// src/components/ScriptHub.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  FaMicrophone, FaCode, FaSearch, FaPlay, FaVolumeUp, FaClock, FaDownload, FaExternalLinkAlt, FaTag, FaUpload,
} from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import ScriptViewer from './ScriptViewer';
import { youtubeToEmbed } from '../helpers/youtube';
import { exportScriptToPrint } from './pdf/exportScriptPdf';
import UploadVoiceModal from './UploadVoiceModal';
import './Scripthub.css';

const ScriptHub = ({ profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScript, setSelectedScript] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState([]);
  const [uploadTarget, setUploadTarget] = useState(null);

  const categories = [
    { value: 'all', label: 'सभी स्क्रिप्ट्स' },
    { value: 'history', label: 'इतिहास' },
    { value: 'biography', label: 'जीवनी' },
    { value: 'motivational', label: 'प्रेरणादायक' },
    { value: 'spiritual', label: 'आध्यात्मिक' },
    { value: 'other', label: 'अन्य' }
  ];

  // Load scripts with voice metadata
  // const loadScripts = async () => {
  //   setLoading(true);
  //   const { data } = await supabase
  //     .from('scripts')
  //     .select('*')
  //     .order('created_at', { ascending: false });
  //   setScripts(data || []);
  //   setLoading(false);
  // };

    // Load scripts with newest first
  const loadScripts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('scripts')
      .select('*')
      .order('created_at', { ascending: false }); // newest first
    setScripts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadScripts(); }, []);

  // Localized date formatter (Hindi, 24h/12h browser setting ke hisaab se)
const fmtCreatedAt = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return new Intl.DateTimeFormat('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};


  const filteredScripts = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return scripts.filter((s) => {
      const matchesSearch =
        s.title?.toLowerCase().includes(t) ||
        s.description?.toLowerCase().includes(t) ||
        s.intro_note?.toLowerCase().includes(t);
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [scripts, searchTerm, selectedCategory]);

  if (selectedScript) {
    return <ScriptViewer script={selectedScript} onBack={() => setSelectedScript(null)} />;
  }

  return (
    <div className="script-hub-container">
      <div className="script-hub-header fx">
        <div className="fx-bg"></div>
        <div className="fx-ring"></div>
        <h2 className="fx-title">
          <span className="fx-icon"><FaMicrophone/></span>
          <span className="fx-text">Voice‑Over</span>
        </h2>
        <p className="fx-sub">
          Shine On, {profile?.name || 'Creator'}! ✨
        </p>
        <div className="fx-eq">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="स्क्रिप्ट खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Scripts Grid */}
      {loading ? <div className="loading">Loading...</div> : null}

     <div className="scripts-grid">
        {filteredScripts.map((script) => {
          const embed = script.youtube_url ? youtubeToEmbed(script.youtube_url) : null;
          const isPublished = !!script.youtube_url;
          const showVoice = !isPublished && !!script.voice_uploaded;
          const sampleUrl = !isPublished ? (script.voice_sample_url || '') : '';

          return (
            <div key={script.id} className="script-card">
              <div className="script-header">
                <h3 title={script.title} className="script-title">
                  {script.title}
                </h3>
                <div className="badges">
                  {isPublished && (
                    <span className="pub-badge">
                      <FaTag /> Published
                    </span>
                  )}
                  {showVoice && (
                    <span className="voice-badge">
                      <FaVolumeUp /> Voice uploaded
                    </span>
                  )}
                  {script.difficulty && (
                    <span
                      className={`difficulty-badge ${String(script.difficulty).toLowerCase()}`}
                    >
                      {script.difficulty}
                    </span>
                  )}
                </div>
              </div>

              {/* YouTube area: always iframe when URL exists (long or shorts) */}
              {embed ? (
                <div className="video-embed">
                  <iframe
                    src={`${embed}?rel=0&playsinline=1&modestbranding=1&enablejsapi=1&controls=1`}
                    title={script.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    loading="lazy"
                  />
                </div>
              ) : null}

              <div className="script-meta">
                <div className="duration"><FaClock /> {script.duration || '—'}</div>
                <div className="category"><span className="category-tag">{script.category}</span></div>
              </div>

              <p className="script-description">{script.description}</p>
              {script.intro_note ? <p className="intro-note">📝 {script.intro_note}</p> : null}

              {/* Optional voice inline preview only when not published */}
              {showVoice && sampleUrl && (
                <div className="voices-inline">
                  <span className="voices-count">{script.voice_count || 1} audio</span>
                  <audio controls src={sampleUrl} preload="metadata" />
                </div>
              )}

              <div className="script-preview">
                <div className="actions actions-tight">
                  <button className="btn primary" onClick={() => setSelectedScript(script)}>
                    <FaPlay /> Script
                  </button>
                  <button className="btn outline" onClick={() => exportScriptToPrint(script)}>
                    <FaDownload /> PDF Script
                  </button>

                  {/* NEW: Additional file button */}
                  {script.additional_file_url && (
                    <a
                      className="btn ghost"
                      href={script.additional_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open additional file"
                    >
                      <FaExternalLinkAlt /> Additional file
                    </a>
                  )}

                  {showVoice && sampleUrl && (
                    <a className="btn ghost" href={sampleUrl} target="_blank" rel="noopener noreferrer">
                      <FaVolumeUp /> Listen
                    </a>
                  )}

                  {!isPublished && (
                    <button className="btn accent" onClick={() => setUploadTarget(script)} title="Upload Voice">
                      <FaUpload /> Upload
                    </button>
                  )}
                </div>
                <div className="sections-count">
                  {(script.sections || []).length} सेक्शन्स
                </div>
              </div>
 <div
                className="created-at-badge"
                title={new Date(script.created_at).toLocaleString('hi-IN')}
              >
                {fmtCreatedAt(script.created_at)}
              </div>
            </div>
          );
        })}
      </div>

      {(!loading && filteredScripts.length === 0) && (
        <div className="no-results">
          <FaVolumeUp size={48} />
          <p>कोई स्क्रिप्ट नहीं मिली।</p>
          <p>अलग keywords से search करें।</p>
        </div>
      )}

      {/* In-card upload modal; refresh list after upload */}
      {uploadTarget && (
        <UploadVoiceModal
          open={!!uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={async () => { setUploadTarget(null); await loadScripts(); }}
          supabase={supabase}
          script={uploadTarget}
        />
      )}
    </div>
  );
};

export default ScriptHub;
