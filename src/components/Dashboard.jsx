import React from 'react'
import Navbar from './Navbar'
import Tasks from './Tasks'
import Milestones from './Milestones'
import Leaderboard from './Leaderboard'
import FileUpload from './FileUpload'
import Alerts from './Alerts'
export default function Dashboard({ profile }) {
  if (!profile) return <p>Loading profile...</p>

  return (
    <div>
      <Navbar profile={profile} />

<p>Welcome, {profile.name}!</p>
      <h2 style={{ textAlign: 'center' }}>Welcome to the Dashboard</h2>

      {profile.role === 'admin' ? (
        <div>
          <h3>📋 Admin Panel</h3>
          <FileUpload />
          <Milestones />
          <Alerts />
          <Leaderboard />
        </div>
      ) : (
        <div>
          <h3>👨‍🎓 Member Panel</h3>
          <Tasks />
          <Milestones />
          <Leaderboard />
        </div>
      )}
    </div>
  )
}
