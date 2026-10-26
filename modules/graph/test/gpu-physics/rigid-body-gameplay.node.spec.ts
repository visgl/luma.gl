// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {GPURigidBodyWorld, decodeRigidBodyContactEvents} from '../../src/gpu-physics';
it('accounts for optional gameplay storage and validates event capacities', () => {
  const bodies = [{position: [0, 0, 0] as const, shape: {type: 'sphere' as const, radius: 1}}];
  const plain = new GPURigidBodyWorld({bodies});
  const enabled = new GPURigidBodyWorld({bodies, eventCapacity: 8, enableQueries: true});
  expect(
    enabled.getCapacityInfo().ownedBufferBytes - plain.getCapacityInfo().ownedBufferBytes
  ).toBe(16 + 8 * 64 + enabled.maximumPairs * 16 + 48 + 4 + 16 + 48);
  for (const eventCapacity of [-1, 0.5, 65537, NaN])
    expect(() => new GPURigidBodyWorld({bodies, eventCapacity})).toThrow();
  plain.destroy();
  enabled.destroy();
});
it('decodes a saturated ring with explicit loss and preserves a nonzero buffer offset', () => {
  const buffer = new ArrayBuffer(16 + 16 + 2 * 64);
  const words = new Uint32Array(buffer, 16);
  words[0] = 5;
  words[1] = 7;
  words[2] = 1;
  // Two retained events: sequence four at slot one, sequence five at slot zero.
  words[4] = 5;
  words[5] = 7;
  words[6] = 2;
  words[20] = 4;
  words[21] = 6;
  words[22] = 0;
  const result = decodeRigidBodyContactEvents(words, 1);
  expect(result).toMatchObject({sequence: 5, step: 7, dropped: 2, saturated: true});
  expect(result.events.map(event => event.sequence)).toEqual([4, 5]);
  expect(result.events.map(event => event.phase)).toEqual(['begin', 'end']);
});
