// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GPUSplatGraphRenderer, makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

it('GPUSplatGraphRenderer reserves progressive hints lazily while borrowing original batches', () => {
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

  expect(renderer.compiledGraph, 'does not compile anticipated slots before streaming').toBe(
    undefined
  );
  renderer.appendData(firstBatch);
  renderer.appendData(secondBatch);
  expect(renderer.compiledGraph, 'does not compile eagerly while batches are appended').toBe(
    undefined
  );
  expect(renderer.batches[0], 'retains the original first streamed GPU batch').toBe(firstBatch);
  expect(renderer.batches[1], 'retains the original second streamed GPU batch').toBe(secondBatch);
  expect(
    renderer.stats.splatCount,
    'reports populated rows instead of reserved scene capacity'
  ).toBe(3);
  expect(
    renderer.stats.batchCount,
    'reports populated batches instead of reserved batch slots'
  ).toBe(2);
  expect(
    renderer.batches[0].positions.data[0].buffer,
    'preserves the first original source GPU allocation'
  ).toBe(firstPositionBuffer);
  expect(
    renderer.batches[1].positions.data[0].buffer,
    'preserves the second original source GPU allocation'
  ).toBe(secondPositionBuffer);

  renderer.destroy();
  expect(
    Boolean(firstPositionBuffer.destroyed),
    'never destroys the first borrowed source allocation'
  ).toBe(false);
  expect(
    Boolean(secondPositionBuffer.destroyed),
    'never destroys the second borrowed source allocation'
  ).toBe(false);
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
});

it('GPUSplatGraphRenderer preserves mixed packed and HDR progressive source formats', () => {
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

  expect(packedBatch.colors.format, 'retains packed streamed colors').toBe('unorm8x4');
  expect(renderer.props.toneMapping, 'does not tone-map packed SDR source data').toBe('none');
  renderer.appendData(highDynamicRangeBatch);
  expect(
    highDynamicRangeBatch.colors.format,
    'preserves streamed HDR radiance without byte quantization'
  ).toBe('float32x4');
  expect(renderer.props.toneMapping, 'automatically resolves streamed HDR display').toBe(
    'reinhard'
  );
  expect(renderer.stats.splatCount, 'accepts more rows than an underestimated scene hint').toBe(2);
  expect(renderer.stats.batchCount, 'accepts more batches than an underestimated slot hint').toBe(
    2
  );
  expect(renderer.compiledGraph, 'grows lazy anticipated capacity without compilation').toBe(
    undefined
  );

  renderer.destroy();
  expect(Boolean(packedBatch.destroyed), 'retains ownership of the initial packed batch').toBe(
    false
  );
  expect(
    Boolean(highDynamicRangeBatch.destroyed),
    'retains ownership of the progressive HDR batch'
  ).toBe(false);
  packedBatch.destroy();
  highDynamicRangeBatch.destroy();
  void 0;
});

it('GPUSplatGraphRenderer replaces progressively retained batches without destroying sources', () => {
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
  expect(renderer.batches.length, 'replaces the entire previously streamed batch sequence').toBe(1);
  expect(renderer.batches[0], 'retains the exact replacement GPU batch').toBe(replacementBatch);
  expect(renderer.stats.splatCount, 'resets populated scene row counts after replacement').toBe(1);
  expect(
    Boolean(firstPositionBuffer.destroyed),
    'preserves the previous first borrowed source allocation'
  ).toBe(false);
  expect(
    Boolean(secondPositionBuffer.destroyed),
    'preserves the previous second borrowed source allocation'
  ).toBe(false);

  renderer.destroy();
  expect(
    Boolean(replacementPositionBuffer.destroyed),
    'destroying replacement graph slots preserves the caller-owned replacement allocation'
  ).toBe(false);
  firstBatch.destroy();
  secondBatch.destroy();
  replacementBatch.destroy();
  void 0;
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
