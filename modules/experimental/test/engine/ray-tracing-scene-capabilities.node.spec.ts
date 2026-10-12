// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getRayTracingSceneCapabilities} from '@luma.gl/experimental';
import {expect, it} from 'vitest';

it('reports implemented software tracing separately from planned material transport', () => {
  const capabilities = getRayTracingSceneCapabilities({type: 'webgpu'});
  expect(capabilities.supported).toBe(true);
  expect(capabilities.hardwareRayTracing).toBe(false);
  expect(capabilities.transport).toEqual({
    maximumDiffuseBounces: 8,
    modes: ['diffuse', 'pbr'],
    specular: true,
    transmission: false,
    explicitEmitterSampling: true
  });
  expect(capabilities.materialTextures).toBe(false);
  expect(capabilities.alphaModes).toEqual(['OPAQUE', 'MASK']);
  expect(capabilities.debugViews).toEqual([
    'color',
    'normal',
    'cameraDistance',
    'identity',
    'history'
  ]);
  expect(getRayTracingSceneCapabilities({type: 'webgl'}).supported).toBe(false);
  expect(getRayTracingSceneCapabilities({type: 'null'}).supported).toBe(false);
});
