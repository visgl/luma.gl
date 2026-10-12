// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  exportRayTracingImage,
  RayTracingSceneRenderer,
  type RayTracingSceneRenderOptions
} from '@luma.gl/experimental';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it, vi} from 'vitest';

it('tiled seeded transport matches full-frame output across odd edges, denoise seams and camera projections', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(37, 23)}
  });
  const errors = vi.spyOn(device, 'reportError');
  const renderer = new RayTracingSceneRenderer(device);
  const sphere = new Geometry({
    attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0])}}
  });
  const triangle = new Geometry({
    attributes: {
      POSITION: {
        size: 3,
        value: new Float32Array([
          -3, -0.7, -3, 3, -0.7, 3, 3, -0.7, -3, -3, -0.7, -3, -3, -0.7, 3, 3, -0.7, 3
        ])
      },
      NORMAL: {size: 3, value: new Float32Array(Array.from({length: 6}, () => [0, 1, 0]).flat())}
    }
  });
  const scene: RayTracingSceneRenderOptions = {
    id: 'export-reference',
    width: 37,
    height: 23,
    camera: {
      position: [0, 1, 4],
      viewMatrix: new Matrix4().lookAt({eye: [0, 1, 4], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 37 / 23,
        near: 0.1,
        far: 20
      })
    },
    primitives: {sphere: {type: 'sphere', radius: 0.7}, emitter: {type: 'sphere', radius: 0.3}},
    surfaces: [
      {
        id: 'sphere',
        geometry: sphere,
        material: {
          id: 'blue',
          uniforms: {
            baseColorFactor: [0.2, 0.5, 0.8, 1],
            metallicRoughnessValues: [0.3, 0.35]
          }
        },
        transforms: [new Matrix4()]
      },
      {
        id: 'emitter',
        geometry: sphere,
        material: {
          id: 'emissive',
          uniforms: {baseColorFactor: [0, 0, 0, 1], emissiveFactor: [1, 0.3, 0.1]}
        },
        transforms: [new Matrix4().translate([1, 0.2, 0])]
      },
      {
        id: 'floor',
        geometry: triangle,
        material: {
          id: 'matte',
          uniforms: {baseColorFactor: [0.6, 0.6, 0.6, 1], metallicRoughnessValues: [0, 0.7]}
        },
        transforms: [new Matrix4()]
      }
    ],
    lights: [
      {type: 'ambient', color: [1, 1, 1], intensity: 0.1},
      {type: 'directional', direction: [-1, -1, -1], color: [1, 1, 1], intensity: 1.5}
    ],
    background: [0.02, 0.03, 0.04, 1],
    exposure: 1,
    samplesPerPixel: 4,
    samplingSeed: 17,
    maxBounces: 2,
    emitterSampling: true,
    shadowSamplesPerFrame: 0,
    resolutionScale: 1,
    adaptiveResolution: false,
    temporalReprojection: false,
    progressive: true
  };
  const color = device.createTexture({
    width: 37,
    height: 23,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 37,
    height: 23,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const layout = color.computeMemoryLayout();
  const buffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  try {
    for (const projection of ['perspective', 'orthographic'] as const) {
      scene.cameraProjection = projection;
      scene.camera.projectionMatrix =
        projection === 'perspective'
          ? new Matrix4().perspective({fovy: Math.PI / 3, aspect: 37 / 23, near: 0.1, far: 20})
          : new Matrix4().ortho({
              left: -2,
              right: 2,
              bottom: (-2 * 23) / 37,
              top: (2 * 23) / 37,
              near: 0.1,
              far: 20
            });
      for (const radius of [0, 2] as const) {
        scene.denoiseRadius = radius;
        scene.transportMode = radius ? 'pbr' : 'diffuse';
        renderer.destroyFrame(scene.id);
        for (let frameIndex = 0; frameIndex < 2; frameIndex++) {
          renderer.render({...scene, framebuffer, samplingFrameIndex: frameIndex});
          device.submit();
        }
        color.readBuffer({}, buffer);
        const reference = await buffer.readAsync();
        const stitched = new Uint8Array(37 * 23 * 4);
        const tiles = exportRayTracingImage(device, scene, {
          width: 37,
          height: 23,
          tileSize: 9,
          frames: 2
        });
        let tileCount = 0;
        for await (const tile of tiles) {
          expect(tile.data.length).toBe(tile.width * tile.height * 4);
          for (let row = 0; row < tile.height; row++)
            stitched.set(
              tile.data.subarray(row * tile.width * 4, (row + 1) * tile.width * 4),
              ((tile.y + row) * 37 + tile.x) * 4
            );
          tileCount++;
        }
        expect(tileCount).toBe(15);
        let maximumError = 0;
        for (let y = 0; y < 23; y++) {
          for (let x = 0; x < 37 * 4; x++)
            maximumError = Math.max(
              maximumError,
              Math.abs(stitched[y * 37 * 4 + x] - reference[y * layout.bytesPerRow + x])
            );
        }
        expect(maximumError, `${projection}, denoise ${radius}`).toBeLessThanOrEqual(1);
        expect(stitched.some(value => value > 30 && value < 255)).toBe(true);
      }
    }
    const getOwnedAllocationCounts = () => {
      const counts = device.statsManager.getStats('Resource Counts');
      return [counts.get('Buffers Active').count, counts.get('Textures Active').count];
    };
    const baselineAllocations = getOwnedAllocationCounts();
    const abort = new AbortController();
    abort.abort();
    await expect(
      exportRayTracingImage(device, scene, {
        width: 37,
        height: 23,
        tileSize: 9,
        signal: abort.signal
      }).next()
    ).rejects.toThrow();
    const returned = exportRayTracingImage(device, scene, {width: 37, height: 23, tileSize: 9});
    const first = await returned.next();
    expect(first.value?.data.length).toBe(9 * 9 * 4);
    const retainedData = first.value!.data.slice();
    await returned.return(undefined);
    expect(first.value!.data).toEqual(retainedData);
    expect(getOwnedAllocationCounts()).toEqual(baselineAllocations);
    const interrupted = new AbortController();
    const cancelled = exportRayTracingImage(device, scene, {
      width: 37,
      height: 23,
      tileSize: 9,
      signal: interrupted.signal
    });
    await cancelled.next();
    interrupted.abort();
    await expect(cancelled.next()).rejects.toThrow();
    expect(getOwnedAllocationCounts()).toEqual(baselineAllocations);
    expect(errors).not.toHaveBeenCalled();
  } finally {
    renderer.destroy();
    buffer.destroy();
    framebuffer.destroy();
    color.destroy();
    errors.mockRestore();
    device.destroy();
  }
});
