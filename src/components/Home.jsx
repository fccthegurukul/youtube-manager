import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Home.css'

export default function Home() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [visibleCount, setVisibleCount] = useState(20)
  const [selectedDate, setSelectedDate] = useState('') // YYYY-MM-DD format

  const statusOptions = ['assigned', 'recorded', 'editing', 'uploading', 'published']

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      const { data: statusData, error: statusError } = await supabase
        .from('task_status_tracking')
        .select(`
          task_id,
          current_stage,
          updated_at,
          tasks (
            id,
            title,
            assigned_to,
            assigned_user:profiles (
              id,
              name,
              avatar_url
            )
          )
        `)
        .order('updated_at', { ascending: false })

      if (statusError) {
        console.error('Fetch error:', statusError)
        setError('Failed to load task status')
        setLoading(false)
        return
      }

      // Sort tasks: first non-published, then published
      const sortedData = [...statusData].sort((a, b) => {
        if (a.current_stage === 'published' && b.current_stage !== 'published') return 1
        if (b.current_stage === 'published' && a.current_stage !== 'published') return -1
        return new Date(b.updated_at) - new Date(a.updated_at)
      })

      setData(sortedData)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Filter data based on selectedDate (if set)
  const filteredData = selectedDate
    ? data.filter((item) => {
        // Extract date in YYYY-MM-DD from updated_at
        const itemDate = new Date(item.updated_at).toISOString().slice(0, 10)
        return itemDate === selectedDate
      })
    : data

  // Paginate and group filtered data by date
  const grouped = filteredData.slice(0, visibleCount).reduce((acc, record) => {
    const date = new Date(record.updated_at).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(record)
    return acc
  }, {})

  const handleAnimationEnd = (taskId) => {
    setCompletedTasks((prev) => new Set([...prev, taskId]))
  }

  const loadMore = () => {
    setVisibleCount((prev) => prev + 20)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
    setVisibleCount(20) // Reset pagination on date change
  }

  if (loading) return <p className="loading">⏳ Loading...</p>
  if (error) return <p className="error">⚠️ {error}</p>

  return (
    <div className="home-container">
      <h2>📅 All Tasks Status</h2>
      <p>Track the progress of your tasks below.</p>
      
      {/* Date filter */}
      <div className="date-filter">
        <label htmlFor="datePicker">Filter by Date: </label>
        <input
          id="datePicker"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          max={new Date().toISOString().slice(0, 10)} // Disable future dates
        />
        {selectedDate && (
          <button onClick={() => setSelectedDate('')}>Clear Filter</button>
        )}
      </div>

      {Object.entries(grouped).length === 0 && (
        <p>No tasks found for the selected date.</p>
      )}

      {Object.entries(grouped).map(([date, records]) => (
        <div key={date} className="date-section">
          <h3>{date}</h3>
          {records.map((item) => {
            const assignedUser = item.tasks?.assigned_user
            const isCompleted = item.current_stage === 'published'
            const showAnimation = isCompleted && !completedTasks.has(item.task_id)

            return (
              <div className={`task-card ${isCompleted ? 'task-completed' : ''}`} key={item.task_id}>
                <img
                  src={assignedUser?.avatar_url || 'default-avatar.png'}
                  alt={assignedUser?.name || 'Member'}
                  className="avatar"
                />
                <div className="task-info">
                  <h4>{assignedUser?.name || 'Unknown Member'}</h4>
                  <p><strong>Title:</strong> {item.tasks?.title || 'Untitled'}</p>
                  <div className="progress-tracker">
                    {statusOptions.map((stage, idx) => {
                      const currentIndex = statusOptions.indexOf(item.current_stage)
                      const isStageCompleted = isCompleted || (currentIndex !== -1 && idx <= currentIndex)
                      const isCurrent = !isCompleted && currentIndex === idx
                      const stageClass = isStageCompleted ? 'stage-completed' : 'stage-future'
                      const connectorClass = idx > 0 && isStageCompleted ? 'connector-completed' : 'connector-future'

                      return (
                        <React.Fragment key={stage}>
                          {idx > 0 && <div className={`connector ${connectorClass}`}></div>}
                          <div className={`stage ${stageClass}`}>
                            <div className="stage-circle"></div>
                            <span className="stage-label">{stage}</span>
                            {isCurrent && <span className="pulse-dot"></span>}
                            {showAnimation && idx === statusOptions.length - 1 && (
                              <span
                                className="completion-icon"
                                onAnimationEnd={() => handleAnimationEnd(item.task_id)}
                              >
                                🎉
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Load More Button */}
      {visibleCount < filteredData.length && (
        <button className="load-more-btn" onClick={loadMore}>
          Load More
        </button>
      )}
    </div>
  )
}
