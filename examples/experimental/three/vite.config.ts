// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig(({mode}) => ({
  base:
    mode === 'website'
      ? `${(process.env['WEBSITE_BASE_URL'] || '/').replace(/\/?$/, '/')}standalone-examples/three/`
      : './',
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        'gpu-graph-galaxy': fileURLToPath(new URL('./gpu-graph-galaxy.html', import.meta.url)),
        'host-overlay': fileURLToPath(new URL('./host-overlay.html', import.meta.url))
      }
    }
  },
  resolve: {
    alias: Object.fromEntries(
      ['core', 'effects', 'engine', 'gpgpu', 'three', 'webgl', 'webgpu', 'shadertools'].map(
        name => [
          `@luma.gl/${name}`,
          fileURLToPath(new URL(`../../../modules/${name}/src`, import.meta.url))
        ]
      )
    )
  },
  optimizeDeps: {
    exclude: ['@deck.gl/core', '@deck.gl/layers'],
    // Prebundle the linked entry points together so shared GPU classes retain one identity.
    // Serving these large barrel exports as individual source modules creates a cold-load waterfall.
    include: [
      '@deck.gl/layers > earcut',
      '@deck.gl-community/panels',
      'preact',
      'preact/hooks',
      '@luma.gl/core',
      '@luma.gl/core/webgpu',
      '@luma.gl/effects',
      '@luma.gl/engine',
      '@luma.gl/gpgpu/gpu-core',
      '@luma.gl/shadertools',
      '@luma.gl/three/interop',
      'three/webgpu',
      'three/tsl',
      'three/addons/controls/OrbitControls.js',
      'three/addons/tsl/display/BloomNode.js'
    ],
    noDiscovery: true
  },
  server: {host: '127.0.0.1'}
}));
