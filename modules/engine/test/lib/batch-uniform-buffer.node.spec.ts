// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {BatchUniformBuffer} from '../../src/model/batch-uniform-buffer';

it('aligns and reuses batch slots, growing only before a call starts', () => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'minUniformBufferOffsetAlignment', {value: 256});
  const uniforms = new BatchUniformBuffer(device);
  uniforms.prepare(512);
  const first = uniforms.write(new Uint8Array(16));
  const second = uniforms.write(new Uint8Array(48));
  expect(first.offset).toBe(0);
  expect(second.offset).toBe(256);
  expect(second.buffer).toBe(first.buffer);
  expect(second.size).toBe(48);
  uniforms.prepare(512);
  expect(uniforms.write(new Uint8Array(16))).toEqual(first);
  uniforms.prepare(2048);
  const grown = uniforms.write(new Uint8Array(16));
  expect(grown.buffer).not.toBe(first.buffer);
  expect(first.buffer.destroyed).toBe(true);
  expect(grown.buffer.byteLength).toBeGreaterThanOrEqual(2048);
  expect(grown.offset).toBe(0);
  uniforms.destroy();
  expect(grown.buffer.destroyed).toBe(true);
});
