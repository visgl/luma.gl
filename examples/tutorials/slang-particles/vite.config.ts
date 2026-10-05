// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      ['core', 'engine', 'shadertools', 'slang', 'webgl', 'webgpu'].map(moduleName => [
        `@luma.gl/${moduleName}`,
        fileURLToPath(new URL(`../../../modules/${moduleName}/src`, import.meta.url))
      ])
    )
  }
});
