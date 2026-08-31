// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {bloom, bloomShaderPassPipeline, createBloomShaderPassPipeline} from '@luma.gl/effects';
import {fromHalfFloat, getShaderModuleUniforms, toHalfFloat} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('bloom#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(bloom, {}, {});

  expect(Boolean(uniforms), 'bloom module build is ok').toBe(true);
  expect(uniforms.radius, 'bloom radius uniform is ok').toBe(4);
  expect(uniforms.threshold, 'bloom threshold uniform is ok').toBe(0.8);
  expect(uniforms.intensity, 'bloom intensity uniform is ok').toBe(1);
});

it('bloomShaderPassPipeline#routing', () => {
  const extractionSteps = bloomShaderPassPipeline.steps.filter(
    step => step.shaderPass.name === 'bloomExtract'
  );
  const downsampleSteps = bloomShaderPassPipeline.steps.filter(
    step => step.shaderPass.name === 'bloomDownsample'
  );

  expect(extractionSteps.length, 'pipeline thresholds HDR radiance once').toBe(1);
  expect(
    extractionSteps[0]?.inputs.sourceTexture,
    'bloom extraction consumes the preceding effect output'
  ).toBe('previous');
  expect(downsampleSteps.length, 'pipeline low-passes the remaining bloom scales').toBe(2);
  expect(
    downsampleSteps.map(step => step.inputs.sourceTexture),
    'quarter and eighth levels form a successive low-pass pyramid'
  ).toEqual(['extractHalf', 'extractQuarter']);
  const extractionPass = extractionSteps[0]?.shaderPass;
  const downsamplePass = downsampleSteps[0]?.shaderPass;
  expect(extractionPass?.source || '', 'WGSL extraction explicitly covers source texels').toMatch(
    /textureLoad\(sourceTexture/
  );
  expect(extractionPass?.fs || '', 'GLSL extraction explicitly covers source texels').toMatch(
    /texelFetch\(sourceTexture/
  );
  expect(
    downsamplePass?.source || '',
    'WGSL downsampling derives its tent footprint from the actual target size'
  ).toMatch(/abs\(dpdx\(texCoord\)\) \+ abs\(dpdy\(texCoord\)\)/);
  expect(
    downsamplePass?.fs || '',
    'GLSL downsampling derives the same scale-aware tent footprint'
  ).toMatch(/abs\(dFdx\(texCoord\)\) \+ abs\(dFdy\(texCoord\)\)/);
  expect(extractionPass?.source || '', 'WGSL extraction normalizes its dynamic footprint').toMatch(
    /return color \/ max\(totalWeight, 0\.00001\)/
  );
  expect(extractionPass?.fs || '', 'GLSL extraction normalizes its dynamic footprint').toMatch(
    /return color \/ max\(totalWeight, 0\.00001\)/
  );
  for (const target of Object.values(bloomShaderPassPipeline.renderTargets)) {
    expect(target.sampler.minFilter, 'bloom intermediates use linear minification').toBe('linear');
    expect(target.sampler.magFilter, 'bloom intermediates use linear magnification').toBe('linear');
  }
  const configurablePipeline = createBloomShaderPassPipeline({
    resolutionScale: 0.5,
    colorFormat: 'rgba8unorm',
    threshold: 0.55,
    radius: 12,
    intensity: 1.75
  });
  const configurableTargets = configurablePipeline.renderTargets;
  expect(Boolean(configurableTargets), 'configurable bloom declares intermediate targets').toBe(
    true
  );
  if (configurableTargets) {
    expect(configurableTargets.extractHalf.scale, 'configurable bloom scales its pyramid').toEqual([
      0.25, 0.25
    ]);
    for (const target of Object.values(configurableTargets)) {
      expect(target.format, 'configurable bloom applies the requested format').toBe('rgba8unorm');
      expect(target.sampler?.minFilter, 'configurable bloom preserves linear minification').toBe(
        'linear'
      );
      expect(target.sampler?.magFilter, 'configurable bloom preserves linear magnification').toBe(
        'linear'
      );
    }
  }
  expect(
    configurablePipeline.steps.find(step => step.shaderPass.name === 'bloomExtract')?.uniforms?.[
      'threshold'
    ],
    'configurable bloom applies the requested threshold'
  ).toBe(0.55);
  expect(
    configurablePipeline.steps.find(step => step.shaderPass.name === 'bloomBlur')?.uniforms?.[
      'radius'
    ],
    'configurable bloom applies the requested blur radius'
  ).toBe(12);
  expect(
    configurablePipeline.steps.find(step => step.shaderPass.name === 'bloomComposite')?.uniforms?.[
      'intensity'
    ],
    'configurable bloom applies the requested intensity'
  ).toBe(1.75);
  const blurPass = bloomShaderPassPipeline.steps.find(
    step => step.shaderPass.name === 'bloomBlur'
  )?.shaderPass;
  expect(Boolean(blurPass), 'multiscale bloom includes a separable blur').toBe(true);
  expect(blurPass?.source || '', 'blur preserves smooth falloff').toMatch(
    /return color \/ totalWeight/
  );
  expect(
    Boolean(/unpremultipliedRgb/.test(blurPass?.source || '')),
    'blur does not amplify tiny alpha into square halos'
  ).toBe(false);

  const compositePass = bloomShaderPassPipeline.steps.find(
    step => step.shaderPass.name === 'bloomComposite'
  )?.shaderPass;
  expect(Boolean(compositePass), 'multiscale bloom includes a glow composite').toBe(true);
  expect(
    compositePass?.source || '',
    'WGSL composites glow in the same orientation as the scene'
  ).toMatch(/textureSample\(glowHalf, glowHalfSampler, texCoord\)/);
  expect(
    compositePass?.fs || '',
    'GLSL composites glow in the same orientation as the scene'
  ).toMatch(/texture\(glowHalf, texCoord\)/);
  expect(
    Boolean(/shaderPassRenderer_getRenderTargetUV/.test(compositePass?.fs || '')),
    'GLSL does not vertically mirror named bloom targets'
  ).toBe(false);
});

it('createBloomShaderPassPipeline#adaptive pyramid reconstruction', () => {
  const qualityLevels = [
    {quality: 'low', levelCount: 2, coarsestLevel: 'Quarter'},
    {quality: 'medium', levelCount: 3, coarsestLevel: 'Eighth'},
    {quality: 'high', levelCount: 4, coarsestLevel: 'Sixteenth'},
    {quality: 'ultra', levelCount: 5, coarsestLevel: 'ThirtySecond'}
  ] as const;

  for (const {quality, levelCount, coarsestLevel} of qualityLevels) {
    const pipeline = createBloomShaderPassPipeline({quality});
    const extractionSteps = pipeline.steps.filter(step => step.shaderPass.name === 'bloomExtract');
    const downsampleSteps = pipeline.steps.filter(
      step => step.shaderPass.name === 'bloomDownsample'
    );
    const blurSteps = pipeline.steps.filter(step => step.shaderPass.name === 'bloomBlur');
    const upsampleSteps = pipeline.steps.filter(step => step.shaderPass.name === 'bloomUpsample');
    const compositeStep = pipeline.steps.find(step => step.shaderPass.name === 'bloomComposite');

    expect(extractionSteps.length, `${quality} quality thresholds highlights once`).toBe(1);
    expect(
      downsampleSteps.length,
      `${quality} quality builds ${levelCount} successive pyramid levels`
    ).toBe(levelCount - 1);
    expect(blurSteps.length, `${quality} quality uses separable blur at every pyramid level`).toBe(
      levelCount * 2
    );
    expect(
      upsampleSteps.length,
      `${quality} quality progressively reconstructs the complete pyramid`
    ).toBe(levelCount - 1);
    expect(
      Object.keys(pipeline.renderTargets || {}).length,
      `${quality} quality allocates only its required pyramid and reconstruction targets`
    ).toBe(levelCount * 4 - 1);
    expect(
      upsampleSteps[0]?.inputs?.sourceTexture,
      `${quality} reconstruction starts at its coarsest blurred level`
    ).toBe(`blur${coarsestLevel}`);
    expect(
      upsampleSteps[upsampleSteps.length - 1]?.output,
      `${quality} reconstruction finishes at half resolution`
    ).toBe('upsampleHalf');
    expect(
      compositeStep?.inputs?.glowTexture,
      `${quality} composition consumes one normalized reconstructed glow texture`
    ).toBe('upsampleHalf');
  }

  const pipeline = createBloomShaderPassPipeline({
    quality: 'ultra',
    radius: 10,
    scatter: 0.7,
    softKnee: 0.35,
    fireflyReduction: 0.4,
    anamorphicRatio: 0.5,
    tint: [0.8, 1, 0.65]
  });
  const extractionStep = pipeline.steps.find(step => step.shaderPass.name === 'bloomExtract');
  const blurSteps = pipeline.steps.filter(step => step.shaderPass.name === 'bloomBlur');
  const upsampleSteps = pipeline.steps.filter(step => step.shaderPass.name === 'bloomUpsample');
  const compositeStep = pipeline.steps.find(step => step.shaderPass.name === 'bloomComposite');

  expect(extractionStep?.uniforms?.softKnee, 'configures the soft highlight knee').toBe(0.35);
  expect(
    extractionStep?.uniforms?.fireflyReduction,
    'configures luminance-weighted firefly suppression'
  ).toBe(0.4);
  expect(blurSteps[0]?.uniforms?.radius, 'positive anamorphism widens horizontal blur').toBe(15);
  expect(blurSteps[1]?.uniforms?.radius, 'positive anamorphism preserves vertical blur').toBe(10);
  expect(
    Boolean(upsampleSteps.every(step => step.uniforms?.scatter === 0.7)),
    'applies the same normalized scatter to every reconstruction level'
  ).toBe(true);
  expect(compositeStep?.uniforms?.tint, 'applies the requested tint').toEqual([0.8, 1, 0.65]);
  expect(
    pipeline.renderTargets?.extractThirtySecond.scale,
    'ultra quality reaches the thirty-second-resolution pyramid level'
  ).toEqual([0.03125, 0.03125]);

  const upsamplePass = upsampleSteps[0]?.shaderPass;
  expect(
    upsamplePass?.source || '',
    'WGSL reconstruction normalizes its nine-tap tent filter'
  ).toMatch(/\(center \+ edges \+ corners\) \/ 16\.0/);
  expect(
    upsamplePass?.fs || '',
    'GLSL reconstruction uses the matching normalized tent filter'
  ).toMatch(/\(center \+ edges \+ corners\) \/ 16\.0/);
  expect(
    upsamplePass?.source || '',
    'WGSL mixes pyramid levels without duplicating highlight energy'
  ).toMatch(/mix\(higherGlow, lowerGlow, clamp\(bloomUpsample\.scatter, 0\.0, 1\.0\)\)/);
  expect(
    upsamplePass?.fs || '',
    'GLSL mixes pyramid levels without duplicating highlight energy'
  ).toMatch(/mix\(higherGlow, lowerGlow, clamp\(bloomUpsample\.scatter, 0\.0, 1\.0\)\)/);

  const verticalPipeline = createBloomShaderPassPipeline({radius: 10, anamorphicRatio: -0.5});
  const verticalBlurSteps = verticalPipeline.steps.filter(
    step => step.shaderPass.name === 'bloomBlur'
  );
  expect(verticalBlurSteps[0]?.uniforms?.radius, 'negative anamorphism preserves width').toBe(10);
  expect(verticalBlurSteps[1]?.uniforms?.radius, 'negative anamorphism widens height').toBe(15);
});

it('createBloomShaderPassPipeline#anamorphic radii stay within the shader kernel', () => {
  const anamorphicCases = [
    {radius: 12, anamorphicRatio: 1, horizontalRadius: 24, verticalRadius: 12},
    {radius: 18, anamorphicRatio: 0.5, horizontalRadius: 24, verticalRadius: 16},
    {radius: 18, anamorphicRatio: -0.5, horizontalRadius: 16, verticalRadius: 24},
    {radius: 24, anamorphicRatio: 1, horizontalRadius: 24, verticalRadius: 12},
    {radius: 24, anamorphicRatio: -1, horizontalRadius: 12, verticalRadius: 24},
    {radius: 24, anamorphicRatio: 0, horizontalRadius: 24, verticalRadius: 24}
  ];

  for (const {radius, anamorphicRatio, horizontalRadius, verticalRadius} of anamorphicCases) {
    const pipeline = createBloomShaderPassPipeline({radius, anamorphicRatio});
    const blurSteps = pipeline.steps.filter(step => step.shaderPass.name === 'bloomBlur');

    expect(
      blurSteps.map(step => step.uniforms?.radius),
      `radius ${radius} preserves anamorphic ratio ${anamorphicRatio} within every shader kernel`
    ).toEqual(
      Array.from({length: blurSteps.length}, (_, stepIndex) =>
        stepIndex % 2 === 0 ? horizontalRadius : verticalRadius
      )
    );
  }
});

it('createBloomShaderPassPipeline#optional cinematic lens effects', () => {
  const defaultPipeline = createBloomShaderPassPipeline();
  const dirtOnlyPipeline = createBloomShaderPassPipeline({lens: {dirtIntensity: 0.8}});
  const cinematicPipeline = createBloomShaderPassPipeline({
    quality: 'high',
    temporalStability: 0.7,
    lens: {
      starburstIntensity: 1.1,
      starburstSpikes: 7,
      starburstLength: 64,
      starburstRotation: 0.35,
      ghostIntensity: 0.65,
      ghostCount: 12,
      ghostSpacing: 0.4,
      haloIntensity: 0.45,
      haloRadius: 0.28,
      chromaticAberration: 0.6,
      dirtIntensity: 0.35
    }
  });
  const lensStep = cinematicPipeline.steps.find(step => step.shaderPass.name === 'bloomLens');
  const temporalStep = cinematicPipeline.steps.find(
    step => step.shaderPass.name === 'bloomTemporal'
  );
  const compositeStep = cinematicPipeline.steps.find(
    step => step.shaderPass.name === 'bloomComposite'
  );
  const dirtOnlyComposite = dirtOnlyPipeline.steps.find(
    step => step.shaderPass.name === 'bloomComposite'
  );

  expect(defaultPipeline.steps.length, 'default high-quality bloom keeps its 16 passes').toBe(16);
  expect(
    dirtOnlyPipeline.steps.length,
    'lens dirt reuses the existing composite without adding a render pass'
  ).toBe(defaultPipeline.steps.length);
  expect(
    Object.keys(dirtOnlyPipeline.renderTargets || {}).length,
    'lens dirt does not allocate another intermediate texture'
  ).toBe(Object.keys(defaultPipeline.renderTargets || {}).length);
  expect(
    dirtOnlyComposite?.shaderPass.bindingLayout?.map(binding => binding.name),
    'dirt-only composition requires only the glow and external dirt mask'
  ).toEqual(['glowTexture', 'lensDirtTexture']);
  expect(
    cinematicPipeline.steps.length,
    'all lens artifacts share one half-resolution pass and stabilization adds one history pass'
  ).toBe(defaultPipeline.steps.length + 2);
  expect(
    cinematicPipeline.renderTargets?.['bloomLensArtifacts'].scale,
    'photographic artifacts render at half resolution'
  ).toEqual([0.5, 0.5]);
  expect(
    cinematicPipeline.renderTargets?.['bloomGlowHistory'].lifetime,
    'temporal stabilization owns persistent glow history'
  ).toBe('history');
  expect(
    cinematicPipeline.renderTargets?.['bloomGlowHistory'].initialize,
    'an invalid history marker prevents first-frame darkening'
  ).toEqual({clearColor: [0, 0, 0, 0]});
  expect(
    temporalStep?.inputs,
    'temporal stabilization clamps reconstructed glow against its previous frame'
  ).toEqual({sourceTexture: 'upsampleHalf', historyTexture: 'bloomGlowHistory'});
  expect(temporalStep?.uniforms?.stability, 'configures temporal history blending').toBe(0.7);
  expect(
    lensStep?.inputs,
    'lens artifacts combine sharp HDR highlights with stabilized glow'
  ).toEqual({sourceTexture: 'extractHalf', glowTexture: 'bloomGlowHistory'});
  expect(lensStep?.uniforms?.starburstSpikes, 'rounds diffraction rays to an even count').toBe(8);
  expect(lensStep?.uniforms?.ghostCount, 'caps ghost reflections at their shader budget').toBe(6);
  expect(lensStep?.uniforms?.chromaticAberration, 'configures spectral lens separation').toBe(0.6);
  expect(
    lensStep?.shaderPass.source || '',
    'WGSL lens reflections use explicit levels inside nonuniform screen-space branches'
  ).toMatch(/textureSampleLevel\(sourceTexture/);
  expect(
    lensStep?.shaderPass.fs || '',
    'GLSL lens reflections match the explicit sampling behavior'
  ).toMatch(/textureLod\(sourceTexture/);
  expect(
    compositeStep?.shaderPass.bindingLayout?.map(binding => binding.name),
    'composition binds dirt and lens artifacts only when they are enabled'
  ).toEqual(['glowTexture', 'lensTexture', 'lensDirtTexture']);
  expect(compositeStep?.uniforms?.dirtIntensity, 'configures the dirt-mask strength').toBe(0.35);

  const clampedPipeline = createBloomShaderPassPipeline({
    temporalStability: 4,
    lens: {starburstIntensity: 1, starburstSpikes: 1, starburstLength: 500}
  });
  const clampedLensStep = clampedPipeline.steps.find(step => step.shaderPass.name === 'bloomLens');
  expect(
    clampedPipeline.steps.find(step => step.shaderPass.name === 'bloomTemporal')?.uniforms
      ?.stability,
    'limits history contribution to preserve responsiveness'
  ).toBe(0.95);
  expect(clampedLensStep?.uniforms?.starburstSpikes, 'keeps at least two diffraction rays').toBe(2);
  expect(clampedLensStep?.uniforms?.starburstLength, 'limits the diffraction radius').toBe(256);
});

it('HDR bloom replaces fragment extraction with one exposure-aware WebGPU dispatch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  if (
    !capabilities.render ||
    !capabilities.filter ||
    !capabilities.store ||
    device.limits.maxStorageTexturesPerShaderStage < 3
  ) {
    return;
  }

  const width = 32;
  const height = 32;
  const highlightX = 16;
  const highlightY = 10;
  const sourcePixels = new Uint16Array(width * height * 4);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    sourcePixels[pixelIndex * 4 + 3] = toHalfFloat(1);
  }
  sourcePixels.set(
    [toHalfFloat(4), toHalfFloat(4), toHalfFloat(4), toHalfFloat(1)],
    (highlightY * width + highlightX) * 4
  );
  const sourceTexture = device.createTexture({
    id: 'fused-bloom-source',
    width,
    height,
    format: 'rgba16float',
    data: sourcePixels,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [
      createBloomShaderPassPipeline({
        quality: 'medium',
        threshold: 1,
        radius: 3,
        downsample: 'auto'
      })
    ],
    colorFormat: 'rgba16float',
    flipY: false
  });
  renderer.resize([width, height]);

  const renderWithExposure = async (
    exposure: number,
    selectedRenderer: ShaderPassRenderer = renderer
  ): Promise<{
    highlight: number;
    neighbor: number;
    reflectedNeighbor: number;
    renderPasses: number;
    computePasses: number;
  }> => {
    const encoder = device.createCommandEncoder({id: `fused-bloom-exposure-${exposure}`});
    let renderPasses = 0;
    let computePasses = 0;
    const beginRenderPass = encoder.beginRenderPass.bind(encoder);
    const beginComputePass = encoder.beginComputePass.bind(encoder);
    encoder.beginRenderPass = props => {
      renderPasses++;
      return beginRenderPass(props);
    };
    encoder.beginComputePass = props => {
      computePasses++;
      return beginComputePass(props);
    };
    const outputTexture = selectedRenderer.encodeToTexture(encoder, {
      sourceTexture,
      uniforms: {bloomExtract: {exposure}, bloomComposite: {intensity: 2}}
    });
    device.submit(encoder.finish());
    if (!outputTexture) {
      throw new Error('Fused bloom did not produce an output texture.');
    }

    const layout = outputTexture.computeMemoryLayout({width, height});
    const readback = device.createBuffer({
      id: `fused-bloom-readback-${exposure}`,
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      outputTexture.readBuffer({width, height}, readback);
      device.submit();
      const bytes = await readback.readAsync(0, layout.byteLength);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const readRed = (pixelX: number, pixelY = highlightY): number =>
        fromHalfFloat(view.getUint16(pixelY * layout.bytesPerRow + pixelX * 8, true));
      return {
        highlight: readRed(highlightX),
        neighbor: readRed(highlightX + 2),
        reflectedNeighbor: readRed(highlightX + 2, height - highlightY - 1),
        renderPasses,
        computePasses
      };
    } finally {
      readback.destroy();
    }
  };

  try {
    expect(
      Boolean(renderer.passRenderers[0].computeRenderer),
      'the supported backend selects fused compute'
    ).toBe(true);
    const lowExposure = await renderWithExposure(0.2);
    const highExposure = await renderWithExposure(2);

    expect(highExposure.computePasses, 'all pyramid levels share one compute dispatch').toBe(1);
    expect(
      highExposure.renderPasses,
      'medium quality uses nine effect render passes plus one source-seeding pass'
    ).toBe(10);
    expect(
      Boolean(highExposure.highlight > 4),
      'HDR extraction contributes glow above the source peak'
    ).toBe(true);
    expect(
      Boolean(highExposure.neighbor > lowExposure.neighbor),
      'runtime camera exposure changes the effective threshold without rebuilding the renderer'
    ).toBe(true);

    const flippedComputeRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createBloomShaderPassPipeline({
          quality: 'medium',
          threshold: 1,
          radius: 3,
          reconstruction: 'bicubic'
        })
      ],
      colorFormat: 'rgba16float',
      flipY: true
    });
    const flippedFragmentRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createBloomShaderPassPipeline({
          quality: 'medium',
          threshold: 1,
          radius: 3,
          downsample: 'render',
          reconstruction: 'bicubic'
        })
      ],
      colorFormat: 'rgba16float',
      flipY: true
    });
    flippedComputeRenderer.resize([width, height]);
    flippedFragmentRenderer.resize([width, height]);
    try {
      const flippedCompute = await renderWithExposure(2, flippedComputeRenderer);
      const flippedFragment = await renderWithExposure(2, flippedFragmentRenderer);
      expect(flippedCompute.computePasses, 'flipped WebGPU extraction stays fused').toBe(1);
      expect(flippedFragment.computePasses, 'explicit fragment mode disables compute').toBe(0);
      expect(
        Math.sign(flippedCompute.neighbor - flippedCompute.reflectedNeighbor),
        'fused extraction preserves the fragment fallback texture orientation'
      ).toBe(Math.sign(flippedFragment.neighbor - flippedFragment.reflectedNeighbor));
    } finally {
      flippedComputeRenderer.destroy();
      flippedFragmentRenderer.destroy();
    }
  } finally {
    renderer.destroy();
    sourceTexture.destroy();
  }
});

