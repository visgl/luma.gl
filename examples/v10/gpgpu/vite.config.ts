import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/graph/_internal/arrow': `${__dirname}/../../../modules/graph/src/arrow/internal.ts`,
  '@luma.gl/graph/arrow': `${__dirname}/../../../modules/graph/src/arrow`,
  '@luma.gl/engine/arrow': `${__dirname}/../../../modules/engine/src/arrow`,
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
  '@luma.gl/graph/_internal': `${__dirname}/../../../modules/graph/src/execution`,
  '@luma.gl/graph/gpu-simple-graph/cpu': `${__dirname}/../../../modules/graph/src/gpu-simple-graph/operations/cpu`,
  '@luma.gl/graph/gpu-simple-graph/webgl': `${__dirname}/../../../modules/graph/src/gpu-simple-graph/operations/webgl`,
  '@luma.gl/graph/gpu-simple-graph/webgpu': `${__dirname}/../../../modules/graph/src/gpu-simple-graph/operations/webgpu`,
  '@luma.gl/graph/gpu-simple-graph': `${__dirname}/../../../modules/graph/src/gpu-simple-graph`,
  '@luma.gl/graph': `${__dirname}/../../../modules/graph/src`,
  '@luma.gl/shaders': `${__dirname}/../../../modules/shaders/src`,
  '@luma.gl/core/webgl-constants': `${__dirname}/../../../modules/core/src/webgl-constants`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
  '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
