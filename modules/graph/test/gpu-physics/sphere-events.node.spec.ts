// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decodeSphereEvents, makeSphereBoxPlanes, getBodyInertia} from '../../src/gpu-physics';

test('sphere event ring preserves order, reports overwritten entries and handles wrap', () => {
  const words = new Uint32Array(4 + 3 * 8);
  const values = new Float32Array(words.buffer);
  words[0] = 5;
  for (let sequence = 2; sequence < 5; sequence++) {
    const offset = 4 + (sequence % 3) * 8;
    words.set([sequence, 42, (2 << 24) | sequence, 1], offset);
    values.set([sequence, 2, 3, 0], offset + 4);
  }
  const batch = decodeSphereEvents(words, 0);
  expect(batch.dropped).toBe(2);
  expect(batch.events.map(event => event.sequence)).toEqual([2, 3, 4]);
  expect(batch.events[0]).toMatchObject({
    step: 42,
    kind: 'trigger',
    body: 2,
    target: 1,
    position: [2, 2, 3]
  });
  expect(decodeSphereEvents(words, batch.sequence).events).toEqual([]);
  words[0] = 1;
  expect(decodeSphereEvents(words, 0xfffffffe).dropped).toBe(0);
});

test('static box faces have outward normals and the correct tangent extents', () => {
  const faces = makeSphereBoxPlanes({
    center: [1, 2, 3],
    halfExtents: [2, 3, 4],
    material: {restitution: 0.7}
  });
  expect(faces).toHaveLength(6);
  expect(faces[0]).toMatchObject({
    normal: [-1, 0, 0],
    center: [-1, 2, 3],
    halfExtents: [4, 3],
    restitution: 0.7
  });
  expect(faces[2].halfExtents).toEqual([4, 2]);
  expect(faces[4].halfExtents).toEqual([2, 3]);
  expect(() => makeSphereBoxPlanes({center: [0, 0, 0], halfExtents: [1, 0, 1]})).toThrow();
});

test('principal inertia matches analytic solid sphere and box references', () => {
  expect(getBodyInertia(5, {type: 'sphere', radius: 2})).toEqual([8, 8, 8]);
  expect(getBodyInertia(3, {type: 'box', halfExtents: [1, 2, 3]})).toEqual([13, 10, 5]);
  expect(() => getBodyInertia(-1, {type: 'sphere', radius: 1})).toThrow();
});
