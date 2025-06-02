import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import Taskstatus from './Taskstatus'; // 👈 import Taskstatus component
import './AssignTask.css'; // 👈 Add your CSS file for styling

export default function AssignTask() {
  const [title, setTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [classValue, setClassValue] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  // Load users from profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setErrorUsers(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, class, role') // 'role' bhi select karo
        .in('role', ['member', 'promember']); // Yahan par 'member' aur 'promember' dono ko fetch karo

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
      alert('Please fill all fields');
      return;
    }

    const taskId = uuidv4();

    const { error: taskError } = await supabase.from('tasks').insert([
      {
        id: taskId,
        title,
        drive_link: driveLink,
        assigned_to: assignedTo,
        class: classValue,
      },
    ]);

    if (taskError) {
      console.error('Error assigning task:', taskError);
      alert('Failed to assign task. Please try again.');
      return;
    }

    function getISTISOString() {
      const now = new Date();
      // IST is UTC + 5:30 = 330 minutes
      const istOffset = 330 * 60 * 1000; // milliseconds
      // Calculate IST time by adding offset
      const istTime = new Date(now.getTime() + istOffset);
      // Return ISO string without 'Z' (because it's not UTC anymore)
      const isoString = istTime.toISOString().replace('Z', '');
      return isoString;
    }

    // Insert default task status
    const { error: statusError } = await supabase.from('task_status_tracking').insert([
      {
        task_id: taskId,
        current_stage: 'assigned',
        updated_at: getISTISOString(),
      },
    ]);

    if (statusError) {
      console.error('Error inserting task status:', statusError);
      alert('Task assigned but failed to set initial status.');
      // You might want to handle this more robustly, e.g., rollback the task insertion
    }

    alert('✅ Task assigned successfully');
    setTitle('');
    setDriveLink('');
    setAssignedTo('');
    setClassValue('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 Assign Task</h2>
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
          placeholder="Google Drive Link"
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          required
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

      {/* 👇 Render Taskstatus component here */}
      <Taskstatus />
    </div>
  );
}