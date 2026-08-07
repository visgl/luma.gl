// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {Device} from '@luma.gl/core';
import {
  makeGPUSplatData,
  SplatPicker,
  SplatRenderer,
  type SplatPickingInfo,
  type SplatSource
} from '@luma.gl/splats';
import {getTestDevices} from '@luma.gl/test-utils';

test('SplatPicker reads actual Gaussian source identities from WebGPU and WebGL picking targets', async t => {
  const devices = await getTestDevices(['webgpu', 'webgl']);
  t.ok(devices.length > 0, 'at least one browser graphics backend is available');

  for (const device of devices) {
    if (isSoftwareBackedDevice(device)) {
      t.comment(`${device.type}: skipping picking readback on a software-backed adapter`);
      continue;
    }

    const firstBatch = makeGPUSplatData(
      device,
      makeBrowserPickingSplatSource({depth: 0.8, semanticId: 4, sourceBatchIndex: 5, rowIndex: 100})
    );
    const secondBatch = makeGPUSplatData(
      device,
      makeBrowserPickingSplatSource({
        depth: 0.2,
        semanticId: 8,
        sourceBatchIndex: 11,
        rowIndex: 25_000_400
      })
    );
    const renderer = new SplatRenderer(device, {
      data: [firstBatch, secondBatch],
      viewportSize: [1, 1],
      alphaCutoff: 0,
      semanticFilter: {include: [8]}
    });
    const notifications: SplatPickingInfo[] = [];
    const picker = new SplatPicker(renderer, {
      mode: device.type === 'webgpu' ? 'index' : 'color',
      onPick: pickInfo => notifications.push(pickInfo)
    });

    t.equal(
      picker.mode,
      device.type === 'webgpu' ? 'index' : 'color',
      `${device.type}: selects integer WebGPU picking or portable WebGL color picking`
    );
    const firstPick = await picker.pick([0, 0]);
    t.notOk(
      picker.model?.pipeline.isErrored,
      `${device.type}: compiles the dedicated GPU pipeline`
    );
    t.deepEqual(
      firstPick,
      {batchIndex: 11, rowIndex: 25_000_400, batchRowIndex: 0, semanticId: 8},
      `${device.type}: GPU readback resolves stable source batch, global row, and semantic class`
    );

    renderer.setProps({semanticFilter: {include: [4, 8]}});
    t.deepEqual(
      await picker.pick([0, 0], {force: true}),
      {batchIndex: 11, rowIndex: 25_000_400, batchRowIndex: 0, semanticId: 8},
      `${device.type}: resolves the nearest globally identified row across overlapping source batches`
    );
    t.equal(
      notifications.length,
      1,
      `${device.type}: changing shared GPU batch uniforms never duplicates stable source callbacks`
    );

    renderer.setProps({semanticFilter: {include: [4]}});
    t.deepEqual(
      await picker.pick([0, 0], {force: true}),
      {batchIndex: 5, rowIndex: 100, batchRowIndex: 0, semanticId: 4},
      `${device.type}: excludes filtered Gaussian rows from GPU picking fragments`
    );
    t.equal(notifications.length, 2, `${device.type}: publishes each changed source-row pick once`);

    const sourcePositionBuffer = firstBatch.positions.data[0].buffer;
    picker.destroy();
    t.notOk(
      sourcePositionBuffer.destroyed,
      `${device.type}: destroying picking resources preserves independently owned source buffers`
    );
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
  }

  t.end();
});

function makeBrowserPickingSplatSource({
  depth,
  semanticId,
  sourceBatchIndex,
  rowIndex
}: {
  depth: number;
  semanticId: number;
  sourceBatchIndex: number;
  rowIndex: number;
}): SplatSource {
  return {
    positions: new Float32Array([0, 0, depth]),
    scales: new Float32Array([1, 1, 0.1]),
    rotations: new Float32Array([1, 0, 0, 0]),
    colors: new Uint8Array([255, 128, 64, 255]),
    opacities: new Float32Array([1]),
    semanticIds: new Uint32Array([semanticId]),
    sourceBatchIndex,
    rowIndexBase: rowIndex
  };
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
