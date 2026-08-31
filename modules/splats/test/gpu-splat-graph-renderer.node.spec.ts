// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GPUSplatGraphRenderer, makeGPUSplatData, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

it('GPUSplatGraphRenderer rejects devices without WebGPU command graphs', () => {
  const device = new NullDevice({});
  expect(
    () => new GPUSplatGraphRenderer(device),
    'preserves the legacy renderer as the explicit WebGL2 fallback'
  ).toThrow(/requires a WebGPU device/);
  void 0;
});

it('GPUSplatGraphRenderer retains borrowed batches without eager CPU projection or graph compilation', () => {
  const device = makeWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(device, makeGraphSplatSource([0.25, 0.75], 0));
  const secondBatch = makeGPUSplatData(device, makeGraphSplatSource([0.5], 2));
  const renderer = new GPUSplatGraphRenderer(device, {data: firstBatch, viewportSize: [32, 24]});
  renderer.appendData(secondBatch);

  expect(renderer.batches[0], 'retains the original first caller-owned batch').toBe(firstBatch);
  expect(renderer.batches[1], 'retains the original second caller-owned batch').toBe(secondBatch);
  expect(renderer.compiledGraph, 'defers immutable graph compilation until encoding').toBe(
    undefined
  );
  expect(renderer.stats.splatCount, 'aggregates source row counts without inspecting rows').toBe(3);
  expect(renderer.stats.batchCount, 'preserves independently streamed source batches').toBe(2);
  expect(renderer.stats.drawCallCount, 'plans one global indirect render draw').toBe(1);
  expect(renderer.stats.sortMode, 'always uses a globally ordered GPU depth sort').toBe('global');

  const sourceBuffer = firstBatch.positions.data[0].buffer;
  const commandBuffer = renderer.drawCommands.buffer;
  renderer.destroy();
  renderer.destroy();
  expect(Boolean(renderer.destroyed), 'marks owned renderer resources destroyed').toBe(true);
  expect(
    Boolean(commandBuffer.destroyed),
    'releases the renderer-owned indirect command allocation'
  ).toBe(true);
  expect(
    Boolean(sourceBuffer.destroyed),
    'never destroys a borrowed caller-owned source allocation'
  ).toBe(false);

  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
});

it('GPUSplatGraphRenderer preserves HDR radiance and resolves display tone mapping', () => {
  const device = makeWebGPUNullDevice();
  const source = makeGraphSplatSource([0.5], 0);
  source.colors = new Float32Array([4, 2, 0.25, 1]);
  const batch = makeGPUSplatData(device, source);
  const renderer = new GPUSplatGraphRenderer(device, {data: batch});

  expect(batch.colors.format, 'retains Float32 source radiance without quantization').toBe(
    'float32x4'
  );
  expect(renderer.props.toneMapping, 'tone-maps HDR highlights for SDR presentation').toBe(
    'reinhard'
  );
  renderer.setProps({exposure: 0.5, toneMapping: 'none', opacityThreshold: 0.2, pointSize: 1.5});
  expect(renderer.props.exposure, 'updates the display exposure').toBe(0.5);
  expect(renderer.props.toneMapping, 'respects an explicit display tone-mapping override').toBe(
    'none'
  );
  expect(renderer.props.alphaCutoff, 'accepts the existing opacity-threshold alias').toBe(0.2);
  expect(renderer.props.radiusScale, 'accepts the existing point-size alias').toBe(1.5);

  renderer.destroy();
  batch.destroy();
  void 0;
});

it('GPUSplatGraphRenderer validates borrowing and replacement ownership', () => {
  const firstDevice = makeWebGPUNullDevice();
  const secondDevice = makeWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(firstDevice, makeGraphSplatSource([0.25], 0));
  const replacementBatch = makeGPUSplatData(firstDevice, makeGraphSplatSource([0.75], 1));
  const foreignBatch = makeGPUSplatData(secondDevice, makeGraphSplatSource([0.5], 0));
  const renderer = new GPUSplatGraphRenderer(firstDevice, {data: firstBatch});

  expect(
    () => renderer.appendData(foreignBatch),
    'rejects source allocations from another WebGPU device'
  ).toThrow(/live data prepared on its own device/);
  renderer.setProps({data: replacementBatch});
  expect(renderer.batches.length, 'replaces the ordered source batch list').toBe(1);
  expect(renderer.batches[0], 'retains the replacement caller-owned batch').toBe(replacementBatch);
  expect(
    Boolean(firstBatch.destroyed),
    'never destroys the previous caller-owned source batch'
  ).toBe(false);

  renderer.destroy();
  firstBatch.destroy();
  replacementBatch.destroy();
  foreignBatch.destroy();
  void 0;
});

it('GPUSplatGraphRenderer preserves GPU-native camera, harmonics, and semantic controls', () => {
  const device = makeWebGPUNullDevice();
  const source = makeGraphSplatSource([0.25, 0.75], 17);
  source.semanticIds = new Uint32Array([3, 7]);
  source.sphericalHarmonics = new Float32Array(18);
  source.sphericalHarmonicsDegree = 1;
  const batch = makeGPUSplatData(device, source);
  const initialFilter = {include: new Set([3, 7]), exclude: [7], includeUnlabeled: true};
  const renderer = new GPUSplatGraphRenderer(device, {
    data: batch,
    cameraPosition: [1, 2, 3],
    sphericalHarmonicsDegree: 1,
    semanticFilter: initialFilter
  });

  expect(renderer.props.cameraPosition, 'preserves world-space camera position').toEqual([1, 2, 3]);
  expect(renderer.props.sphericalHarmonicsDegree, 'caps GPU-evaluated source SH bands').toBe(1);
  expect(renderer.props.semanticFilter, 'retains included/excluded class controls').toBe(
    initialFilter
  );
  expect(renderer.projectedRecordBuffer, 'keeps projected records lazy until encoding').toBe(
    undefined
  );
  expect(renderer.uniformBuffer, 'keeps graph uniform bindings lazy until encoding').toBe(
    undefined
  );

  renderer.setProps({
    cameraPosition: [4, 5, 6],
    sphericalHarmonicsDegree: 0,
    semanticFilter: undefined
  });
  expect(renderer.props.cameraPosition, 'updates directional source lighting').toEqual([4, 5, 6]);
  expect(renderer.props.sphericalHarmonicsDegree, 'disables optional higher-order bands').toBe(0);
  expect(renderer.props.semanticFilter, 'restores unfiltered source visibility').toBe(undefined);
  expect(batch.sphericalHarmonics?.data[0].buffer.destroyed, 'borrows original SH storage').toBe(
    false
  );
  expect(batch.semanticIds?.data[0].buffer.destroyed, 'borrows original semantic storage').toBe(
    false
  );

  expect(
    () => renderer.setProps({semanticFilter: {predicate: () => true}}),
    'rejects JavaScript callbacks that cannot execute in a GPU-native graph'
  ).toThrow(/JavaScript predicates/);
  expect(
    () => renderer.setProps({semanticFilter: {include: [-1]}}),
    'rejects semantic classes that cannot be represented by source GPU identifiers'
  ).toThrow(/unsigned 32-bit/);

  renderer.destroy();
  batch.destroy();
  void 0;
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
