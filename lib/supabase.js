import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eqbmdppowdlchytebnns.supabase.co'  
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYm1kcHBvd2RsY2h5dGVibm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDY3MzYsImV4cCI6MjEwNDMyMjczNn0.F_SrdZEztYo0yNSVraNOOHetkylTnuBDpOVYLcZbD8w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)  
