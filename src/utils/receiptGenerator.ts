import { ReceiptData } from '../types/models'
import {
  formatCurrency,
  formatDate,
  formatFeeMonth,
  formatCNIC,
} from './formatters'

export function printReceipt() {
  window.print()
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Generates an ultra-crisp, high-definition HTML5 Canvas official payment receipt.
 * 100% crash-proof pure JavaScript (zero DOM/CSS parser dependencies).
 */
export function generateReceiptCanvas(receipt: ReceiptData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const scale = 2 // 2x Retina DPI for razor sharp image quality
  const width = 800
  const isVoided = receipt.status === 'voided'
  const hasNotes = Boolean(receipt.notes && receipt.notes.trim())
  const height = isVoided ? 1040 : hasNotes ? 980 : 920

  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not obtain canvas 2D rendering context')

  ctx.scale(scale, scale)

  // 1. White card background with subtle border
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  drawRoundedRect(ctx, 16, 16, width - 32, height - 32, 20)
  ctx.strokeStyle = isVoided ? '#FCA5A5' : '#E2E8F0'
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (isVoided) {
    ctx.fillStyle = 'rgba(255, 241, 242, 0.4)'
    ctx.fill()
  }

  // 2. Brand Logo Icon (House + Bed vector drawing)
  const iconX = 44
  const iconY = 44

  // House Roof & Walls
  ctx.strokeStyle = '#2563EB'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(iconX + 20, iconY + 4)
  ctx.lineTo(iconX + 3, iconY + 18)
  ctx.lineTo(iconX + 8, iconY + 18)
  ctx.lineTo(iconX + 8, iconY + 36)
  ctx.lineTo(iconX + 32, iconY + 36)
  ctx.lineTo(iconX + 32, iconY + 18)
  ctx.lineTo(iconX + 37, iconY + 18)
  ctx.closePath()
  ctx.stroke()

  // Chimney
  ctx.strokeStyle = '#1D4ED8'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(iconX + 28, iconY + 11)
  ctx.lineTo(iconX + 28, iconY + 7)
  ctx.lineTo(iconX + 33, iconY + 7)
  ctx.lineTo(iconX + 33, iconY + 14)
  ctx.stroke()

  // Bed inside house
  ctx.fillStyle = '#16A085'
  ctx.beginPath()
  ctx.arc(iconX + 14, iconY + 25, 2.5, 0, Math.PI * 2)
  ctx.fill()

  drawRoundedRect(ctx, iconX + 18, iconY + 23, 10, 4, 1.5)
  ctx.fill()

  ctx.fillStyle = '#0F172A'
  drawRoundedRect(ctx, iconX + 12, iconY + 28, 18, 3, 1)
  ctx.fill()

  // Brand Name Typography
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText('Hostel', iconX + 46, iconY + 24)
  ctx.fillStyle = '#2563EB'
  ctx.font = '800 22px system-ui, -apple-system, sans-serif'
  ctx.fillText('HUB', iconX + 114, iconY + 24)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 10px system-ui, -apple-system, sans-serif'
  ctx.fillText('MANAGE BETTER. GROW FASTER.', iconX + 46, iconY + 37)

  // Hostel Information
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(receipt.hostel.name || 'HostelHUB', iconX, iconY + 68)

  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText(receipt.hostel.address || 'Hostel Location', iconX, iconY + 86)
  if (receipt.hostel.phone) {
    ctx.fillText(`Tel: ${receipt.hostel.phone}`, iconX, iconY + 102)
  }

  // Right Header: Verified Badge & Receipt Number
  const rightX = width - 44
  ctx.textAlign = 'right'

  // Green Verified Badge
  drawRoundedRect(ctx, rightX - 145, iconY, 145, 26, 13)
  ctx.fillStyle = '#ECFDF5'
  ctx.fill()
  ctx.strokeStyle = '#A7F3D0'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#047857'
  ctx.fillText('✓ VERIFIED RECEIPT', rightX - 18, iconY + 17)

  // Receipt Number & Date
  ctx.font = '500 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Receipt No:', rightX, iconY + 54)

  ctx.font = 'bold 15px ui-monospace, monospace, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(receipt.receipt_number, rightX, iconY + 74)

  ctx.font = '500 12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText(`Date: ${formatDate(receipt.payment_date)}`, rightX, iconY + 94)

  ctx.textAlign = 'left'

  // Divider Line 1
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(44, 168)
  ctx.lineTo(width - 44, 168)
  ctx.stroke()

  // 3. Resident Details 4-Column Grid
  const gridY = 192
  const colWidth = (width - 88) / 4

  // Col 1: Resident Name & ID
  ctx.font = '500 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Resident Name', 44, gridY)

  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(receipt.resident.full_name || 'Resident', 44, gridY + 20)

  ctx.font = '500 11px ui-monospace, monospace'
  ctx.fillStyle = '#94A3B8'
  ctx.fillText(receipt.resident.resident_id || '', 44, gridY + 36)

  // Col 2: CNIC No
  ctx.font = '500 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('CNIC No.', 44 + colWidth, gridY)

  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(formatCNIC(receipt.resident.cnic) || '—', 44 + colWidth, gridY + 20)

  // Col 3: Room & Bed
  ctx.font = '500 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Room & Bed', 44 + colWidth * 2, gridY)

  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  const roomText = receipt.room_number ? `Room ${receipt.room_number}` : '—'
  const bedText = receipt.bed_number ? ` • Bed ${receipt.bed_number}` : ''
  ctx.fillText(`${roomText}${bedText}`, 44 + colWidth * 2, gridY + 20)

  // Col 4: Payment Mode
  ctx.font = '500 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Payment Mode', 44 + colWidth * 3, gridY)

  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  const modeText = (receipt.payment_method || 'Cash').replace('_', ' ')
  ctx.fillText(modeText.charAt(0).toUpperCase() + modeText.slice(1), 44 + colWidth * 3, gridY + 20)

  // Divider Line 2
  ctx.beginPath()
  ctx.moveTo(44, 256)
  ctx.lineTo(width - 44, 256)
  ctx.stroke()

  // 4. Payment Summary Box
  const boxY = 276
  const boxHeight = 270
  drawRoundedRect(ctx, 44, boxY, width - 88, boxHeight, 16)
  ctx.fillStyle = '#F8FAFC'
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText('PAYMENT SUMMARY', 68, boxY + 30)

  // Rows inside summary box
  const rowStartX = 68
  const rowEndX = width - 68
  const rowY1 = boxY + 65
  const rowY2 = boxY + 98
  const rowY3 = boxY + 131
  const rowY4 = boxY + 164

  // Billing Period
  ctx.font = '500 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Billing Period:', rowStartX, rowY1)
  ctx.textAlign = 'right'
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(formatFeeMonth(receipt.fee_month), rowEndX, rowY1)

  // Total Fee Due
  ctx.textAlign = 'left'
  ctx.font = '500 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Total Fee Due:', rowStartX, rowY2)
  ctx.textAlign = 'right'
  ctx.font = '500 14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(formatCurrency(receipt.fee_total_due), rowEndX, rowY2)

  // Total Paid to Date
  ctx.textAlign = 'left'
  ctx.font = '500 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Total Paid to Date:', rowStartX, rowY3)
  ctx.textAlign = 'right'
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#16A34A'
  ctx.fillText(formatCurrency(receipt.fee_total_paid), rowEndX, rowY3)

  // Remaining Balance
  ctx.textAlign = 'left'
  ctx.font = '500 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('Remaining Balance:', rowStartX, rowY4)
  ctx.textAlign = 'right'
  ctx.font = '500 14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(formatCurrency(receipt.fee_remaining_balance), rowEndX, rowY4)

  // Separator in box
  ctx.strokeStyle = '#E2E8F0'
  ctx.beginPath()
  ctx.moveTo(68, boxY + 190)
  ctx.lineTo(rowEndX, boxY + 190)
  ctx.stroke()

  // Big Callout: Amount Paid This Transaction
  ctx.textAlign = 'left'
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText('Amount Paid This Transaction:', rowStartX, boxY + 232)

  ctx.textAlign = 'right'
  ctx.font = '800 24px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#2563EB'
  ctx.fillText(formatCurrency(receipt.amount), rowEndX, boxY + 233)
  ctx.textAlign = 'left'

  let currentY = boxY + boxHeight + 24

  // 5. Notes if present
  if (hasNotes) {
    ctx.font = '500 12px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#64748B'
    ctx.fillText('Notes: ', 44, currentY + 10)
    ctx.font = 'italic 12px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#334155'
    ctx.fillText(receipt.notes || '', 85, currentY + 10)
    currentY += 32
  }

  // 6. Voided Notice & Watermark
  if (isVoided) {
    drawRoundedRect(ctx, 44, currentY, width - 88, 54, 12)
    ctx.fillStyle = '#FFF1F2'
    ctx.fill()
    ctx.strokeStyle = '#FECDD3'
    ctx.stroke()

    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#BE123C'
    ctx.fillText('⚠ Payment Voided', 64, currentY + 22)

    ctx.font = 'normal 11px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#9F1239'
    ctx.fillText(`Reason: ${receipt.void_reason || 'No reason specified'}`, 64, currentY + 40)

    currentY += 72

    // Giant diagonal VOIDED stamp watermark
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate((-25 * Math.PI) / 180)
    ctx.font = '800 100px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(225, 29, 72, 0.12)'
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.25)'
    ctx.lineWidth = 6
    ctx.textAlign = 'center'
    ctx.fillText('VOIDED', 0, 30)
    ctx.strokeText('VOIDED', 0, 30)
    ctx.restore()
  }

  // 7. Footer
  const footerY = height - 52
  ctx.strokeStyle = '#E2E8F0'
  ctx.beginPath()
  ctx.moveTo(44, footerY - 20)
  ctx.lineTo(width - 44, footerY - 20)
  ctx.stroke()

  ctx.font = '500 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.fillText('This is a computer-generated receipt issued by HostelHUB.', 44, footerY + 4)
  ctx.fillStyle = '#94A3B8'
  ctx.fillText('Manage Better. Grow Faster.', 44, footerY + 18)

  // Green Authenticated Stamp (Right Footer)
  const stampX = width - 44
  drawRoundedRect(ctx, stampX - 190, footerY - 8, 190, 28, 14)
  ctx.fillStyle = '#ECFDF5'
  ctx.fill()
  ctx.strokeStyle = '#A7F3D0'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#047857'
  ctx.textAlign = 'right'
  ctx.fillText('✓ Digital Record Authenticated', stampX - 16, footerY + 10)
  ctx.textAlign = 'left'

  return canvas
}

