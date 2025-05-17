import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, FileDown, AlertCircle, Loader2, FolderCheck } from 'lucide-react'
import './Tasks.css'

const statusOptions = ['assigned', 'recorded', 'editing', 'uploading', 'published']

export default function Tasks({ profile }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [submittingTaskId, setSubmittingTaskId] = useState(null)
  const [completedTaskStatusMap, setCompletedTaskStatusMap] = useState({})
  const [stageFilter, setStageFilter] = useState('all') // Filter state

  useEffect(() => {
    fetchTasks()
  }, [profile])

  const fetchTasks = async () => {
    if (!profile?.id) {
      setLoading(false)
      setErrorMsg('User profile not loaded.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg('Failed to fetch tasks from the server.')
      setTasks([])
    } else {
      // Save tasks first to map statuses
      setTasks(data)

      // Fetch completed task statuses for tasks marked completed
      const completedIds = data.filter(t => t.status === 'completed').map(t => t.id)
      fetchCompletedStatuses(completedIds)
    }

    setLoading(false)
  }

  const fetchCompletedStatuses = async (completedIds) => {
    if (completedIds.length === 0) return

    const { data, error } = await supabase
      .from('task_status_tracking')
      .select('task_id, current_stage, updated_at')
      .in('task_id', completedIds)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      const map = {}
      data.forEach(item => {
        if (!map[item.task_id]) {
          map[item.task_id] = item
        }
      })
      setCompletedTaskStatusMap(map)
    }
  }

  async function handleComplete(taskId) {
    if (!profile?.id) {
      alert('User profile not loaded.')
      return
    }

    const confirmed = window.confirm(
      'यदि आपने टास्क को पूरा करके ऑफिस को भेज दिया है, तो कृपया "OK" पर क्लिक करें। अन्यथा, "Cancel" पर क्लिक करें।'
    )
    if (!confirmed) return

    setSubmittingTaskId(taskId)
    await new Promise(res => setTimeout(res, 2500))

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)
      .eq('assigned_to', profile.id)

    if (updateError) {
      alert('Failed to mark complete.')
      console.error(updateError)
      setSubmittingTaskId(null)
      return
    }

    const { error: insertError } = await supabase.from('task_completions').insert([
      {
        task_id: taskId,
        user_id: profile.id,
        completed_at: new Date().toISOString(),
      },
    ])
    if (insertError) console.warn('Failed to record completion:', insertError)

    const currentTime = new Date().toISOString()

    // 1. Check if task_status_tracking entry exists
    const { data: existingStatus } = await supabase
      .from('task_status_tracking')
      .select('id')
      .eq('task_id', taskId)
      .single()

    if (existingStatus) {
      const { error: trackingUpdateError } = await supabase
        .from('task_status_tracking')
        .update({
          current_stage: 'recorded',
          updated_at: currentTime,
          updated_by: profile.id,
        })
        .eq('task_id', taskId)

      if (trackingUpdateError) {
        console.error('Error updating tracking status:', trackingUpdateError)
      }
    } else {
      const { error: trackingInsertError } = await supabase
        .from('task_status_tracking')
        .insert({
          task_id: taskId,
          current_stage: 'recorded',
          updated_at: currentTime,
          updated_by: profile.id,
        })

      if (trackingInsertError) {
        console.error('Error inserting tracking status:', trackingInsertError)
      }
    }

    // 2. Log into task_status_history
    const { error: historyError } = await supabase.from('task_status_history').insert({
      task_id: taskId,
      current_stage: 'recorded',
      updated_at: currentTime,
      updated_by: profile.id,
    })

    if (historyError) {
      console.error('Error inserting status history:', historyError)
    }

    setSubmittingTaskId(null)
    fetchTasks()
  }

  const renderProgress = (taskId, current_stage) => {
    const currentIndex = statusOptions.indexOf(current_stage)

    return (
      <div className="progress-tracker mt-2">
        {statusOptions.map((stage, idx) => {
          const isStageCompleted = idx <= currentIndex
          const isCurrent = idx === currentIndex
          const stageClass = isStageCompleted ? 'stage-completed' : 'stage-future'
          const connectorClass = idx > 0 && isStageCompleted ? 'connector-completed' : 'connector-future'

          return (
            <React.Fragment key={stage}>
              {idx > 0 && <div className={`connector ${connectorClass}`}></div>}
              <div className={`stage ${stageClass}`}>
                <div className="stage-circle"></div>
                <span className="stage-label">{stage}</span>
                {isCurrent && <span className="pulse-dot"></span>}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="status-message loading">
        <Loader2 className="icon" /> Loading your tasks...
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="status-message error">
        <AlertCircle className="icon" /> {errorMsg}
      </div>
    )
  }

  // Filter tasks based on stageFilter
  let filteredTasks = tasks.filter(task => {
    const tracking = completedTaskStatusMap[task.id]
    const currentStage = tracking?.current_stage || task.status

    if (stageFilter === 'all') return true
    return currentStage === stageFilter
  })

  // Sort tasks: non-published first, then published at bottom
  filteredTasks.sort((a, b) => {
    const aStage = completedTaskStatusMap[a.id]?.current_stage || a.status
    const bStage = completedTaskStatusMap[b.id]?.current_stage || b.status

    if (aStage === 'published' && bStage !== 'published') return 1
    if (aStage !== 'published' && bStage === 'published') return -1
    return 0
  })

  return (
    <section className="tasks-container">
      <header className="tasks-header">
        <FolderCheck className="icon" />
        <h2>Your Assigned Tasks</h2>
      </header>

      {/* Stage filter dropdown */}
      <div className="filter-container">
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
        <div className="no-tasks">
          <Clock className="icon large-icon" />
          <p>No tasks found for the selected stage.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map((task, index) => {
            const tracking = completedTaskStatusMap[task.id]
            const currentStage = tracking?.current_stage || task.status
            const isPublished = currentStage === 'published'

            return (
              <motion.article
                key={task.id}
                className={`task-card ${isPublished ? 'published-task' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                  <span className={`status-badge ${task.status}`}>
                    {task.status === 'completed' && currentStage !== 'published' ? 'Completed' : task.status}
                  </span>
                </div>

                <p className="task-class">
                  <strong>Assigned Class:</strong> {task.class}
                </p>

                {task.drive_link ? (
                  <a
                    href={task.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    <FileDown className="icon small-icon" /> Download Task File
                  </a>
                ) : (
                  <p className="no-file">No file link provided</p>
                )}

                {task.status === 'pending' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="complete-button"
                    type="button"
                    disabled={submittingTaskId === task.id}
                  >
                    {submittingTaskId === task.id ? (
                      <>
                        <Loader2 className="icon small-icon spinning" /> Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="icon small-icon" /> Mark as Complete
                      </>
                    )}
                  </button>
                )}

                {tracking && (
                  <div className="status-tracking">
                    <p className="tracking-time">
                      Last updated: {new Date(tracking.updated_at).toLocaleString()}
                    </p>
                    {renderProgress(task.id, currentStage)}
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
      )}
    </section>
  )
}
