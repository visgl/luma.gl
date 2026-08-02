// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {Buffer, type Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {fromHalfFloat} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import SpectralCausticsAnimationLoopTemplate, {
  type SpectralCausticsExampleProps
} from '../../examples/experimental/spectral-caustics/app';

describe('Spectral Caustics: Prism Cathedral', () => {
  test('traces finite HDR caustics and renders them into the floating-point beauty target', async () => {
    const device = await getWebGPUTestDevice('max');
    if (!device) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'example-panel-host';
    document.body.append(host);
    let viewer: SpectralCausticsAnimationLoopTemplate | null = null;
    const width = 96;
    const height = 72;
    const mapSize = 64;
    try {
      viewer = new SpectralCausticsAnimationLoopTemplate({
        device,
        width,
        height,
        captureSize: 32,
        mapSize
      } as SpectralCausticsExampleProps);

      expect(viewer.sceneColorTexture.format).toBe('rgba16float');
      expect(viewer.spectralCausticMap.format).toBe('rgba16float');

      // This assertion targets the two offscreen HDR outputs. The shared test canvas can outlive
      // Dawn's external presentation instance as the complete SwiftShader suite advances through
      // independent files, so do not present the already-verified beauty target in this test.
      const presentationSpy = vi
        .spyOn(viewer.postprocessingRenderer, 'renderToScreen')
        .mockImplementation(() => {});
      try {
        viewer.onRender(makeAnimationProps(device, width, height));
      } finally {
        presentationSpy.mockRestore();
      }
      device.submit();

      const causticXyz = await readRgba16FloatTexture(viewer.spectralCausticMap, mapSize, mapSize);
      expect(causticXyz.every(Number.isFinite)).toBe(true);
      expect(getMaximumRgb(causticXyz)).toBeGreaterThan(1);

      const sceneColor = await readRgba16FloatTexture(viewer.sceneColorTexture, width, height);
      expect(sceneColor.every(Number.isFinite)).toBe(true);
      expect(getMaximumRgb(sceneColor)).toBeGreaterThan(1);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);
});

function makeAnimationProps(
  device: AnimationProps['device'],
  width: number,
  height: number
): AnimationProps {
  return {
    device,
    tick: 1000,
    time: 1000,
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
