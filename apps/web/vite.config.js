import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawPort = Number(env.VITE_WEB_PORT);
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 5174;

  return {
    plugins: [react()],
    server: { port },
  };
});
