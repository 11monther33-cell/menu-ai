import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qtljdlxiumqktxgzmjsg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bGpkbHhpdW1xa3R4Z3ptanNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTgyMzcsImV4cCI6MjA5MTAzNDIzN30.mofudv88asa1Vg4tPk0mBuCNsQAz9fmRmfiU94K2SBY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Attempting sign in...")
  const { data, error } = await supabase.auth.signInWithPassword({
    email: '11monther44@gmail.com',
    password: 'bnm@0987',
  })
  
  if (error) {
    console.error("Auth Error:", error.message)
    return;
  }
  
  console.log("Login successful! User ID:", data.user.id)
  
  console.log("Checking profile...")
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single();
    
  if (profileError) {
    console.error("Profile Error:", profileError.message)
  } else {
    console.log("Profile:", profile)
  }
}

test()
