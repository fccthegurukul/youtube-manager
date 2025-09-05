import React, { useState } from 'react';
import {
  FaHome,
  FaTasks,
  FaFlagCheckered,
  FaFileUpload,
  FaBell,
  FaNetworkWired,
  FaTools,
  FaCode, // Script Hub के लिए icon add करें
} from 'react-icons/fa';
import Navbar from './Navbar';
import Tasks from './Tasks';
import Milestones from './Milestones';
import NetworkPage from './NetworkPage';
import FileUpload from './FileUpload';
import Alerts from './Alerts';
import Home from './Home';
import Promember from './promember';
import ScriptHub from './ScriptHub';
import ScriptAdmin from './ScriptAdmin';

export default function Dashboard({ profile }) {
  const [activePanel, setActivePanel] = useState(null);

  if (!profile) return <p>Loading profile...</p>;

  // Admin के लिए links
  const adminLinks = [
    { key: 'fileUpload', label: 'Admin Panel', icon: <FaFileUpload /> },
    { key: 'milestones', label: 'Goals', icon: <FaFlagCheckered /> },
    { key: 'alerts', label: 'Alerts', icon: <FaBell /> },
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> },
    { key: 'scriptadmin', label: 'Script Admin', icon: <FaCode /> }, // Script Admin link
  ];

  // Pro Members के लिए links (Script Hub add किया गया)
  const proMemberLinks = [
    { key: 'promember', label: 'Content Space', icon: <FaTools /> },
    { key: 'scripthub', label: 'Script Hub', icon: <FaCode /> }, // Script Hub link
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> },
  ];

  // Regular Members के लिए links
  const memberLinks = [
    { key: 'tasks', label: 'My Tasks', icon: <FaTasks /> },
    { key: 'milestones', label: 'Milestones', icon: <FaFlagCheckered /> },
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> },
  ];

  // Role के हिसाब से links choose करें
  const links =
    profile.role === 'admin'
      ? adminLinks
      : profile.role === 'promember'
      ? proMemberLinks
      : memberLinks;

  return (
    <div style={{ paddingBottom: '4.5rem' }}>
      <Navbar profile={profile} />
      <div className="welcome-section">
        <h2>👋 Welcome, <span>{profile.name}</span>!</h2>
      </div>

      {/* Panels */}
      {activePanel === null && <Home profile={profile} />}
      {activePanel === 'fileUpload' && <FileUpload />}
      {activePanel === 'milestones' && <Milestones />}
      {activePanel === 'alerts' && <Alerts />}
      {activePanel === 'networkpage' && <NetworkPage />}
      {activePanel === 'tasks' && <Tasks profile={profile} />}
      {activePanel === 'promember' && <Promember profile={profile} />}
      {activePanel === 'scripthub' && <ScriptHub profile={profile} />} {/* Script Hub render करें */}
      {activePanel === 'scriptadmin' && <ScriptAdmin profile={profile} />}

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
  );
}
