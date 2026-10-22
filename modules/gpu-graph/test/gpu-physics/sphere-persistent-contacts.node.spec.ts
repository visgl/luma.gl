// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  makeAccumulatedSphereSolver,
  makePersistentContactShader
} from '../../src/gpu-physics/sphere-persistent-contacts';
import {
  SOLVE_SPHERE_CONTACTS,
  getSphereContactShader
} from '../../src/gpu-physics/sphere-world-shaders';

test('shader specialization fails when required shared fragments change or duplicate', () => {
  const changed = SOLVE_SPHERE_CONTACTS.replace(
    'var<storage, read> contacts:',
    'var<storage,read> contacts:'
  );
  expect(() => makeAccumulatedSphereSolver(changed)).toThrow();
  expect(() =>
    makeAccumulatedSphereSolver(SOLVE_SPHERE_CONTACTS + SOLVE_SPHERE_CONTACTS)
  ).toThrow();
  const emitter = getSphereContactShader('emit', true);
  expect(() =>
    makePersistentContactShader(
      emitter.replace('= vec2u(other, bitcast<u32>(bounce));', '= vec2u(other, 0u);'),
      true
    )
  ).toThrow();
  expect(() => makeAccumulatedSphereSolver(SOLVE_SPHERE_CONTACTS)).not.toThrow();
  expect(() => makePersistentContactShader(emitter, true)).not.toThrow();
});
