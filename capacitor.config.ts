import type { CapacitorConfig } from '@capacitor/cli'

// Configuration Capacitor — enveloppe la PWA (Vite build) dans un
// projet Android natif pour générer un APK.
const config: CapacitorConfig = {
  appId: 'com.durex.projectworkspace',
  appName: 'Project Workspace',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
}

export default config
