// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {GPUSplatGraphRenderer, makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('GPUSplatGraphRenderer rejects devices without WebGPU command graphs', t => {
  const device = new NullDevice({});
  t.throws(
    () => new GPUSplatGraphRenderer(device),
    /requires a WebGPU device/,
    'preserves the legacy renderer as the explicit WebGL2 fallback'
  );
  t.end();
});

test('GPUSplatGraphRenderer retains borrowed batches without eager CPU projection or graph compilation', t => {
  const device = makeWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(device, makeGraphSplatSource([0.25, 0.75], 0));
  const secondBatch = makeGPUSplatData(device, makeGraphSplatSource([0.5], 2));
  const renderer = new GPUSplatGraphRenderer(device, {data: firstBatch, viewportSize: [32, 24]});
  renderer.appendData(secondBatch);

  t.equal(renderer.batches[0], firstBatch, 'retains the original first caller-owned batch');
  t.equal(renderer.batches[1], secondBatch, 'retains the original second caller-owned batch');
  t.equal(renderer.compiledGraph, undefined, 'defers immutable graph compilation until encoding');
  t.equal(renderer.stats.splatCount, 3, 'aggregates source row counts without inspecting rows');
  t.equal(renderer.stats.batchCount, 2, 'preserves independently streamed source batches');
  t.equal(renderer.stats.drawCallCount, 1, 'plans one global indirect render draw');
  t.equal(renderer.stats.sortMode, 'global', 'always uses a globally ordered GPU depth sort');

  const sourceBuffer = firstBatch.positions.data[0].buffer;
  const commandBuffer = renderer.drawCommands.buffer;
  renderer.destroy();
  renderer.destroy();
  t.ok(renderer.destroyed, 'marks owned renderer resources destroyed');
  t.ok(commandBuffer.destroyed, 'releases the renderer-owned indirect command allocation');
  t.notOk(sourceBuffer.destroyed, 'never destroys a borrowed caller-owned source allocation');

  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

test('GPUSplatGraphRenderer preserves HDR radiance and resolves display tone mapping', t => {
  const device = makeWebGPUNullDevice();
  const source = makeGraphSplatSource([0.5], 0);
  source.colors = new Float32Array([4, 2, 0.25, 1]);
  const batch = makeGPUSplatData(device, source);
  const renderer = new GPUSplatGraphRenderer(device, {data: batch});

  t.equal(batch.colors.format, 'float32x4', 'retains Float32 source radiance without quantization');
  t.equal(renderer.props.toneMapping, 'reinhard', 'tone-maps HDR highlights for SDR presentation');
  renderer.setProps({exposure: 0.5, toneMapping: 'none', opacityThreshold: 0.2, pointSize: 1.5});
  t.equal(renderer.props.exposure, 0.5, 'updates the display exposure');
  t.equal(renderer.props.toneMapping, 'none', 'respects an explicit display tone-mapping override');
  t.equal(renderer.props.alphaCutoff, 0.2, 'accepts the existing opacity-threshold alias');
  t.equal(renderer.props.radiusScale, 1.5, 'accepts the existing point-size alias');

  renderer.destroy();
  batch.destroy();
  t.end();
});

test('GPUSplatGraphRenderer validates borrowing and replacement ownership', t => {
  const firstDevice = makeWebGPUNullDevice();
  const secondDevice = makeWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(firstDevice, makeGraphSplatSource([0.25], 0));
  const replacementBatch = makeGPUSplatData(firstDevice, makeGraphSplatSource([0.75], 1));
  const foreignBatch = makeGPUSplatData(secondDevice, makeGraphSplatSource([0.5], 0));
  const renderer = new GPUSplatGraphRenderer(firstDevice, {data: firstBatch});

  t.throws(
    () => renderer.appendData(foreignBatch),
    /live data prepared on its own device/,
    'rejects source allocations from another WebGPU device'
  );
  renderer.setProps({data: replacementBatch});
  t.equal(renderer.batches.length, 1, 'replaces the ordered source batch list');
  t.equal(renderer.batches[0], replacementBatch, 'retains the replacement caller-owned batch');
  t.notOk(firstBatch.destroyed, 'never destroys the previous caller-owned source batch');

  renderer.destroy();
  firstBatch.destroy();
  replacementBatch.destroy();
  foreignBatch.destroy();
  t.end();
});

function makeWebGPUNullDevice(): NullDevice {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  return device;
}

function makeGraphSplatSource(depths: readonly number[], rowIndexBase: number): SplatSource {
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
