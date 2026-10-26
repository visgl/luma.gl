// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {parseGLTFPhysics} from '../../modules/gltf/src/physics';
import {makePhysicsBodyDelta} from '../../examples/gltf/physics/body-transforms';

describe('glTF physics example pose bridge', () => {
  const description = parseGLTFPhysics({
    scenes: [{nodes: [0]}],
    nodes: [
      {
        translation: [2, 3, 4],
        scale: [2, 2, 2],
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {mass: 1, centerOfMass: [0.25, 0, 0]},
            collider: {geometry: {shape: 0}}
          }
        }
      }
    ],
    extensions: {KHR_implicit_shapes: {shapes: [{type: 'box', box: {size: [1, 1, 1]}}]}}
  });

  test('initial center-of-mass pose preserves authored mesh scale and placement', () => {
    expect(description.issues).toEqual([]);
    const body = description.bodies[0];
    const delta = makePhysicsBodyDelta(body, {
      position: [2 + body.centerOfMass[0], 3, 4],
      orientation: [0, 0, 0, 1],
      velocity: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      sleeping: false
    });
    const matrix = delta.multiplyRight(body.worldMatrix);
    Array.from(matrix).forEach((value, index) =>
      expect(value).toBeCloseTo(body.worldMatrix[index])
    );
  });

  test('rotation moves the mesh around its center of mass', () => {
    const body = description.bodies[0];
    const delta = makePhysicsBodyDelta(body, {
      position: [5, 6, 7],
      orientation: [0, 0, 1, 0],
      velocity: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      sleeping: false
    });
    const matrix = delta.multiplyRight(new Matrix4(body.worldMatrix));
    expect(matrix[12]).toBeCloseTo(5 + body.centerOfMass[0]);
    expect(matrix[13]).toBeCloseTo(6);
    expect(matrix[14]).toBeCloseTo(7);
    expect(matrix[0]).toBeCloseTo(-2);
    expect(matrix[5]).toBeCloseTo(-2);
    expect(matrix[10]).toBeCloseTo(2);
  });
});
