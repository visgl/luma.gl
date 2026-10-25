import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {input: {main: `${__dirname}/index.html`, batch: `${__dirname}/batch.html`}}
  },
  resolve: {
    alias: Object.fromEntries(
      [
        'core',
        'engine',
        'shadertools',
        'webgpu',
        'constants',
        'gpgpu',
        'graph',
        'experimental'
      ].map(name => [`@luma.gl/${name}`, `${__dirname}/../../../modules/${name}/src`])
    )
  },
  server: {open: true}
});
