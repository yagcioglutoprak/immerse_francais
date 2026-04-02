import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ImmerseFrancais',
    description: 'Learn French vocabulary while browsing the web',
    version: '2.0.0',
    permissions: ['storage', 'activeTab', 'alarms', 'tts'],
    host_permissions: ['<all_urls>'],
  },
  vite: () => ({
    esbuild: {
      // Force ASCII output to prevent Chrome UTF-8 validation errors
      charset: 'ascii',
    },
  }),
});
