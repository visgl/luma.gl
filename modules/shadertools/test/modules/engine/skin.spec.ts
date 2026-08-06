// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GroupNode} from '@luma.gl/engine';
import {SKIN_MAX_JOINTS, skin} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('shadertools#skin returns empty uniforms without a glTF skin', t => {
  t.deepEqual(
    skin.getUniforms({
      scenegraphsFromGLTF: {
        gltf: {}
      }
    }),
    {jointMatrix: []},
    'Returns an empty joint matrix when no skin data is available'
  );

  t.end();
});

test('shadertools#skin packs joint matrices from the scenegraph', t => {
  const skeletonRootNode = new GroupNode({id: 'skeleton-root', position: [1, 0, 0]});
  const jointNode = new GroupNode({id: 'joint-0', position: [0, 2, 0]});
  skeletonRootNode.add(jointNode);

  const expectedJointMatrix = new Matrix4(skeletonRootNode.matrix).multiplyRight(jointNode.matrix);
  const inverseBindMatrices = new Float32Array(Array.from(new Matrix4()));

  const uniforms = skin.getUniforms({
    scenegraphsFromGLTF: {
      gltf: {
        skins: [
          {
            inverseBindMatrices: {value: inverseBindMatrices},
            joints: [1],
            skeleton: 0
          }
        ]
      },
      gltfNodeIndexToNodeMap: new Map([
        [0, skeletonRootNode],
        [1, jointNode]
      ])
    }
  });

  t.ok(uniforms.jointMatrix instanceof Float32Array, 'Returns a packed joint matrix buffer');
  t.deepEqual(
    Array.from(uniforms.jointMatrix!.slice(0, 16)),
    Array.from(expectedJointMatrix),
    'Writes the world matrix for the first joint'
  );
  t.deepEqual(
    Array.from(uniforms.jointMatrix!.slice(16, 32)),
    Array.from(new Float32Array(16)),
    'Leaves unused joint matrix slots zeroed'
  );

  t.end();
});

test('shadertools#skin supports Fox-sized skeletons beyond the previous 20-joint limit', t => {
  const skeletonRoot = new GroupNode({id: 'skeleton-root'});
  const nodes = new Map<number, GroupNode>([[0, skeletonRoot]]);
  const joints: number[] = [];
  for (let jointIndex = 0; jointIndex < 24; jointIndex++) {
    const nodeIndex = jointIndex + 1;
    const joint = new GroupNode({id: `joint-${jointIndex}`, position: [nodeIndex, 0, 0]});
    skeletonRoot.add(joint);
    nodes.set(nodeIndex, joint);
    joints.push(nodeIndex);
  }

  const uniforms = skin.getUniforms({
    scenegraphsFromGLTF: {
      gltf: {skins: [{joints, skeleton: 0}]},
      gltfNodeIndexToNodeMap: nodes
    }
  });

  t.equal(uniforms.jointMatrix?.length, SKIN_MAX_JOINTS * 16, 'allocates a portable joint palette');
  t.equal(uniforms.jointMatrix?.[23 * 16 + 12], 24, 'retains the final Fox-sized skeleton joint');
  t.end();
});

test('shadertools#skin selects independent skins and defaults missing bind matrices', t => {
  const firstRoot = new GroupNode({id: 'first-root', position: [3, 0, 0]});
  const firstJoint = new GroupNode({id: 'first-joint', position: [1, 0, 0]});
  firstRoot.add(firstJoint);
  const secondRoot = new GroupNode({id: 'second-root', position: [10, 0, 0]});
  const secondJoint = new GroupNode({id: 'second-joint', position: [2, 0, 0]});
  secondRoot.add(secondJoint);

  const uniforms = skin.getUniforms({
    skinIndex: 1,
    meshWorldMatrix: new Matrix4().translate([10, 0, 0]),
    scenegraphsFromGLTF: {
      gltf: {skins: [{joints: [1], skeleton: 0}, {joints: [3]}]},
      scenes: [firstRoot, secondRoot],
      gltfNodeIndexToNodeMap: new Map([
        [0, firstRoot],
        [1, firstJoint],
        [2, secondRoot],
        [3, secondJoint]
      ])
    }
  });

  t.equal(uniforms.jointMatrix?.[12], 2, 'selects the requested skin in mesh-local space');
  t.end();
});

test('shadertools#skin accepts a format-independent precomputed joint palette', t => {
  const jointMatrices = new Float32Array(new Matrix4().translate([7, 0, 0]));
  const uniforms = skin.getUniforms({jointMatrices});

  t.equal(uniforms.jointMatrix?.[12], 7, 'preserves precomputed joint transforms');
  t.equal(uniforms.jointMatrix?.length, SKIN_MAX_JOINTS * 16, 'pads the uniform palette');
  t.end();
});
