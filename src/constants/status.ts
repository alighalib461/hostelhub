export const STATUS_CONFIG = {
  // Fee statuses
  paid: {
    label: 'Paid',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  partial: {
    label: 'Partial',
    badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200/80',
    dotClass: 'bg-yellow-500',
  },
  overdue: {
    label: 'Overdue',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dotClass: 'bg-slate-400',
  },

  // Resident statuses
  active: {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  left: {
    label: 'Left',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dotClass: 'bg-slate-400',
  },

  // Bed & Room statuses
  available: {
    label: 'Available',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  occupied: {
    label: 'Occupied',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dotClass: 'bg-slate-500',
  },
  maintenance: {
    label: 'Maintenance',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  inactive: {
    label: 'Inactive',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dotClass: 'bg-slate-400',
  },

  // Registration Request statuses
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },

  // Payment statuses
  voided: {
    label: 'Voided',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80 line-through',
    dotClass: 'bg-rose-500',
  },
} as const
