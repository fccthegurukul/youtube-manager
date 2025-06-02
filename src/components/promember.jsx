import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Path sahi hona chahiye
import { motion } from 'framer-motion';
import { CheckCircle, Clock, FileDown, AlertCircle, Loader2, FolderCheck } from 'lucide-react';
import './Promember.css'; // Import the new CSS file

const statusOptions = ['assigned', 'recorded', 'editing', 'uploading', 'published'];

export default function Promember({ profile }) { // 'profile' prop receive karein
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [completedTaskStatusMap, setCompletedTaskStatusMap] = useState({});
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [profile]); // Profile change hone par tasks re-fetch karein

  const fetchTasks = async () => {
    if (!profile?.id) { // Ensure profile and id are available
      setLoading(false);
      setErrorMsg('User profile not loaded. Please log in again.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profile.id) // Assigned tasks user ke ID se fetch karein
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg('Failed to fetch video tasks from the server. Please try again later.');
      setTasks([]);
      console.error('Error fetching tasks for Pro Member:', error);
    } else {
      setTasks(data);
      // 'completed' tasks ke liye latest status fetch karein
      const completedIds = data.filter(t => t.status === 'completed').map(t => t.id);
      fetchCompletedStatuses(completedIds);
    }
    setLoading(false);
  };

  const fetchCompletedStatuses = async (completedIds) => {
    if (completedIds.length === 0) return;

    const { data, error } = await supabase
      .from('task_status_tracking')
      .select('task_id, current_stage, updated_at')
      .in('task_id', completedIds)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      // Map banaye latest status ke liye, agar multiple entries hain toh latest waali rakhein
      const map = {};
      data.forEach(item => {
        if (!map[item.task_id] || new Date(item.updated_at) > new Date(map[item.task_id].updated_at)) {
          map[item.task_id] = item;
        }
      });
      setCompletedTaskStatusMap(map);
    } else if (error) {
        console.error('Error fetching completed task tracking statuses:', error);
    }
  };

  async function handleComplete(taskId) {
    if (!profile?.id) {
      alert('User profile not loaded. Please log in again.');
      return;
    }

    const confirmed = window.confirm(
      'यदि आपने विडियो रिकॉर्ड करके ड्राइव में या Youtube पर अपलोड कर दिया है, तो कृपया "OK" पर क्लिक करें। अन्यथा, "Cancel" पर क्लिक करें।'
    );
    if (!confirmed) return;

    setSubmittingTaskId(taskId);
    await new Promise(res => setTimeout(res, 1500)); // Simulate a delay for better UX

    try {
        // 1. Update task status in 'tasks' table to 'completed'
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ status: 'completed' }) // Status 'completed' karein
            .eq('id', taskId)
            .eq('assigned_to', profile.id);

        if (updateError) {
            throw new Error(`Failed to mark task as recorded: ${updateError.message}`);
        }

        // 2. Record completion in 'task_completions' table
        const { error: insertCompletionError } = await supabase.from('task_completions').insert([
            {
                task_id: taskId,
                user_id: profile.id,
                completed_at: new Date().toISOString(),
            },
        ]);
        if (insertCompletionError) {
            console.warn('Warning: Failed to record completion in task_completions table. This might be a duplicate entry or other issue. Error:', insertCompletionError.message);
        }

        const currentTime = new Date().toISOString();

        // 3. Update or Insert into 'task_status_tracking' (current stage to 'recorded')
        const { data: existingTracking, error: fetchTrackingError } = await supabase
            .from('task_status_tracking')
            .select('id')
            .eq('task_id', taskId)
            .single();

        if (fetchTrackingError && fetchTrackingError.code !== 'PGRST116') { // PGRST116 means "no rows found"
            console.error('Error checking existing tracking status:', fetchTrackingError.message);
        }

        if (existingTracking) {
            // If entry exists, update it
            const { error: trackingUpdateError } = await supabase
                .from('task_status_tracking')
                .update({
                    current_stage: 'recorded', // Set stage to 'recorded'
                    updated_at: currentTime,
                    updated_by: profile.id,
                })
                .eq('task_id', taskId);

            if (trackingUpdateError) {
                console.error('Error updating tracking status:', trackingUpdateError.message);
            }
        } else {
            // If no entry, insert a new one
            const { error: trackingInsertError } = await supabase
                .from('task_status_tracking')
                .insert({
                    task_id: taskId,
                    current_stage: 'recorded', // Set stage to 'recorded'
                    updated_at: currentTime,
                    updated_by: profile.id,
                });

            if (trackingInsertError) {
                console.error('Error inserting tracking status:', trackingInsertError.message);
            }
        }

        // 4. Log into task_status_history for audit trail
        const { error: historyError } = await supabase.from('task_status_history').insert({
            task_id: taskId,
            current_stage: 'recorded', // Log this specific stage
            updated_at: currentTime,
            updated_by: profile.id,
        });

        if (historyError) {
            console.error('Error inserting status history:', historyError.message);
        }

        alert('Task successfully marked as recorded!');
    } catch (error) {
        alert(error.message); // Show specific error message to user
        console.error('Error in handleComplete:', error);
    } finally {
        setSubmittingTaskId(null);
        fetchTasks(); // Re-fetch all tasks to update UI with latest statuses
    }
  }

  const renderProgress = (taskId, current_stage) => {
    const currentIndex = statusOptions.indexOf(current_stage);

    return (
      <div className="promember-progress-tracker mt-2">
        {statusOptions.map((stage, idx) => {
          const isStageCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const stageClass = isStageCompleted ? 'promember-stage-completed' : 'promember-stage-future';
          const connectorClass = idx < statusOptions.length - 1 && idx < currentIndex ? 'promember-connector-completed' : 'promember-connector-future';

          return (
            <React.Fragment key={stage}>
              {idx > 0 && <div className={`promember-connector ${connectorClass}`}></div>}
              <div className={`promember-stage ${stageClass}`}>
                <div className="promember-stage-circle"></div>
                {/* Stage label mein capitalize kiya gaya hai */}
                <span className="promember-stage-label">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                {isCurrent && <span className="promember-pulse-dot"></span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="promember-status-message promember-loading">
        <Loader2 className="promember-icon promember-spinning" /> Loading your video Content...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="promember-status-message promember-error">
        <AlertCircle className="promember-icon" /> {errorMsg}
      </div>
    );
  }

  let filteredTasks = tasks.filter(task => {
    // Get the actual current stage from tracking, fallback to task.status if no tracking yet
    const tracking = completedTaskStatusMap[task.id];
    const actualCurrentStage = tracking?.current_stage || task.status; // Yeh actual stage hai

    if (stageFilter === 'all') return true;
    return actualCurrentStage === stageFilter;
  });

  // Sort tasks: pending/in-progress first, then published/completed at bottom
  filteredTasks.sort((a, b) => {
    const aStage = completedTaskStatusMap[a.id]?.current_stage || a.status;
    const bStage = completedTaskStatusMap[b.id]?.current_stage || b.status;

    // Prioritize non-published/non-completed tasks to be at the top
    if (aStage === 'published' && bStage !== 'published') return 1; // a comes after b
    if (aStage !== 'published' && bStage === 'published') return -1; // a comes before b
    // If both are published or both are not published, then sort by creation date (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <section className="promember-tasks-container">
      <header className="promember-tasks-header">
        <FolderCheck className="promember-icon" />
        <h2>Your Video Production Content</h2>
      </header>

      {/* Stage filter dropdown */}
      <div className="promember-filter-container">
        <label htmlFor="stage-filter">Filter by Stage: </label>
        <select
          id="stage-filter"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="all">All</option>
          {statusOptions.map(stage => (
            <option key={stage} value={stage}>
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="promember-no-tasks">
          <Clock className="promember-icon promember-large-icon" />
          <p>No video tasks found for the selected stage.</p>
        </div>
      ) : (
        <div className="promember-tasks-list">
          {filteredTasks.map((task, index) => {
            const tracking = completedTaskStatusMap[task.id];
            // Actual current stage is from tracking or task.status if not yet tracked
            const currentStage = tracking?.current_stage || task.status;
            const isPublished = currentStage === 'published';

            return (
              <motion.article
                key={task.id}
                className={`promember-task-card ${isPublished ? 'promember-published-task' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <div className="promember-task-header">
                  <h3 className="promember-task-title">{task.title}</h3>
                  <span className={`promember-status-badge ${currentStage}`}>
                    {/* Display actual current stage from tracking or fallback */}
                    {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
                  </span>
                </div>

                <p className="promember-task-class">
                  <strong>Target Class:</strong> {task.className || 'N/A'}
                </p>

                {task.drive_link ? (
                  <a
                    href={task.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="promember-download-link"
                  >
                    <FileDown className="promember-icon promember-small-icon" /> Access PDF/PPT Content
                  </a>
                ) : (
                  <p className="promember-no-file">No link provided</p>
                )}

                {/* 'Mark as Recorded' button only if task status is 'pending' */}
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="promember-complete-button"
                    type="button"
                    disabled={submittingTaskId === task.id}
                  >
                    {submittingTaskId === task.id ? (
                      <>
                        <Loader2 className="promember-icon promember-small-icon promember-spinning" /> Marking as Recorded...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="promember-icon promember-small-icon" /> Mark as Recorded
                      </>
                    )}
                  </button>
                )}

                {/* Show progress tracker if task is not pending (meaning it has been "completed" or beyond) */}
                {task.status !== 'pending' && tracking && (
                  <div className="promember-status-tracking">
                    <p className="promember-tracking-time">
                      Last updated: {new Date(tracking.updated_at).toLocaleString()}
                    </p>
                    {renderProgress(task.id, currentStage)}
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}