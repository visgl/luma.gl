// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {ClusteredLightGrid, CLUSTERED_POINT_LIGHT_LAYOUT} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';

it('clustered grid preserves deterministic overflow, clears frames and borrows inputs', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const records = new Float32Array((4 * CLUSTERED_POINT_LIGHT_LAYOUT.byteStride) / 4);
  for (let index = 0; index < 4; index++)
    records.set([0, 0, -2, 10, index, -100, 999, 0], index * 8);
  const pointLights = device.createBuffer({data: records, usage: Buffer.STORAGE | Buffer.COPY_DST});
  const grid = new ClusteredLightGrid(device, {
    clusterDimensions: [2, 2, 2],
    maxLightCount: 4,
    maxLightsPerCluster: 2
  });
  const options = {
    pointLights,
    pointLightCount: 4,
    projectionMatrix: new Matrix4().perspective({fovy: 1, aspect: 1, near: 0.1, far: 10}),
    nearPlane: 0.1,
    farPlane: 10
  };
  const submit = vi.spyOn(device, 'submit');
  try {
    expect(() => grid.getUniforms()).toThrow();
    for (let iteration = 0; iteration < 2; iteration++) {
      submit.mockClear();
      grid.encode(device.commandEncoder, options);
      expect(submit).not.toHaveBeenCalled();
      expect(grid.getBindings()).toEqual(grid.getShaderPassBindings());
      expect(grid.getUniforms()).toEqual(grid.getShaderPassUniforms(0.1, 10));
      device.submit();
      expect(Array.from(await readUnsigned(grid.clusterLightCounts))).toEqual(Array(8).fill(4));
      expect(Array.from(await readUnsigned(grid.clusterLightIndices))).toEqual(
        Array.from({length: 16}, (_, index) => index % 2)
      );
    }
    grid.encode(device.commandEncoder, {...options, pointLightCount: 0, nearPlane: 0.2});
    device.submit();
    expect(grid.getUniforms().clusterNearPlane).toBe(0.2);
    expect(Array.from(await readUnsigned(grid.clusterLightCounts))).toEqual(Array(8).fill(0));
    expect(() => grid.encode(device.commandEncoder, {...options, pointLightCount: 5})).toThrow();
    grid.destroy();
    grid.destroy();
    expect(grid.clusterLightCounts.destroyed).toBe(true);
    expect(grid.clusterLightIndices.destroyed).toBe(true);
    expect(pointLights.destroyed).toBe(false);
    expect(() => grid.encode(device.commandEncoder, options)).toThrow();
  } finally {
    submit.mockRestore();
    grid.destroy();
    pointLights.destroy();
  }
});

it('clustered grid agrees with independent orthographic sphere bounds', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const lights = [
    [-0.65, 0.65, -1, 0.1],
    [0.65, -0.65, -4, 0.1],
    [3, 0, -2, 0.2],
    [0, 0, -30, 0.1]
  ];
  const records = new Float32Array(lights.length * 8);
  lights.forEach((light, index) => records.set([...light, 100, -100, 0, 42], index * 8));
  const pointLights = device.createBuffer({data: records, usage: Buffer.STORAGE});
  const grid = new ClusteredLightGrid(device, {
    clusterDimensions: [4, 4, 2],
    maxLightCount: 4,
    maxLightsPerCluster: 4
  });
  try {
    grid.encode(device.commandEncoder, {
      pointLights,
      pointLightCount: 4,
      projectionMatrix: new Matrix4().ortho({
        left: -1,
        right: 1,
        bottom: -1,
        top: 1,
        near: 0.1,
        far: 10
      }),
      nearPlane: 0.1,
      farPlane: 10
    });
    device.submit();
    const counts = await readUnsigned(grid.clusterLightCounts);
    const indices = await readUnsigned(grid.clusterLightIndices);
    for (let depthSlice = 0; depthSlice < 2; depthSlice++) {
      for (let tileY = 0; tileY < 4; tileY++) {
        for (let tileX = 0; tileX < 4; tileX++) {
          const expected = lights.flatMap(([x, y, z, radius], index) => {
            const overlaps =
              x + radius >= -1 + tileX * 0.5 &&
              x - radius <= -1 + (tileX + 1) * 0.5 &&
              y + radius >= 1 - (tileY + 1) * 0.5 &&
              y - radius <= 1 - tileY * 0.5 &&
              -z + radius >= 0.1 * 10 ** depthSlice &&
              -z - radius <= 0.1 * 10 ** (depthSlice + 1);
            return overlaps ? [index] : [];
          });
          const clusterIndex = (depthSlice * 4 + tileY) * 4 + tileX;
          expect(counts[clusterIndex]).toBe(expected.length);
          expect(
            Array.from(indices.slice(clusterIndex * 4, clusterIndex * 4 + expected.length))
          ).toEqual(expected);
        }
      }
    }
  } finally {
    grid.destroy();
    pointLights.destroy();
  }
});

