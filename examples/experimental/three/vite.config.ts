// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig(({mode}) => ({
  base:
    mode === 'website'
      ? `${(process.env['WEBSITE_BASE_URL'] || '/').replace(/\/?$/, '/')}standalone-examples/three/`
      : './',
  resolve: {
    alias: Object.fromEntries(
      ['core', 'engine', 'three', 'webgl', 'webgpu', 'shadertools'].map(name => [
        `@luma.gl/${name}`,
        fileURLToPath(new URL(`../../../modules/${name}/src`, import.meta.url))
      ])
    )
  },
  optimizeDeps: {
    exclude: ['@deck.gl/core', '@deck.gl/layers'],
    include: ['@deck.gl/layers > earcut'],
    noDiscovery: true
  },
  server: {host: '127.0.0.1'}
}));
