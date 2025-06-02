import React, { useState } from 'react';
import {
  FaHome,
  FaTasks,
  FaFlagCheckered,
  FaFileUpload,
  FaBell,
  FaNetworkWired,
  FaTools,
} from 'react-icons/fa';
import Navbar from './Navbar';
import Tasks from './Tasks';
import Milestones from './Milestones';
import NetworkPage from './NetworkPage';
import FileUpload from './FileUpload';
import Alerts from './Alerts';
import Home from './Home';
import Promember from './promember'; // Promember component import karo

export default function Dashboard({ profile }) {
  const [activePanel, setActivePanel] = useState(null);

  if (!profile) return <p>Loading profile...</p>;

  // Admin ke liye links
  const adminLinks = [
    { key: 'fileUpload', label: 'Admin Panel', icon: <FaFileUpload /> },
    { key: 'milestones', label: 'Goals', icon: <FaFlagCheckered /> },
    { key: 'alerts', label: 'Alerts', icon: <FaBell /> },
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> },
  ];

  // Pro Members ke liye links
  const proMemberLinks = [
    { key: 'promember', label: 'Content Space', icon: <FaTools /> }, // Promember ka link
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> },
  ];

  // Regular Members ke liye links
  const memberLinks = [
    { key: 'tasks', label: 'My Tasks', icon: <FaTasks /> },
    { key: 'milestones', label: 'Milestones', icon: <FaFlagCheckered /> },
    { key: 'networkpage', label: 'Network Page', icon: <FaNetworkWired /> },
  ];

  // Role ke hisaab se links choose karo
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
        <p>Let's unlock your YouTube potential.</p>
      </div>

      {/* Panels */}
      {activePanel === null && <Home profile={profile} />}
      {activePanel === 'fileUpload' && <FileUpload />}
      {activePanel === 'milestones' && <Milestones />}
      {activePanel === 'alerts' && <Alerts />}
      {activePanel === 'networkpage' && <NetworkPage />}
      {activePanel === 'tasks' && <Tasks profile={profile} />}
      {activePanel === 'promember' && <Promember profile={profile} />} {/* Promember render karo */}

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