// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {bloom, bloomShaderPassPipeline, createBloomShaderPassPipeline} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('bloom#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(bloom, {}, {});

  t.ok(uniforms, 'bloom module build is ok');
  t.equal(uniforms.radius, 4, 'bloom radius uniform is ok');
  t.equal(uniforms.threshold, 0.8, 'bloom threshold uniform is ok');
  t.equal(uniforms.intensity, 1, 'bloom intensity uniform is ok');
  t.end();
});

test('bloomShaderPassPipeline#routing', t => {
  const extractionSteps = bloomShaderPassPipeline.steps.filter(
    step => step.shaderPass.name === 'bloomExtract'
  );

  t.equal(extractionSteps.length, 3, 'pipeline extracts three bloom scales');
  for (const extractionStep of extractionSteps) {
    t.equal(
      extractionStep.inputs.sourceTexture,
      'previous',
      'bloom extraction consumes the preceding effect output'
    );
  }
  t.end();
});

test('HDR bloom attenuates isolated highlights without square ringing', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU unavailable, skipping HDR bloom image regression');
    testCase.end();
    return;
  }

  const width = 64;
  const height = 64;
  const sourcePixels = new Uint8Array(width * height * 4);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    sourcePixels[pixelIndex * 4 + 3] = 255;
  }
  for (let pixelY = 30; pixelY <= 34; pixelY++) {
    for (let pixelX = 30; pixelX <= 34; pixelX++) {
      sourcePixels.set([255, 255, 255, 255], (pixelY * width + pixelX) * 4);
    }
  }

  const sourceTexture = device.createTexture({
    id: 'hdr-bloom-ringing-source',
    data: sourcePixels,
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [createBloomShaderPassPipeline()],
    colorFormat: 'rgba8unorm',
    flipY: false
  });
  renderer.resize([width, height]);

  try {
    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      uniforms: {
        bloomExtract: {threshold: 0.3},
        bloomBlur: {radius: 8},
        bloomComposite: {intensity: 1}
      }
    });
    device.submit();

    testCase.ok(outputTexture, 'isolated HDR bloom highlight renders');
    if (outputTexture) {
      const memoryLayout = outputTexture.computeMemoryLayout({width, height});
      const readbackBuffer = device.createBuffer({
        id: 'hdr-bloom-ringing-readback',
        byteLength: memoryLayout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        outputTexture.readBuffer({width, height}, readbackBuffer);
        const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
        const centerRowOffset = Math.floor(height / 2) * memoryLayout.bytesPerRow;
        const nearGlow = pixels[centerRowOffset + 37 * 4]!;
        const distantGlow = pixels[centerRowOffset + 47 * 4]!;
        const cornerGlow = pixels[40 * memoryLayout.bytesPerRow + 40 * 4]!;

        testCase.ok(nearGlow > distantGlow, 'glow fades away from the isolated highlight');
        testCase.ok(
          distantGlow < Math.max(nearGlow * 0.65, 4),
          'distant bloom does not recover full-strength color through alpha division'
        );
        testCase.ok(
          cornerGlow < nearGlow,
          'diagonal support remains smooth instead of forming a square plateau'
        );
      } finally {
        readbackBuffer.destroy();
      }
    }
  } finally {
    renderer.destroy();
    sourceTexture.destroy();
  }

  testCase.end();
});
