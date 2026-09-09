import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ebayqkzubjpjtejskuly.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYXlxa3p1YmpwanRlanNrdWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzAyMDksImV4cCI6MjEwNDI0NjIwOX0.Ty39j-WzCaRCyOTOEBqMaum6Hq2xCJVrxg-B2t5xHcQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testE2EAccountDeletion() {
  const testEmail = `deltest_${Date.now()}@example.com`
  const testPassword = 'Password123!@#'
  const testName = 'Deletion Test Resident'

  console.log(`1. Signing up test user: ${testEmail}...`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: testName,
        role: 'resident',
      },
    },
  })

  if (signUpError || !signUpData.user) {
    console.error('Sign up failed:', signUpError)
    process.exit(1)
  }

  const userId = signUpData.user.id
  console.log(`   User created with ID: ${userId}`)

  // Create profile row if needed
  await supabase.from('profiles').upsert({
    id: userId,
    full_name: testName,
    email: testEmail,
    role: 'resident',
  })

  // Verify profile exists
  const { data: profileBefore } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  console.log('2. Profile before deletion:', profileBefore ? 'EXISTS' : 'NOT FOUND')

  // 3. Call delete_user_account RPC as this authenticated user
  console.log('3. Executing delete_user_account RPC...')
  const { data: delData, error: delError } = await supabase.rpc('delete_user_account')
  if (delError) {
    console.error('delete_user_account failed:', delError)
    process.exit(1)
  }

  console.log('   RPC returned:', delData)

  // 4. Verify profile no longer exists in profiles table
  const { data: profileAfter } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  console.log('4. Profile after deletion:', profileAfter ? 'STILL EXISTS (ERROR)' : 'PERMANENTLY DELETED (OK)')

  // 5. Try signing in with the deleted credentials - MUST FAIL
  console.log('5. Verifying old credentials cannot sign in...')
  const { data: signInAfter, error: signInAfterError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })

  if (signInAfterError) {
    console.log(`   Sign in correctly rejected with: ${signInAfterError.message}`)
    console.log('SUCCESS: Complete account deletion verified!')
  } else {
    console.error('ERROR: Deleted user was able to log in!', signInAfter)
    process.exit(1)
  }
}

testE2EAccountDeletion()
