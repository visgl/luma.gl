// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

export type RayTracingDebugView = 'color' | 'normal' | 'cameraDistance' | 'identity' | 'history';

/** Implementation support, independent of per-scene allocation and capacity limits. */
export function getRayTracingSceneCapabilities(device: Pick<Device, 'type'>) {
  return {
    supported: device.type === 'webgpu',
    backend: 'webgpu-compute' as const,
    hardwareRayTracing: false as const,
    analyticPrimitives: ['sphere'] as const,
    meshTopology: 'triangle-list' as const,
    materialTextures: false as const,
    alphaModes: ['OPAQUE'] as const,
    scalarMetallicRoughness: true as const,
    transport: {
      maximumDiffuseBounces: 8,
      modes: ['diffuse', 'pbr'] as const,
      specular: true as const,
      transmission: false as const,
      explicitEmitterSampling: false as const
    },
    guidedSpatialDenoising: true as const,
    debugViews: ['color', 'normal', 'cameraDistance', 'identity', 'history'] as const,
    gpuStageTiming: false as const
  };
}

export type RayTracingSceneCapabilities = ReturnType<typeof getRayTracingSceneCapabilities>;
