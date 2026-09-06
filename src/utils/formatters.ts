export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0'
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatFeeMonth(monthStr: string | null | undefined): string {
  if (!monthStr) return '—'
  // monthStr is expected as YYYY-MM
  const parts = monthStr.split('-')
  if (parts.length !== 2) return monthStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const date = new Date(year, month, 1)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

export function getCurrentFeeMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function formatCNIC(cnic: string | null | undefined): string {
  if (!cnic) return ''
  const cleaned = cnic.replace(/\D/g, '')
  if (cleaned.length <= 5) return cleaned
  if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    return `+92 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
  }
  return phone
}
