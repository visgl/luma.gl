// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';

export default defineConfig(({mode}) => ({
  base:
    mode === 'website'
      ? `${(process.env['WEBSITE_BASE_URL'] || '/').replace(/\/?$/, '/')}standalone-examples/global-illumination/`
      : './',
  resolve: {
    alias: {
      '@deck.gl-community/gpu-layers': `${__dirname}/../../../modules/deck-gpu-layers/src`,
      '@luma.gl/effects': `${__dirname}/../../../modules/effects/src`,
      '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
      '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
      '@luma.gl/graph': `${__dirname}/../../../modules/graph/src`,
      '@luma.gl/text': `${__dirname}/../../../modules/text/src`,
      '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
      '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
      '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
      '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
      '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
    }
  },
  optimizeDeps: {exclude: ['@deck.gl/core'], noDiscovery: true}
}));
