// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      ['core', 'engine', 'shadertools', 'webgpu', 'constants', 'gpgpu', 'graph'].map(name => [
        `@luma.gl/${name}`,
        `${__dirname}/../../../modules/${name}/src`
      ])
    )
  },
  server: {open: true}
});
