// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {fromHalfFloat} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';
import FluidFoundryAnimationLoopTemplate from '../../examples/experimental/fluid-foundry/app';

describe('Fluid Foundry: Liquid Metal Press', () => {
  test('advances the MLS-MPM solver and renders finite HDR liquid', async () => {
    const device = await getWebGPUTestDevice('core');
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      Boolean(device.info.fallback)
    ) {
      return;
    }

    const width = 96;
    const height = 72;
    const particleCount = 1024;
    const gridSize = [24, 16] as const;
    const densityMapSize = 64;
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    let viewer: FluidFoundryAnimationLoopTemplate | null = null;
    try {
      viewer = new FluidFoundryAnimationLoopTemplate({
        device,
        width,
        height,
        particleCount,
        gridSize,
        densityMapSize
      });
      await viewer.onInitialize({
        ...makeAnimationProps(device, width, height, 1000),
        canvas
      } as AnimationProps);

      expect(viewer.simulation.particleCount).toBe(particleCount);
      expect(viewer.simulation.gridSize).toEqual(gridSize);
      expect(viewer.densityTarget.texture.width).toBe(densityMapSize);
      expect(viewer.densityTarget.texture.height).toBe(densityMapSize);
      expect(viewer.sceneColorTexture.format).toBe('rgba16float');
      expect(viewer.densityTarget.texture.format).toBe('rgba16float');
      expect(
        viewer.postprocessingRenderer.passRenderers.map(
          passRenderer => passRenderer.passDefinition.name
        )
      ).toEqual(['bloomShaderPassPipeline', 'toneMapping']);

      viewer.onRender(makeAnimationProps(device, width, height, 1000));
      device.submit();

      expect(viewer.simulation.stats.encodeCount).toBe(1);
      expect(viewer.simulation.stats.lastSubstepCount).toBeGreaterThan(1);
      expect(viewer.simulation.stats.stepCount).toBe(viewer.simulation.stats.lastSubstepCount);

      const density = await readRgba16FloatTexture(
        viewer.densityTarget.texture,
        densityMapSize,
        densityMapSize
      );
      expect(density.every(Number.isFinite)).toBe(true);
      expect(getMaximumChannel(density, 0)).toBeGreaterThan(0);
      expect(getMaximumChannel(density, 3)).toBeGreaterThan(0);

      const sceneColor = await readRgba16FloatTexture(viewer.sceneColorTexture, width, height);
      expect(sceneColor.every(Number.isFinite)).toBe(true);
      expect(getMaximumRgb(sceneColor)).toBeGreaterThan(1);
    } finally {
      viewer?.onFinalize();
      canvas.remove();
    }
  }, 30_000);
});

function makeAnimationProps(
  device: AnimationProps['device'],
  width: number,
  height: number,
  time: number
): AnimationProps {
  return {
    device,
    tick: Math.floor((time / 1000) * 60),
    time,
    width,
    height,
    aspect: width / height
  } as AnimationProps;
}

async function readRgba16FloatTexture(
  texture: Texture,
  width: number,
  height: number
): Promise<Float32Array> {
  if (texture.format !== 'rgba16float') {
    throw new Error(`Expected rgba16float texture, received ${texture.format}.`);
  }
  const readOptions = {width, height};
  const layout = texture.computeMemoryLayout(readOptions);
  const readback = texture.device.createBuffer({
    id: `${texture.id}-example-test-readback`,
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer(readOptions, readback);
    texture.device.submit();
    const bytes = await readback.readAsync(0, layout.byteLength);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const values = new Float32Array(width * height * 4);
    for (let yCoordinate = 0; yCoordinate < height; yCoordinate++) {
      for (let xCoordinate = 0; xCoordinate < width; xCoordinate++) {
        const valueOffset = (xCoordinate + width * yCoordinate) * 4;
        const byteOffset = yCoordinate * layout.bytesPerRow + xCoordinate * layout.bytesPerPixel;
        for (let channel = 0; channel < 4; channel++) {
          values[valueOffset + channel] = fromHalfFloat(
            view.getUint16(byteOffset + channel * Uint16Array.BYTES_PER_ELEMENT, true)
          );
        }
      }
    }
    return values;
  } finally {
    readback.destroy();
  }
}

function getMaximumRgb(values: Float32Array): number {
  let maximum = 0;
  for (let valueOffset = 0; valueOffset < values.length; valueOffset += 4) {
    maximum = Math.max(
      maximum,
      values[valueOffset],
      values[valueOffset + 1],
      values[valueOffset + 2]
    );
  }
  return maximum;
}

function getMaximumChannel(values: Float32Array, channel: number): number {
  let maximum = 0;
  for (let valueOffset = channel; valueOffset < values.length; valueOffset += 4) {
    maximum = Math.max(maximum, values[valueOffset]);
  }
  return maximum;
}