async function readUnsigned(buffer: Buffer): Promise<Uint32Array> {
  const bytes = await buffer.readAsync();
  return new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

it('perspective binning contains sampled sphere projections, including off-axis bounds', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const projectionMatrix = new Matrix4().perspective({
    fovy: Math.PI / 2,
    aspect: 1,
    near: 0.1,
    far: 10
  });
  const pointLights = device.createBuffer({
    data: new Float32Array([3, 0, -4, 2, 0, 0, 0, 0]),
    usage: Buffer.STORAGE
  });
  const grid = new ClusteredLightGrid(device, {
    clusterDimensions: [32, 32, 8],
    maxLightCount: 1,
    maxLightsPerCluster: 1
  });
  try {
    grid.encode(device.commandEncoder, {
      pointLights,
      pointLightCount: 1,
      projectionMatrix,
      nearPlane: 0.1,
      farPlane: 10
    });
    device.submit();
    const counts = await readUnsigned(grid.clusterLightCounts);
    for (let latitude = 0; latitude <= 20; latitude++) {
      for (let longitude = 0; longitude < 40; longitude++) {
        const elevation = (latitude * Math.PI) / 20;
        const azimuth = (longitude * Math.PI) / 20;
        const position = [
          3 + 2 * Math.sin(elevation) * Math.cos(azimuth),
          2 * Math.sin(elevation) * Math.sin(azimuth),
          -4 + 2 * Math.cos(elevation)
        ];
        const depth = -position[2];
        const horizontal = (position[0] / depth + 1) / 2;
        const vertical = (1 - position[1] / depth) / 2;
        if (horizontal < 0 || horizontal >= 1 || vertical < 0 || vertical >= 1) continue;
        const tileX = Math.floor(horizontal * 32);
        const tileY = Math.floor(vertical * 32);
        const depthSlice = Math.min(7, Math.floor((Math.log(depth / 0.1) / Math.log(100)) * 8));
        expect(counts[(depthSlice * 32 + tileY) * 32 + tileX]).toBe(1);
      }
    }
  } finally {
    grid.destroy();
    pointLights.destroy();
  }
});

it('standalone cluster preview consumes GPU lists without a scene renderer', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {ClusterGridPreview} = await import(
    '../../../../examples/api/pbr-shadows/cluster-grid-preview'
  );
  const {Texture} = await import('@luma.gl/core');
  const preview = new ClusterGridPreview(device);
  const target = device.createTexture({
    width: 64,
    height: 64,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const depth = device.createTexture({
    width: 64,
    height: 64,
    format: 'depth24plus',
    usage: Texture.RENDER_ATTACHMENT
  });
  const framebuffer = device.createFramebuffer({
    colorAttachments: [target],
    depthStencilAttachment: depth
  });
  const readback = device.createBuffer({
    byteLength: 256 * 64,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    preview.encode(
      device,
      new Matrix4().lookAt({eye: [6, 6, 10], center: [0, 0.5, 0], up: [0, 1, 0]}),
      new Matrix4().perspective({fovy: Math.PI / 4, aspect: 1, near: 0.1, far: 40}),
      0
    );
    const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
    preview.draw(pass);
    pass.end();
    device.submit();
    target.readBuffer({width: 64, height: 64}, readback);
    const pixels = await readback.readAsync();
    expect(pixels.some((value, index) => index % 4 === 0 && value > 0)).toBe(true);
  } finally {
    preview.destroy();
    framebuffer.destroy();
    target.destroy();
    depth.destroy();
    readback.destroy();
  }
});
