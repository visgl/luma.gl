// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      ['core', 'engine', 'gpgpu', 'shadertools'].map(name => [
        `@luma.gl/${name}`,
        fileURLToPath(new URL(`../../../modules/${name}/src`, import.meta.url))
      ])
    )
  }
});
