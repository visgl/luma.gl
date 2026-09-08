// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {getGPUConvolutionBloomSupport, GPUConvolutionBloom} from '@luma.gl/experimental';
import {fromHalfFloat, toHalfFloat} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

it('GPUConvolutionBloom convolves RGB highlights with caller-supplied optical kernels', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 16;
  const height = 16;
  const support = getGPUConvolutionBloomSupport(device, {
    width,
    height,
    resolutionScale: 1,
    guardBand: 0
  });
  if (!support.supported) {
    void 0;
    void 0;
    return;
  }

  const centerX = 8;
  const centerY = 8;
  const sourceValues = new Uint16Array(width * height * 4);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    sourceValues[pixelIndex * 4 + 3] = toHalfFloat(1);
  }
  sourceValues.set(
    [toHalfFloat(8), toHalfFloat(4), toHalfFloat(2), toHalfFloat(1)],
    (centerY * width + centerX) * 4
  );
  const sourceTexture = device.createTexture({
    id: 'fft-bloom-source',
    width,
    height,
    format: 'rgba16float',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    data: sourceValues
  });
  const outputTexture = device.createTexture({
    id: 'fft-bloom-output',
    width,
    height,
    format: 'rgba16float',
    usage: Texture.SAMPLE | Texture.STORAGE | Texture.COPY_SRC
  });
  const identityKernel = new Float32Array(width * height);
  identityKernel[0] = 1;
  const renderer = new GPUConvolutionBloom(device, {
    id: 'fft-bloom-optical-regression',
    width,
    height,
    resolutionScale: 1,
    guardBand: 0,
    threshold: 0.5,
    pointSpreadFunction: identityKernel
  });

  try {
    const identityEncoder = device.createCommandEncoder({id: 'fft-bloom-identity-encoder'});
    expect(
      renderer.encode(identityEncoder, {sourceTexture, outputTexture}),
      'encoding returns the caller-owned HDR destination'
    ).toBe(outputTexture);
    device.submit(identityEncoder.finish());
    const identityPixels = await readHDRPixels(outputTexture, width, height);
    const readPixel = (pixels: number[], pixelX: number, pixelY: number, channel = 0): number =>
      pixels[(pixelY * width + pixelX) * 4 + channel];

    expect(
      Boolean(readPixel(identityPixels, centerX, centerY) > 14),
      'an identity optical kernel preserves and composites the red HDR highlight'
    ).toBe(true);
    expect(
      Boolean(readPixel(identityPixels, centerX, centerY, 1) > 7),
      'the green channel is transformed independently'
    ).toBe(true);
    expect(
      Boolean(readPixel(identityPixels, centerX + 1, centerY) < 0.02),
      'the identity kernel does not invent neighboring diffraction'
    ).toBe(true);

    const diffractionKernel = new Float32Array(width * height);
    diffractionKernel[0] = 0.5;
    diffractionKernel[1] = 0.25;
    diffractionKernel[width - 1] = 0.25;
    renderer.setPointSpreadFunction(diffractionKernel);
    const diffractionEncoder = device.createCommandEncoder({id: 'fft-bloom-diffraction-encoder'});
    renderer.encode(diffractionEncoder, {sourceTexture, outputTexture});
    device.submit(diffractionEncoder.finish());
    const diffractionPixels = await readHDRPixels(outputTexture, width, height);

    expect(
      Boolean(readPixel(diffractionPixels, centerX - 1, centerY) > 1),
      'a changed point-spread function redistributes energy left of the highlight'
    ).toBe(true);
    expect(
      Boolean(readPixel(diffractionPixels, centerX + 1, centerY) > 1),
      'a changed point-spread function redistributes energy right of the highlight'
    ).toBe(true);
    expect(
      Boolean(
        readPixel(diffractionPixels, centerX, centerY) < readPixel(identityPixels, centerX, centerY)
      ),
      'normalized diffraction reduces the central peak instead of duplicating energy'
    ).toBe(true);

    const redKernel = new Float32Array(width * height);
    const greenKernel = new Float32Array(width * height);
    const blueKernel = new Float32Array(width * height);
    redKernel[1] = 1;
    greenKernel[0] = 1;
    blueKernel[width - 1] = 1;
    renderer.setPointSpreadFunction({red: redKernel, green: greenKernel, blue: blueKernel});
    const spectralEncoder = device.createCommandEncoder({id: 'fft-bloom-spectral-encoder'});
    renderer.encode(spectralEncoder, {sourceTexture, outputTexture});
    device.submit(spectralEncoder.finish());
    const spectralPixels = await readHDRPixels(outputTexture, width, height);

    expect(
      Boolean(readPixel(spectralPixels, centerX + 1, centerY, 0) > 5),
      'the measured red point-spread function shifts red diffraction right'
    ).toBe(true);
    expect(
      Boolean(readPixel(spectralPixels, centerX - 1, centerY, 2) > 1),
      'the independent blue point-spread function shifts blue diffraction left'
    ).toBe(true);
  } finally {
    renderer.destroy();
    renderer.destroy();
    sourceTexture.destroy();
    outputTexture.destroy();
  }
  void 0;
});

