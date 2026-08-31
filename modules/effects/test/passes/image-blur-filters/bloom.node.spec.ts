// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createBloomCompositeShaderPass} from '@luma.gl/effects';
import {WgslReflect} from 'wgsl_reflect';
import {expect, it} from 'vitest';

it('HDR bloom fuses every selected pyramid level into one WebGPU dispatch', () => {
  const qualityLevels = [
    {quality: 'low', levelCount: 2},
    {quality: 'medium', levelCount: 3},
    {quality: 'high', levelCount: 4},
    {quality: 'ultra', levelCount: 5}
  ] as const;

  for (const {quality, levelCount} of qualityLevels) {
    const pipeline = createBloomCompositeShaderPass({quality, downsample: 'auto'});
    const optimization = pipeline.compute;

    expect(Boolean(optimization), `${quality} includes a portable fused-compute optimization`).toBe(
      true
    );
    if (!optimization) {
      continue;
    }
    const reflection = new WgslReflect(optimization.source);
    expect(reflection.entry.compute.length, `${quality} uses exactly one dispatch`).toBe(1);
    expect(
      Object.keys(optimization.outputs).length,
      `${quality} writes each of its ${levelCount} pyramid levels`
    ).toBe(levelCount);
    expect(
      optimization.replacedPasses,
      `${quality} preserves its original extraction passes as the portable fallback`
    ).toEqual(['bloomExtract', 'bloomDownsample']);
    expect(optimization.source, 'reduction reuses shared memory').toMatch(
      /var<workgroup> bloomTile/
    );
    expect(optimization.source, 'reduction synchronizes tile writes').toMatch(
      /workgroupBarrier\(\)/
    );
    expect(
      Boolean(
        Object.values(optimization.outputs).every(
          targetName => pipeline.renderTargets?.[targetName].storage
        )
      ),
      `${quality} explicitly enables storage only on writable extraction targets`
    ).toBe(true);
  }

  const portablePipeline = createBloomCompositeShaderPass({downsample: 'render'});
  expect(portablePipeline.compute, 'render-only mode omits the compute stage').toBe(undefined);
  expect(
    Boolean(Object.values(portablePipeline.renderTargets || {}).every(target => !target.storage)),
    'render-only mode avoids unnecessary storage texture usage'
  ).toBe(true);
  void 0;
});

it('HDR bloom shares expired targets without overwriting live lens highlights', () => {
  const reusedPipeline = createBloomCompositeShaderPass({quality: 'ultra'});
  const dedicatedPipeline = createBloomCompositeShaderPass({
    quality: 'ultra',
    reuseRenderTargets: false
  });
  const opticalPipeline = createBloomCompositeShaderPass({
    quality: 'ultra',
    lens: {starburstIntensity: 1}
  });

  for (const levelName of ['Half', 'Quarter', 'Eighth', 'Sixteenth']) {
    expect(
      reusedPipeline.renderTargets?.[`upsample${levelName}`].aliasFor,
      `${levelName} reconstruction reuses its expired extraction allocation`
    ).toBe(`extract${levelName}`);
    expect(
      dedicatedPipeline.renderTargets?.[`upsample${levelName}`].aliasFor,
      `${levelName} can retain a dedicated target when diagnostics require it`
    ).toBe(undefined);
  }
  expect(
    opticalPipeline.renderTargets?.upsampleHalf.aliasFor,
    'half-resolution highlights remain available to the later lens pass'
  ).toBe(undefined);
  expect(
    opticalPipeline.renderTargets?.upsampleQuarter.aliasFor,
    'optical artifacts do not prevent reuse at coarser expired levels'
  ).toBe('extractQuarter');
  void 0;
});

