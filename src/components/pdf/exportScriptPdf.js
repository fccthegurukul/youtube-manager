// Hindi-safe printing that always shows content using a Blob URL

function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildPrintableHtml(script) {
  const title = escapeHtml(script?.title || 'Script');
  const metaLine = [escapeHtml(script?.category || ''), escapeHtml(script?.duration || ''), escapeHtml(script?.difficulty || '')]
    .filter(Boolean)
    .join(' • ');
  const description = escapeHtml(script?.description || '');
  const sections = Array.isArray(script?.sections) ? script.sections : [];

  const sectionsHtml = sections
    .map((s) => {
      const ts = escapeHtml(s?.timeStamp || '');
      const st = escapeHtml(s?.title || '');
      const mood = escapeHtml(s?.mood || '');
      const content = escapeHtml(s?.content || '');
      return `
        <section class="sec">
          <div class="ts">${ts}</div>
          <h2>${st}</h2>
          <div class="mood">${mood}</div>
          <pre class="content">${content}</pre>
        </section>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { height: 100%; }
    body {
      margin: 0; color: #111; background: #fff;
      font-family: "Noto Sans Devanagari", "Mangal", "Hind", "Kohinoor Devanagari",
                   "Nirmala UI", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    }
    .page { max-width: 820px; margin: 24px auto; padding: 0 24px 48px; }
    h1 { font-size: 28px; margin: 0 0 6px; font-weight: 700; }
    .meta { color:#4b5bbd; font-weight: 600; margin: 0 0 10px; }
    .desc { color:#444; margin: 0 0 12px; }
    hr { border: 0; border-top: 2px solid #e5e7eb; margin: 12px 0 8px; }

    .sec { margin: 16px 0 20px; page-break-inside: avoid; break-inside: avoid; }
    .ts { display:inline-block; background:rgba(63,81,181,0.12); color:#3f51b5; border:1px solid #3f51b5; border-radius:14px; padding:4px 10px; font-size:12px; font-weight:700; }
    h2 { font-size: 22px; margin: 10px 0 6px; }
    .mood { color:#666; font-style: italic; margin: 0 0 6px; }
    .content { white-space:pre-wrap; line-height:1.72; font-size:16px; margin:0 0 8px; font-family:inherit; word-wrap:break-word; }

    .toolbar { position: sticky; top:0; z-index:1; background:#f8fafc; border-bottom:1px solid #e5e7eb; padding:10px 16px; display:flex; gap:8px; justify-content:flex-end; }
    .btn { background:#3f51b5; color:#fff; border:0; border-radius:8px; padding:8px 12px; cursor:pointer; font-weight:600; }
    .btn.secondary { background:#2d2d2d; }

    @page { size: A4; margin: 18mm 16mm 20mm; }
    @media print {
      .page { max-width:none; margin:0; padding:0; }
      h1, h2 { break-after: avoid; page-break-after: avoid; }
      .sec { page-break-inside: avoid; break-inside: avoid; }
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn" onclick="window.print()">Print / Save PDF</button>
    <button class="btn secondary" onclick="window.close()">Close</button>
  </div>
  <div class="page">
    <h1>${title}</h1>
    <div class="meta">${metaLine}</div>
    <p class="desc">${description}</p>
    <hr />
    ${sectionsHtml}
  </div>
  <script>
    (async function() {
      try { if (document.fonts && document.fonts.ready) { await document.fonts.ready; } } catch(e) {}
      setTimeout(() => { window.focus(); window.print(); }, 150);
      window.onafterprint = () => { window.close(); };
    })();
  </script>
</body>
</html>`;
}

export function exportScriptToPrint(script) {
  const html = buildPrintableHtml(script);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob); // robust way to load full HTML into a new tab
  const w = window.open(url, '_blank', 'noopener,width=1024,height=768'); // keep noreferrer off
  if (!w) {
    // Fallback: open via temporary <a> if popup blocked
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  // Revoke later to free memory
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
