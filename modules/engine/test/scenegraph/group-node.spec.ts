// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {GroupNode, ScenegraphNode, ModelNode, Model} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {DUMMY_VS, DUMMY_FS} from './model-node.spec';

test('GroupNode#construction', async t => {
  const grandChild = new ScenegraphNode();
  const child1 = new GroupNode([grandChild]);
  const child2 = new GroupNode();
  const groupNode = new GroupNode({children: [child1, child2]});
  const invalidNode = {id: 'invalidNode'};

  t.ok(child1 instanceof GroupNode, 'construction with array is successful');
  t.ok(groupNode instanceof GroupNode, 'construction with object is successful');

  // @ts-expect-error
  t.throws(() => new GroupNode({children: [invalidNode]}));
  // @ts-expect-error
  t.throws(() => new GroupNode({children: [invalidNode, child1]}));
  // @ts-expect-error
  t.throws(() => new GroupNode({children: [child1, invalidNode]}));
  t.end();
});

test('GroupNode#add', async t => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();

  // @ts-expect-error Need to fix nested types
  groupNode.add([child1, [child2, child3]]);

  t.ok(groupNode.children.length === 3, 'add: should unpack nested arrays');
  t.end();
});

test('GroupNode#remove', async t => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();

  groupNode.add([child1, child2]);

  groupNode.remove(child3);
  t.ok(groupNode.children.length === 2, 'remove: should ignore non child node');

  groupNode.remove(child2);
  t.ok(groupNode.children.length === 1, 'remove: should remove child');
  t.end();
});

test('GroupNode#removeAll', async t => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();
  groupNode.add([child1, child2, child3]);

  groupNode.removeAll();

  t.ok(groupNode.children.length === 0, 'removeAll: should remove all');
  t.end();
});

test('GroupNode#destroy', async t => {
  const grandChild = new GroupNode();
  const child1 = new GroupNode([grandChild]);
  const child2 = new GroupNode();
  const groupNode = new GroupNode({children: [child1, child2]});

  groupNode.destroy();

  t.ok(groupNode.children.length === 0, 'destroy: should remove all');
  t.ok(child1.children.length === 0, 'destroy: should destroy children');
  t.end();
});

test('GroupNode#traverse', async t => {
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

  t.deepEqual(modelMatrices[childSNode.id], matrix, 'should update child matrix');
  t.deepEqual(
    modelMatrices[grandChildSNode.id],
    new Matrix4().identity().scale(4),
    'should update grand child matrix'
  );

  t.end();
});

test('GroupNode#getBounds', async t => {
  const device = await getWebGLTestDevice();

  const matrix = new Matrix4().translate([0, 0, 1]).scale(2);

  const model1 = new Model(device, {id: 'childSNode', vs: DUMMY_VS, fs: DUMMY_FS});
  const model2 = new Model(device, {id: 'grandChildSNode', vs: DUMMY_VS, fs: DUMMY_FS});
  const childSNode = new ModelNode({model: model1});
  const grandChildSNode = new ModelNode({model: model2});
  const child1 = new GroupNode({id: 'child-1', matrix, children: [grandChildSNode]});
  const groupNode = new GroupNode({id: 'parent', matrix, children: [child1, childSNode]});

  t.deepEqual(groupNode.getBounds(), null, 'child bounds are not defined');

  childSNode.bounds = [
    [0, 0, 0],
    [1, 1, 1]
  ];
  grandChildSNode.bounds = [
    [-1, -1, -1],
    [0, 0, 0]
  ];

  t.deepEqual(
    groupNode.getBounds(),
    [
      [-4, -4, -1],
      [2, 2, 3]
    ],
    'bounds calculated'
  );
  t.end();
});

test('GroupNode#getBounds applies leaf transforms and rotated box corners', async t => {
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

  t.ok(bounds, 'transformed model contributes bounds');
  t.ok(
    Math.abs(bounds![0][0] - (3 - rotatedHalfExtent)) < 0.000001 &&
      Math.abs(bounds![1][0] - (3 + rotatedHalfExtent)) < 0.000001,
    'all rotated horizontal corners contribute to the aggregate bounds'
  );
  t.ok(
    Math.abs(bounds![0][1] - (2 - rotatedHalfExtent)) < 0.000001 &&
      Math.abs(bounds![1][1] - (2 + rotatedHalfExtent)) < 0.000001,
    'leaf and parent transforms are included in world-space bounds'
  );

  group.destroy();
  t.end();
});

test('GroupNode#traverseDepthSorted orders transformed leaf bounds by camera depth', async t => {
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

  t.deepEqual(
    backToFrontIds,
    ['far', 'middle', 'near'],
    'default traversal visits far nodes first'
  );
  t.deepEqual(depths, [9, 5, 2], 'nested and leaf transforms contribute to camera depth');

  const frontToBackIds: string[] = [];
  group.traverseDepthSorted((node: ScenegraphNode) => frontToBackIds.push(node.id), {
    viewMatrix: new Matrix4(),
    order: 'front-to-back'
  });
  t.deepEqual(frontToBackIds, ['near', 'middle', 'far'], 'front-to-back traversal is available');

  const reverseViewIds: string[] = [];
  group.traverseDepthSorted((node: ScenegraphNode) => reverseViewIds.push(node.id), {
    viewMatrix: new Matrix4().lookAt({eye: [0, 0, -20], center: [0, 0, 0], up: [0, 1, 0]})
  });
  t.deepEqual(
    reverseViewIds,
    ['near', 'middle', 'far'],
    'camera direction determines ordering instead of fixed world-space depth'
  );

  t.end();
});
