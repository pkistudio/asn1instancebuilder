import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        viewer: resolve(__dirname, 'viewer.html')
      }
    }
  },
  define: {
    __ASN1_INSTANCE_BUILDER_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0')
  }
});
