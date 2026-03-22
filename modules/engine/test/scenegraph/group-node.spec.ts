import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { GroupNode, ScenegraphNode, ModelNode, Model } from '@luma.gl/engine';
import { Matrix4 } from '@math.gl/core';
import { DUMMY_VS, DUMMY_FS } from './model-node.spec';
test('GroupNode#construction', async () => {
  const grandChild = new ScenegraphNode();
  const child1 = new GroupNode([grandChild]);
  const child2 = new GroupNode();
  const groupNode = new GroupNode({
    children: [child1, child2]
  });
  const invalidNode = {
    id: 'invalidNode'
  };
  expect(child1 instanceof GroupNode, 'construction with array is successful').toBeTruthy();
  expect(groupNode instanceof GroupNode, 'construction with object is successful').toBeTruthy();

  // @ts-expect-error
  expect(() => new GroupNode({
    children: [invalidNode]
  })).toThrow();
  // @ts-expect-error
  expect(() => new GroupNode({
    children: [invalidNode, child1]
  })).toThrow();
  // @ts-expect-error
  expect(() => new GroupNode({
    children: [child1, invalidNode]
  })).toThrow();
});
test('GroupNode#add', async () => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();

  // @ts-expect-error Need to fix nested types
  groupNode.add([child1, [child2, child3]]);
  expect(groupNode.children.length === 3, 'add: should unpack nested arrays').toBeTruthy();
});
test('GroupNode#remove', async () => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();
  groupNode.add([child1, child2]);
  groupNode.remove(child3);
  expect(groupNode.children.length === 2, 'remove: should ignore non child node').toBeTruthy();
  groupNode.remove(child2);
  expect(groupNode.children.length === 1, 'remove: should remove child').toBeTruthy();
});
test('GroupNode#removeAll', async () => {
  const child1 = new GroupNode();
  const child2 = new GroupNode();
  const child3 = new GroupNode();
  const groupNode = new GroupNode();
  groupNode.add([child1, child2, child3]);
  groupNode.removeAll();
  expect(groupNode.children.length === 0, 'removeAll: should remove all').toBeTruthy();
});
test('GroupNode#destroy', async () => {
  const grandChild = new GroupNode();
  const child1 = new GroupNode([grandChild]);
  const child2 = new GroupNode();
  const groupNode = new GroupNode({
    children: [child1, child2]
  });
  groupNode.destroy();
  expect(groupNode.children.length === 0, 'destroy: should remove all').toBeTruthy();
  expect(child1.children.length === 0, 'destroy: should destroy children').toBeTruthy();
});
test('GroupNode#traverse', async () => {
  const modelMatrices = {};
  const matrix = new Matrix4().identity().scale(2);
  function visitor(child, opts) {
    modelMatrices[child.id] = opts.worldMatrix;
  }
  const childSNode = new ScenegraphNode({
    id: 'childSNode'
  });
  const grandChildSNode = new ScenegraphNode({
    id: 'grandChildSNode'
  });
  const child1 = new GroupNode({
    id: 'child-1',
    matrix,
    children: [grandChildSNode]
  });
  const groupNode = new GroupNode({
    id: 'parent',
    matrix,
    children: [child1, childSNode]
  });
  groupNode.traverse(visitor);
  expect(modelMatrices[childSNode.id], 'should update child matrix').toEqual(matrix);
  expect(modelMatrices[grandChildSNode.id], 'should update grand child matrix').toEqual(new Matrix4().identity().scale(4));
});
test('GroupNode#getBounds', async () => {
  const device = await getWebGLTestDevice();
  const matrix = new Matrix4().translate([0, 0, 1]).scale(2);
  const model1 = new Model(device, {
    id: 'childSNode',
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });
  const model2 = new Model(device, {
    id: 'grandChildSNode',
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });
  const childSNode = new ModelNode({
    model: model1
  });
  const grandChildSNode = new ModelNode({
    model: model2
  });
  const child1 = new GroupNode({
    id: 'child-1',
    matrix,
    children: [grandChildSNode]
  });
  const groupNode = new GroupNode({
    id: 'parent',
    matrix,
    children: [child1, childSNode]
  });
  expect(groupNode.getBounds(), 'child bounds are not defined').toEqual(null);
  childSNode.bounds = [[0, 0, 0], [1, 1, 1]];
  grandChildSNode.bounds = [[-1, -1, -1], [0, 0, 0]];
  expect(groupNode.getBounds(), 'bounds calculated').toEqual([[-4, -4, -1], [2, 2, 3]]);
});
