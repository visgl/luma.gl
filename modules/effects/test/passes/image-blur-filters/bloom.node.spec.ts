// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createBloomShaderPassPipeline} from '@luma.gl/effects';
import {WgslReflect} from 'wgsl_reflect';
import test from 'test/utils/vitest-tape';

test('HDR bloom fuses every selected pyramid level into one WebGPU dispatch', testCase => {
  const qualityLevels = [
    {quality: 'low', levelCount: 2},
    {quality: 'medium', levelCount: 3},
    {quality: 'high', levelCount: 4},
    {quality: 'ultra', levelCount: 5}
  ] as const;

  for (const {quality, levelCount} of qualityLevels) {
    const pipeline = createBloomShaderPassPipeline({quality, downsample: 'auto'});
    const optimization = pipeline.compute;

    testCase.ok(optimization, `${quality} includes a portable fused-compute optimization`);
    if (!optimization) {
      continue;
    }
    const reflection = new WgslReflect(optimization.source);
    testCase.equal(reflection.entry.compute.length, 1, `${quality} uses exactly one dispatch`);
    testCase.equal(
      Object.keys(optimization.outputs).length,
      levelCount,
      `${quality} writes each of its ${levelCount} pyramid levels`
    );
    testCase.deepEqual(
      optimization.replacedPasses,
      ['bloomExtract', 'bloomDownsample'],
      `${quality} preserves its original extraction passes as the portable fallback`
    );
    testCase.match(
      optimization.source,
      /var<workgroup> bloomTile/,
      'reduction reuses shared memory'
    );
    testCase.match(
      optimization.source,
      /workgroupBarrier\(\)/,
      'reduction synchronizes tile writes'
    );
    testCase.ok(
      Object.values(optimization.outputs).every(
        targetName => pipeline.renderTargets?.[targetName].storage
      ),
      `${quality} explicitly enables storage only on writable extraction targets`
    );
  }

  const portablePipeline = createBloomShaderPassPipeline({downsample: 'render'});
  testCase.equal(portablePipeline.compute, undefined, 'render-only mode omits the compute stage');
  testCase.ok(
    Object.values(portablePipeline.renderTargets || {}).every(target => !target.storage),
    'render-only mode avoids unnecessary storage texture usage'
  );
  testCase.end();
});

test('HDR bloom shares expired targets without overwriting live lens highlights', testCase => {
  const reusedPipeline = createBloomShaderPassPipeline({quality: 'ultra'});
  const dedicatedPipeline = createBloomShaderPassPipeline({
    quality: 'ultra',
    reuseRenderTargets: false
  });
  const opticalPipeline = createBloomShaderPassPipeline({
    quality: 'ultra',
    lens: {starburstIntensity: 1}
  });

  for (const levelName of ['Half', 'Quarter', 'Eighth', 'Sixteenth']) {
    testCase.equal(
      reusedPipeline.renderTargets?.[`upsample${levelName}`].aliasFor,
      `extract${levelName}`,
      `${levelName} reconstruction reuses its expired extraction allocation`
    );
    testCase.equal(
      dedicatedPipeline.renderTargets?.[`upsample${levelName}`].aliasFor,
      undefined,
      `${levelName} can retain a dedicated target when diagnostics require it`
    );
  }
  testCase.equal(
    opticalPipeline.renderTargets?.upsampleHalf.aliasFor,
    undefined,
    'half-resolution highlights remain available to the later lens pass'
  );
  testCase.equal(
    opticalPipeline.renderTargets?.upsampleQuarter.aliasFor,
    'extractQuarter',
    'optical artifacts do not prevent reuse at coarser expired levels'
  );
  testCase.end();
});

