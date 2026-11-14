// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {encodeSceneBake, decodeSceneBake} from '../../../../examples/api/lightmap-baking/bake-file';

test('scene bake files retain HDR values and reject mismatched scenes before upload', () => {
  const data = {
    version: 1 as const,
    width: 1,
    height: 1,
    encoding: 'linear-irradiance' as const,
    uvSet: 1 as const,
    data: new Float32Array([4, 0.25, 2, 1])
  };
  const bytes = encodeSceneBake(data, 'courtyard');
  expect(decodeSceneBake(bytes, 'courtyard')).toEqual(data);
  expect(() => decodeSceneBake(bytes, 'rooms')).toThrow('different scene');
  expect(() => decodeSceneBake(bytes.slice(0, 12), 'courtyard')).toThrow('Incomplete');
});
