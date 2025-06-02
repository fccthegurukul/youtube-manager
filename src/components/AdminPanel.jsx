import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
// Assuming assignTask is a service function that interacts with Supabase to insert tasks
// Make sure '../services/taskService' correctly calls supabase.from('tasks').insert(...)
import { assignTask } from '../services/taskService'; 
import './AdminPanel.css'; // Import the CSS file


export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', link: '', userId: '', className: '' });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);


  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      setErrorUsers(null);
      const { data, error } = await supabase
        .from('profiles') // Assuming users are in 'profiles' table
        .select('id, name, class, role') // role bhi select karo
        .in('role', ['member', 'promember']); // 'member' aur 'promember' dono ko fetch karo
      
      if (error) {
        console.error('Error fetching users for AdminPanel:', error);
        setErrorUsers('Failed to load users for assignment. Please try again.');
      } else {
        setUsers(data);
      }
      setLoadingUsers(false);
    }
    fetchUsers();
  }, []);

  async function handleAssign() {
    if (!form.title || !form.link || !form.userId || !form.className) {
      alert('Please fill all task details.');
      return;
    }
    try {
      await assignTask({
        title: form.title,
        drive_link: form.link,
        assigned_to: form.userId,
        class: form.className,
      });
      alert('Task Assigned Successfully!');
      setForm({ title: '', link: '', userId: '', className: '' });
    } catch (error) {
      console.error('Error assigning task from AdminPanel:', error);
      alert('Failed to assign task. Please check console for details.');
    }
  }

  return (
    <div>
      <h3>Assign New Task</h3>
      <input 
        placeholder="Title" 
        value={form.title} 
        onChange={e => setForm({ ...form, title: e.target.value })} 
        required
      />
      <input 
        placeholder="Google Drive Link" 
        value={form.link} 
        onChange={e => setForm({ ...form, link: e.target.value })} 
        required
      />
      {loadingUsers ? (
          <p>Loading assignable users...</p>
        ) : errorUsers ? (
          <p style={{ color: 'red' }}>{errorUsers}</p>
        ) : (
          <select onChange={e => setForm({ ...form, userId: e.target.value })} value={form.userId} required>
            <option value="">Select Member/Pro-Member</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} (Class {u.class}) - {u.role}
              </option>
            ))}
          </select>
        )}
      <input 
        placeholder="Class" 
        value={form.className} 
        onChange={e => setForm({ ...form, className: e.target.value })} 
        required
      />
      <button onClick={handleAssign}>Assign</button>
    </div>
  );
}