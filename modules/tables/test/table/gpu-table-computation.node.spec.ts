// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {GPUData, GPUTableComputation, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';

vi.mock('@luma.gl/engine', async importOriginal => {
  const original = await importOriginal<typeof import('@luma.gl/engine')>();
  return {
    ...original,
    Computation: class {
      readonly device: Device;
      bindings: Record<string, Binding>;

      constructor(device: Device, props: {bindings?: Record<string, Binding>}) {
        this.device = device;
        this.bindings = props.bindings ?? {};
      }

      setBindings(bindings: Record<string, Binding>): void {
        Object.assign(this.bindings, bindings);
      }
    }
  };
});

test('GPUTableComputation binds fixed-size-list rows without trailing physical padding', () => {
  const device = new NullDevice({});
  const embeddings = new GPUVector({
    type: 'buffer',
    name: 'embeddings',
    buffer: device.createBuffer({byteLength: 32}),
    format: 'fixed-size-list<float32,3>',
    length: 2,
    byteOffset: 4,
    byteStride: 16,
    ownsBuffer: true
  });
  const computation = new GPUTableComputation(device, {inputVectors: {embeddings}});

  expect(computation.bindings.embeddings).toEqual({
    buffer: embeddings.data[0].buffer,
    offset: 4,
    size: 28
  });

  embeddings.destroy();
});

test('GPUTableComputation preserves explicit value spans and empty fixed-size-list chunks', () => {
  const device = new NullDevice({});
  const limitedData = new GPUData({
    buffer: device.createBuffer({byteLength: 28}),
    format: 'fixed-size-list<float32,3>',
    length: 2,
    byteStride: 16,
    valueByteLength: 24,
    ownsBuffer: true
  });
  const limited = new GPUVector({
    type: 'data',
    name: 'limited',
    data: [limitedData],
    ownsData: false
  });
  const empty = new GPUVector({
    type: 'buffer',
    name: 'empty',
    buffer: device.createBuffer({byteLength: 4}),
    format: 'fixed-size-list<float32,3>',
    length: 0,
    byteOffset: 4,
    ownsBuffer: true
  });
  const limitedComputation = new GPUTableComputation(device, {inputVectors: {limited}});
  const emptyComputation = new GPUTableComputation(device, {inputVectors: {empty}});

  expect(limitedComputation.bindings.limited).toEqual({
    buffer: limitedData.buffer,
    offset: 0,
    size: 24
  });
  expect(emptyComputation.bindings.empty).toEqual({
    buffer: empty.data[0].buffer,
    offset: 4,
    size: 0
  });

  limited.destroy();
  limitedData.destroy();
  empty.destroy();
});
