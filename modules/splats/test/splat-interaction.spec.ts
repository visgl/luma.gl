// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Device} from '@luma.gl/core';
import {
  makeGPUSplatData,
  SplatPicker,
  SplatRenderer,
  type SplatPickingInfo,
  type SplatSource
} from '@luma.gl/splats';
import {getTestDevices} from '@luma.gl/test-utils';

it('SplatPicker reads actual Gaussian source identities from WebGPU and WebGL picking targets', async () => {
  const devices = await getTestDevices(['webgpu', 'webgl']);
  expect(Boolean(devices.length > 0), 'at least one browser graphics backend is available').toBe(
    true
  );

  for (const device of devices) {
    if (isSoftwareBackedDevice(device)) {
      void 0;
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

    expect(
      picker.mode,
      `${device.type}: selects integer WebGPU picking or portable WebGL color picking`
    ).toBe(device.type === 'webgpu' ? 'index' : 'color');
    const firstPick = await picker.pick([0, 0]);
    expect(
      Boolean(picker.model?.pipeline.isErrored),
      `${device.type}: compiles the dedicated GPU pipeline`
    ).toBe(false);
    expect(
      firstPick,
      `${device.type}: GPU readback resolves stable source batch, global row, and semantic class`
    ).toEqual({batchIndex: 11, rowIndex: 25_000_400, batchRowIndex: 0, semanticId: 8});

    renderer.setProps({semanticFilter: {include: [4, 8]}});
    expect(
      await picker.pick([0, 0], {force: true}),
      `${device.type}: resolves the nearest globally identified row across overlapping source batches`
    ).toEqual({batchIndex: 11, rowIndex: 25_000_400, batchRowIndex: 0, semanticId: 8});
    expect(
      notifications.length,
      `${device.type}: changing shared GPU batch uniforms never duplicates stable source callbacks`
    ).toBe(1);

    renderer.setProps({semanticFilter: {include: [4]}});
    expect(
      await picker.pick([0, 0], {force: true}),
      `${device.type}: excludes filtered Gaussian rows from GPU picking fragments`
    ).toEqual({batchIndex: 5, rowIndex: 100, batchRowIndex: 0, semanticId: 4});
    expect(
      notifications.length,
      `${device.type}: publishes each changed source-row pick once`
    ).toBe(2);

    const sourcePositionBuffer = firstBatch.positions.data[0].buffer;
    picker.destroy();
    expect(
      Boolean(sourcePositionBuffer.destroyed),
      `${device.type}: destroying picking resources preserves independently owned source buffers`
    ).toBe(false);
    renderer.destroy();
    firstBatch.destroy();
    secondBatch.destroy();
  }

  void 0;
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
