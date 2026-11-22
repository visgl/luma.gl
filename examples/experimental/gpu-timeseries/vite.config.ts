// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({
  resolve: {
    alias: {
      '@luma.gl/graph/_internal': fileURLToPath(
        new URL('../../../modules/graph/src/execution', import.meta.url)
      ),
      '@luma.gl/engine/models': fileURLToPath(
        new URL('../../../modules/engine/src/graph/models', import.meta.url)
      ),
      '@luma.gl/engine/physics': fileURLToPath(
        new URL('../../../modules/engine/src/graph/physics', import.meta.url)
      ),
      '@luma.gl/engine/tables': fileURLToPath(
        new URL('../../../modules/engine/src/graph/tables', import.meta.url)
      ),
      ...Object.fromEntries(
        ['core', 'engine', 'shaders'].map(name => [
          `@luma.gl/${name}`,
          fileURLToPath(new URL(`../../../modules/${name}/src`, import.meta.url))
        ])
      )
    }
  }
});
