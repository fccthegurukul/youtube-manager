import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Taskstatus.css'

export default function Taskstatus() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const statusOptions = ['assigned', 'recorded', 'editing', 'uploading', 'published']

  const fetchData = async () => {
    setLoading(true)

    // Step 1: Get all tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        assigned_to,
        class,
        profiles ( name )
      `)
      .order('created_at', { ascending: false })

    if (tasksError) {
      setError('Failed to load tasks')
      console.error(tasksError)
      setLoading(false)
      return
    }

    // Step 2: Get latest status entry per task from task_status_tracking
    const { data: trackingData, error: trackingError } = await supabase
      .from('task_status_tracking')
      .select('*')
      .order('updated_at', { ascending: false })

    if (trackingError) {
      setError('Failed to load task status')
      console.error(trackingError)
      setLoading(false)
      return
    }

    // Step 3: Build map of latest status by task_id
    const latestStatusMap = {}
    for (const row of trackingData) {
      if (!latestStatusMap[row.task_id]) {
        latestStatusMap[row.task_id] = row
      }
    }

    // Step 4: Merge status into tasks and exclude 'published'
    const mergedTasks = tasksData
      .map(task => ({
        ...task,
        task_status_tracking: latestStatusMap[task.id] || null,
      }))
      .filter(task => task.task_status_tracking?.current_stage !== 'published')

    setTasks(mergedTasks)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusChange = async (taskId, newStage) => {
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id
    const currentTime = new Date().toISOString()

    try {
      const { data: existingStatus } = await supabase
        .from('task_status_tracking')
        .select('id')
        .eq('task_id', taskId)
        .single()

      if (existingStatus) {
        const { error: updateError } = await supabase
          .from('task_status_tracking')
          .update({
            current_stage: newStage,
            updated_at: currentTime,
            updated_by: userId,
          })
          .eq('task_id', taskId)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('task_status_tracking')
          .insert({
            task_id: taskId,
            current_stage: newStage,
            updated_at: currentTime,
            updated_by: userId,
          })

        if (insertError) throw insertError
      }

      const { error: logError } = await supabase
        .from('task_status_history')
        .insert({
          task_id: taskId,
          current_stage: newStage,
          updated_at: currentTime,
          updated_by: userId,
        })

      if (logError) throw logError

      await fetchData()
    } catch (error) {
      alert('Failed to update status or log change')
      console.error(error)
    }
  }

  if (loading) return <p className="loading">⏳ Loading...</p>
  if (error) return <p className="error">⚠️ {error}</p>

  return (
    <div className="task-status-container">
      <h2>🛠️ Task Status Control</h2>
      <table className="task-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Class</th>
            <th>Assigned To</th>
            <th>Current Stage</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.class}</td>
              <td>{task.profiles?.name || 'Unassigned'}</td>
              <td>{task.task_status_tracking?.current_stage || 'N/A'}</td>
              <td>
                <div className="update-cell">
                  <span className="current-stage-label">
                    ({task.task_status_tracking?.current_stage || 'N/A'})
                  </span>
                  <select
                    value={task.task_status_tracking?.current_stage || ''}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="">-- Select Stage --</option>
                    {statusOptions.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Task Status Log */}
      <h2 className="log-heading">📜 Task Status Change Log</h2>
      <TaskStatusLog />
    </div>
  )
}

function TaskStatusLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('task_status_history')
      .select(`
        id,
        task_id,
        current_stage,
        updated_at,
        updated_by,
        tasks ( title ),
        profiles ( name )
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      setError('Failed to load status logs')
      console.error(error)
    } else {
      setLogs(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  if (loading) return <p className="loading">⏳ Loading...</p>
  if (error) return <p className="error">⚠️ {error}</p>

  return (
    <table className="log-table">
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Status</th>
          <th>Updated By</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        {logs
          .filter(log => log.current_stage !== 'published')
          .map((log) => (
            <tr key={log.id}>
              <td>{log.tasks?.title || 'Unknown Task'}</td>
              <td>{log.current_stage}</td>
              <td>{log.profiles?.name || 'Unknown User'}</td>
              <td>{new Date(log.updated_at).toLocaleString()}</td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
