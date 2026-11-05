// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/core/test-utils';
import {makeGPUSplatData, SplatRenderer, type SplatDepthInterval} from '@luma.gl/engine/splats';

// Regression: https://github.com/LTplus-AG/ifc-lite/issues/8813
// The two interval draws partition the same samples as an unfiltered draw.
for (const samples of [1, 4]) {
  for (const depthConvention of ['standard', 'reverse'] as const) {
    it(`partitions ${samples} sample splats with ${depthConvention} depth`, async () => {
      const devices = await getTestDevices(['webgpu']);
      expect(devices.length, 'requires real WebGPU execution').toBeGreaterThan(0);
      for (const device of devices) {
        const size = 32;
        const data = makeGPUSplatData(device, {
          positions: new Float32Array([0, 0, 0.25, 0, 0, 0.75]),
          scales: new Float32Array([0.3, 0.3, 0.3, 0.3, 0.3, 0.3]),
          rotations: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0]),
          colors: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
          opacities: new Float32Array([0.75, 0.75])
        });
        const bound = device.createTexture({
          width: size,
          height: size,
          samples,
          format: 'depth32float',
          usage: Texture.RENDER_ATTACHMENT | Texture.TEXTURE
        });
        const boundFramebuffer = device.createFramebuffer({
          width: size,
          height: size,
          depthStencilAttachment: bound
        });
        const color = device.createTexture({
          width: size,
          height: size,
          format: 'rgba8unorm',
          usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
        });
        const multisampledColor =
          samples > 1
            ? device.createTexture({
                width: size,
                height: size,
                samples,
                format: 'rgba8unorm',
                usage: Texture.RENDER_ATTACHMENT
              })
            : undefined;
        const framebuffer = device.createFramebuffer({
          width: size,
          height: size,
          colorAttachments: [multisampledColor ?? color],
          depthStencilAttachment: device.createTexture({
            width: size,
            height: size,
            samples,
            format: 'depth32float',
            usage: Texture.RENDER_ATTACHMENT
          })
        });
        const commonProps = {
          data,
          viewportSize: [size, size] as [number, number],
          depthConvention,
          depthCompare: 'always' as const
        };
        const baseline = new SplatRenderer(device, commonProps);
        const filtered = new SplatRenderer(device, {...commonProps, depthIntervalSamples: samples});
        for (const renderer of [baseline, filtered]) {
          renderer.model?.setParameters({...renderer.model.parameters, sampleCount: samples});
        }
        const layout = color.computeMemoryLayout({width: size, height: size});
        const readback = device.createBuffer({
          byteLength: layout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        const readCenter = async (): Promise<number[]> => {
          device.submit();
          color.readBuffer({width: size, height: size}, readback);
          const pixels = await readback.readAsync(0, layout.byteLength);
          return Array.from(
            pixels.slice(16 * layout.bytesPerRow + 16 * 4, 16 * layout.bytesPerRow + 16 * 4 + 4)
          );
        };
        const draw = (
          renderer: SplatRenderer,
          sides?: readonly SplatDepthInterval['compare'][]
        ): void => {
          renderer.predraw(device.commandEncoder);
          const pass = device.beginRenderPass({
            framebuffer,
            clearColor: [0, 0, 0, 0],
            clearDepth: 1,
            resolveTargets: [multisampledColor ? color.view : null]
          });
          if (sides) {
            for (const side of sides) {
              renderer.setDepthInterval({bound, compare: side});
              renderer.draw(pass);
            }
          } else {
            renderer.draw(pass);
          }
          pass.end();
        };
        try {
          const clearBound = device.beginRenderPass({
            framebuffer: boundFramebuffer,
            clearDepth: 0.5
          });
          clearBound.end();
          device.submit();

          draw(baseline);
          const unsplit = await readCenter();
          expect(unsplit[0]).toBeGreaterThan(0);
          expect(unsplit[2]).toBeGreaterThan(0);

          const sides =
            depthConvention === 'standard'
              ? (['greater', 'less-equal'] as const)
              : (['less-equal', 'greater'] as const);
          draw(filtered, [sides[0]]);
          const first = await readCenter();
          expect(first).not.toEqual(unsplit);
          draw(filtered, sides);
          const split = await readCenter();
          for (let channel = 0; channel < 4; channel++) {
            expect(Math.abs(split[channel] - unsplit[channel])).toBeLessThanOrEqual(1);
          }
        } finally {
          readback.destroy();
          filtered.destroy();
          baseline.destroy();
          framebuffer.depthStencilAttachment?.texture.destroy();
          framebuffer.destroy();
          multisampledColor?.destroy();
          color.destroy();
          boundFramebuffer.destroy();
          bound.destroy();
          data.destroy();
        }
      }
    });
  }
}
