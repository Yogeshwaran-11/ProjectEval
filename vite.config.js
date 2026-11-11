import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { handleApiRequest } = require('./backend/apiEngine.cjs');

// Vite middleware plugin to serve native backend REST & SSE stream
const backendApiPlugin = () => ({
  name: 'backend-api-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.startsWith('/api')) {
        return handleApiRequest(req, res);
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), backendApiPlugin()]
});
