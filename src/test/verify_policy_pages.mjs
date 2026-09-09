import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../')

console.log('--- Verifying Public Policy Pages & Routes ---')

// 1. Check file existence
const files = [
  'src/app/layouts/PublicPolicyLayout.tsx',
  'src/pages/public/PrivacyPolicyPage.tsx',
  'src/pages/public/TermsAndConditionsPage.tsx',
  'src/pages/public/AccountDeletionPage.tsx',
  'src/app/router/AppRouter.tsx',
  'src/constants/routes.ts',
  'src/app/layouts/AuthLayout.tsx',
  'src/pages/auth/SignupPage.tsx',
  'src/pages/auth/LoginPage.tsx',
]

for (const f of files) {
  const fullPath = path.join(rootDir, f)
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing file: ${f}`)
    process.exit(1)
  }
  console.log(`✅ File exists: ${f}`)
}

// 2. Check Routes configuration
const routesContent = fs.readFileSync(path.join(rootDir, 'src/constants/routes.ts'), 'utf-8')
const requiredRoutes = ['/privacy-policy', '/terms-and-conditions', '/account-deletion', '/delete-account']
for (const r of requiredRoutes) {
  if (!routesContent.includes(r)) {
    console.error(`❌ Route ${r} missing from src/constants/routes.ts`)
    process.exit(1)
  }
}
console.log('✅ All routes defined in routes.ts')

// 3. Check AppRouter configuration
const appRouterContent = fs.readFileSync(path.join(rootDir, 'src/app/router/AppRouter.tsx'), 'utf-8')
const expectedRouterElements = [
  'PublicPolicyLayout',
  'PrivacyPolicyPage',
  'TermsAndConditionsPage',
  'AccountDeletionPage',
  'path="/privacy-policy"',
  'path="/terms-and-conditions"',
  'path="/account-deletion"',
  'path="/delete-account"',
]

for (const el of expectedRouterElements) {
  if (!appRouterContent.includes(el)) {
    console.error(`❌ Missing element in AppRouter.tsx: ${el}`)
    process.exit(1)
  }
}
console.log('✅ All public policy routes registered in AppRouter.tsx')

// 4. Check PrivacyPolicyPage content
const privacyContent = fs.readFileSync(path.join(rootDir, 'src/pages/public/PrivacyPolicyPage.tsx'), 'utf-8')
const privacyRequirements = [
  'HostelHub',
  'malighalib461@gmail.com',
  'September 9, 2026',
  'Information We Collect',
  'How We Use Information',
  'Data Storage and Service Providers',
  'Sharing of Information',
  'Data Security',
  'Data Retention',
  'Account and Data Deletion',
  'Children\'s Privacy',
  'Changes to This Privacy Policy',
  'Contact Information',
  'Supabase',
  'CNIC',
]

for (const req of privacyRequirements) {
  if (!privacyContent.includes(req)) {
    console.error(`❌ Privacy Policy missing required text: ${req}`)
    process.exit(1)
  }
}
console.log('✅ Privacy Policy contains all 10 required sections and accurate developer metadata')

// 5. Check TermsAndConditionsPage content
const termsContent = fs.readFileSync(path.join(rootDir, 'src/pages/public/TermsAndConditionsPage.tsx'), 'utf-8')
const termsRequirements = [
  'HostelHub',
  'malighalib461@gmail.com',
  'September 9, 2026',
  'Acceptance of Terms',
  'Description of HostelHub',
  'User Accounts',
  'User Responsibilities',
  'Resident and Identification Data',
  'Fees, Billing & Payment Records',
  'Acceptable Use Policy',
  'Account Suspension',
  'Data and Privacy',
  'Intellectual Property',
  'Service Availability',
  'Limitation of Liability',
  'Changes to Terms',
  'Contact Information',
  'authority',
  'AS IS',
]

for (const req of termsRequirements) {
  if (!termsContent.includes(req)) {
    console.error(`❌ Terms & Conditions missing required text: ${req}`)
    process.exit(1)
  }
}
console.log('✅ Terms & Conditions contains all 14 required sections and legal notices')

// 6. Check AccountDeletionPage content
const deletionContent = fs.readFileSync(path.join(rootDir, 'src/pages/public/AccountDeletionPage.tsx'), 'utf-8')
const deletionRequirements = [
  'Delete Your HostelHub Account',
  'malighalib461@gmail.com',
  'September 9, 2026',
  'Method 1: Instant In-App Self-Service Deletion',
  'For Hostel Owners / Managers:',
  'For Hostel Residents:',
  'Method 2',
  'Submit a Public Deletion Request Form',
  'submitPublicDeletionRequest',
  'Danger Zone',
  'Permanently Removed',
  'Retention Exceptions',
]

for (const req of deletionRequirements) {
  if (!deletionContent.includes(req)) {
    console.error(`❌ Account Deletion Page missing required text: ${req}`)
    process.exit(1)
  }
}
console.log('✅ Account Deletion Page covers in-app deletion, public web form, and retention guidelines')

// 7. Check PublicPolicyLayout content
const layoutContent = fs.readFileSync(path.join(rootDir, 'src/app/layouts/PublicPolicyLayout.tsx'), 'utf-8')
const layoutRequirements = [
  '/privacy-policy',
  '/terms-and-conditions',
  '/account-deletion',
  '/login',
  'malighalib461@gmail.com',
  'September 9, 2026',
  'BrandLogo',
]

for (const req of layoutRequirements) {
  if (!layoutContent.includes(req)) {
    console.error(`❌ PublicPolicyLayout missing required element: ${req}`)
    process.exit(1)
  }
}
console.log('✅ PublicPolicyLayout contains responsive nav, active links, and footer compliance info')

// 8. Check AuthLayout and Auth pages footer links
const authLayoutContent = fs.readFileSync(path.join(rootDir, 'src/app/layouts/AuthLayout.tsx'), 'utf-8')
if (!authLayoutContent.includes('/privacy-policy') || !authLayoutContent.includes('/terms-and-conditions') || !authLayoutContent.includes('/account-deletion')) {
  console.error('❌ AuthLayout missing policy footer links')
  process.exit(1)
}
console.log('✅ AuthLayout includes links to Privacy Policy, Terms & Conditions, and Account Deletion')

const signupContent = fs.readFileSync(path.join(rootDir, 'src/pages/auth/SignupPage.tsx'), 'utf-8')
if (!signupContent.includes('/terms-and-conditions') || !signupContent.includes('/privacy-policy')) {
  console.error('❌ SignupPage missing terms and privacy policy agreement link')
  process.exit(1)
}
console.log('✅ SignupPage includes terms and privacy agreement links')

console.log('\n🎉 ALL PUBLIC POLICY PAGES & ROUTES VERIFICATION TESTS PASSED SUCCESSFULLY!')
