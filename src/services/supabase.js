import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehvjybhrdrgvziiesnlk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodmp5YmhyZHJndnppaWVzbmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTY1OTIsImV4cCI6MjA2Mjg3MjU5Mn0.YfP8m4mpjUfMxuSBWnKPr2uuvKFwyxaXIUDOKfuFSj8'

export const supabase = createClient(supabaseUrl, supabaseKey)
