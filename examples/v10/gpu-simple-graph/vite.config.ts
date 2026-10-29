// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/arrow': `${__dirname}/../../../modules/arrow/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine/models': `${__dirname}/../../../modules/engine/src/graph/models`,
  '@luma.gl/engine/physics': `${__dirname}/../../../modules/engine/src/graph/physics`,
  '@luma.gl/engine/tables': `${__dirname}/../../../modules/engine/src/graph/tables`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/engine/gltf': `${__dirname}/../../../modules/engine/src/gltf`,
  '@luma.gl/gpgpu/_internal': `${__dirname}/../../../modules/gpgpu/src/execution`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/graph': `${__dirname}/../../../modules/graph/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/core/webgl-constants': `${__dirname}/../../../modules/core/src/webgl-constants`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
  '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
