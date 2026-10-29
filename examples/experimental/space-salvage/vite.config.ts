// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@luma.gl/gpgpu/_internal': `${__dirname}/../../../modules/gpgpu/src/execution`,
      '@luma.gl/engine/models': `${__dirname}/../../../modules/engine/src/graph/models`,
      '@luma.gl/engine/physics': `${__dirname}/../../../modules/engine/src/graph/physics`,
      '@luma.gl/engine/tables': `${__dirname}/../../../modules/engine/src/graph/tables`,
      ...Object.fromEntries(
        ['core', 'engine', 'shaders', 'webgpu', 'constants', 'gpgpu', 'graph'].map(name => [
          `@luma.gl/${name}`,
          `${__dirname}/../../../modules/${name}/src`
        ])
      )
    }
  },
  server: {open: true}
});