test('HDR bloom supports exposure-aware extraction and four-fetch bicubic reconstruction', testCase => {
  const pipeline = createBloomShaderPassPipeline({
    threshold: 1.5,
    exposure: 2,
    exposureCompensation: -1,
    reconstruction: 'bicubic'
  });
  const extract = pipeline.steps.find(step => step.shaderPass.name === 'bloomExtract');
  const upsample = pipeline.steps.filter(step => step.shaderPass.name === 'bloomUpsample');

  testCase.equal(extract?.uniforms?.threshold, 1.5, 'the original scene threshold is retained');
  testCase.equal(extract?.uniforms?.exposure, 2, 'adapted camera exposure reaches extraction');
  testCase.equal(
    extract?.uniforms?.exposureCompensation,
    -1,
    'photographic stop compensation reaches extraction'
  );
  testCase.deepEqual(
    pipeline.compute?.uniforms,
    {threshold: 1.5, softKnee: 0.5, fireflyReduction: 0, exposure: 2, exposureCompensation: -1},
    'fragment and fused compute paths receive the same exposure-aware defaults'
  );
  testCase.ok(
    upsample.every(step => step.uniforms?.reconstruction === 1),
    'bicubic reconstruction is selected at every pyramid level'
  );
  testCase.match(
    upsample[0]?.shaderPass.source || '',
    /bloomUpsample_sampleBicubicGlow/,
    'WGSL contains the normalized bicubic reconstruction path'
  );
  testCase.match(
    upsample[0]?.shaderPass.fs || '',
    /bloomUpsample_sampleBicubicGlow/,
    'WebGL retains an equivalent bicubic fallback'
  );
  testCase.end();
});

test('HDR bloom can remove separable passes with a normalized dual-Kawase pyramid', testCase => {
  const gaussian = createBloomShaderPassPipeline({quality: 'ultra'});
  const dualKawase = createBloomShaderPassPipeline({
    quality: 'ultra',
    blurAlgorithm: 'dual-kawase'
  });

  testCase.equal(gaussian.steps.length, 20, 'the compatible Gaussian path keeps its original cost');
  testCase.equal(dualKawase.steps.length, 10, 'portable dual-Kawase removes ten separable passes');
  testCase.equal(
    dualKawase.steps.filter(step => step.shaderPass.name === 'bloomBlur').length,
    0,
    'the reconstruction-only path does not allocate or execute Gaussian kernels'
  );
  testCase.ok(
    Object.keys(dualKawase.renderTargets || {}).every(name => !name.startsWith('blur')),
    'dual-Kawase avoids all separable intermediate textures'
  );
  testCase.equal(
    dualKawase.steps.length - (dualKawase.compute?.replacedPasses ? 5 : 0),
    5,
    'WebGPU needs five render passes and one compute dispatch at ultra quality'
  );
  testCase.end();
});

test('HDR bloom reprojects depth-validated history without another history target', testCase => {
  const pipeline = createBloomShaderPassPipeline({
    temporalStability: 0.8,
    temporalReprojection: true,
    temporalDepthThreshold: 0.025,
    exposure: 2,
    previousExposure: 0.5
  });
  const temporal = pipeline.steps.find(step => step.shaderPass.name === 'bloomTemporal');
  const reflection = new WgslReflect(temporal?.shaderPass.source || '');

  testCase.deepEqual(
    temporal?.shaderPass.bindingLayout?.map(binding => binding.name),
    ['historyTexture', 'velocityTexture', 'depthTexture'],
    'motion-aware history consumes existing scene velocity and depth bindings'
  );
  testCase.deepEqual(
    temporal?.uniforms,
    {stability: 0.8, depthThreshold: 0.025, exposureScale: 4},
    'history combines exposure correction with a configurable disocclusion threshold'
  );
  testCase.equal(reflection.textures.length, 3, 'WGSL exposes history, velocity, and scene depth');
  testCase.match(
    temporal?.shaderPass.source || '',
    /history\.a - 1\.0\) - currentDepth/,
    'the glow history alpha carries previous scene depth without another target'
  );
  testCase.match(
    temporal?.shaderPass.fs || '',
    /texCoord - textureLod\(velocityTexture/,
    'the WebGL fallback uses the same motion-vector reprojection'
  );
  testCase.end();
});

test('HDR bloom can scatter every source pixel without additive energy duplication', testCase => {
  const pipeline = createBloomShaderPassPipeline({
    threshold: 3,
    intensity: 0.4,
    energyConserving: true
  });
  const extraction = pipeline.steps.find(step => step.shaderPass.name === 'bloomExtract');
  const composite = pipeline.steps.find(step => step.shaderPass.name === 'bloomComposite');

  testCase.equal(
    extraction?.uniforms?.threshold,
    0,
    'physical bloom cannot discard dim scene light'
  );
  testCase.equal(pipeline.compute?.uniforms.threshold, 0, 'fused extraction remains thresholdless');
  testCase.equal(composite?.uniforms?.energyConserving, 1, 'composition selects normalized mixing');
  testCase.match(
    composite?.shaderPass.source || '',
    /mix\(\s*sourceColor\.rgb,\s*glowColor \* bloomComposite\.tint/,
    'physical composition redistributes source energy instead of adding another copy'
  );
  testCase.end();
});