it('HDR bloom covers source texels at quarter pyramid resolution', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  if (!capabilities.render || !capabilities.filter) {
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

    expect(Boolean(outputTexture), 'reduced-resolution bloom renders').toBe(true);
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

        expect(
          Boolean(readRed(highlightX, highlightY) > sourceRadiance),
          'a highlight in a former fixed-kernel sampling gap contributes bloom'
        ).toBe(true);
        expect(
          Boolean(readRed(highlightX + 2, highlightY) > 0),
          'the captured highlight contributes glow to neighboring source pixels'
        ).toBe(true);
      } finally {
        readbackBuffer.destroy();
      }
    }
  } finally {
    renderer.destroy();
    sourceTexture.destroy();
  }
});

it('HDR bloom preserves radiance with symmetric, energy-bounded falloff', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  if (!capabilities.render || !capabilities.filter) {
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

    expect(Boolean(outputTexture), 'isolated HDR bloom highlight renders').toBe(true);
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

        expect(
          Boolean(centerRadiance > sourceRadiance),
          'bloom composites onto a true HDR source without clipping it to display range'
        ).toBe(true);
        expect(Boolean(nearGlow > middleGlow), 'glow falls off outside the source highlight').toBe(
          true
        );
        expect(Boolean(middleGlow > distantGlow), 'glow continues falling off at wider radii').toBe(
          true
        );
        expect(
          Boolean(Math.abs(leftGlow - rightGlow) <= symmetryTolerance),
          'horizontal bloom is symmetric around the highlight'
        ).toBe(true);
        expect(
          Boolean(Math.abs(topGlow - bottomGlow) <= symmetryTolerance),
          'vertical bloom is symmetric around the highlight'
        ).toBe(true);
        expect(
          Boolean(
            Math.abs(average([leftGlow, rightGlow]) - average([topGlow, bottomGlow])) <=
              symmetryTolerance
          ),
          'horizontal and vertical falloff have matching energy'
        ).toBe(true);
        expect(
          Boolean(diagonalGlow < middleGlow),
          'diagonal support decays instead of forming a square plateau'
        ).toBe(true);

        let addedBloomEnergy = 0;
        for (let pixelY = 0; pixelY < height; pixelY++) {
          for (let pixelX = 0; pixelX < width; pixelX++) {
            const sourceRed =
              pixelX >= 31 && pixelX <= 32 && pixelY >= 31 && pixelY <= 32 ? sourceRadiance : 0;
            addedBloomEnergy += Math.max(readRed(pixelX, pixelY) - sourceRed, 0);
          }
        }
        const sourceEnergy = sourceRadiance * 4;
        expect(
          Boolean(addedBloomEnergy > sourceEnergy * 0.4),
          'normalized downsampling retains useful HDR highlight energy'
        ).toBe(true);
        expect(
          Boolean(addedBloomEnergy < sourceEnergy * 1.6),
          'the multiscale pyramid does not duplicate unbounded highlight energy'
        ).toBe(true);
      } finally {
        readbackBuffer.destroy();
      }
    }
  } finally {
    renderer.destroy();
    sourceTexture.destroy();
  }
});

