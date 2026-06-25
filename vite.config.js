import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function versionPlugin() {
  return {
    name: 'version-plugin',
    closeBundle() {
      const version = {
        v: Date.now().toString(36),
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
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
})
