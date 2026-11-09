// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {postProcessGLTF} from '@luma.gl/engine/gltf';
import {expect, test} from 'vitest';

test('glTF half-float accessors use native values when available and preserve fallback payloads', () => {
  const bytes = new Uint8Array(7);
  new Uint16Array(bytes.buffer, 0, 3).set([0x3c00, 0x4000, 0x4200]);
  const gltf = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      bufferViews: [
        {buffer: 0, byteLength: 6},
        {buffer: 0, byteOffset: 6, byteLength: 1}
      ],
      accessors: [
        {bufferView: 0, componentType: 5131, count: 1, type: 'VEC3'},
        {
          componentType: 5131,
          count: 1,
          type: 'VEC3',
          sparse: {count: 1, indices: {bufferView: 1, componentType: 5121}, values: {bufferView: 0}}
        }
      ]
    },
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
  });
  const nativeHalfFloat = typeof Float16Array === 'function';
  for (const accessor of gltf.accessors) {
    expect(accessor.value.constructor).toBe(nativeHalfFloat ? Float16Array : Uint16Array);
    expect([...accessor.value]).toEqual(nativeHalfFloat ? [1, 2, 3] : [0x3c00, 0x4000, 0x4200]);
    expect(accessor.bytesPerComponent).toBe(2);
  }
});
