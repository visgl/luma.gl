// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {GPUSplatGraphRenderer, makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('GPUSplatGraphRenderer reserves progressive hints lazily while borrowing original batches', t => {
  const device = makeProgressiveWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(device, makeProgressiveNodeSplatSource([0.25, 0.75], 0));
  const secondBatch = makeGPUSplatData(device, makeProgressiveNodeSplatSource([0.5], 2));
  const firstPositionBuffer = firstBatch.positions.data[0].buffer;
  const secondPositionBuffer = secondBatch.positions.data[0].buffer;
  const renderer = new GPUSplatGraphRenderer(device, {
    expectedSplatCount: 8,
    expectedBatchCount: 4,
    viewportSize: [32, 24]
  });

  t.equal(renderer.compiledGraph, undefined, 'does not compile anticipated slots before streaming');
  renderer.appendData(firstBatch);
  renderer.appendData(secondBatch);
  t.equal(renderer.compiledGraph, undefined, 'does not compile eagerly while batches are appended');
  t.equal(renderer.batches[0], firstBatch, 'retains the original first streamed GPU batch');
  t.equal(renderer.batches[1], secondBatch, 'retains the original second streamed GPU batch');
  t.equal(
    renderer.stats.splatCount,
    3,
    'reports populated rows instead of reserved scene capacity'
  );
  t.equal(
    renderer.stats.batchCount,
    2,
    'reports populated batches instead of reserved batch slots'
  );
  t.equal(
    renderer.batches[0].positions.data[0].buffer,
    firstPositionBuffer,
    'preserves the first original source GPU allocation'
  );
  t.equal(
    renderer.batches[1].positions.data[0].buffer,
    secondPositionBuffer,
    'preserves the second original source GPU allocation'
  );

  renderer.destroy();
  t.notOk(firstPositionBuffer.destroyed, 'never destroys the first borrowed source allocation');
  t.notOk(secondPositionBuffer.destroyed, 'never destroys the second borrowed source allocation');
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

test('GPUSplatGraphRenderer preserves mixed packed and HDR progressive source formats', t => {
  const device = makeProgressiveWebGPUNullDevice();
  const packedBatch = makeGPUSplatData(device, makeProgressiveNodeSplatSource([0.25], 0));
  const highDynamicRangeSource = makeProgressiveNodeSplatSource([0.75], 1);
  highDynamicRangeSource.colors = new Float32Array([8, 2, 0.25, 1]);
  const highDynamicRangeBatch = makeGPUSplatData(device, highDynamicRangeSource);
  const renderer = new GPUSplatGraphRenderer(device, {
    expectedSplatCount: 1,
    expectedBatchCount: 1,
    data: packedBatch
  });

  t.equal(packedBatch.colors.format, 'unorm8x4', 'retains packed streamed colors');
  t.equal(renderer.props.toneMapping, 'none', 'does not tone-map packed SDR source data');
  renderer.appendData(highDynamicRangeBatch);
  t.equal(
    highDynamicRangeBatch.colors.format,
    'float32x4',
    'preserves streamed HDR radiance without byte quantization'
  );
  t.equal(renderer.props.toneMapping, 'reinhard', 'automatically resolves streamed HDR display');
  t.equal(renderer.stats.splatCount, 2, 'accepts more rows than an underestimated scene hint');
  t.equal(renderer.stats.batchCount, 2, 'accepts more batches than an underestimated slot hint');
  t.equal(renderer.compiledGraph, undefined, 'grows lazy anticipated capacity without compilation');

  renderer.destroy();
  t.notOk(packedBatch.destroyed, 'retains ownership of the initial packed batch');
  t.notOk(highDynamicRangeBatch.destroyed, 'retains ownership of the progressive HDR batch');
  packedBatch.destroy();
  highDynamicRangeBatch.destroy();
  t.end();
});

test('GPUSplatGraphRenderer replaces progressively retained batches without destroying sources', t => {
  const device = makeProgressiveWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(device, makeProgressiveNodeSplatSource([0.25], 0));
  const secondBatch = makeGPUSplatData(device, makeProgressiveNodeSplatSource([0.5], 1));
  const replacementBatch = makeGPUSplatData(device, makeProgressiveNodeSplatSource([0.75], 2));
  const firstPositionBuffer = firstBatch.positions.data[0].buffer;
  const secondPositionBuffer = secondBatch.positions.data[0].buffer;
  const replacementPositionBuffer = replacementBatch.positions.data[0].buffer;
  const renderer = new GPUSplatGraphRenderer(device, {
    expectedSplatCount: 8,
    expectedBatchCount: 4,
    data: firstBatch
  });

  renderer.appendData(secondBatch);
  renderer.setProps({data: replacementBatch});
  t.equal(renderer.batches.length, 1, 'replaces the entire previously streamed batch sequence');
  t.equal(renderer.batches[0], replacementBatch, 'retains the exact replacement GPU batch');
  t.equal(renderer.stats.splatCount, 1, 'resets populated scene row counts after replacement');
  t.notOk(firstPositionBuffer.destroyed, 'preserves the previous first borrowed source allocation');
  t.notOk(
    secondPositionBuffer.destroyed,
    'preserves the previous second borrowed source allocation'
  );

  renderer.destroy();
  t.notOk(
    replacementPositionBuffer.destroyed,
    'destroying replacement graph slots preserves the caller-owned replacement allocation'
  );
  firstBatch.destroy();
  secondBatch.destroy();
  replacementBatch.destroy();
  t.end();
});

function makeProgressiveWebGPUNullDevice(): NullDevice {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  return device;
}

function makeProgressiveNodeSplatSource(
  depths: readonly number[],
  rowIndexBase: number
): SplatSource {
  const positions = new Float32Array(depths.length * 3);
  const scales = new Float32Array(depths.length * 3);
  const rotations = new Float32Array(depths.length * 4);
  const colors = new Uint8Array(depths.length * 4);
  const opacities = new Float32Array(depths.length);
  for (const [rowIndex, depth] of depths.entries()) {
    positions[rowIndex * 3 + 2] = depth;
    scales.set([0.1, 0.06, 0.03], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([255, 128, 32, 255], rowIndex * 4);
    opacities[rowIndex] = 1;
  }
  return {positions, scales, rotations, colors, opacities, rowIndexBase};
}
