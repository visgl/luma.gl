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
