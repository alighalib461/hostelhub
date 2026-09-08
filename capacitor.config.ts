import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hostelhub.app',
  appName: 'HostelHub',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
