import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/constants': `${__dirname}/../../../modules/constants/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
  '@luma.gl/webgl-legacy': `${__dirname}/../../../modules/gltf/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/test-utils': `${__dirname}/../../../modules/test-utils/src`,
  '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
