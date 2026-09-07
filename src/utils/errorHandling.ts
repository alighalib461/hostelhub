export function formatErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.'

  const message = typeof error === 'string' 
    ? error 
    : (error as { message?: string })?.message || JSON.stringify(error)

  // Duplicate key constraints
  if (message.includes('unique_room_number_per_hostel') || message.includes('rooms_hostel_id_room_number_key')) {
    return 'A room with this room number already exists in this hostel.'
  }
  if (message.includes('unique_bed_number_per_room') || message.includes('beds_room_id_bed_number_key')) {
    return 'A bed with this number already exists in this room.'
  }
  if (message.includes('unique_resident_fee_month')) {
    return 'This resident already has a fee charge generated for this billing month.'
  }
  if (message.includes('idx_unique_current_resident_assignment')) {
    return 'This resident already has an active room/bed assignment.'
  }
  if (message.includes('idx_unique_current_bed_assignment')) {
    return 'This bed is currently occupied by another resident.'
  }
  if (message.includes('payments_receipt_number_key')) {
    return 'A payment with this receipt number already exists.'
  }
  if (message.includes('residents_resident_id_key')) {
    return 'A resident with this ID already exists.'
  }

  // Check constraints
  if (message.includes('rooms_status_check')) {
    return 'Invalid status provided for room.'
  }
  if (message.includes('beds_status_check')) {
    return 'Invalid status provided for bed.'
  }

  // Row level security & auth
  if (message.includes('permission denied') || message.includes('new row violates row-level security policy') || message.includes('violates row-level security')) {
    return "You don't have permission to access or modify this information."
  }
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials.'
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  // Business logic RPC messages
  if (message.includes('Fee charge is already fully paid')) {
    return 'This fee charge is already fully paid.'
  }
  if (message.includes('exceeds remaining balance')) {
    return 'Payment amount exceeds the remaining fee balance.'
  }
  if (message.includes('Selected bed is not available')) {
    return 'The selected bed is no longer available.'
  }

  return message
}
