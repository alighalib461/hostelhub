import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ebayqkzubjpjtejskuly.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYXlxa3p1YmpwanRlanNrdWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzAyMDksImV4cCI6MjEwNDI0NjIwOX0.Ty39j-WzCaRCyOTOEBqMaum6Hq2xCJVrxg-B2t5xHcQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testPublicDeletionRequest() {
  console.log('Testing public deletion request via RPC...')
  const testPayload = {
    p_full_name: 'Test GooglePlay Resident',
    p_email: `test_play_${Date.now()}@example.com`,
    p_phone: '03001234567',
    p_role: 'resident',
    p_reason: 'Google Play account deletion compliance test',
  }

  const { data, error } = await supabase.rpc('submit_account_deletion_request', testPayload)

  if (error) {
    console.error('FAILED public deletion request:', error)
    process.exit(1)
  }

  console.log('SUCCESS: Public deletion request created with ticket:', data)

  // Verify that anon user cannot read other requests (RLS verification)
  const { data: readData, error: readError } = await supabase
    .from('account_deletion_requests')
    .select('*')

  console.log('Anon select attempt returned rows:', readData ? readData.length : 0)
  if (readData && readData.length > 0) {
    console.error('WARNING: Anon user was able to read requests! RLS should prevent listing.')
    process.exit(1)
  } else {
    console.log('SUCCESS: RLS correctly protects requests table from anon read access.')
  }
}

testPublicDeletionRequest()