it('HDR bloom supports exposure-aware extraction and four-fetch bicubic reconstruction', () => {
  const pipeline = createBloomCompositeShaderPass({
    threshold: 1.5,
    exposure: 2,
    exposureCompensation: -1,
    reconstruction: 'bicubic'
  });
  const extract = pipeline.steps.find(step => step.shaderPass.name === 'bloomExtract');
  const upsample = pipeline.steps.filter(step => step.shaderPass.name === 'bloomUpsample');

  expect(extract?.uniforms?.threshold, 'the original scene threshold is retained').toBe(1.5);
  expect(extract?.uniforms?.exposure, 'adapted camera exposure reaches extraction').toBe(2);
  expect(
    extract?.uniforms?.exposureCompensation,
    'photographic stop compensation reaches extraction'
  ).toBe(-1);
  expect(
    pipeline.compute?.uniforms,
    'fragment and fused compute paths receive the same exposure-aware defaults'
  ).toEqual({
    threshold: 1.5,
    softKnee: 0.5,
    fireflyReduction: 0,
    exposure: 2,
    exposureCompensation: -1
  });
  expect(
    Boolean(upsample.every(step => step.uniforms?.reconstruction === 1)),
    'bicubic reconstruction is selected at every pyramid level'
  ).toBe(true);
  expect(
    upsample[0]?.shaderPass.source || '',
    'WGSL contains the normalized bicubic reconstruction path'
  ).toMatch(/bloomUpsample_sampleBicubicGlow/);
  expect(upsample[0]?.shaderPass.fs || '', 'WebGL retains an equivalent bicubic fallback').toMatch(
    /bloomUpsample_sampleBicubicGlow/
  );
  void 0;
});

it('HDR bloom can remove separable passes with a normalized dual-Kawase pyramid', () => {
  const gaussian = createBloomCompositeShaderPass({quality: 'ultra'});
  const dualKawase = createBloomCompositeShaderPass({
    quality: 'ultra',
    blurAlgorithm: 'dual-kawase'
  });

  expect(gaussian.steps.length, 'the compatible Gaussian path keeps its original cost').toBe(20);
  expect(dualKawase.steps.length, 'portable dual-Kawase removes ten separable passes').toBe(10);
  expect(
    dualKawase.steps.filter(step => step.shaderPass.name === 'bloomBlur').length,
    'the reconstruction-only path does not allocate or execute Gaussian kernels'
  ).toBe(0);
  expect(
    Boolean(Object.keys(dualKawase.renderTargets || {}).every(name => !name.startsWith('blur'))),
    'dual-Kawase avoids all separable intermediate textures'
  ).toBe(true);
  expect(
    dualKawase.steps.length - (dualKawase.compute?.replacedPasses ? 5 : 0),
    'WebGPU needs five render passes and one compute dispatch at ultra quality'
  ).toBe(5);
  void 0;
});

it('HDR bloom reprojects depth-validated history without another history target', () => {
  const pipeline = createBloomCompositeShaderPass({
    temporalStability: 0.8,
    temporalReprojection: true,
    temporalDepthThreshold: 0.025,
    exposure: 2,
    previousExposure: 0.5
  });
  const temporal = pipeline.steps.find(step => step.shaderPass.name === 'bloomTemporal');
  const reflection = new WgslReflect(temporal?.shaderPass.source || '');

  expect(
    temporal?.shaderPass.bindingLayout?.map(binding => binding.name),
    'motion-aware history consumes existing scene velocity and depth bindings'
  ).toEqual(['historyTexture', 'velocityTexture', 'depthTexture']);
  expect(
    temporal?.uniforms,
    'history combines exposure correction with a configurable disocclusion threshold'
  ).toEqual({stability: 0.8, depthThreshold: 0.025, exposureScale: 4});
  expect(reflection.textures.length, 'WGSL exposes history, velocity, and scene depth').toBe(3);
  expect(
    temporal?.shaderPass.source || '',
    'the glow history alpha carries previous scene depth without another target'
  ).toMatch(/history\.a - 1\.0\) - currentDepth/);
  expect(
    temporal?.shaderPass.fs || '',
    'the WebGL fallback uses the same motion-vector reprojection'
  ).toMatch(/texCoord - textureLod\(velocityTexture/);
  void 0;
});

it('HDR bloom can scatter every source pixel without additive energy duplication', () => {
  const pipeline = createBloomCompositeShaderPass({
    threshold: 3,
    intensity: 0.4,
    energyConserving: true
  });
  const extraction = pipeline.steps.find(step => step.shaderPass.name === 'bloomExtract');
  const composite = pipeline.steps.find(step => step.shaderPass.name === 'bloomComposite');

  expect(extraction?.uniforms?.threshold, 'physical bloom cannot discard dim scene light').toBe(0);
  expect(pipeline.compute?.uniforms.threshold, 'fused extraction remains thresholdless').toBe(0);
  expect(composite?.uniforms?.energyConserving, 'composition selects normalized mixing').toBe(1);
  expect(
    composite?.shaderPass.source || '',
    'physical composition redistributes source energy instead of adding another copy'
  ).toMatch(/mix\(\s*sourceColor\.rgb,\s*glowColor \* bloomComposite\.tint/);
  void 0;
});
