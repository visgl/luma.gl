// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {build} from 'esbuild';
import {ClusteredLightGrid, CLUSTERED_POINT_LIGHT_LAYOUT} from '@luma.gl/engine/lighting';
import {ClusteredLightGrid as CompatibleClusteredLightGrid} from '../../../anari/src/rendering/clustered-lighting';

it('clustered grid preserves compatibility identity and exposes the record layout', () => {
  expect(CompatibleClusteredLightGrid).toBe(ClusteredLightGrid);
  expect(CLUSTERED_POINT_LIGHT_LAYOUT).toEqual({
    byteStride: 32,
    positionByteOffset: 0,
    radiusByteOffset: 12,
    payloadByteOffset: 16
  });
});

it('cluster-only imports remove unrelated lighting implementations', async () => {
  const result = await build({
    stdin: {
      contents: "export {ClusteredLightGrid} from './modules/engine/src/lighting/index.ts';",
      resolveDir: process.cwd()
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    minify: true,
    external: [
      '@luma.gl/core',
      '@luma.gl/core/*',
      '@luma.gl/graph',
      '@luma.gl/graph/*',
      '@luma.gl/shaders',
      '@math.gl/*',
      'probe.gl'
    ]
  });
  const source = result.outputFiles[0].text;
  for (const symbol of [
    'clusteredDeferredLighting',
    'pbrEnvironmentFilter',
    'ContactShadowPass',
    'AmbientOcclusionPass',
    'LTC_MAT'
  ])
    expect(source).not.toContain(symbol);
});
