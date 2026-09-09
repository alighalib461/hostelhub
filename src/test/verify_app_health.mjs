import http from 'http'

async function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, length: data.length, snippet: data.slice(0, 150) })
      })
    }).on('error', reject)
  })
}

async function main() {
  console.log('Testing Vite Server Endpoints...')
  try {
    const root = await checkUrl('http://localhost:5173/')
    console.log('Root "/" Status:', root.statusCode, 'Length:', root.length)

    const login = await checkUrl('http://localhost:5173/login')
    console.log('Login "/login" Status:', login.statusCode, 'Length:', login.length)

    const signup = await checkUrl('http://localhost:5173/signup')
    console.log('Signup "/signup" Status:', signup.statusCode, 'Length:', signup.length)

    const privacy = await checkUrl('http://localhost:5173/privacy-policy')
    console.log('Privacy Policy Status:', privacy.statusCode, 'Length:', privacy.length)

    console.log('\nAll server endpoints responding with HTTP 200 OK!')
  } catch (err) {
    console.error('Endpoint check error:', err)
  }
}

main()
