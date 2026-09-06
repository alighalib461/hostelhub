import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ebayqkzubjpjtejskuly.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYXlxa3p1YmpwanRlanNrdWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzAyMDksImV4cCI6MjEwNDI0NjIwOX0.Ty39j-WzCaRCyOTOEBqMaum6Hq2xCJVrxg-B2t5xHcQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
