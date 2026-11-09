// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/core/test-utils';
import {makeGPUSplatData, SplatRenderer} from '@luma.gl/engine/splats';

// Regression: https://github.com/LTplus-AG/ifc-lite/discussions/8141
// Alpha composition must put the nearer red Gaussian over the farther blue one.
for (const orthographic of [false, true]) {
  it(`composites reverse-Z ${orthographic ? 'orthographic' : 'perspective'} splats far to near`, async () => {
    const devices = await getTestDevices(['webgpu']);
    expect(
      devices.length,
      'requires real WebGPU execution, including software adapters'
    ).toBeGreaterThan(0);
    for (const device of devices) {
      const textureSize = 64;
      const colorTexture = device.createTexture({
        width: textureSize,
        height: textureSize,
        format: 'rgba8unorm',
        usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
      });
      const framebuffer = device.createFramebuffer({
        width: textureSize,
        height: textureSize,
        colorAttachments: [colorTexture],
        depthStencilAttachment: 'depth32float'
      });
      const batches = [-2, -4].map((positionZ, batchIndex) =>
        makeGPUSplatData(device, {
          positions: new Float32Array([0, 0, positionZ]),
          scales: new Float32Array([0.3, 0.3, 0.3]),
          rotations: new Float32Array([1, 0, 0, 0]),
          colors: new Uint8Array(batchIndex === 0 ? [255, 0, 0, 255] : [0, 0, 255, 255]),
          opacities: new Float32Array([0.75]),
          sourceBatchIndex: batchIndex,
          rowIndexBase: batchIndex
        })
      );
      const matrix = orthographic
        ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 / 99.9, 0, 0, 0, 100 / 99.9, 1]
        : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0.1, 0];
      const renderer = new SplatRenderer(device, {
        data: batches,
        viewportSize: [textureSize, textureSize],
        modelViewProjectionMatrix: matrix,
        depthConvention: 'reverse',
        depthCompare: 'greater'
      });
      const layout = colorTexture.computeMemoryLayout({width: textureSize, height: textureSize});
      const readback = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      const readCenterColor = async (clearDepth: number): Promise<Uint8Array> => {
        renderer.predraw(device.commandEncoder);
        const renderPass = device.beginRenderPass({
          framebuffer,
          clearColor: [0, 0, 0, 1],
          clearDepth
        });
        renderer.draw(renderPass);
        renderPass.end();
        device.submit();
        colorTexture.readBuffer({width: textureSize, height: textureSize}, readback);
        const pixels = await readback.readAsync(0, layout.byteLength);
        const centerPixelOffset = 32 * layout.bytesPerRow + 32 * 4;
        return pixels.slice(centerPixelOffset, centerPixelOffset + 4);
      };
      try {
        const reverseColor = await readCenterColor(0);
        expect(reverseColor[0]).toBeGreaterThan(170);
        expect(reverseColor[2]).toBeGreaterThan(30);
        expect(reverseColor[0]).toBeGreaterThan(reverseColor[2] + 100);
        expect(reverseColor[1]).toBe(0);
        expect(reverseColor[3]).toBe(255);

        renderer.setProps({depthConvention: 'standard'});
        const wrongConventionColor = await readCenterColor(0);
        expect(wrongConventionColor[2]).toBeGreaterThan(wrongConventionColor[0] + 100);
        renderer.setProps({depthConvention: 'reverse'});
        expect(Array.from(await readCenterColor(0))).toEqual(Array.from(reverseColor));

        // A shared opaque-depth plane at z=-3 hides blue at -4, but retains red at -2.
        const opaqueDepth = (-3 * matrix[10] + matrix[14]) / (-3 * matrix[11] + matrix[15]);
        const occludedColor = await readCenterColor(opaqueDepth);
        expect(occludedColor[0]).toBeGreaterThan(170);
        expect(occludedColor[2]).toBe(0);

        // Convert clip z to w-z: same camera, conventional depth convention.
        for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
          matrix[columnIndex * 4 + 2] = matrix[columnIndex * 4 + 3] - matrix[columnIndex * 4 + 2];
        }
        renderer.setProps({
          modelViewProjectionMatrix: matrix,
          depthConvention: 'standard',
          depthCompare: 'less'
        });
        const standardColor = await readCenterColor(1);
        for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
          expect(
            Math.abs(standardColor[channelIndex] - reverseColor[channelIndex])
          ).toBeLessThanOrEqual(1);
        }
      } finally {
        readback.destroy();
        renderer.destroy();
        for (const batch of batches) batch.destroy();
        framebuffer.destroy();
        colorTexture.destroy();
      }
    }
  });
}
