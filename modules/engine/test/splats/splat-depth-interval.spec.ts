// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/core/test-utils';
import {makeGPUSplatData, SplatRenderer, type SplatDepthInterval} from '@luma.gl/engine/splats';

// Regression: https://github.com/LTplus-AG/ifc-lite/issues/8813
// The two interval draws partition the same samples as an unfiltered draw.
for (const [samples, perSampleDepth] of [
  [1, false],
  [4, false],
  [4, true]
] as const) {
  for (const depthConvention of ['standard', 'reverse'] as const) {
    it(`partitions ${samples} sample splats with ${depthConvention} depth${perSampleDepth ? ' and per-sample bounds' : ''}`, async () => {
      const devices = await getTestDevices(['webgpu']);
      expect(devices.length, 'requires real WebGPU execution').toBeGreaterThan(0);
      for (const device of devices) {
        const size = 32;
        const data = makeGPUSplatData(device, {
          positions: new Float32Array(perSampleDepth ? [0, 0, 0.5] : [0, 0, 0.25, 0, 0, 0.75]),
          scales: new Float32Array(
            perSampleDepth ? [0.3, 0.3, 0.3] : [0.3, 0.3, 0.3, 0.3, 0.3, 0.3]
          ),
          rotations: new Float32Array(perSampleDepth ? [1, 0, 0, 0] : [1, 0, 0, 0, 1, 0, 0, 0]),
          colors: new Uint8Array(
            perSampleDepth ? [255, 0, 0, 255] : [255, 0, 0, 255, 0, 0, 255, 255]
          ),
          opacities: new Float32Array(perSampleDepth ? [0.75] : [0.75, 0.75])
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
        // The unfiltered renderer has no sample-count prop; the filtered renderer must set its own.
        baseline.model?.setParameters({...baseline.model.parameters, sampleCount: samples});
        expect(filtered.model?.parameters.sampleCount).toBe(samples);
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
          if (perSampleDepth) {
            // A different pipeline mask writes each sample's depth independently. Samples 1 and 3
            // equal the splat depth and must belong to the less-equal interval.
            for (const [sampleIndex, depth] of [0.25, 0.5, 0.75, 0.5].entries()) {
              const shader = device.createShader({
                stage: 'vertex',
                source: `@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
                  let x = select(-1.0, 3.0, index == 1u);
                  let y = select(-1.0, 3.0, index == 2u);
                  return vec4f(x, y, ${depth}, 1.0);
                }`
              });
              const pipeline = device.createRenderPipeline({
                vs: shader,
                fs: null,
                colorAttachmentFormats: [],
                depthStencilAttachmentFormat: 'depth32float',
                parameters: {
                  sampleCount: 4,
                  sampleMask: 1 << sampleIndex,
                  depthWriteEnabled: true,
                  depthCompare: 'always'
                }
              });
              const pass = device.beginRenderPass({
                framebuffer: boundFramebuffer,
                clearDepth: sampleIndex === 0 ? 1 : false
              });
              pass.setPipeline(pipeline);
              pass.draw({vertexCount: 3});
              pass.end();
              device.submit();
              pipeline.destroy();
              shader.destroy();
            }
          } else {
            const clearBound = device.beginRenderPass({
              framebuffer: boundFramebuffer,
              clearDepth: 0.5
            });
            clearBound.end();
          }
          device.submit();

          draw(baseline);
          const unsplit = await readCenter();
          expect(unsplit[0]).toBeGreaterThan(0);
          if (!perSampleDepth) {
            expect(unsplit[2]).toBeGreaterThan(0);
          }

          const sides =
            depthConvention === 'standard'
              ? (['greater', 'less-equal'] as const)
              : (['less-equal', 'greater'] as const);
          draw(filtered, [sides[0]]);
          const first = await readCenter();
          expect(first).not.toEqual(unsplit);
          if (perSampleDepth) {
            const firstFraction = depthConvention === 'standard' ? 1 / 4 : 3 / 4;
            expect(Math.abs(first[0] - unsplit[0] * firstFraction)).toBeLessThanOrEqual(2);
            draw(filtered, [sides[1]]);
            const second = await readCenter();
            expect(Math.abs(second[0] - unsplit[0] * (1 - firstFraction))).toBeLessThanOrEqual(2);
          }
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
