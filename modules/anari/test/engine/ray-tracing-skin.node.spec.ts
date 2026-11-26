// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core/matrix';
import {expect, test} from 'vitest';
import {applyRaySkin} from '../../src/engine/ray-tracing-skin';

test('skins normals with inverse transpose and preserves reflected tangent orientation', () => {
  const position = new Float32Array([1, 1, 1, 2, 2, 2]);
  const normal = new Float32Array([1, 1, 0, 0, 0, 1]);
  const tangent = new Float32Array([1, 0, 0, 1, 1, 0, 0, 1]);
  const deformed = applyRaySkin(
    {
      palette: new Float32Array(new Matrix4().translate([1, 0, 0]).scale([-2, 1, 1])),
      joints: new Uint16Array([0, 0, 0, 0, 5, 0, 0, 0]),
      weights: {size: 4, value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0])}
    },
    {POSITION: position, NORMAL: normal, TANGENT: tangent}
  );
  expect(Array.from(deformed.POSITION!)).toEqual([-1, 1, 1, 2, 2, 2]);
  expect(deformed.NORMAL?.[0]).toBeCloseTo(-1 / Math.sqrt(5));
  expect(deformed.NORMAL?.[1]).toBeCloseTo(2 / Math.sqrt(5));
  expect(deformed.TANGENT?.[0]).toBe(-1);
  expect(deformed.TANGENT?.[3]).toBe(-1);
  expect(Array.from(position)).toEqual([1, 1, 1, 2, 2, 2]);
});
