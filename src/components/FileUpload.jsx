import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import Taskstatus from './Taskstatus';
import './AssignTask.css';

export default function AssignTask() {
  const [title, setTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [privateDriveLink, setPrivateDriveLink] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [classValue, setClassValue] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setErrorUsers(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, class, role')
        .in('role', ['member', 'promember']);

      if (error) {
        console.error('Error fetching users:', error);
        setErrorUsers('Failed to load users. Please try again.');
      } else {
        setUsers(data);
      }
      setLoadingUsers(false);
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !driveLink || !assignedTo || !classValue) {
      alert('Please fill all required fields');
      return;
    }

    const taskId = uuidv4();

    // Insert into tasks
    const { error: taskError } = await supabase.from('tasks').insert([{
      id: taskId,
      title,
      drive_link: driveLink,
      private_drive_link: privateDriveLink,
      assigned_to: assignedTo,
      class: classValue,
    }]);

    if (taskError) {
      console.error('Error assigning task:', taskError);
      alert('Failed to assign task. Please try again.');
      return;
    }

    // Helper: IST timestamp
    function getISTISOString() {
      const now = new Date();
      const istOffset = 330 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      return istTime.toISOString().replace('Z', '');
    }

    // Insert initial status
    const { error: statusError } = await supabase.from('task_status_tracking').insert([{
      task_id: taskId,
      current_stage: 'assigned',
      updated_at: getISTISOString(),
    }]);

    if (statusError) {
      console.error('Error inserting task status:', statusError);
      alert('Task assigned but failed to set initial status.');
    } else {
      alert('✅ Task assigned successfully');
      // Reset form
      setTitle('');
      setDriveLink('');
      setPrivateDriveLink('');
      setAssignedTo('');
      setClassValue('');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 Assign Task</h2>
      {/* Add onSubmit to form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Google Drive Link (Content)"
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Private Google Drive Link"
          value={privateDriveLink}
          onChange={(e) => setPrivateDriveLink(e.target.value)}
        />
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : errorUsers ? (
          <p style={{ color: 'red' }}>{errorUsers}</p>
        ) : (
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required>
            <option value="">-- Select Member/Pro-Member --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} (Class {user.class}) - {user.role}
              </option>
            ))}
          </select>
        )}
        <select value={classValue} onChange={(e) => setClassValue(e.target.value)} required>
          <option value="">-- Select Class --</option>
          {['4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <button type="submit">Assign Task</button>
      </form>

      <hr style={{ margin: '40px 0' }} />

      <Taskstatus />
    </div>
  );
}
