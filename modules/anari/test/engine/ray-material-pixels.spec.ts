// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {RayTracingSceneRenderer, type RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('ray maps preserve UV selection and replacement, and dielectrics cross both sphere interfaces', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)}
  });
  const renderer = new RayTracingSceneRenderer(device);
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-4, -4, 0, 4, -4, 0, 0, 4, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
      TEXCOORD_0: {size: 2, value: new Float32Array([0.25, 0.5, 0.25, 0.5, 0.25, 0.5])},
      TEXCOORD_1: {size: 2, value: new Float32Array([0.75, 0.5, 0.75, 0.5, 0.75, 0.5])}
    }
  });
  const map = device.createTexture({
    id: 'same-label',
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
    sampler: {minFilter: 'nearest', magFilter: 'nearest'}
  });
  const replacement = device.createTexture({
    id: map.id,
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]),
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
    id: 'triangle',
    geometry,
    material: {
      id: 'material',
      uniforms: {
        baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
        baseColorUVSet: 0,
        baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
      },
      bindings: {pbr_baseColorSampler: map}
    },
    transforms: [new Matrix4()]
  };
  const options: RayTracingSceneRenderOptions = {
    id: 'pixels',
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
    exposure: 1,
    toneMapMode: 0,
    outputColorSpace: 'linear',
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 1}],
    progressive: true,
    temporalReprojection: false,
    adaptiveResolution: false,
    resolutionScale: 1
  };
  async function readPixel(): Promise<number[]> {
    renderer.render(options);
    device.submit();
    const layout = color.computeMemoryLayout({width: 1, height: 1});
    const buffer = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      color.readBuffer({x: 4, y: 4, width: 1, height: 1}, buffer);
      const bytes = await buffer.readAsync();
      return Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 3));
    } finally {
      buffer.destroy();
    }
  }
  try {
    expect(await readPixel()).toEqual([255, 0, 0]);
    surface.material.uniforms.baseColorUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 255]);
    surface.material.uniforms.baseColorUVSet = 0;
    surface.material.uniforms.baseColorUVTransform = [1, 0, 0, 0, 1, 0, 0.5, 0, 1];
    expect(await readPixel()).toEqual([0, 0, 255]);
    surface.material.bindings.pbr_baseColorSampler = replacement;
    expect(await readPixel()).toEqual([0, 255, 0]);
    const glass = {
      id: 'glass',
      geometry,
      material: {
        id: 'glass-material',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          transmissionFactor: 1,
          ior: 1.5
        }
      },
      transforms: [new Matrix4()]
    };
    const emitter = {
      id: 'emitter',
      geometry,
      material: {
        id: 'emitter-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          emissiveFactor: [0.8, 0, 0] as [number, number, number]
        }
      },
      transforms: [new Matrix4().translate([0, 0, -2])]
    };
    options.surfaces = [glass, emitter];
    options.primitives = {glass: {type: 'sphere', radius: 1}};
    options.transportMode = 'pbr';
    options.maxBounces = 0;
    expect(await readPixel()).toEqual([255, 255, 255]);
    options.lights = [];
    options.maxBounces = 2;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const transmitted = await readPixel();
    expect(transmitted[0]).toBeGreaterThan(100);
    expect(transmitted[1]).toBeLessThan(4);
    expect(transmitted[2]).toBeLessThan(4);
    options.surfaces = [glass];
    options.background = [0.8, 0.2, 0.05, 1];
    const backdrop = await readPixel();
    expect(backdrop[0]).toBeGreaterThan(100);
    expect(backdrop[1]).toBeGreaterThan(20);
    options.background = [0, 0, 0, 1];
    options.surfaces = [glass, emitter];
    options.surfaces[0].material.bindings = {pbr_transmissionSampler: replacement};
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.surfaces = [emitter];
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [0, 0, 0, 1],
      emissiveFactor: [1, 1, 1]
    };
    options.surfaces[0].material.bindings = {pbr_emissiveSampler: replacement};
    expect(await readPixel()).toEqual([0, 255, 0]);
    options.surfaces = [surface];
    options.primitives = {};
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 1}];
    options.maxBounces = 0;
    options.surfaces[0].material.bindings = {};
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0, 1]
    };
    const scalarMaterial = await readPixel();
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [1, 1]
    };
    options.surfaces[0].material.bindings = {pbr_metallicRoughnessSampler: replacement};
    expect(await readPixel()).toEqual(scalarMaterial);
    // A diffuse receiver inside glass must not turn a camera backdrop into a light.
    options.surfaces = [surface, glass];
    options.surfaces[0].material.bindings = {};
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0, 1]
    };
    options.surfaces[1].material.bindings = {};
    options.primitives = {glass: {type: 'sphere', radius: 6}};
    options.lights = [];
    options.background = [0.8, 0.2, 0.05, 1];
    options.maxBounces = 3;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    color.destroy();
    map.destroy();
    replacement.destroy();
    device.destroy();
  }
  // Software WebGPU CI compiles several complete traversal/material pipelines here.
}, 180_000);