it('GPUConvolutionBloom zero-padded guard bands prevent opposite-edge diffraction', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 16;
  const height = 16;
  const support = getGPUConvolutionBloomSupport(device, {
    width,
    height,
    resolutionScale: 1,
    guardBand: 0.25
  });
  if (!support.supported || !support.stats) {
    void 0;
    void 0;
    return;
  }

  const sourceValues = new Uint16Array(width * height * 4);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    sourceValues[pixelIndex * 4 + 3] = toHalfFloat(1);
  }
  sourceValues.set([toHalfFloat(8), toHalfFloat(8), toHalfFloat(8), toHalfFloat(1)], 8 * width * 4);
  const sourceTexture = device.createTexture({
    width,
    height,
    format: 'rgba16float',
    data: sourceValues,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const outputTexture = device.createTexture({
    width,
    height,
    format: 'rgba16float',
    usage: Texture.SAMPLE | Texture.STORAGE | Texture.COPY_SRC
  });
  const kernel = new Float32Array(support.stats.elementCount);
  kernel[0] = 0.5;
  kernel[support.stats.transformWidth - 1] = 0.5;
  const renderer = new GPUConvolutionBloom(device, {
    width,
    height,
    resolutionScale: 1,
    guardBand: 0.25,
    pointSpreadFunction: kernel
  });

  try {
    const encoder = device.createCommandEncoder();
    renderer.encode(encoder, {sourceTexture, outputTexture});
    device.submit(encoder.finish());
    const pixels = await readHDRPixels(outputTexture, width, height);
    expect(
      Boolean(pixels[(8 * width + width - 1) * 4] < 0.02),
      'left-edge light cannot wrap right'
    ).toBe(true);
    expect(Boolean(pixels[8 * width * 4] > 8), 'the original edge highlight remains visible').toBe(
      true
    );
  } finally {
    renderer.destroy();
    sourceTexture.destroy();
    outputTexture.destroy();
  }
  void 0;
});

async function readHDRPixels(texture: Texture, width: number, height: number): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width, height});
  const readback = texture.device.createBuffer({
    id: 'fft-bloom-readback',
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });

  try {
    texture.readBuffer({width, height}, readback);
    texture.device.submit();
    const bytes = await readback.readAsync(0, layout.byteLength);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const pixels: number[] = [];
    for (let pixelY = 0; pixelY < height; pixelY++) {
      for (let pixelX = 0; pixelX < width; pixelX++) {
        const offset = pixelY * layout.bytesPerRow + pixelX * layout.bytesPerPixel;
        for (let channel = 0; channel < 4; channel++) {
          pixels.push(fromHalfFloat(view.getUint16(offset + channel * 2, true)));
        }
      }
    }
    return pixels;
  } finally {
    readback.destroy();
  }
}
