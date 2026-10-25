import {defineConfig} from 'vite';

export default defineConfig({
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
