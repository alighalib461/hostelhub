import http from 'http'

async function checkUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5173${path}`, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ path, statusCode: res.statusCode, length: data.length })
      })
    }).on('error', reject)
  })
}

async function main() {
  console.log('Testing All SPA Client Routes on Dev Server...\n')
  const routes = [
    '/',
    '/login',
    '/signup',
    '/invite/warden/test-invitation-token',
    '/privacy-policy',
    '/terms-and-conditions',
    '/account-deletion',
    '/app/dashboard',
    '/app/wardens',
    '/app/payment-verifications',
    '/app/payment-accounts',
    '/app/menu',
    '/app/announcements',
    '/app/expenses',
    '/warden/dashboard',
    '/warden/residents',
    '/warden/fees',
    '/warden/menu',
    '/resident/dashboard',
    '/resident/fees',
    '/resident/pay-online',
    '/resident/menu',
    '/resident/announcements',
  ]

  let passed = 0
  for (const route of routes) {
    try {
      const res = await checkUrl(route)
      if (res.statusCode === 200 && res.length > 0) {
        console.log(`✅ [200 OK] ${route}`)
        passed++
      } else {
        console.error(`❌ [FAIL] ${route} returned status ${res.statusCode}`)
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${route}:`, err.message)
    }
  }

  console.log(`\nResult: ${passed} / ${routes.length} routes served successfully!`)
  if (passed === routes.length) {
    console.log('🎉 SPA Routing Verification Complete!')
  }
}

main()
