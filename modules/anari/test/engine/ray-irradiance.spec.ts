// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Buffer, Texture} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {RayTracingSceneRenderer, type RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core';
import {expect, test} from 'vitest';

test('irradiance transport preserves coverage and receives emissive color', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(2, 1)}
  });
  const renderer = new RayTracingSceneRenderer(device);
  const positions = device.createTexture({
    width: 2,
    height: 1,
    format: 'rgba32float',
    data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 0])
  });
  const normals = device.createTexture({
    width: 2,
    height: 1,
    format: 'rgba32float',
    data: new Float32Array([0, 1, 0, 0, 0, 1, 0, 0])
  });
  const output = device.createTexture({
    width: 2,
    height: 1,
    format: 'rgba16float',
    usage: Texture.STORAGE | Texture.COPY_SRC
  });
  const readback = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.COPY_SRC});
  try {
    device.handle.pushErrorScope('validation');
    const options: RayTracingSceneRenderOptions = {
      id: 'bake',
      width: 2,
      height: 1,
      camera: {
        position: [0, 0, 0],
        viewMatrix: new Matrix4().lookAt({eye: [0, 0, 0], center: [0, 1, 0], up: [0, 0, 1]}),
        projectionMatrix: new Matrix4().perspective({
          fovy: Math.PI / 3,
          aspect: 2,
          near: 0.1,
          far: 1000
        })
      },
      surfaces: [
        {
          id: 'emitter',
          geometry: new Geometry({
            topology: 'triangle-list',
            attributes: {
              POSITION: {
                size: 3,
                value: new Float32Array([-100, 1, -100, 100, 1, -100, 0, 1, 100])
              },
              NORMAL: {size: 3, value: new Float32Array([0, -1, 0, 0, -1, 0, 0, -1, 0])}
            }
          }),
          material: {
            id: 'red',
            uniforms: {
              baseColorFactor: [0, 0, 0, 1],
              emissiveFactor: [1, 0, 0],
              emissiveStrength: 1
            }
          },
          transforms: [new Matrix4()]
        }
      ],
      lights: [],
      progressive: false,
      adaptiveResolution: false,
      maxBounces: 0,
      samplingSeed: 17
    };
    renderer.render(options);
    device.submit();
    renderer.encodeIrradiance('bake', positions, normals, output);
    device.submit();
    output.readBuffer({}, readback);
    const bytes = await readback.readAsync();
    const pixels = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    expect(await device.handle.popErrorScope()).toBe(null);
    expect(pixels[0]).toBeGreaterThan(0x3c00);
    expect(pixels[1]).toBe(0);
    expect(pixels[2]).toBe(0);
    expect(pixels[3]).toBe(0x3c00);
    expect(Array.from(pixels.slice(4, 8))).toEqual([0, 0, 0, 0]);
    device.handle.pushErrorScope('validation');
    renderer.render({
      ...options,
      surfaces: [
        ...options.surfaces,
        {
          id: 'wall',
          geometry: options.surfaces[0].geometry,
          material: {id: 'black-wall', uniforms: {baseColorFactor: [0, 0, 0, 1]}},
          transforms: [new Matrix4().translate([0, -0.5, 0])]
        }
      ]
    });
    device.submit();
    renderer.encodeIrradiance('bake', positions, normals, output);
    device.submit();
    output.readBuffer({}, readback);
    const blockedBytes = await readback.readAsync();
    const blockedPixels = new Uint16Array(
      blockedBytes.buffer,
      blockedBytes.byteOffset,
      blockedBytes.byteLength / 2
    );
    expect(await device.handle.popErrorScope()).toBe(null);
    expect(Array.from(blockedPixels.slice(0, 4))).toEqual([0, 0, 0, 0x3c00]);
  } finally {
    renderer.destroy();
    positions.destroy();
    normals.destroy();
    output.destroy();
    readback.destroy();
    device.destroy();
  }
});
