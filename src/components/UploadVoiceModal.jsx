// src/components/UploadVoiceModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FaTimes, FaUpload, FaLink } from 'react-icons/fa';
import successSfx from '../Sound/tick-sound.mp3'; // keep a ~1s tick sound at src/Sound/tick.mp3

const BUCKET = 'voices';

function slugify(s = '') {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

export default function UploadVoiceModal({ open, onClose, supabase, script, onUploaded }) {
  const [items, setItems] = useState([]); // [{file, name, progress, state, path, url?}]
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Preload short success sound (safe to construct each mount)
  const successAudio = useMemo(() => {
    const a = new Audio(successSfx);
    a.preload = 'auto';
    a.volume = 0.65;
    return a;
  }, []);

  const folder = useMemo(() => {
    if (!script) return '';
    const slug = slugify(script.title || `script-${script.id}`);
    return `${script.id}-${slug}`;
  }, [script]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) { setItems([]); setMessage(''); setUploading(false); setShowSuccess(false); }
  }, [open]);

  const onSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const bad = files.find((f) => !/^audio\//.test(f.type));
    if (bad) return setMessage('Please select only audio files (mp3, wav, m4a, etc.)');
    const oversize = files.find((f) => f.size > 50 * 1024 * 1024);
    if (oversize) return setMessage('Max 50MB per file (standard uploads)');
    setMessage('');
    setItems(files.map((f) => ({
      file: f, name: f.name, progress: 0, state: 'queued', path: '', url: ''
    })));
  };

  const startSmoothProgress = (index) => {
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(p + 2, 90);
      setItems((prev) => prev.map((it, i) => (i === index ? { ...it, progress: p } : it)));
    }, 120);
    return () => clearInterval(id);
  };

  const doUploadAll = async () => {
    if (!items.length || !script) return;
    setUploading(true);
    setMessage('Uploading...');
    try {
      const slug = slugify(script.title || `script-${script.id}`);
      const uploaded = [];

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const f = it.file;
        const ext = f.name.includes('.') ? f.name.split('.').pop() : '';
        const stamp = Date.now();
        const filename = `${slug}-${stamp}${ext ? '.' + ext : ''}`;
        const path = `${folder}/${filename}`;

        setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, state: 'uploading' } : x)));
        const stop = startSmoothProgress(i);

        const { error } = await supabase.storage.from(BUCKET).upload(path, f, {
          contentType: f.type, upsert: false, cacheControl: '3600'
        });

        stop();

        if (error) {
          setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, state: 'error', progress: 0 } : x)));
          throw new Error(error.message || 'Upload error');
        } else {
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          const url = pub?.publicUrl || '';
          uploaded.push({ name: f.name, path, url });
          setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, state: 'done', progress: 100, path, url } : x)));
        }
      }

      // Persist voice meta
      const first = uploaded?.url || null;
      await supabase.from('scripts').update({
        voice_uploaded: true,
        voice_folder: folder,
        voice_sample_url: first,
        voice_count: uploaded.length
      }).eq('id', script.id);

      setMessage('All files uploaded');

      // Celebrate: play short success sfx using Promise pattern (autoplay‑safe after user action)
      try {
        successAudio.currentTime = 0;
        const p = successAudio.play();
        if (p && typeof p.then === 'function') p.catch(() => {}); // ignore policy rejections
      } catch (_) {}

      // Show success overlay and wait so animation completes
      setShowSuccess(true);
      await new Promise((r) => setTimeout(r, 1450));
      setShowSuccess(false);

      // Notify parent AFTER animation
      if (typeof onUploaded === 'function') onUploaded();
    } catch (e) {
      setMessage(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="upload-modal-overlay show" onClick={onClose}>
      <div className="upload-modal-card show" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h4>Upload Voice</h4>
          <button className="icon-btn" onClick={onClose} title="Close"><FaTimes /></button>
        </div>
        <div className="upload-modal-body">
          <div className="dest">
            <div className="label">Script</div>
            <div className="value" title={script?.title}>{script?.title}</div>
          </div>
          <div className="dest">
            <div className="label">Destination</div>
            <div className="value">voices/{folder}</div>
          </div>
          <input type="file" accept="audio/*" multiple onChange={onSelect} />
          {items.length > 0 && (
            <div className="file-list">
              {items.map((it, i) => (
                <div key={i} className="file-row">
                  <div className="file-main">
                    <div className="file-name" title={it.name}>{it.name}</div>
                    <div className={`chip ${it.state}`}>
                      {it.state === 'queued' && 'Queued'}
                      {it.state === 'uploading' && 'Uploading'}
                      {it.state === 'done' && 'Done'}
                      {it.state === 'error' && 'Error'}
                    </div>
                  </div>
                  <div className="progress-wrap" aria-label="Upload progress">
                    <div className="progress-bar"><span className="progress-fill" style={{ width: `${it.progress}%` }} /></div>
                    <div className="progress-text">{it.progress}%</div>
                  </div>
                  {it.url ? <a href={it.url} target="_blank" rel="noreferrer" className="open-link"><FaLink /> Open</a> : null}
                </div>
              ))}
            </div>
          )}
          <div className="actions-row">
            <button className="btn-primary" disabled={!items.length || uploading} onClick={doUploadAll}>
              <FaUpload /> {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {message && <div className="msg">{message}</div>}
        </div>
      </div>

      {/* Success tick + confetti overlay */}
      {showSuccess && (
        <div className="success-pop" role="status" aria-live="polite" aria-atomic="true">
          <div className="success-wrap">
            <svg className="checkmark" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="checkmark__fill"   cx="26" cy="26" r="25" />
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path   className="checkmark__check"  fill="none" d="M14 27 l8 8 16-16" />
            </svg>
            <div className="confetti" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
