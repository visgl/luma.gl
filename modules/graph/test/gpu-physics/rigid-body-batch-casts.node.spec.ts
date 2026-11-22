// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GPURigidBodyWorld, type GPURigidBodyWorldProps} from '../../src/gpu-physics';
import {packRigidBodyBatchCasts} from '../../src/gpu-physics/rigid-body-queries';

/** Minimal fixture shared by the allocation and validation checks. */
const fixture: GPURigidBodyWorldProps = {
  enableQueries: true,
  bodies: [{position: [0, 0, 0], mass: 0, shape: {type: 'sphere', radius: 1}}]
};

it('only reserves bounded command and result buffers when batch capacity is enabled', () => {
  /** Compare identical geometry and scalar query allocations. */
  const scalar = new GPURigidBodyWorld(fixture);
  /** A 17-cast capacity adds two fixed buffers. */
  const batch = new GPURigidBodyWorld({...fixture, queryBatchCapacity: 17});
  expect(batch.getCapacityInfo().ownedBufferBytes - scalar.getCapacityInfo().ownedBufferBytes).toBe(
    17 * (48 + 64)
  );
  for (const queryBatchCapacity of [-1, 1.5, 65536, Infinity])
    expect(() => new GPURigidBodyWorld({...fixture, queryBatchCapacity})).toThrow('batch capacity');
  expect(
    () => new GPURigidBodyWorld({...fixture, enableQueries: false, queryBatchCapacity: 8})
  ).toThrow('batch capacity');
});

it('packs directions, query kinds and per-row exclusions in the WGSL layout', () => {
  /** Compare mixed commands in one transfer. */
  const bytes = packRigidBodyBatchCasts(
    [
      {origin: [3, 2, 1], direction: [0, -5, 0], maximumDistance: 20},
      {origin: [0, 1, 0], direction: [0, 0, 6], maximumDistance: 10, radius: 0.5, excludeBody: 2}
    ],
    5,
    9
  );
  /** Query uniforms and batch records share their float and integer lanes. */
  const floats = new Float32Array(bytes.buffer);
  /** Integer lanes include the common selection count. */
  const words = new Uint32Array(bytes.buffer);
  expect([...floats.slice(0, 8)]).toEqual([3, 2, 1, 0, 0, -1, 0, 20]);
  expect([...words.slice(8, 12)]).toEqual([0, 1, 0xffffffff, 9]);
  expect([...floats.slice(12, 20)]).toEqual([0, 1, 0, 0.5, 0, 0, 1, 10]);
  expect([...words.slice(20, 24)]).toEqual([2, 1, 2, 9]);
});
