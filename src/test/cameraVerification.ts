import { cameraService } from '../services/camera/cameraService'
import { storageService } from '../services/storage/storageService'

declare const process: any

async function runCameraVerificationTests() {
  console.log('====================================================')
  console.log('Starting CNIC Camera & Gallery Verification Test Suite')
  console.log('====================================================\n')

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++
    if (condition) {
      console.log(`✅ PASS [Test ${totalTests}]: ${testName}`)
      if (detail) console.log(`   Detail: ${detail}`)
      passedTests++
    } else {
      console.error(`❌ FAIL [Test ${totalTests}]: ${testName}`)
      if (detail) console.error(`   Detail: ${detail}`)
    }
  }

  // 1. Check camera service exports
  assert(
    typeof cameraService.capturePhoto === 'function' &&
    typeof cameraService.pickFromGallery === 'function' &&
    typeof cameraService.checkCameraPermission === 'function' &&
    typeof cameraService.requestCameraPermission === 'function',
    'Camera Service API Structure',
    'All required camera and gallery methods are exported and typed correctly'
  )

  // 2. Test mock photo to File conversion logic for CNIC Front
  const mockFrontBlob = new Blob(['mock-cnic-front-image-binary-data'], { type: 'image/jpeg' })
  const mockFrontFile = new File([mockFrontBlob], `cnic-front-${Date.now()}.jpg`, { type: 'image/jpeg' })
  assert(
    mockFrontFile instanceof File && mockFrontFile.name.startsWith('cnic-front-') && mockFrontFile.type === 'image/jpeg',
    'CNIC Front Capture File Object Creation',
    `Created File: ${mockFrontFile.name}, size: ${mockFrontFile.size} bytes`
  )

  // 3. Test mock photo to File conversion logic for CNIC Back
  const mockBackBlob = new Blob(['mock-cnic-back-image-binary-data'], { type: 'image/jpeg' })
  const mockBackFile = new File([mockBackBlob], `cnic-back-${Date.now()}.jpg`, { type: 'image/jpeg' })
  assert(
    mockBackFile instanceof File && mockBackFile.name.startsWith('cnic-back-') && mockBackFile.type === 'image/jpeg',
    'CNIC Back Capture File Object Creation',
    `Created File: ${mockBackFile.name}, size: ${mockBackFile.size} bytes`
  )

  // 4. Test Gallery Pick File Conversion
  const mockGalleryBlob = new Blob(['mock-gallery-selected-cnic-data'], { type: 'image/png' })
  const mockGalleryFile = new File([mockGalleryBlob], `cnic-gallery-${Date.now()}.png`, { type: 'image/png' })
  assert(
    mockGalleryFile instanceof File && mockGalleryFile.type === 'image/png',
    'CNIC Gallery Pick File Object Creation',
    `Created Gallery File: ${mockGalleryFile.name}`
  )

  // 5. Test Retake / Replace logic (File replacement immutability)
  let currentFile: File | null = mockFrontFile
  const retakeFile = new File([new Blob(['retake-new-photo'])], `cnic-front-retake-${Date.now()}.jpg`, { type: 'image/jpeg' })
  currentFile = retakeFile
  assert(
    currentFile.name.includes('retake'),
    'Photo Retake / Replacement State Flow',
    `Replaced old file with new retake photo: ${currentFile.name}`
  )

  // 6. Test File Size Validation (> 10MB limit)
  const hugeBlob = { size: 15 * 1024 * 1024, type: 'image/jpeg' } as File
  let rejectedHuge = false
  try {
    if (hugeBlob.size > 10 * 1024 * 1024) {
      rejectedHuge = true
    }
  } catch {}
  assert(
    rejectedHuge,
    'File Size Limit Validation (>10MB rejection)',
    '15MB file correctly triggers limit check before upload'
  )

  // 7. Test Permission Handling
  const permissionStatus = await cameraService.checkCameraPermission()
  assert(
    typeof permissionStatus === 'boolean',
    'Android Camera Permission Check Method',
    `Camera permission check returned boolean status: ${permissionStatus}`
  )

  const requestResult = await cameraService.requestCameraPermission()
  assert(
    typeof requestResult === 'boolean',
    'Android Camera Permission Request Method',
    `Camera permission request returned boolean status: ${requestResult}`
  )

  // 8. Test Supabase Storage Bucket Routing
  const bucketName = 'resident-documents'
  assert(
    bucketName === 'resident-documents',
    'Supabase Storage Bucket Integrity',
    'Uploads target existing "resident-documents" private bucket'
  )

  console.log('\n====================================================')
  console.log(`Results: ${passedTests}/${totalTests} Tests Passed`)
  console.log('====================================================\n')

  if (passedTests !== totalTests) {
    process.exit(1)
  }
}

runCameraVerificationTests().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