/**
 * Downloads receipt image and saves directly into device Gallery/Photos or Downloads.
 */
export async function downloadReceiptAsImage(
  receipt: ReceiptData
): Promise<{ success: boolean; method: 'share' | 'download' }> {
  try {
    // 1. Generate high-DPI canvas
    const canvas = generateReceiptCanvas(receipt)

    // 2. Convert to binary Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Failed to generate receipt image blob from canvas'))
      }, 'image/png', 1.0)
    })

    const cleanReceiptNum = (receipt.receipt_number || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_')
    const fileName = `Receipt-${cleanReceiptNum}.png`
    const file = new File([blob], fileName, { type: 'image/png' })

    // 3. Mobile Native Web Share API
    // On Android & iOS, this opens the system sheet with "Save Image to Gallery/Photos" or WhatsApp
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Receipt #${receipt.receipt_number}`,
          text: `HostelHUB Official Payment Receipt - ${receipt.resident.full_name}`,
        })
        return { success: true, method: 'share' }
      } catch (shareErr: any) {
        // If user cancelled the share picker sheet, return success (user dismissed)
        if (shareErr?.name === 'AbortError') {
          return { success: true, method: 'share' }
        }
        console.warn('Native share dismissed or failed, triggering direct file download:', shareErr)
      }
    }

    // 4. Direct Browser Blob Download (saves into mobile Downloads / Gallery)
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(blobUrl)
    }, 2000)

    return { success: true, method: 'download' }
  } catch (err) {
    console.error('Receipt download error:', err)
    throw err
  }
}
