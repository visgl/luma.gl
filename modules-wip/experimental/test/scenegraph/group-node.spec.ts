// luma.gl, MIT license

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';
import {GroupNode, ScenegraphNode, ModelNode} from '@luma.gl/experimental';
import {Matrix4} from '@math.gl/core';
import {DUMMY_VS, DUMMY_FS} from './model-node.spec';

test('GroupNode#construction', (t) => {
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

test('GroupNode#add', (t) => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();

  // @ts-expect-error Need to fix nested types
  groupNode.add([child1, [child2, child3]]);

  t.ok(groupNode.children.length === 3, 'add: should unpack nested arrays');
  t.end();
});

test('GroupNode#remove', (t) => {
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

test('GroupNode#removeAll', (t) => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();
  groupNode.add([child1, child2, child3]);

  groupNode.removeAll();

  t.ok(groupNode.children.length === 0, 'removeAll: should remove all');
  t.end();
});

test('GroupNode#destroy', (t) => {
  const grandChild = new GroupNode();
  const child1 = new GroupNode([grandChild]);
  const child2 = new GroupNode();
  const groupNode = new GroupNode({children: [child1, child2]});

  groupNode.destroy();

  t.ok(groupNode.children.length === 0, 'destroy: should remove all');
  t.ok(child1.children.length === 0, 'destroy: should destroy children');
  t.end();
});

test('GroupNode#traverse', (t) => {
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

test('GroupNode#getBounds', (t) => {
  for (const device of getWebGLTestDevices()) {
    const matrix = new Matrix4().translate([0, 0, 1]).scale(2);

    const childSNode = new ModelNode(device, {id: 'childSNode', vs: DUMMY_VS, fs: DUMMY_FS});
    const grandChildSNode = new ModelNode(device, {id: 'grandChildSNode', vs: DUMMY_VS, fs: DUMMY_FS});
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
  }
  t.end();
});
