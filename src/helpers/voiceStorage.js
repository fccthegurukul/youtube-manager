// src/helpers/voiceStorage.js
// List voice files for a given script from the 'voices' bucket
export function slugify(s = '') {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

export function voiceFolderForScript(script) {
  const slug = slugify(script?.title || `script-${script?.id}`);
  return `${script?.id}-${slug}`;
}

// Returns { files: [{name, path, url}], error }
export async function listVoicesForScript(supabase, script) {
  const folder = voiceFolderForScript(script);
  const { data, error } = await supabase.storage.from('voices').list(folder, {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' }
  });
  if (error) return { files: [], error };
  const files = (data || []).map((f) => {
    const path = `${folder}/${f.name}`;
    const { data: pub } = supabase.storage.from('voices').getPublicUrl(path);
    return { name: f.name, path, url: pub?.publicUrl || '' };
  });
  return { files, error: null };
}
