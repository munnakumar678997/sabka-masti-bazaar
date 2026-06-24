import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

// ══ VERSION PLUGIN ══════════════════════════════════════════
// Har build pe ek naya version.json generate karta hai
// Jisme unique build timestamp hota hai
// App yeh check karke detect karta hai ki naya version aaya hai ya nahi
// ════════════════════════════════════════════════════════════
function versionPlugin() {
  return {
    name: 'version-plugin',
    closeBundle() {
      const version = {
        v: Date.now().toString(36),          // e.g. "lz4abc123" — unique per build
        t: new Date().toISOString(),
      };
      writeFileSync(
        resolve(__dirname, 'dist/version.json'),
        JSON.stringify(version)
      );
      console.log(`[version-plugin] version.json generated: v=${version.v}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
