import { supabase } from '../supabaseClient'
import AdminPanel from '../components/AdminPanel'


export async function fetchTasksForUser(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', userId)

  if (error) throw error
  return data
}

export async function assignTask({ title, drive_link, assigned_to, className }) {
  const { data, error } = await supabase.from('tasks').insert([
    {
      title,
      drive_link,
      assigned_to,
      class: className,
      status: 'pending',
    },
  ])
  if (error) throw error
  return data
}
