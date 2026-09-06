export const ROUTES = {
  // Public & Auth
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PUBLIC_REGISTER: '/register/:hostelId',

  // Owner Routes
  OWNER: {
    DASHBOARD: '/app/dashboard',
    RESIDENTS: '/app/residents',
    RESIDENT_DETAIL: '/app/residents/:id',
    RESIDENT_NEW: '/app/residents/new',
    REGISTRATION_REQUESTS: '/app/registration-requests',
    HOSTELS: '/app/hostels',
    HOSTEL_DETAIL: '/app/hostels/:id',
    ROOMS: '/app/rooms',
    FEES: '/app/fees',
    PAYMENTS: '/app/payments',
    PAYMENT_DETAIL: '/app/payments/:id',
    REPORTS: '/app/reports',
    SETTINGS: '/app/settings',
  },

  // Resident Routes
  RESIDENT: {
    DASHBOARD: '/resident/dashboard',
    PROFILE: '/resident/profile',
    HOSTEL: '/resident/hostel',
    FEES: '/resident/fees',
    RECEIPTS: '/resident/receipts',
    DOCUMENTS: '/resident/documents',
  },
} as const
