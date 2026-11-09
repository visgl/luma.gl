import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine/models': `${__dirname}/../../../modules/engine/src/graph/models`,
  '@luma.gl/engine/physics': `${__dirname}/../../../modules/engine/src/graph/physics`,
  '@luma.gl/engine/tables': `${__dirname}/../../../modules/engine/src/graph/tables`,
  '@luma.gl/engine/gltf-physics': `${__dirname}/../../../modules/engine/src/gltf/physics`,
  '@luma.gl/engine/text-fonts': `${__dirname}/../../../modules/engine/src/text/fonts`,
  '@luma.gl/engine/text-3d': `${__dirname}/../../../modules/engine/src/text/text-3d`,
  '@luma.gl/engine/text-experimental': `${__dirname}/../../../modules/engine/src/text/experimental.ts`,
  '@luma.gl/engine/text': `${__dirname}/../../../modules/engine/src/text`,
  '@luma.gl/engine/effects': `${__dirname}/../../../modules/engine/src/effects`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/engine/gltf': `${__dirname}/../../../modules/engine/src/gltf`,
  '@luma.gl/shaders': `${__dirname}/../../../modules/shaders/src`,
  '@luma.gl/core/test-utils': `${__dirname}/../../../modules/core/src/test-utils`,
  '@luma.gl/core/webgl-constants': `${__dirname}/../../../modules/core/src/webgl-constants`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
