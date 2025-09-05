// src/pages/ScriptAdmin.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  FaPlus, FaTrash, FaSave, FaSearch, FaEdit, FaTimes,
  FaArrowUp, FaArrowDown, FaCheckCircle, FaYoutube, FaVolumeUp, FaLink, FaRedo
} from 'react-icons/fa';
import { listVoicesForScript, voiceFolderForScript } from '../helpers/voiceStorage';
import './ScriptAdmin.css';

const emptySection = { timeStamp: '', title: '', mood: '', content: '' };

export default function ScriptAdmin() {
  const [user, setUser] = useState(null);

  // Listing
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  // Voices by script.id
  const [voicesMap, setVoicesMap] = useState({}); // { [id]: [{name,path,url}] }
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Form
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: 'history',
    duration: '',
    difficulty: 'Medium',
    description: '',
    intro_note: '',
    youtube_url: '',
    youtube_type: 'long',
  });
  const [sections, setSections] = useState([{ ...emptySection }]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, []);

  const loadItems = async () => {
    setLoadingList(true);
    const { data, error } = await supabase.from('scripts').select('*').order('updated_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoadingList(false);
  };

  const loadVoices = async (rows) => {
    setLoadingVoices(true);
    const entries = await Promise.all(
      (rows || items).map(async (s) => {
        const { files } = await listVoicesForScript(supabase, s); // list per folder [1]
        return [s.id, files];
      })
    );
    setVoicesMap(Object.fromEntries(entries));
    setLoadingVoices(false);
  };

  const reloadVoicesForEditing = async () => {
    if (!editingId) return;
    const s = items.find(x => x.id === editingId);
    if (!s) return;
    const { files } = await listVoicesForScript(supabase, s); // [1]
    setVoicesMap(prev => ({ ...prev, [editingId]: files }));
  };

  const downloadVoice = async (path) => {
    const { data, error } = await supabase.storage.from('voices').download(path); // binary file [13]
    if (error) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(data);
    a.download = path.split('/').pop();
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  };

  useEffect(() => { loadItems(); }, []);
  useEffect(() => { if (items.length) loadVoices(items); }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((s) => {
      const mSearch =
        s.title?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.intro_note?.toLowerCase().includes(term);
      const mCat = cat === 'all' || s.category === cat;
      return mSearch && mCat;
    });
  }, [items, q, cat]);

  const updateField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const updateSection = (i, k, v) => setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const addSection = () => setSections((prev) => [...prev, { ...emptySection }]);
  const removeSection = (i) => setSections((prev) => prev.filter((_, idx) => idx !== i));
  const moveSection = (i, dir) => {
    setSections((prev) => {
      const next = [...prev];
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', category: 'history', duration: '', difficulty: 'Medium', description: '', intro_note: '', youtube_url: '', youtube_type: 'long' });
    setSections([{ ...emptySection }]);
    setMsg('');
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title required';
    if (!form.category) return 'Category required';
    if (!sections.length) return 'At least one section required';
    for (const [idx, s] of sections.entries()) {
      if (!s.title?.trim()) return `Section ${idx + 1}: title required`;
      if (!s.content?.trim()) return `Section ${idx + 1}: content required`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setMsg('Login required to save');
    const err = validate();
    if (err) return setMsg(err);
    setSaving(true); setMsg('');
    const payload = {
      title: form.title, category: form.category, duration: form.duration || null, difficulty: form.difficulty || null,
      description: form.description || null, intro_note: form.intro_note || null, sections,
      youtube_url: form.youtube_url || null, youtube_type: form.youtube_url ? form.youtube_type : null, author_id: user.id,
    };
    if (editingId) {
      const { error } = await supabase.from('scripts').update(payload).eq('id', editingId);
      if (error) setMsg(error.message); else { setMsg('Updated'); await loadItems(); await loadVoices(items); }
    } else {
      const { error } = await supabase.from('scripts').insert(payload);
      if (error) setMsg(error.message); else { setMsg('Created'); resetForm(); await loadItems(); await loadVoices(items); }
    }
    setSaving(false);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      title: row.title || '', category: row.category || 'history', duration: row.duration || '',
      difficulty: row.difficulty || 'Medium', description: row.description || '', intro_note: row.intro_note || '',
      youtube_url: row.youtube_url || '', youtube_type: row.youtube_type || 'long',
    });
    setSections(Array.isArray(row.sections) ? row.sections : [{ ...emptySection }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-wrap">
      <h2>Script Admin</h2>
      {!user && <div className="note">Insert/Update ke liye authentication required hai (Supabase Auth).</div>}

      <div className="admin-grid">
        {/* Left: listing */}
        <aside className="admin-left">
          <div className="list-toolbar">
            <div className="search">
              <FaSearch />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/description/intro..." />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All</option>
              <option value="history">history</option>
              <option value="biography">biography</option>
              <option value="motivational">motivational</option>
              <option value="spiritual">spiritual</option>
              <option value="other">other</option>
            </select>
            <button className="btn-ghost" onClick={loadItems} disabled={loadingList}>Refresh</button>
          </div>

          <div className="list">
            {loadingList ? <div className="muted">Loading...</div> : null}
            {loadingVoices ? <div className="muted">Checking voices…</div> : null}
            {!loadingList && filtered.length === 0 ? <div className="muted">No scripts</div> : null}

            {filtered.map((row) => {
              const published = !!row.youtube_url;
              // Prefer DB status; fallback to storage listing if DB hasn't been updated
              const fallbackCount = (voicesMap[row.id] || []).length;
              const voiceCount = row.voice_count || fallbackCount;
              const voiceUploaded = row.voice_uploaded || fallbackCount > 0;

              return (
                <div key={row.id} className="row">
                  <div className="row-main">
                    <div className="row-title" title={row.title}>{row.title}</div>
                    <div className="row-sub">
                      <span className="chip">{row.category}</span>
                      {row.duration ? <span className="chip">{row.duration}</span> : null}
                      {row.difficulty ? <span className="chip">{row.difficulty}</span> : null}
                      {published ? <span className="chip ok" title="Published"><FaCheckCircle /> Published</span> : null}
                      {row.youtube_type ? <span className="chip yt"><FaYoutube /> {row.youtube_type}</span> : null}
                      {voiceUploaded ? (
                        <span className="chip voice"><FaVolumeUp /> {voiceCount} voice(s)</span>
                      ) : (
                        <span className="chip muted">No voice</span>
                      )}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => startEdit(row)} title="Edit"><FaEdit /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right: form */}
        <main className="admin-right">
          <div className="form-header">
            <h3>{editingId ? 'Update Script' : 'Create Script'}</h3>
            {editingId ? <button className="icon-btn" onClick={resetForm} title="Cancel editing"><FaTimes /></button> : null}
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="grid-2">
              <label>
                Title
                <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} />
              </label>
              <label>
                Category
                <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                  <option value="history">history</option>
                  <option value="biography">biography</option>
                  <option value="motivational">motivational</option>
                  <option value="spiritual">spiritual</option>
                  <option value="other">other</option>
                </select>
              </label>
              <label>
                Duration
                <input value={form.duration} onChange={(e) => updateField('duration', e.target.value)} placeholder="8 मिनट" />
              </label>
              <label>
                Difficulty
                <select value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value)}>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Advanced</option>
                </select>
              </label>
            </div>

            <label>
              Description
              <textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </label>

            <label>
              Intro Note
              <textarea rows={2} value={form.intro_note} onChange={(e) => updateField('intro_note', e.target.value)} />
            </label>

            <div className="grid-2">
              <label>
                YouTube URL
                <input value={form.youtube_url} onChange={(e) => updateField('youtube_url', e.target.value)} placeholder="https://youtu.be/..." />
              </label>
              <label>
                Video Type
                <select value={form.youtube_type} onChange={(e) => updateField('youtube_type', e.target.value)} disabled={!form.youtube_url}>
                  <option value="long">long</option>
                  <option value="short">short</option>
                </select>
              </label>
            </div>

            <h4>Sections</h4>
            <div className="sections">
              {sections.map((s, i) => (
                <div className="section-item" key={i}>
                  <div className="section-grid">
                    <input value={s.timeStamp} onChange={(e) => updateSection(i, 'timeStamp', e.target.value)} placeholder="[0:00 - 0:30]" />
                    <input value={s.title} onChange={(e) => updateSection(i, 'title', e.target.value)} placeholder="Title" />
                    <input value={s.mood} onChange={(e) => updateSection(i, 'mood', e.target.value)} placeholder="Mood" />
                  </div>
                  <textarea rows={4} value={s.content} onChange={(e) => updateSection(i, 'content', e.target.value)} placeholder="Content..." />
                  <div className="section-actions">
                    <button type="button" className="icon-btn" onClick={() => moveSection(i, 'up')} title="Move up" disabled={i === 0}><FaArrowUp /></button>
                    <button type="button" className="icon-btn" onClick={() => moveSection(i, 'down')} title="Move down" disabled={i === sections.length - 1}><FaArrowDown /></button>
                    <button type="button" className="icon-btn danger" onClick={() => removeSection(i)} title="Remove"><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn-ghost" onClick={addSection}><FaPlus /> Add Section</button>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}><FaSave /> {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              {msg ? <span className="msg">{msg}</span> : null}
            </div>
          </form>

          {/* Voice files panel */}
          {editingId && (
            <div className="voice-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Voice uploads</h4>
                <button className="icon-btn" title="Reload voices" onClick={reloadVoicesForEditing}><FaRedo /></button>
              </div>

              {(!voicesMap[editingId] || voicesMap[editingId].length === 0) ? (
                <>
                  {(() => {
                    const row = items.find(x => x.id === editingId);
                    if (row?.voice_uploaded && row?.voice_sample_url) {
                      const folder = voiceFolderForScript(row);
                      return (
                        <div className="voice-row">
                          <span className="voice-name">{folder} (sample)</span>
                          <audio controls src={row.voice_sample_url} preload="metadata" />
                          <a href={row.voice_sample_url} target="_blank" rel="noreferrer" className="voice-link"><FaLink /> Open</a>
                        </div>
                      );
                    }
                    return <div className="muted">No voice files found.</div>;
                  })()}
                </>
              ) : (
                <div className="voice-list">
                  {voicesMap[editingId].map((v, idx) => (
                    <div key={idx} className="voice-row">
                      <span className="voice-name">{v.name}</span>
                      <audio controls src={v.url} preload="metadata" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={v.url} target="_blank" rel="noreferrer" className="voice-link"><FaLink /> Open</a>
                        <button className="btn-ghost" onClick={() => downloadVoice(v.path)}>Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
