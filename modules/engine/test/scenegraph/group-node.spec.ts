// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {GroupNode, ScenegraphNode, ModelNode, Model} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {DUMMY_VS, DUMMY_FS} from './model-node.spec';
import {expect, it} from 'vitest';

it('GroupNode#construction', async () => {
  const grandChild = new ScenegraphNode();
  const child1 = new GroupNode([grandChild]);
  const child2 = new GroupNode();
  const groupNode = new GroupNode({children: [child1, child2]});
  const invalidNode = {id: 'invalidNode'};

  expect(child1 instanceof GroupNode, 'construction with array is successful').toBe(true);
  expect(groupNode instanceof GroupNode, 'construction with object is successful').toBe(true);

  // @ts-expect-error
  expect(() => new GroupNode({children: [invalidNode]})).toThrow();
  // @ts-expect-error
  expect(() => new GroupNode({children: [invalidNode, child1]})).toThrow();
  // @ts-expect-error
  expect(() => new GroupNode({children: [child1, invalidNode]})).toThrow();
});

it('GroupNode#add', async () => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();

  // @ts-expect-error Need to fix nested types
  groupNode.add([child1, [child2, child3]]);

  expect(groupNode.children.length === 3, 'add: should unpack nested arrays').toBe(true);
});

it('GroupNode#remove', async () => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();

  groupNode.add([child1, child2]);

  groupNode.remove(child3);
  expect(groupNode.children.length === 2, 'remove: should ignore non child node').toBe(true);

  groupNode.remove(child2);
  expect(groupNode.children.length === 1, 'remove: should remove child').toBe(true);
});

it('GroupNode#removeAll', async () => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();
  groupNode.add([child1, child2, child3]);

  groupNode.removeAll();

  expect(groupNode.children.length === 0, 'removeAll: should remove all').toBe(true);
});

it('GroupNode#destroy', async () => {
  const grandChild = new GroupNode();
  const child1 = new GroupNode([grandChild]);
  const child2 = new GroupNode();
  const groupNode = new GroupNode({children: [child1, child2]});

  groupNode.destroy();

  expect(groupNode.children.length === 0, 'destroy: should remove all').toBe(true);
  expect(child1.children.length === 0, 'destroy: should destroy children').toBe(true);
});

it('GroupNode#traverse', async () => {
  const modelMatrices = {};
  const matrix = new Matrix4().identity().scale(2);

  function visitor(child, opts) {
    modelMatrices[child.id] = opts.worldMatrix;
  }

  const childSNode = new ScenegraphNode({id: 'childSNode'});
  const grandChildSNode = new ScenegraphNode({id: 'grandChildSNode'});
  const child1 = new GroupNode({id: 'child-1', matrix, children: [grandChildSNode]});
  const groupNode = new GroupNode({id: 'parent', matrix, children: [child1, childSNode]});

  groupNode.traverse(visitor);

  expect(modelMatrices[childSNode.id], 'should update child matrix').toEqual(matrix);
  expect(modelMatrices[grandChildSNode.id], 'should update grand child matrix').toEqual(
    new Matrix4().identity().scale(4)
  );
});

it('GroupNode#getBounds', async () => {
  const device = await getWebGLTestDevice();

  const matrix = new Matrix4().translate([0, 0, 1]).scale(2);

  const model1 = new Model(device, {id: 'childSNode', vs: DUMMY_VS, fs: DUMMY_FS});
  const model2 = new Model(device, {id: 'grandChildSNode', vs: DUMMY_VS, fs: DUMMY_FS});
  const childSNode = new ModelNode({model: model1});
  const grandChildSNode = new ModelNode({model: model2});
  const child1 = new GroupNode({id: 'child-1', matrix, children: [grandChildSNode]});
  const groupNode = new GroupNode({id: 'parent', matrix, children: [child1, childSNode]});

  expect(groupNode.getBounds(), 'child bounds are not defined').toBeNull();

  childSNode.bounds = [
    [0, 0, 0],
    [1, 1, 1]
  ];
  grandChildSNode.bounds = [
    [-1, -1, -1],
    [0, 0, 0]
  ];

  expect(groupNode.getBounds(), 'bounds calculated').toEqual([
    [-4, -4, -1],
    [2, 2, 3]
  ]);
});

