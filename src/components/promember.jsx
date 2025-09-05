import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, FileDown, AlertCircle, Loader2, FolderCheck } from 'lucide-react';
import './Promember.css';

const statusOptions = ['assigned', 'recorded', 'editing', 'uploading', 'published'];

export default function Promember({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [completedTaskStatusMap, setCompletedTaskStatusMap] = useState({});
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [profile]);

  const fetchTasks = async () => {
    if (!profile?.id) {
      setLoading(false);
      setErrorMsg('User profile not loaded. Please log in again.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg('Failed to fetch video tasks from the server. Please try again later.');
      setTasks([]);
      console.error('Error fetching tasks for Pro Member:', error);
    } else {
      setTasks(data);
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

  const handleDownload = async (taskId, userId, privateLink) => {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', taskId)
      .single();

    if (taskError || task.assigned_to !== userId) {
      alert('You are not authorized to download this file.');
      return;
    }

    const { error } = await supabase.from('file_downloads').insert({
      task_id: taskId,
      user_id: userId,
      download_time: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log download:', error);
      alert('Failed to log download. Please try again.');
      return;
    }

    window.open(privateLink, '_blank');
  };

  async function handleComplete(taskId) {
    if (!profile?.id) {
      alert('User profile not loaded. Please log in again.');
      return;
    }

    // const confirmed = window.confirm(
    //   'यदि आपने विडियो रिकॉर्ड करके ड्राइव में या Youtube पर अपलोड कर दिया है, तो कृपया "OK" पर क्लिक करें। अन्यथा, "Cancel" पर क्लिक करें।'
    // );
    // if (!confirmed) return;

    setSubmittingTaskId(taskId);
    await new Promise(res => setTimeout(res, 1500));

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)
        .eq('assigned_to', profile.id);

      if (updateError) {
        throw new Error(`Failed to mark task as recorded: ${updateError.message}`);
      }

      const { error: insertCompletionError } = await supabase.from('task_completions').insert([
        {
          task_id: taskId,
          user_id: profile.id,
          completed_at: new Date().toISOString(),
        },
      ]);
      if (insertCompletionError) {
        console.warn('Warning: Failed to record completion in task_completions table:', insertCompletionError.message);
      }

      const currentTime = new Date().toISOString();
      const { data: existingTracking, error: fetchTrackingError } = await supabase
        .from('task_status_tracking')
        .select('id')
        .eq('task_id', taskId)
        .single();

      if (fetchTrackingError && fetchTrackingError.code !== 'PGRST116') {
        console.error('Error checking existing tracking status:', fetchTrackingError.message);
      }

      if (existingTracking) {
        const { error: trackingUpdateError } = await supabase
          .from('task_status_tracking')
          .update({
            current_stage: 'recorded',
            updated_at: currentTime,
            updated_by: profile.id,
          })
          .eq('task_id', taskId);

        if (trackingUpdateError) {
          console.error('Error updating tracking status:', trackingUpdateError.message);
        }
      } else {
        const { error: trackingInsertError } = await supabase
          .from('task_status_tracking')
          .insert({
            task_id: taskId,
            current_stage: 'recorded',
            updated_at: currentTime,
            updated_by: profile.id,
          });

        if (trackingInsertError) {
          console.error('Error inserting tracking status:', trackingInsertError.message);
        }
      }

      const { error: historyError } = await supabase.from('task_status_history').insert({
        task_id: taskId,
        current_stage: 'recorded',
        updated_at: currentTime,
        updated_by: profile.id,
      });

      if (historyError) {
        console.error('Error inserting status history:', historyError.message);
      }

      // alert('Task successfully marked as recorded!');
    } catch (error) {
      alert(error.message);
      console.error('Error in handleComplete:', error);
    } finally {
      setSubmittingTaskId(null);
      fetchTasks();
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
    const tracking = completedTaskStatusMap[task.id];
    const actualCurrentStage = tracking?.current_stage || task.status;
    if (stageFilter === 'all') return true;
    return actualCurrentStage === stageFilter;
  });

  filteredTasks.sort((a, b) => {
    const aStage = completedTaskStatusMap[a.id]?.current_stage || a.status;
    const bStage = completedTaskStatusMap[b.id]?.current_stage || b.status;
    if (aStage === 'published' && bStage !== 'published') return 1;
    if (aStage !== 'published' && bStage === 'published') return -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <section className="promember-tasks-container">
   <header className="promember-hero fx">
  <div className="pm-fx-bg"></div>
  <div className="pm-fx-ring"></div>

  <h2 className="pm-hero-title">
    <span className="pm-hero-text">Video Production PDFs, PPTs &  DOCs</span>
  </h2>

  {/* Subtext: pick one of these lines or keep both as rotating copy later */}
  <p className="pm-hero-sub">
    Plan. Present. Publish.✨
  </p>

  {/* Unique visual: orbiting dots instead of equalizer */}
  <div className="pm-orbit" aria-hidden="true">
    <span className="track"></span>
    <span className="dot d1"></span>
    <span className="dot d2"></span>
    <span className="dot d3"></span>
  </div>
</header>


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
                    {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
                  </span>
                </div>

                <p className="promember-task-class">
                  <strong>Target Class:</strong> {task.class || 'N/A'}
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
                  <p className="promember-no-file">No content link provided</p>
                )}

                {task.private_drive_link ? (
                  <button
                    onClick={() => handleDownload(task.id, profile.id, task.private_drive_link)}
                    className="promember-download-button-2"
                  >
                    <FileDown className="promember-icon promember-small-icon" /> Access Private PDF/PPT

                  </button>
                ) : (
                  <p className="promember-no-file">No private PPT/PDF provided</p>
                )}

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