// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {scaleRigidBodyShape} from '../../src/gpu-physics/scale-shape';

it('scales analytic geometry exactly and rejects approximations and singular transforms', () => {
  expect(scaleRigidBodyShape({type: 'box', halfExtents: [1, 2, 3]}, [2, 3, 4])).toEqual({
    type: 'box',
    halfExtents: [2, 6, 12]
  });
  expect(scaleRigidBodyShape({type: 'sphere', radius: 2}, [3, 3, 3])).toEqual({
    type: 'sphere',
    radius: 6
  });
  expect(
    scaleRigidBodyShape({type: 'cylinder', height: 2, radiusBottom: 0, radiusTop: 1}, [2, 3, 2])
  ).toEqual({type: 'cylinder', height: 6, radiusBottom: 0, radiusTop: 2});
  expect(scaleRigidBodyShape({type: 'plane', sizeZ: 2, doubleSided: true}, [2, 3, 4])).toEqual({
    type: 'plane',
    sizeX: undefined,
    sizeZ: 8,
    doubleSided: true
  });
  for (const scale of [
    [0, 0, 0],
    [-1, 1, 1],
    [1, 2, 1],
    [Infinity, 1, 1],
    [1, 1]
  ])
    expect(() => scaleRigidBodyShape({type: 'sphere', radius: 1}, scale)).toThrow();
  expect(() =>
    scaleRigidBodyShape({type: 'capsule', height: 1, radiusBottom: 1, radiusTop: 1}, [1, 2, 1])
  ).toThrow();
});
