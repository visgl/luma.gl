// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GroupNode, updateSkinJointMatrices} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('Animation#updateSkinJointMatrices evaluates shared joints in mesh-local space', testContext => {
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

  testContext.equal(jointMatrices, target, 'reuses adapter-owned output storage');
  testContext.equal(jointMatrices[12], 1, 'evaluates the first joint relative to the skinned mesh');
  testContext.equal(jointMatrices[16 + 13], 2, 'applies authored inverse bind transforms');

  worldMatrices.set(secondJoint, new Matrix4().translate([10, 7, 0]));
  updateSkinJointMatrices({
    joints: [firstJoint, secondJoint],
    meshNode,
    worldMatrices,
    inverseBindMatrices,
    target
  });

  testContext.equal(jointMatrices[16 + 13], 5, 'updates animated joints without reallocating');
  testContext.end();
});

test('Animation#updateSkinJointMatrices defaults missing inverse bind matrices', testContext => {
  const joint = new GroupNode({id: 'joint', position: [0, 3, 0]});
  const matrices = updateSkinJointMatrices({
    joints: [joint],
    worldMatrices: new Map([[joint, new Matrix4().translate([0, 3, 0])]])
  });

  testContext.equal(matrices.length, 16, 'allocates only the authored joint palette');
  testContext.equal(matrices[13], 3, 'uses an identity inverse bind transform by default');
  testContext.end();
});
