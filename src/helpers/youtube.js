// helpers/youtube.js
export function youtubeToEmbed(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, '');
    const segs = u.pathname.split('/').filter(Boolean); // remove empty segments

    // youtu.be/<id>
    if (host === 'youtu.be' && segs) {
      return `https://www.youtube.com/embed/${segs}`;
    }

    // *.youtube.com/*
    if (host.endsWith('youtube.com')) {
      // watch?v=<id>
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;

      // /shorts/<id>
      const sIdx = segs.indexOf('shorts');
      if (sIdx !== -1 && segs[sIdx + 1]) {
        return `https://www.youtube.com/embed/${segs[sIdx + 1]}`;
      }

      // /live/<id>
      const lIdx = segs.indexOf('live');
      if (lIdx !== -1 && segs[lIdx + 1]) {
        return `https://www.youtube.com/embed/${segs[lIdx + 1]}`;
      }

      // /embed/<id>
      const eIdx = segs.indexOf('embed');
      if (eIdx !== -1 && segs[eIdx + 1]) {
        return `https://www.youtube.com/embed/${segs[eIdx + 1]}`;
      }
    }
  } catch {}
  return null;
}
