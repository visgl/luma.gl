// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {RayTracingSceneRenderer, type RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {fromHalfFloat} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it, vi} from 'vitest';

it('preserves stationary HDR and confidence with split histories through sparse batches and resize', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({featureLevel: 'core'});
  const framebuffer = device.createFramebuffer({
    width: 16,
    height: 16,
    colorAttachments: ['rgba8unorm']
  });
  const reportError = vi.spyOn(device, 'reportError');
  const renderer = new RayTracingSceneRenderer(device);
  try {
    const projectionMatrix = new Matrix4().perspective({
      fovy: Math.PI / 3,
      aspect: 1,
      near: 0.1,
      far: 20
    });
    const scene: RayTracingSceneRenderOptions = {
      id: 'split-history',
      framebuffer,
      width: 16,
      height: 16,
      camera: {
        position: [0, 0, 4],
        projectionMatrix,
        viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]})
      },
      surfaces: [
        {
          id: 'sphere',
          geometry: new Geometry({
            attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0])}}
          }),
          material: {
            id: 'mixed',
            uniforms: {
              baseColorFactor: [0.2, 0.5, 0.8, 1],
              metallicRoughnessValues: [0.35, 0.32]
            }
          },
          transforms: [new Matrix4()]
        }
      ],
      primitives: {sphere: {type: 'sphere', radius: 1}},
      lights: [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 2}],
      environmentRadiance: [0.2, 0.2, 0.2],
      resolutionScale: 1,
      adaptiveResolution: false,
      temporalReprojection: true,
      transportMode: 'pbr',
      maxBounces: 2,
      varianceGuidance: true,
      samplesPerPixel: 1,
      samplingSeed: 37,
      progressive: true,
      rayBatchPhaseCount: 2
    };
    async function capture(separateLobeHistories: boolean) {
      renderer.destroyFrame(scene.id);
      for (let samplingFrameIndex = 0; samplingFrameIndex < 5; samplingFrameIndex++) {
        renderer.render({...scene, samplingFrameIndex, separateLobeHistories});
        device.submit();
      }
      const result = await renderer.readRadiance(scene.id);
      expect(result).not.toBeNull();
      return new DataView(result!.data.buffer, result!.data.byteOffset, result!.data.byteLength);
    }
    const combined = await capture(false);
    const split = await capture(true);
    let maxError = 0;
    let maxRadiance = 0;
    for (let offset = 0; offset < combined.byteLength; offset += 8) {
      expect(split.getUint16(offset + 6, true)).toBe(combined.getUint16(offset + 6, true));
      for (let channel = 0; channel < 6; channel += 2) {
        const reference = fromHalfFloat(combined.getUint16(offset + channel, true));
        const sample = fromHalfFloat(split.getUint16(offset + channel, true));
        maxRadiance = Math.max(maxRadiance, sample);
        maxError = Math.max(maxError, Math.abs(sample - reference));
      }
    }
    expect(maxRadiance).toBeGreaterThan(0.1);
    expect(maxError).toBeLessThan(0.003);

    renderer.render({
      ...scene,
      camera: {
        ...scene.camera,
        position: [0.05, 0, 4],
        viewMatrix: new Matrix4().lookAt({eye: [0.05, 0, 4], center: [0, 0, 0], up: [0, 1, 0]})
      },
      separateLobeHistories: true
    });
    device.submit();
    const diffuse = await renderer.readRadiance(scene.id, 'diffuse');
    const specular = await renderer.readRadiance(scene.id, 'specular');
    expect(diffuse).not.toBeNull();
    expect(specular).not.toBeNull();
    const diffuseSamples = new DataView(diffuse!.data.buffer, diffuse!.data.byteOffset);
    const specularSamples = new DataView(specular!.data.buffer, specular!.data.byteOffset);
    let retainedDiffuse = false;
    for (let offset = 6; offset < diffuseSamples.byteLength; offset += 8) {
      retainedDiffuse ||= fromHalfFloat(diffuseSamples.getUint16(offset, true)) > 1;
      expect(fromHalfFloat(specularSamples.getUint16(offset, true))).toBe(1);
    }
    expect(retainedDiffuse).toBe(true);

    renderer.render({...scene, resolutionScale: 0.5, separateLobeHistories: true});
    device.submit();
    const resized = await renderer.readRadiance(scene.id);
    expect([resized?.width, resized?.height]).toEqual([8, 8]);
    const samples = new DataView(resized!.data.buffer, resized!.data.byteOffset);
    for (let offset = 6; offset < samples.byteLength; offset += 8) {
      expect(fromHalfFloat(samples.getUint16(offset, true))).toBe(1);
    }
    expect(reportError).not.toHaveBeenCalled();
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    reportError.mockRestore();
    device.destroy();
  }
});

it('reports sampled traversal counts from the submitted frame', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({featureLevel: 'core'});
  const framebuffer = device.createFramebuffer({
    width: 16,
    height: 16,
    colorAttachments: ['rgba8unorm']
  });
  const renderer = new RayTracingSceneRenderer(device);
  try {
    const scene: RayTracingSceneRenderOptions = {
      id: 'traversal-counters',
      framebuffer,
      width: 16,
      height: 16,
      camera: {
        position: [0, 0, 4],
        projectionMatrix: new Matrix4().perspective({
          fovy: Math.PI / 3,
          aspect: 1,
          near: 0.1,
          far: 20
        }),
        viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]})
      },
      primitives: {sphere: {type: 'sphere', radius: 1}},
      surfaces: [
        {
          id: 'sphere',
          geometry: new Geometry({
            attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0])}}
          }),
          material: {id: 'matte', uniforms: {baseColorFactor: [0.5, 0.5, 0.5, 1]}},
          transforms: [new Matrix4()]
        }
      ],
      lights: [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 2}],
      resolutionScale: 1,
      adaptiveResolution: false,
      samplesPerPixel: 1,
      maxBounces: 1,
      sampleTraversal: true
    };
    const measured = renderer.render(scene);
    device.submit();
    const counters = await measured.rayTracing?.readTraversalCounters?.();
    expect(counters).toMatchObject({sampledPixels: 4, primaryRays: 4, guideRays: 4});
    expect(counters?.tlasNodes).toBeGreaterThan(0);
    expect(counters?.shadowRays).toBeGreaterThan(0);
    expect(counters?.continuationRays).toBeGreaterThan(0);
    const withoutGuides = {...scene, temporalReprojection: false, rayBatchPhaseCount: 4 as const};
    const first = renderer.render(withoutGuides);
    device.submit();
    expect(await first.rayTracing?.readTraversalCounters?.()).toMatchObject({
      sampledPixels: 4,
      guideRays: 0
    });
    const sparse = renderer.render(withoutGuides);
    device.submit();
    expect(await sparse.rayTracing?.readTraversalCounters?.()).toMatchObject({
      sampledPixels: 2,
      guideRays: 0
    });
    // Switching to an identity view must populate every guide before it can reuse them.
    const identity = {...withoutGuides, debugView: 'identity' as const};
    const firstIdentity = renderer.render(identity);
    device.submit();
    expect(await firstIdentity.rayTracing?.readTraversalCounters?.()).toMatchObject({
      sampledPixels: 4,
      guideRays: 4
    });
    const cachedIdentity = renderer.render(identity);
    device.submit();
    expect(await cachedIdentity.rayTracing?.readTraversalCounters?.()).toMatchObject({
      sampledPixels: 2,
      guideRays: 0
    });
    renderer.destroyFrame(scene.id);
    expect(await measured.rayTracing?.readTraversalCounters?.()).toBeNull();
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    device.destroy();
  }
});
