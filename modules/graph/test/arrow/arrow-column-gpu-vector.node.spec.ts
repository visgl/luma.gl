// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {convertArrowColumnToGPUVector} from '@luma.gl/graph/arrow';
import * as arrow from 'apache-arrow';

test('Arrow column conversion preserves validity, transforms and residuals', () => {
  const device = new NullDevice({});
  const createBuffer = vi.spyOn(device, 'createBuffer');
  const source = arrow.vectorFromArray([1.00000001, null], new arrow.Float64());
  const result = convertArrowColumnToGPUVector(device, source, {
    name: 'positions',
    format: 'float32',
    color: false,
    preserveNulls: true,
    fp64: true,
    transform: value => [value[0] + 1]
  });
  const payloads = createBuffer.mock.calls.map(([props]) => props.data as Uint8Array);
  const high = new Float32Array(payloads[0].buffer, payloads[0].byteOffset, 2);
  const low = new Float32Array(payloads[1].buffer, payloads[1].byteOffset, 2);
  const validity = new Uint32Array(payloads[2].buffer, payloads[2].byteOffset, 2);
  expect(high[0] + low[0]).toBeCloseTo(2.00000001, 14);
  expect(Array.from(validity)).toEqual([1, 0]);
  expect(result.vector.length).toBe(2);
  result.destroy();
  for (const buffer of createBuffer.mock.results) expect(buffer.value.destroyed).toBe(true);
  device.destroy();
});

test('Arrow column conversion rejects null rows when preservation is disabled', () => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray([1, null], new arrow.Float32());
  expect(() =>
    convertArrowColumnToGPUVector(device, source, {
      format: 'float32',
      color: false,
      preserveNulls: false
    })
  ).toThrow('null');
  device.destroy();
});

test('Arrow column conversion keeps chunks and respects sliced child validity', () => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(
    [
      [null, 2],
      [3, 4]
    ],
    new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), true))
  );
  const result = convertArrowColumnToGPUVector(device, source.slice(1).concat(source.slice(1)), {
    format: 'float32x3',
    color: false,
    preserveNulls: false
  });
  expect(result.vector.data.map(chunk => chunk.length)).toEqual([1, 1]);
  result.destroy();
  device.destroy();
});

test('Arrow color conversion pads alpha and scales float components', () => {
  const device = new NullDevice({});
  const createBuffer = vi.spyOn(device, 'createBuffer');
  const source = arrow.vectorFromArray(
    [[1, 0.5, 0]],
    new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false))
  );
  const result = convertArrowColumnToGPUVector(device, source, {
    format: 'unorm8x4',
    color: true,
    preserveNulls: false
  });
  expect(Array.from(createBuffer.mock.calls[0][0].data as Uint8Array)).toEqual([255, 128, 0, 255]);
  result.destroy();
  device.destroy();
});

test('Arrow column conversion requires a format matching its semantic', () => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray([1], new arrow.Float32());
  expect(() =>
    convertArrowColumnToGPUVector(device, source, {
      format: 'unorm8x4',
      color: false,
      preserveNulls: false
    })
  ).toThrow('format');
  device.destroy();
});
