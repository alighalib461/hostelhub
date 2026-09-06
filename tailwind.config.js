/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FA',
        card: '#FFFFFF',
        'navy-primary': '#0D1B2A',
        'navy-dark': '#070D14',
        'blue-brand': '#2563EB',
        'blue-light': '#3B82F6',
        'blue-subtle': '#EFF6FF',
        'teal-accent': '#16A085',
        'teal-light': '#1ABC9C',
        'teal-subtle': '#E8F8F5',
        'text-primary': '#172033',
        'text-secondary': '#64748B',
        'text-muted': '#94A3B8',
        'status-green': '#2ECC71',
        'status-orange': '#F39C12',
        'status-yellow': '#F1C40F',
        'status-red': '#E74C3C',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'card-sm': '12px',
        'badge': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 12px 0 rgba(13, 27, 42, 0.04), 0 1px 3px 0 rgba(13, 27, 42, 0.02)',
        'card-hover': '0 10px 25px -3px rgba(13, 27, 42, 0.08), 0 4px 6px -2px rgba(13, 27, 42, 0.04)',
        'modal': '0 20px 35px -5px rgba(13, 27, 42, 0.15), 0 10px 10px -5px rgba(13, 27, 42, 0.04)',
      },
    },
  },
  plugins: [],
}
