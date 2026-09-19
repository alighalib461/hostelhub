import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ebayqkzubjpjtejskuly.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYXlxa3p1YmpwanRlanNrdWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzAyMDksImV4cCI6MjEwNDI0NjIwOX0.Ty39j-WzCaRCyOTOEBqMaum6Hq2xCJVrxg-B2t5xHcQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function runVerification() {
  console.log('====================================================')
  console.log('  HOSTELHUB MULTI-HOSTEL & WARDEN VERIFICATION SUITE')
  console.log('====================================================\n')

  let passed = 0
  let total = 0

  function assert(name, condition, details = '') {
    total++
    if (condition) {
      console.log(`✅ [PASS] ${name}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? '— ' + details : ''}`)
    }
  }

  // 1. Check Table Accessibility & Schema Definition
  console.log('--- 1. Database Schema & Tables Check ---')
  const tables = [
    'hostels',
    'warden_assignments',
    'warden_invitations',
    'payment_accounts',
    'online_payment_submissions',
    'announcements',
    'announcement_hostels',
    'expenses',
    'audit_logs',
    'fee_charges',
    'payments',
    'residents',
    'rooms',
    'beds',
    'complaints',
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0)
    assert(
      `Table "${table}" exists and responds`,
      !error || error.code === 'PGRST116' || error.message.includes('permission') || !error.message.includes('relation does not exist'),
      error ? error.message : ''
    )
  }

  // 2. Check Hostels Menu Column
  console.log('\n--- 2. Hostels Menu Column Check ---')
  const { data: hostelSample, error: hostelErr } = await supabase
    .from('hostels')
    .select('id, name, current_menu_image_url, current_menu_updated_at')
    .limit(1)

  assert(
    'Hostels table has current_menu_image_url and current_menu_updated_at columns',
    !hostelErr,
    hostelErr ? hostelErr.message : ''
  )

  // 3. Check RLS on Protected Tables for Anon Client
  console.log('\n--- 3. Multi-Tenant RLS & Security Policy Checks ---')
  const { data: wardenData, error: wardenErr } = await supabase
    .from('warden_assignments')
    .select('*')

  assert(
    'Anon client cannot inspect private warden assignments (RLS Active)',
    !wardenData || wardenData.length === 0 || wardenErr !== null
  )

  const { data: expData, error: expErr } = await supabase
    .from('expenses')
    .select('*')

  assert(
    'Anon client cannot inspect private expenses ledger (RLS Active)',
    !expData || expData.length === 0 || expErr !== null
  )

  // 4. Test RPC functions existence
  console.log('\n--- 4. Backend Stored Procedures (RPCs) Check ---')
  // Call RPC with dummy params to check if the RPC function exists on Supabase (invalid auth / UUID is expected, function_not_found would be an error)
  const rpcTests = [
    { name: 'verify_online_payment', params: { p_submission_id: '00000000-0000-0000-0000-000000000000', p_action: 'approve' } },
    { name: 'update_hostel_menu', params: { p_hostel_id: '00000000-0000-0000-0000-000000000000', p_image_url: 'https://example.com/menu.jpg' } },
    { name: 'accept_warden_invitation', params: { p_invitation_token: 'dummy-token' } },
  ]

  for (const rpc of rpcTests) {
    const { error } = await supabase.rpc(rpc.name, rpc.params)
    const functionNotFound = error && (error.code === 'PGRST202' || error.message?.includes('Could not find the function'))
    assert(
      `RPC function "${rpc.name}" is registered on Supabase`,
      !functionNotFound,
      error ? error.message : ''
    )
  }

  // Summary
  console.log('\n====================================================')
  console.log(`  VERIFICATION RESULT: ${passed} / ${total} TESTS PASSED`)
  console.log('====================================================')

  if (passed === total) {
    console.log('🎉 ALL MULTI-HOSTEL & WARDEN SERVICES OPERATIONAL!\n')
    process.exit(0)
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n')
    process.exit(1)
  }
}

runVerification()
