// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {bloom, bloomShaderPassPipeline, createBloomShaderPassPipeline} from '@luma.gl/effects';
import {fromHalfFloat, getShaderModuleUniforms, toHalfFloat} from '@luma.gl/shadertools';
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
  const downsampleSteps = bloomShaderPassPipeline.steps.filter(
    step => step.shaderPass.name === 'bloomDownsample'
  );

  t.equal(extractionSteps.length, 1, 'pipeline thresholds HDR radiance once');
  t.equal(
    extractionSteps[0]?.inputs.sourceTexture,
    'previous',
    'bloom extraction consumes the preceding effect output'
  );
  t.equal(downsampleSteps.length, 2, 'pipeline low-passes the remaining bloom scales');
  t.deepEqual(
    downsampleSteps.map(step => step.inputs.sourceTexture),
    ['extractHalf', 'extractQuarter'],
    'quarter and eighth levels form a successive low-pass pyramid'
  );
  const extractionPass = extractionSteps[0]?.shaderPass;
  const downsamplePass = downsampleSteps[0]?.shaderPass;
  t.match(
    extractionPass?.source || '',
    /textureLoad\(sourceTexture/,
    'WGSL extraction explicitly covers source texels'
  );
  t.match(
    extractionPass?.fs || '',
    /texelFetch\(sourceTexture/,
    'GLSL extraction explicitly covers source texels'
  );
  t.match(
    downsamplePass?.source || '',
    /abs\(dpdx\(texCoord\)\) \+ abs\(dpdy\(texCoord\)\)/,
    'WGSL downsampling derives its tent footprint from the actual target size'
  );
  t.match(
    downsamplePass?.fs || '',
    /abs\(dFdx\(texCoord\)\) \+ abs\(dFdy\(texCoord\)\)/,
    'GLSL downsampling derives the same scale-aware tent footprint'
  );
  t.match(
    extractionPass?.source || '',
    /return color \/ max\(totalWeight, 0\.00001\)/,
    'WGSL extraction normalizes its dynamic footprint'
  );
  t.match(
    extractionPass?.fs || '',
    /return color \/ max\(totalWeight, 0\.00001\)/,
    'GLSL extraction normalizes its dynamic footprint'
  );
  for (const target of Object.values(bloomShaderPassPipeline.renderTargets)) {
    t.equal(target.sampler.minFilter, 'linear', 'bloom intermediates use linear minification');
    t.equal(target.sampler.magFilter, 'linear', 'bloom intermediates use linear magnification');
  }
  const configurablePipeline = createBloomShaderPassPipeline({
    resolutionScale: 0.5,
    colorFormat: 'rgba8unorm'
  });
  const configurableTargets = configurablePipeline.renderTargets;
  t.ok(configurableTargets, 'configurable bloom declares intermediate targets');
  if (configurableTargets) {
    t.deepEqual(
      configurableTargets.extractHalf.scale,
      [0.25, 0.25],
      'configurable bloom scales its pyramid'
    );
    for (const target of Object.values(configurableTargets)) {
      t.equal(target.format, 'rgba8unorm', 'configurable bloom applies the requested format');
      t.equal(
        target.sampler?.minFilter,
        'linear',
        'configurable bloom preserves linear minification'
      );
      t.equal(
        target.sampler?.magFilter,
        'linear',
        'configurable bloom preserves linear magnification'
      );
    }
  }
  const blurPass = bloomShaderPassPipeline.steps.find(
    step => step.shaderPass.name === 'bloomBlur'
  )?.shaderPass;
  t.ok(blurPass, 'multiscale bloom includes a separable blur');
  t.match(blurPass?.source || '', /return color \/ totalWeight/, 'blur preserves smooth falloff');
  t.notOk(
    /unpremultipliedRgb/.test(blurPass?.source || ''),
    'blur does not amplify tiny alpha into square halos'
  );

  const compositePass = bloomShaderPassPipeline.steps.find(
    step => step.shaderPass.name === 'bloomComposite'
  )?.shaderPass;
  t.ok(compositePass, 'multiscale bloom includes a glow composite');
  t.match(
    compositePass?.source || '',
    /textureSample\(glowHalf, glowHalfSampler, texCoord\)/,
    'WGSL composites glow in the same orientation as the scene'
  );
  t.match(
    compositePass?.fs || '',
    /texture\(glowHalf, texCoord\)/,
    'GLSL composites glow in the same orientation as the scene'
  );
  t.notOk(
    /shaderPassRenderer_getRenderTargetUV/.test(compositePass?.fs || ''),
    'GLSL does not vertically mirror named bloom targets'
  );
  t.end();
});

