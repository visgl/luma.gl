// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';

export default defineConfig(({mode}) => ({
  // Website hosts may redirect index.html to a clean URL without a trailing slash.
  base:
    mode === 'website'
      ? `${(process.env['WEBSITE_BASE_URL'] || '/').replace(/\/?$/, '/')}standalone-examples/city-scene/`
      : './',
  resolve: {
    alias: {
      '@deck.gl-community/gpu-layers': `${__dirname}/../../../modules/deck-gpu-layers/src`,
      '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
      '@luma.gl/engine/models': `${__dirname}/../../../modules/engine/src/graph/models`,
      '@luma.gl/engine/physics': `${__dirname}/../../../modules/engine/src/graph/physics`,
      '@luma.gl/engine/tables': `${__dirname}/../../../modules/engine/src/graph/tables`,
      '@luma.gl/engine/text-fonts': `${__dirname}/../../../modules/engine/src/text/fonts`,
      '@luma.gl/engine/text-3d': `${__dirname}/../../../modules/engine/src/text/text-3d`,
      '@luma.gl/engine/text-experimental': `${__dirname}/../../../modules/engine/src/text/experimental.ts`,
      '@luma.gl/engine/text': `${__dirname}/../../../modules/engine/src/text`,
      '@luma.gl/engine/effects': `${__dirname}/../../../modules/engine/src/effects`,
      '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
      '@luma.gl/gpgpu/_internal': `${__dirname}/../../../modules/gpgpu/src/execution`,
      '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
      '@luma.gl/graph': `${__dirname}/../../../modules/graph/src`,
      '@luma.gl/shaders': `${__dirname}/../../../modules/shaders/src`,
      '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
      '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
    }
  },
  optimizeDeps: {exclude: ['@deck.gl/core'], noDiscovery: true}
}));
