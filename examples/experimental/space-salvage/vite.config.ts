// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@luma.gl/graph/gpu-simple-graph/cpu': `${__dirname}/../../../modules/graph/src/gpu-simple-graph/operations/cpu`,
      '@luma.gl/graph/gpu-simple-graph/webgl': `${__dirname}/../../../modules/graph/src/gpu-simple-graph/operations/webgl`,
      '@luma.gl/graph/gpu-simple-graph/webgpu': `${__dirname}/../../../modules/graph/src/gpu-simple-graph/operations/webgpu`,

      '@luma.gl/graph/_internal': `${__dirname}/../../../modules/graph/src/execution`,
      '@luma.gl/engine/models': `${__dirname}/../../../modules/engine/src/graph/models`,
      '@luma.gl/engine/physics': `${__dirname}/../../../modules/engine/src/graph/physics`,
      '@luma.gl/engine/tables': `${__dirname}/../../../modules/engine/src/graph/tables`,
      ...Object.fromEntries(
        ['core', 'engine', 'shaders', 'webgpu', 'constants', 'graph'].map(name => [
          `@luma.gl/${name}`,
          `${__dirname}/../../../modules/${name}/src`
        ])
      )
    }
  },
  server: {open: true}
});
