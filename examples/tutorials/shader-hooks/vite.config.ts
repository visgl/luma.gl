import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/webgl-legacy': `${__dirname}/../../../modules/gltf/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/test-utils': `${__dirname}/../../../modules/test-utils/src`,
  '@luma.gl/core/webgl-constants': `${__dirname}/../../../modules/core/src/webgl-constants`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
