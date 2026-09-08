// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GroupNode, updateSkinJointMatrices} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('Animation#updateSkinJointMatrices evaluates shared joints in mesh-local space', () => {
  const meshNode = new GroupNode({id: 'mesh'});
  const firstJoint = new GroupNode({id: 'first-joint'});
  const secondJoint = new GroupNode({id: 'second-joint'});
  const worldMatrices = new Map([
    [meshNode, new Matrix4().translate([10, 0, 0])],
    [firstJoint, new Matrix4().translate([11, 0, 0])],
    [secondJoint, new Matrix4().translate([10, 4, 0])]
  ]);
  const inverseBindMatrices = new Float32Array([
    ...new Matrix4(),
    ...new Matrix4().translate([0, -2, 0])
  ]);
  const target = new Float32Array(32);

  const jointMatrices = updateSkinJointMatrices({
    joints: [firstJoint, secondJoint],
    meshNode,
    worldMatrices,
    inverseBindMatrices,
    target
  });

  expect(jointMatrices, 'reuses adapter-owned output storage').toBe(target);
  expect(jointMatrices[12], 'evaluates the first joint relative to the skinned mesh').toBe(1);
  expect(jointMatrices[16 + 13], 'applies authored inverse bind transforms').toBe(2);

  worldMatrices.set(secondJoint, new Matrix4().translate([10, 7, 0]));
  updateSkinJointMatrices({
    joints: [firstJoint, secondJoint],
    meshNode,
    worldMatrices,
    inverseBindMatrices,
    target
  });

  expect(jointMatrices[16 + 13], 'updates animated joints without reallocating').toBe(5);
});

it('Animation#updateSkinJointMatrices defaults missing inverse bind matrices', () => {
  const joint = new GroupNode({id: 'joint', position: [0, 3, 0]});
  const matrices = updateSkinJointMatrices({
    joints: [joint],
    worldMatrices: new Map([[joint, new Matrix4().translate([0, 3, 0])]])
  });

  expect(matrices.length, 'allocates only the authored joint palette').toBe(16);
  expect(matrices[13], 'uses an identity inverse bind transform by default').toBe(3);
});