test('HDR bloom covers source texels at quarter pyramid resolution', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU unavailable, skipping reduced-resolution bloom regression');
    testCase.end();
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  if (!capabilities.render || !capabilities.filter) {
    testCase.comment('Renderable, filterable rgba16float textures are unavailable');
    testCase.end();
    return;
  }

  const width = 64;
  const height = 64;
  const highlightX = 8;
  const highlightY = 32;
  const sourceRadiance = 16;
  const sourcePixels = new Uint16Array(width * height * 4);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    sourcePixels[pixelIndex * 4 + 3] = toHalfFloat(1);
  }
  sourcePixels.set(
    [
      toHalfFloat(sourceRadiance),
      toHalfFloat(sourceRadiance),
      toHalfFloat(sourceRadiance),
      toHalfFloat(1)
    ],
    (highlightY * width + highlightX) * 4
  );

  const sourceTexture = device.createTexture({
    id: 'reduced-resolution-bloom-source',
    data: sourcePixels,
    format: 'rgba16float',
    width,
    height,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [createBloomShaderPassPipeline({resolutionScale: 0.25})],
    colorFormat: 'rgba16float',
    flipY: false
  });
  renderer.resize([width, height]);

  try {
    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      uniforms: {
        bloomExtract: {threshold: 0.5},
        bloomBlur: {radius: 0},
        bloomComposite: {intensity: 8}
      }
    });
    device.submit();

    testCase.ok(outputTexture, 'reduced-resolution bloom renders');
    if (outputTexture) {
      const memoryLayout = outputTexture.computeMemoryLayout({width, height});
      const readbackBuffer = device.createBuffer({
        id: 'reduced-resolution-bloom-readback',
        byteLength: memoryLayout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        outputTexture.readBuffer({width, height}, readbackBuffer);
        const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
        const pixelView = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength);
        const readRed = (pixelX: number, pixelY: number): number =>
          fromHalfFloat(pixelView.getUint16(pixelY * memoryLayout.bytesPerRow + pixelX * 8, true));

        testCase.ok(
          readRed(highlightX, highlightY) > sourceRadiance,
          'a highlight in a former fixed-kernel sampling gap contributes bloom'
        );
        testCase.ok(
          readRed(highlightX + 2, highlightY) > 0,
          'the captured highlight contributes glow to neighboring source pixels'
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

test('HDR bloom preserves radiance with symmetric, energy-bounded falloff', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU unavailable, skipping HDR bloom image regression');
    testCase.end();
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  if (!capabilities.render || !capabilities.filter) {
    testCase.comment('Renderable, filterable rgba16float textures are unavailable');
    testCase.end();
    return;
  }

  const width = 64;
  const height = 64;
  const sourcePixels = new Uint16Array(width * height * 4);
  const sourceRadiance = 16;
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    sourcePixels[pixelIndex * 4 + 3] = toHalfFloat(1);
  }
  for (let pixelY = 31; pixelY <= 32; pixelY++) {
    for (let pixelX = 31; pixelX <= 32; pixelX++) {
      const pixelOffset = (pixelY * width + pixelX) * 4;
      sourcePixels.set(
        [
          toHalfFloat(sourceRadiance),
          toHalfFloat(sourceRadiance),
          toHalfFloat(sourceRadiance),
          toHalfFloat(1)
        ],
        pixelOffset
      );
    }
  }

  const sourceTexture = device.createTexture({
    id: 'hdr-bloom-ringing-source',
    data: sourcePixels,
    format: 'rgba16float',
    width,
    height,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [createBloomShaderPassPipeline()],
    colorFormat: 'rgba16float',
    flipY: false
  });
  renderer.resize([width, height]);

  try {
    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      uniforms: {
        bloomExtract: {threshold: 0.5},
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
        const pixelView = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength);
        const readRed = (pixelX: number, pixelY: number): number =>
          fromHalfFloat(pixelView.getUint16(pixelY * memoryLayout.bytesPerRow + pixelX * 8, true));
        const average = (values: number[]): number =>
          values.reduce((sum, value) => sum + value, 0) / values.length;
        const readHorizontalPair = (distance: number): [number, number] => [
          average([readRed(31 - distance, 31), readRed(31 - distance, 32)]),
          average([readRed(32 + distance, 31), readRed(32 + distance, 32)])
        ];
        const readVerticalPair = (distance: number): [number, number] => [
          average([readRed(31, 31 - distance), readRed(32, 31 - distance)]),
          average([readRed(31, 32 + distance), readRed(32, 32 + distance)])
        ];
        const [leftGlow, rightGlow] = readHorizontalPair(8);
        const [topGlow, bottomGlow] = readVerticalPair(8);
        const nearGlow = average([...readHorizontalPair(4), ...readVerticalPair(4)]);
        const middleGlow = average([leftGlow, rightGlow, topGlow, bottomGlow]);
        const distantGlow = average([...readHorizontalPair(14), ...readVerticalPair(14)]);
        const diagonalGlow = average([
          readRed(23, 23),
          readRed(40, 23),
          readRed(23, 40),
          readRed(40, 40)
        ]);
        const centerRadiance = average([
          readRed(31, 31),
          readRed(32, 31),
          readRed(31, 32),
          readRed(32, 32)
        ]);
        const symmetryTolerance = Math.max(middleGlow * 0.06, 0.015);

        testCase.ok(
          centerRadiance > sourceRadiance,
          'bloom composites onto a true HDR source without clipping it to display range'
        );
        testCase.ok(nearGlow > middleGlow, 'glow falls off outside the source highlight');
        testCase.ok(middleGlow > distantGlow, 'glow continues falling off at wider radii');
        testCase.ok(
          Math.abs(leftGlow - rightGlow) <= symmetryTolerance,
          'horizontal bloom is symmetric around the highlight'
        );
        testCase.ok(
          Math.abs(topGlow - bottomGlow) <= symmetryTolerance,
          'vertical bloom is symmetric around the highlight'
        );
        testCase.ok(
          Math.abs(average([leftGlow, rightGlow]) - average([topGlow, bottomGlow])) <=
            symmetryTolerance,
          'horizontal and vertical falloff have matching energy'
        );
        testCase.ok(
          diagonalGlow < middleGlow,
          'diagonal support decays instead of forming a square plateau'
        );

        let addedBloomEnergy = 0;
        for (let pixelY = 0; pixelY < height; pixelY++) {
          for (let pixelX = 0; pixelX < width; pixelX++) {
            const sourceRed =
              pixelX >= 31 && pixelX <= 32 && pixelY >= 31 && pixelY <= 32 ? sourceRadiance : 0;
            addedBloomEnergy += Math.max(readRed(pixelX, pixelY) - sourceRed, 0);
          }
        }
        const sourceEnergy = sourceRadiance * 4;
        testCase.ok(
          addedBloomEnergy > sourceEnergy * 0.4,
          'normalized downsampling retains useful HDR highlight energy'
        );
        testCase.ok(
          addedBloomEnergy < sourceEnergy * 1.6,
          'the multiscale pyramid does not duplicate unbounded highlight energy'
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