it('HDR bloom suppresses fireflies and applies its cinematic tint', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  if (!capabilities.render || !capabilities.filter) {
    return;
  }

  const width = 32;
  const height = 32;
  const highlightX = 16;
  const highlightY = 16;
  const sourcePixels = new Uint16Array(width * height * 4);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    sourcePixels[pixelIndex * 4 + 3] = toHalfFloat(1);
  }
  sourcePixels.set(
    [toHalfFloat(32), toHalfFloat(32), toHalfFloat(32), toHalfFloat(1)],
    (highlightY * width + highlightX) * 4
  );

  const sourceTexture = device.createTexture({
    id: 'cinematic-bloom-firefly-source',
    data: sourcePixels,
    format: 'rgba16float',
    width,
    height,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [
      createBloomShaderPassPipeline({
        quality: 'medium',
        radius: 5,
        scatter: 0.4,
        tint: [1, 0.5, 0.25]
      })
    ],
    colorFormat: 'rgba16float',
    flipY: false
  });
  renderer.resize([width, height]);

  const readGlow = async (fireflyReduction: number): Promise<[number, number, number]> => {
    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      uniforms: {
        bloomExtract: {threshold: 0.5, fireflyReduction},
        bloomComposite: {intensity: 1}
      }
    });
    device.submit();

    expect(
      Boolean(outputTexture),
      `cinematic bloom renders with firefly reduction ${fireflyReduction}`
    ).toBe(true);
    if (!outputTexture) {
      return [0, 0, 0];
    }

    const memoryLayout = outputTexture.computeMemoryLayout({width, height});
    const readbackBuffer = device.createBuffer({
      id: `cinematic-bloom-firefly-readback-${fireflyReduction}`,
      byteLength: memoryLayout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });

    try {
      outputTexture.readBuffer({width, height}, readbackBuffer);
      const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
      const pixelView = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength);
      const pixelOffset = highlightY * memoryLayout.bytesPerRow + (highlightX + 3) * 8;
      return [
        fromHalfFloat(pixelView.getUint16(pixelOffset, true)),
        fromHalfFloat(pixelView.getUint16(pixelOffset + 2, true)),
        fromHalfFloat(pixelView.getUint16(pixelOffset + 4, true))
      ];
    } finally {
      readbackBuffer.destroy();
    }
  };

  try {
    const unfilteredGlow = await readGlow(0);
    const filteredGlow = await readGlow(1);

    expect(
      Boolean(unfilteredGlow[0] > 0),
      'an isolated HDR highlight contributes visible bloom'
    ).toBe(true);
    expect(
      Boolean(Math.abs(unfilteredGlow[1] / unfilteredGlow[0] - 0.5) < 0.02),
      'the green bloom channel respects the configured tint'
    ).toBe(true);
    expect(
      Boolean(Math.abs(unfilteredGlow[2] / unfilteredGlow[0] - 0.25) < 0.02),
      'the blue bloom channel respects the configured tint'
    ).toBe(true);
    expect(
      Boolean(filteredGlow[0] < unfilteredGlow[0] * 0.2),
      'luminance-weighted extraction suppresses an isolated HDR firefly'
    ).toBe(true);
  } finally {
    renderer.destroy();
    sourceTexture.destroy();
  }
});
