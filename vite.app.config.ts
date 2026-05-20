import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __ASN1_INSTANCE_BUILDER_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0')
  }
});
