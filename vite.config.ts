import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        core: 'src/core.ts',
        app: 'src/app.ts'
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [
        '@pkistudio/pkistudiojs/core',
        '@pkistudio/pkistudiojs/oid-resolver',
        '@pkistudio/pkistudiojs/viewer'
      ]
    }
  },
  define: {
    __ASN1_INSTANCE_BUILDER_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0')
  }
});
