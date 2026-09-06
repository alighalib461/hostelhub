export function printReceipt() {
  window.print()
}

export function downloadReceiptAsImage(elementId: string, fileName: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  // Use dynamic import with fallback
  import('html2canvas')
    .then((mod: any) => {
      const html2canvas = mod.default || mod
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a')
        link.download = `${fileName}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      })
    })
    .catch((err) => {
      console.warn('Canvas render error, falling back to print:', err)
      window.print()
    })
}
