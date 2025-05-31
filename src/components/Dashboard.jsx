import React, { useState } from 'react'
import {
  FaHome,
  FaTasks,
  FaFlagCheckered,
  FaTrophy,
  FaFileUpload,
  FaBell,
  FaComments,
  FaTools, // Import tools icon
  FaNetworkWired,
} from 'react-icons/fa'

import Navbar from './Navbar'
import Tasks from './Tasks'
import Milestones from './Milestones'
import NetworkPage from './NetworkPage'
import FileUpload from './FileUpload'
import Alerts from './Alerts'
import Home from './Home'

export default function Dashboard({ profile }) {
  const [activePanel, setActivePanel] = useState(null)

  if (!profile) return <p>Loading profile...</p>

  const adminLinks = [
    { key: 'fileUpload', label: 'Upload', icon: <FaFileUpload /> },
    { key: 'milestones', label: 'Goals', icon: <FaFlagCheckered /> },
    { key: 'alerts', label: 'Alerts', icon: <FaBell /> },
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> },
  ]

  const memberLinks = [
    { key: 'tasks', label: 'My Task', icon: <FaTasks /> },
    { key: 'milestones', label: 'Milestones', icon: <FaFlagCheckered /> },
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> }, // Updated to tools icon
  ]

  const links = profile.role === 'admin' ? adminLinks : memberLinks

  return (
    <div style={{ paddingBottom: '4.5rem' }}>
      <Navbar profile={profile} />
      <div className="welcome-section">
  <h2>👋 Welcome, <span>{profile.name}</span>!</h2>
  <p>Let's unlock your YouTube potential.</p>
</div>
      {/* Panels */}
      {activePanel === null && <Home profile={profile} />}
      {activePanel === 'fileUpload' && <FileUpload />}
      {activePanel === 'milestones' && <Milestones />}
      {activePanel === 'alerts' && <Alerts />}
      {activePanel === 'networkpage' && <NetworkPage />}
      {activePanel === 'tasks' && <Tasks profile={profile} />}
      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          onClick={() => setActivePanel(null)}
          className={`nav-item ${activePanel === null ? 'active' : ''}`}
        >
          <FaHome />
          <span>Home</span>
        </button>

        {links.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActivePanel(key)}
            className={`nav-item ${activePanel === key ? 'active' : ''}`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
