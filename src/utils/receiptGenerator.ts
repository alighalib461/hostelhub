import html2canvas from 'html2canvas'

export function printReceipt() {
  window.print()
}

export async function downloadReceiptAsImage(
  elementId: string,
  fileName: string
): Promise<{ success: boolean; method: 'share' | 'download' | 'print' }> {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('Receipt element not found for id:', elementId)
    return { success: false, method: 'print' }
  }

  try {
    // 1. Render HTML element to high-res canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (_clonedDoc, clonedElement) => {
        // Ensure element is properly presented in the clone
        clonedElement.style.margin = '0'
        clonedElement.style.padding = '24px'
        clonedElement.style.borderRadius = '16px'
        clonedElement.style.boxShadow = 'none'
      },
    })

    // 2. Convert canvas to Blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
    })

    if (!blob) {
      throw new Error('Failed to generate image blob from canvas')
    }

    const cleanFileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`

    // 3. Mobile Web Share API: If on mobile/supported browser, use native share/save sheet
    // This allows mobile users to save directly to Gallery / Photos or share to WhatsApp
    const file = new File([blob], cleanFileName, { type: 'image/png' })
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'HostelHUB Official Payment Receipt',
        })
        return { success: true, method: 'share' }
      } catch (shareErr: any) {
        // If user simply closed the native share sheet (AbortError), treat as handled
        if (shareErr?.name === 'AbortError') {
          return { success: true, method: 'share' }
        }
        console.warn('Native share failed or dismissed, falling back to direct download:', shareErr)
      }
    }

    // 4. Standard Browser Blob Download
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = cleanFileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    // Clean up after download trigger
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(blobUrl)
    }, 1500)

    return { success: true, method: 'download' }
  } catch (err) {
    console.error('Receipt image generation failed, falling back to print:', err)
    window.print()
    return { success: false, method: 'print' }
  }
}
