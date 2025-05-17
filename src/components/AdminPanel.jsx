import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { assignTask } from '../services/taskService'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ title: '', link: '', userId: '', className: '' })

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase.from('users').select('*').neq('role', 'admin')
      setUsers(data)
    }
    fetchUsers()
  }, [])

  async function handleAssign() {
    await assignTask({
      title: form.title,
      drive_link: form.link,
      assigned_to: form.userId,
      className: form.className,
    })
    alert('Task Assigned!')
    setForm({ title: '', link: '', userId: '', className: '' })
  }

  return (
    <div>
      <h3>Assign New Task</h3>
      <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Google Drive Link" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
      <select onChange={e => setForm({ ...form, userId: e.target.value })}>
        <option>Select Member</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name} (Class {u.class})</option>
        ))}
      </select>
      <input placeholder="Class" value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} />
      <button onClick={handleAssign}>Assign</button>
    </div>
  )
}