it('GroupNode#getBounds applies leaf transforms and rotated box corners', async () => {
  const device = await getWebGLTestDevice();
  const model = new Model(device, {vs: DUMMY_VS, fs: DUMMY_FS});
  const node = new ModelNode({
    model,
    bounds: [
      [-1, -2, -1],
      [1, 2, 1]
    ],
    matrix: new Matrix4().translate([3, 0, 0]).rotateZ(Math.PI / 4)
  });
  const group = new GroupNode({
    matrix: new Matrix4().translate([0, 2, 0]),
    children: [node]
  });
  const bounds = group.getBounds();
  const rotatedHalfExtent = 3 / Math.sqrt(2);

  expect(bounds, 'transformed model contributes bounds').toBeTruthy();
  expect(
    Math.abs(bounds![0][0] - (3 - rotatedHalfExtent)) < 0.000001 &&
      Math.abs(bounds![1][0] - (3 + rotatedHalfExtent)) < 0.000001,
    'all rotated horizontal corners contribute to the aggregate bounds'
  ).toBe(true);
  expect(
    Math.abs(bounds![0][1] - (2 - rotatedHalfExtent)) < 0.000001 &&
      Math.abs(bounds![1][1] - (2 + rotatedHalfExtent)) < 0.000001,
    'leaf and parent transforms are included in world-space bounds'
  ).toBe(true);

  group.destroy();
});

it('GroupNode#traverseDepthSorted orders transformed leaf bounds by camera depth', async () => {
  const nearNode = new ScenegraphNode({
    id: 'near',
    matrix: new Matrix4().translate([0, 0, -2])
  });
  const middleNode = new ScenegraphNode({
    id: 'middle',
    matrix: new Matrix4().translate([0, 0, -3])
  });
  const farNode = new ScenegraphNode({
    id: 'far',
    matrix: new Matrix4().translate([0, 0, -9])
  });

  for (const node of [nearNode, middleNode, farNode]) {
    node.getBounds = () => [
      [-1, -1, -1],
      [1, 1, 1]
    ];
  }

  const group = new GroupNode({
    children: [
      nearNode,
      new GroupNode({matrix: new Matrix4().translate([0, 0, -2]), children: [middleNode]}),
      farNode
    ]
  });
  const backToFrontIds: string[] = [];
  const depths: number[] = [];

  group.traverseDepthSorted(
    (node, context) => {
      backToFrontIds.push(node.id);
      depths.push(context.depth);
    },
    {viewMatrix: new Matrix4()}
  );

  expect(backToFrontIds, 'default traversal visits far nodes first').toEqual([
    'far',
    'middle',
    'near'
  ]);
  expect(depths, 'nested and leaf transforms contribute to camera depth').toEqual([9, 5, 2]);

  const frontToBackIds: string[] = [];
  group.traverseDepthSorted((node: ScenegraphNode) => frontToBackIds.push(node.id), {
    viewMatrix: new Matrix4(),
    order: 'front-to-back'
  });
  expect(frontToBackIds, 'front-to-back traversal is available').toEqual(['near', 'middle', 'far']);

  const reverseViewIds: string[] = [];
  group.traverseDepthSorted((node: ScenegraphNode) => reverseViewIds.push(node.id), {
    viewMatrix: new Matrix4().lookAt({eye: [0, 0, -20], center: [0, 0, 0], up: [0, 1, 0]})
  });
  expect(
    reverseViewIds,
    'camera direction determines ordering instead of fixed world-space depth'
  ).toEqual(['near', 'middle', 'far']);
});
