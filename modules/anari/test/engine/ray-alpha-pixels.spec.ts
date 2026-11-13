// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {RayTracingSceneRenderer, type RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('textured cutouts agree across color, picking, channels and retained UV changes', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)}
  });
  const renderer = new RayTracingSceneRenderer(device);
  // Two triangles in one BLAS: rejecting the front triangle must not reject the mesh.
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {
        size: 3,
        value: new Float32Array([-4, -4, 0, 4, -4, 0, 0, 4, 0, -4, -4, -1, 4, -4, -1, 0, 4, -1])
      },
      NORMAL: {
        size: 3,
        value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
      },
      TEXCOORD_0: {
        size: 2,
        value: new Float32Array([0.25, 0.5, 0.25, 0.5, 0.25, 0.5, 0.75, 0.5, 0.75, 0.5, 0.75, 0.5])
      },
      TEXCOORD_1: {
        size: 2,
        value: new Float32Array([0.75, 0.5, 0.75, 0.5, 0.75, 0.5, 0.75, 0.5, 0.75, 0.5, 0.75, 0.5])
      }
    }
  });
  const map = device.createTexture({
    id: 'alpha-map',
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([255, 0, 0, 0, 0, 255, 0, 255]),
    sampler: {minFilter: 'nearest', magFilter: 'nearest', addressModeU: 'clamp-to-edge'}
  });
  const replacement = device.createTexture({
    id: map.id,
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([255, 0, 0, 0, 0, 255, 0, 0]),
    sampler: map.sampler
  });
  const color = device.createTexture({
    width: 8,
    height: 8,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 8,
    height: 8,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const surface = {
    id: 'cutout',
    geometry,
    transforms: [new Matrix4()],
    material: {
      id: 'mask',
      alphaMode: 'MASK' as const,
      version: 0,
      uniforms: {
        baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
        alphaCutoff: 0.5,
        baseColorUVSet: 0,
        baseColorMapEnabled: true,
        baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
      },
      bindings: {pbr_baseColorSampler: map}
    }
  };
  const options: RayTracingSceneRenderOptions = {
    id: 'alpha',
    surfaces: [surface],
    camera: {
      position: [0, 0, 4],
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 1,
        near: 0.1,
        far: 20
      })
    },
    width: 8,
    height: 8,
    framebuffer,
    background: [0, 0, 1, 1],
    exposure: 1,
    toneMapMode: 0,
    outputColorSpace: 'linear',
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 1}],
    progressive: false,
    temporalReprojection: false,
    adaptiveResolution: false,
    resolutionScale: 1
  };
  async function read(texture: Texture): Promise<ArrayBuffer> {
    const layout = texture.computeMemoryLayout({width: 1, height: 1});
    const buffer = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      texture.readBuffer({x: 4, y: 4, width: 1, height: 1}, buffer);
      const bytes = await buffer.readAsync();
      return bytes.slice().buffer as ArrayBuffer;
    } finally {
      buffer.destroy();
    }
  }
  async function check(expectedColor: number[], expectedDepth: number | null) {
    renderer.render(options);
    device.submit();
    expect(Array.from(new Uint8Array(await read(color)).slice(0, 3))).toEqual(expectedColor);
    const picked = await renderer.pick(options.id, 4, 4);
    const channels = renderer.captureChannels(options.id)!;
    try {
      expect(new Uint32Array(await read(channels.identifierTexture))[0]).toBe(
        expectedDepth === null ? 0 : 1
      );
      const distance = new Float32Array(await read(channels.distanceTexture))[0];
      if (expectedDepth === null) {
        expect(picked).toBeNull();
        expect(distance).toBe(0);
      } else {
        expect(picked!.position[2]).toBeCloseTo(expectedDepth, 4);
        expect(distance).toBeCloseTo(picked!.distance, 4);
      }
    } finally {
      channels.destroy();
    }
  }
  try {
    await check([0, 255, 0], -1);
    surface.material.uniforms.baseColorUVSet = 1;
    await check([0, 255, 0], 0);
    surface.material.uniforms.baseColorUVSet = 0;
    surface.material.uniforms.baseColorUVTransform = [1, 0, 0, 0, 1, 0, 0.5, 0, 1];
    await check([0, 255, 0], 0);
    surface.material.bindings.pbr_baseColorSampler = replacement;
    await check([0, 0, 255], null);
    surface.material.uniforms.baseColorMapEnabled = false;
    await check([255, 255, 255], 0);
    surface.material.uniforms.baseColorMapEnabled = true;
    surface.material.bindings.pbr_baseColorSampler = map;
    surface.material.uniforms.baseColorFactor[3] = 0.25;
    await check([0, 0, 255], null);
    surface.material.uniforms.alphaCutoff = 0.25;
    await check([0, 255, 0], 0);
    // Opaque materials ignore alpha even when every texel is transparent.
    options.surfaces = [
      {
        ...surface,
        material: {
          ...surface.material,
          alphaMode: 'OPAQUE',
          bindings: {pbr_baseColorSampler: replacement}
        }
      }
    ];
    await check([0, 255, 0], 0);
    options.surfaces = [surface];
    surface.material.uniforms.baseColorFactor[3] = 1;
    surface.material.uniforms.alphaCutoff = 0.5;
    surface.material.uniforms.baseColorUVTransform = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    options.primitives = {cutout: {type: 'sphere', radius: 1}};
    map.writeData(new Uint8Array([0, 255, 0, 255, 255, 0, 0, 0]));
    surface.material.version++;
    renderer.render(options);
    device.submit();
    expect(Array.from(new Uint8Array(await read(color)).slice(0, 3))).toEqual([0, 255, 0]);
    const farSide = await renderer.pick(options.id, 4, 4);
    expect(farSide!.position[2]).toBeLessThan(-0.8);
    // Refracted secondary paths use the same cutouts as primary visibility.
    const glass = {
      id: 'glass',
      geometry,
      transforms: [new Matrix4()],
      material: {
        id: 'glass',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          transmissionFactor: 1,
          ior: 1.5
        }
      }
    };
    options.primitives = {glass: {type: 'sphere', radius: 1}};
    surface.transforms = [new Matrix4().translate([0, 0, -2])];
    options.surfaces = [
      glass,
      {
        ...surface,
        material: {
          ...surface.material,
          uniforms: {
            ...surface.material.uniforms,
            emissiveFactor: [0, 1, 0]
          }
        }
      }
    ];
    options.transportMode = 'pbr';
    options.maxBounces = 2;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    options.lights = [];
    map.writeData(new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]));
    renderer.render(options);
    device.submit();
    expect(new Uint8Array(await read(color))[1]).toBeGreaterThan(100);
    map.writeData(new Uint8Array([255, 255, 255, 0, 255, 255, 255, 0]));
    renderer.render(options);
    device.submit();
    const throughCutout = new Uint8Array(await read(color));
    expect(throughCutout[1]).toBeLessThan(4);
    expect(throughCutout[2]).toBeGreaterThan(100);
    options.transportMode = 'diffuse';
    options.maxBounces = 0;
    options.samplesPerPixel = 1;
    // A separate off-camera cutout casts a shadow only at opaque texels.
    options.primitives = {};
    surface.transforms = [new Matrix4().translate([1, 0, 2]).scale([0.3, 0.3, 0.3])];
    const receiver = {
      id: 'receiver',
      geometry,
      transforms: [new Matrix4()],
      material: {
        id: 'receiver-material',
        uniforms: {baseColorFactor: [1, 1, 1, 1] as [number, number, number, number]}
      }
    };
    options.surfaces = [receiver, surface];
    options.lights = [
      {type: 'directional', direction: [-1, 0, -2], color: [1, 1, 1], intensity: 1}
    ];
    options.shadows = true;
    map.writeData(new Uint8Array([255, 255, 255, 0, 255, 255, 255, 0]));
    surface.material.version++;
    renderer.render(options);
    device.submit();
    const unshadowed = new Uint8Array(await read(color))[0];
    expect(unshadowed).toBeGreaterThan(30);
    map.writeData(new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]));
    surface.material.version++;
    renderer.render(options);
    device.submit();
    expect(new Uint8Array(await read(color))[0]).toBeLessThan(unshadowed / 4);
    // Masked emitter samples contribute no light, even when shadow rays are disabled.
    options.lights = [];
    options.shadows = false;
    options.emitterSampling = true;
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.surfaces = [
      receiver,
      {
        ...surface,
        material: {
          ...surface.material,
          uniforms: {
            ...surface.material.uniforms,
            emissiveFactor: [10, 10, 10]
          }
        }
      }
    ];
    renderer.render(options);
    device.submit();
    expect(new Uint8Array(await read(color))[0]).toBeGreaterThan(10);
    map.writeData(new Uint8Array([255, 255, 255, 0, 255, 255, 255, 0]));
    renderer.render(options);
    device.submit();
    expect(new Uint8Array(await read(color))[0]).toBe(0);
    options.emitterSampling = false;
    options.maxBounces = 0;
    options.samplesPerPixel = 1;
    options.surfaces = [surface];
    surface.transforms = [new Matrix4()];
    options.lights = [{type: 'ambient', color: [1, 1, 1], intensity: 1}];
    // In-place uploads use a committed material version to invalidate accumulated history.
    options.progressive = true;
    map.writeData(new Uint8Array([255, 0, 0, 0, 0, 255, 0, 0]));
    surface.material.version++;
    await check([0, 0, 255], null);
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    color.destroy();
    map.destroy();
    replacement.destroy();
    device.destroy();
  }
}, 180_000);
