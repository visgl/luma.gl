// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GPURigidBodyWorld,
  makeTriangleMeshGeometry,
  decodeRigidBodyTriggerEvents
} from '../../src/gpu-physics';

it('rejects zero-area triangles after float32 cooking instead of feeding invalid faces to GJK', () => {
  expect(() => makeTriangleMeshGeometry([0, 0, 0, 1, 0, 0, 2, 0, 0], [0, 1, 2])).toThrow(
    'Degenerate'
  );
  expect(() =>
    makeTriangleMeshGeometry([1e10, 0, 0, 1e10 + 1, 0, 0, 1e10, 1, 0], [0, 1, 2])
  ).toThrow('Degenerate');
});
it('includes optional checkpoint, CCD and trigger allocations in preflight', () => {
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    continuous: {bodies: [1]},
    triggers: [{colliders: [0], targets: [1], swept: true}],
    bodies: [
      {
        position: [0, 0, 0],
        mode: 'static',
        colliders: [{shape: {type: 'sphere', radius: 1}, isTrigger: true}]
      },
      {position: [3, 0, 0], shape: {type: 'sphere', radius: 0.5}}
    ]
  });
  const capacity = world.getCapacityInfo();
  for (const name of ['checkpoint-0', 'continuous-previous', 'trigger-history', 'trigger-events'])
    expect(capacity.buffers.some(buffer => buffer.name === name)).toBe(true);
  expect(capacity.ownedBufferBytes).toBe(
    capacity.buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
  );
  world.destroy();
});
it('reports overwritten trigger events and decodes typed-array offsets', () => {
  const storage = new Uint32Array(40);
  const data = storage.subarray(4, 24);
  data.set([3, 2, 0, 0]);
  data.set([3, 2, 1, 1, 0, 5, 1, 2], 4);
  data.set([2, 2, 0, 1, 0, 5, 1, 2], 12);
  const batch = decodeRigidBodyTriggerEvents(data, 0);
  expect(batch.dropped).toBe(1);
  expect(batch.events.map(event => [event.sequence, event.phase, event.body])).toEqual([
    [2, 'enter', 5],
    [3, 'exit', 5]
  ]);
});
