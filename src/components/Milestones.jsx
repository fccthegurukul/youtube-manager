import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import './Milestones.css';

export default function Milestones() {
  // 🎉 Track IDs of celebrated milestones
  const [celebratedIds, setCelebratedIds] = useState([]);

  // 📅 Milestone start date
  const milestoneStartDate = new Date('2025-05-20T00:00:00');

  // 🔢 Current stats (update manually)
  const currentSubscribers = 6;
  const currentWatchTime = 4;
  const currentUploads = 1;

  // 🗂️ Milestones
  const milestones = [
    { id: 0, name: '1 Subscriber', target: 1, type: 'subscribers', celebrate: true, targetDays: 4, completedDate: '2025-05-15T10:48:00' },
    { id: 1, name: '100 Subscribers', target: 100, type: 'subscribers', targetDays: 15 },
    { id: 2, name: '500 Subscribers', target: 500, type: 'subscribers', targetDays: 35 },
    { id: 3, name: '1000 Subscribers', target: 1000, type: 'subscribers', celebrate: true, targetDays: 45 },
    { id: 4, name: '4000h Watch Time', target: 4000, type: 'watchtime', celebrate: true, targetDays: 60 },
    { id: 5, name: '1 Video Uploaded', target: 1, type: 'uploading', celebrate: true, targetDays: 5, completedDate: '2025-05-15T10:50:00' },
    { id: 6, name: '100 Videos Uploaded', target: 100, type: 'uploading', targetDays: 30 },
  ];

  // 📊 Progress calculator
  const getProgress = m => {
    if (m.type === 'subscribers') return Math.min((currentSubscribers / m.target) * 100, 100);
    if (m.type === 'watchtime') return Math.min((currentWatchTime / m.target) * 100, 100);
    if (m.type === 'uploading') return Math.min((currentUploads / m.target) * 100, 100);
    return 0;
  };

  // ✅ Completion check
  const isCompleted = m => {
    if (m.type === 'subscribers') return currentSubscribers >= m.target;
    if (m.type === 'watchtime') return currentWatchTime >= m.target;
    if (m.type === 'uploading') return currentUploads >= m.target;
    return false;
  };

  // 🕒 Time remaining/overdue
  const getTimeRemainingText = m => {
    if (!m.targetDays) return '';
    const targetDate = new Date(milestoneStartDate.getTime() + m.targetDays * 86400000);
    const now = new Date();
    const diff = targetDate - now;
    const abs = Math.abs(diff);
    const d = Math.floor(abs / 86400000);
    const h = Math.floor((abs / 3600000) % 24);
    const min = Math.floor((abs / 60000) % 60);
    return diff > 0
      ? `⏳ ${d}d ${h}h ${min}m left`
      : `⚠️ Overdue by ${d}d ${h}h ${min}m`;
  };

  // 📅 Completion date text
  const getCompletionDateText = m => {
    if (!isCompleted(m) || !m.targetDays) return '';
    const targetDate = new Date(milestoneStartDate.getTime() + m.targetDays * 86400000);
    const now = new Date();
    const comp = m.completedDate ? new Date(m.completedDate) : (now < targetDate ? now : targetDate);
    return `✅ Completed on ${comp.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} at ${comp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // 🎉 Fire confetti on celebrate milestones that are completed
  useEffect(() => {
    const toCelebrate = milestones.filter(m => m.celebrate && isCompleted(m));
    toCelebrate.forEach(m => {
      if (!celebratedIds.includes(m.id)) {
        setCelebratedIds(prev => [...prev, m.id]);
        // Remove after 10s
        setTimeout(() => {
          setCelebratedIds(prev => prev.filter(id => id !== m.id));
        }, 10000);
      }
    });
  }, [milestones, celebratedIds]);

  // 🔢 Grouped milestone view
  const types = ['subscribers', 'watchtime', 'uploading'];
  const grouped = types.map(type => {
    const list = milestones.filter(m => m.type === type);
    const done = list.filter(isCompleted);
    const next = list.find((m, i) => !isCompleted(m) && (i === 0 || isCompleted(list[i - 1])));
    return [...(next ? [next] : []), ...done];
  });

  return (
    <div className="milestones-container">
      <h2>🚀 YouTube Milestones</h2>
      <p className="subtitle">Subscribers, Watch Time & Video Uploading Progress</p>

      {grouped.map((section, idx) => (
        <div key={types[idx]} className="milestones-grid">
          {section.map(m => {
            const progress = Math.floor(getProgress(m));
            const completed = isCompleted(m);
            const timeTxt = getTimeRemainingText(m);
            const compTxt = getCompletionDateText(m);

            return (
              <motion.div
                key={m.id}
                className={`milestone-card ${completed ? 'completed' : ''}`}
                whileHover={{ scale: 1.03 }}
              >
                <div className="milestone-header">
                  <span className="milestone-icon">{completed ? '🏁' : '🎯'}</span>
                  <h3>{m.name}</h3>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="progress-text">{`${progress}% complete`}</p>

                {m.targetDays && !completed && (
                  <p className="target-days">🎯 Target: {m.targetDays} days</p>
                )}
                {m.targetDays && <p className="time-remaining">{timeTxt}</p>}
                {completed && <p className="completion-date">{compTxt}</p>}

                <span className={`badge ${completed ? 'badge-complete' : 'badge-pending'}`}>
                  {completed ? 'Completed' : 'In Progress'}
                </span>

                {/* 🎉 Confetti on celebrated milestone card for 10s */}
                {celebratedIds.includes(m.id) && (
                  <Confetti width={300} height={200} numberOfPieces={150} recycle={false} />
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
