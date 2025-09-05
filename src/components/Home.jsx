import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Home.css'; // Ensure this points to your CSS file

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD format

  // Define the task status options
  const statusOptions = ['assigned', 'recorded', 'editing', 'uploading', 'published'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

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
        .order('updated_at', { ascending: false });

      if (statusError) {
        console.error('Fetch error:', statusError);
        setError('Failed to load task status');
        setLoading(false);
        return;
      }

      // Sort tasks: first non-published, then published.
      // This ensures active tasks are more visible.
      const sortedData = [...statusData].sort((a, b) => {
        if (a.current_stage === 'published' && b.current_stage !== 'published') return 1;
        if (b.current_stage === 'published' && a.current_stage !== 'published') return -1;
        return new Date(b.updated_at) - new Date(a.updated_at); // Then by latest update
      });

      setData(sortedData);
      setLoading(false);
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Filter data based on selectedDate (if set)
  const filteredData = selectedDate
    ? data.filter((item) => {
        // Extract date in YYYY-MM-DD from updated_at for comparison
        const itemDate = new Date(item.updated_at).toISOString().slice(0, 10);
        return itemDate === selectedDate;
      })
    : data;

  // Paginate and group filtered data by date
  const grouped = filteredData.slice(0, visibleCount).reduce((acc, record) => {
    // Get date in a readable local format (e.g., "MM/DD/YYYY" or "DD/MM/YYYY" based on locale)
    const date = new Date(record.updated_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  // Handler for completion animation end
  const handleAnimationEnd = (taskId) => {
    setCompletedTasks((prev) => new Set([...prev, taskId]));
  };

  // Handler for "Load More" button
  const loadMore = () => {
    setVisibleCount((prev) => prev + 20); // Load 20 more tasks
  };

  // Handler for date filter change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setVisibleCount(20); // Reset pagination when date filter changes
  };

  if (loading) return <p className="loading">⏳ Loading...</p>;
  if (error) return <p className="error">⚠️ {error}</p>;

  return (
    <div className="home-container">
      <h2>📅 All Videos Status</h2>
      <p>Track the progress of your video production tasks below.</p>
      
      {/* Date filter section */}
      <div className="date-filter">
        <label htmlFor="datePicker">Filter by Date:</label>
        <input
          id="datePicker"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          max={new Date().toISOString().slice(0, 10)} // Disable future dates in the picker
        />
        {selectedDate && ( // Show clear filter button only if a date is selected
          <button onClick={() => setSelectedDate('')}>Clear Filter</button>
        )}
      </div>

      {/* Message if no tasks are found for the selected date */}
      {Object.entries(grouped).length === 0 && (
        <p>No tasks found for the selected date. Try selecting a different date or clearing the filter.</p>
      )}

      {/* Render tasks grouped by date */}
      {Object.entries(grouped).map(([date, records]) => (
        <div key={date} className="date-section">
          <h3>{date}</h3> {/* Date heading for each group */}
          {records.map((item) => {
            const assignedUser = item.tasks?.assigned_user;
            const isCompleted = item.current_stage === 'published';
            // Show animation only if task is completed AND hasn't animated before
            const showAnimation = isCompleted && !completedTasks.has(item.task_id);

            return (
              <div className={`task-card ${isCompleted ? 'task-completed' : ''}`} key={item.task_id}>
                {/* Main content section of the task card */}
                <div className="task-card-main-content">
                  <img
                    src={assignedUser?.avatar_url || 'default-avatar.png'} // Fallback avatar
                    alt={assignedUser?.name || 'Member'}
                    className="avatar"
                  />
                  <div className="task-details">
                    <h4>{assignedUser?.name || 'Unknown Member'}</h4>
                    <p><strong>Title:</strong> {item.tasks?.title || 'Untitled Task'}</p>
                  </div>
                </div>

                {/* Progress Tracker section, now integrated */}
                <div className="progress-tracker">
                  {statusOptions.map((stage, idx) => {
                    const currentIndex = statusOptions.indexOf(item.current_stage);
                    const isStageCompleted = isCompleted || (currentIndex !== -1 && idx <= currentIndex);
                    const isCurrent = !isCompleted && currentIndex === idx; // Only one current stage
                    const stageClass = isStageCompleted ? 'stage-completed' : 'stage-future';
                    // Connector is completed if the previous stage (or current) is completed
                    const connectorClass = idx > 0 && isStageCompleted ? 'connector-completed' : 'connector-future';

                    return (
                      <React.Fragment key={stage}>
                        {/* Render connector between stages (except for the first) */}
                        {idx > 0 && <div className={`connector ${connectorClass}`}></div>}
                        
                        {/* Render individual stage */}
                        <div className={`stage ${stageClass}`}>
                          <div className="stage-circle"></div>
                          {/* Capitalize first letter of stage label */}
                          <span className="stage-label">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                          {/* Pulse dot for the current active stage */}
                          {isCurrent && <span className="pulse-dot"></span>}
                          {/* Completion confetti animation for published tasks */}
                          {showAnimation && idx === statusOptions.length - 1 && ( // Animation on 'published' stage
                            <span
                              className="completion-icon"
                              onAnimationEnd={() => handleAnimationEnd(item.task_id)}
                            >
                              🎉
                            </span>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Load More Button */}
      {visibleCount < filteredData.length && (
        <button className="load-more-btn" onClick={loadMore}>
          Load More Tasks
        </button>
      )}
    </div>
  );
}