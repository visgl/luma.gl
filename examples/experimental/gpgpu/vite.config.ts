import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/arrow': `${__dirname}/../../../modules/arrow/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/webgl/constants': `${__dirname}/../../../modules/webgl/src/constants`,
  '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
