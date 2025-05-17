import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import Taskstatus from './Taskstatus' // 👈 import Taskstatus component

export default function AssignTask() {
  const [title, setTitle] = useState('')
  const [driveLink, setDriveLink] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [classValue, setClassValue] = useState('')
  const [users, setUsers] = useState([])

  // Load users from profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, class')
        .eq('role', 'member')

      if (error) console.error(error)
      else setUsers(data)
    }

    fetchUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !driveLink || !assignedTo || !classValue) {
      alert('Please fill all fields')
      return
    }

    const taskId = uuidv4()

    const { error: taskError } = await supabase.from('tasks').insert([
      {
        id: taskId,
        title,
        drive_link: driveLink,
        assigned_to: assignedTo,
        class: classValue,
      },
    ])

    if (taskError) {
      console.error(taskError)
      alert('Failed to assign task')
      return
    }

    function getISTISOString() {
      const now = new Date()
    
      // IST is UTC + 5:30 = 330 minutes
      const istOffset = 330 * 60 * 1000 // milliseconds
    
      // Calculate IST time by adding offset
      const istTime = new Date(now.getTime() + istOffset)
    
      // Return ISO string without 'Z' (because it's not UTC anymore)
      // To store ISO-like string but in IST time (dangerous if backend expects UTC)
      const isoString = istTime.toISOString().replace('Z', '')
    
      return isoString
    }

    
    // Insert default task status
    await supabase.from('task_status_tracking').insert([
      {
        task_id: taskId,
        current_stage: 'assigned',
        updated_at: getISTISOString(),
      },
    ])
    

    alert('✅ Task assigned successfully')
    setTitle('')
    setDriveLink('')
    setAssignedTo('')
    setClassValue('')
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 Assign Task</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Google Drive Link"
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
        />
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
          <option value="">-- Select Member --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} (Class {user.class})
            </option>
          ))}
        </select>
        <select value={classValue} onChange={(e) => setClassValue(e.target.value)}>
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
  )
}
