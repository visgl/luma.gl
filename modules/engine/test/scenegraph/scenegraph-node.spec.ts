import {expect, test} from 'vitest';
import { ScenegraphNode } from '@luma.gl/engine';
import { Matrix4, Vector3 } from '@math.gl/core';
const PROPS = {
  display: true,
  position: new Vector3(1, 1, 1),
  rotation: new Vector3(2, 2, 2),
  scale: new Vector3(3, 3, 3),
  matrix: new Matrix4().scale(4)
};
test('ScenegraphNode#constructor', () => {
  const sgNode = new ScenegraphNode(PROPS);
  expect(sgNode instanceof ScenegraphNode, 'should construct the object').toBeTruthy();
  for (const key in PROPS) {
    expect(sgNode.props[key], `prop: ${key} should get set on the object.props`).toEqual(PROPS[key]);
    expect(sgNode[key], `prop: ${key} should get set on the object`).toEqual(PROPS[key]);
  }
});
test('ScenegraphNode#delete', () => {
  const sgNode = new ScenegraphNode();
  expect(() => sgNode.destroy(), 'delete should work').not.toThrow();
});
test('ScenegraphNode#setProps', () => {
  const sgNode = new ScenegraphNode();
  sgNode.setProps(PROPS);
  for (const key in PROPS) {
    expect(sgNode.props[key], `prop: ${key} should get set on the object.props`).toEqual(PROPS[key]);
    expect(sgNode[key], `prop: ${key} should get set on the object`).toEqual(PROPS[key]);
  }
});
test('ScenegraphNode#toString', () => {
  const sgNode = new ScenegraphNode();
  expect(() => sgNode.toString(), 'delete should work').not.toThrow();
});
test('ScenegraphNode#setMatrix', () => {
  const sgNode = new ScenegraphNode();
  const matrix = new Matrix4().scale(1.5);
  sgNode.setMatrix(matrix);
  expect(sgNode.matrix, 'should copy the matrix').toEqual(matrix);
  sgNode.setMatrix(matrix, false);
  expect(sgNode.matrix, 'should asign the matrix').toBe(matrix);
});
test('ScenegraphNode#setMatrixComponents', () => {
  const sgNode = new ScenegraphNode();
  const position = new Vector3(1, 1, 1);
  const rotation = new Vector3(2, 2, 2);
  const scale = new Vector3(3, 3, 3);
  sgNode.setMatrixComponents({
    update: false
  });
  expect(sgNode.matrix, 'should not update the matrix').toEqual(new Matrix4());
  sgNode.setMatrixComponents({
    position,
    rotation,
    scale
  });
  expect(sgNode.matrix, 'should update the matrix').toEqual(new Matrix4().translate(position).rotateXYZ(rotation).scale(scale));
});
test('ScenegraphNode#update', () => {
  const sgNode = new ScenegraphNode();
  const position = new Vector3(1, 1, 1);
  const rotation = new Vector3(2, 2, 2);
  const scale = new Vector3(3, 3, 3);
  sgNode.update();
  expect(sgNode.matrix, 'should update the matrix').toEqual(new Matrix4());
  sgNode.update({
    position,
    rotation,
    scale
  });
  expect(sgNode.matrix, 'should update the matrix').toEqual(new Matrix4().translate(position).rotateXYZ(rotation).scale(scale));
});
test('ScenegraphNode#getCoordinateUniforms', () => {
  const sgNode = new ScenegraphNode();
  const uniforms = sgNode.getCoordinateUniforms(new Matrix4());
  expect(uniforms.viewMatrix, 'should return viewMatrix').toBeTruthy();
  expect(uniforms.modelMatrix, 'should return modelMatrix').toBeTruthy();
  expect(uniforms.objectMatrix, 'should return objectMatrix').toBeTruthy();
  expect(uniforms.worldMatrix, 'should return worldMatrix').toBeTruthy();
  expect(uniforms.worldInverseMatrix, 'should return worldInverseMatrix').toBeTruthy();
  expect(uniforms.worldInverseTransposeMatrix, 'should return worldInverseTransposeMatrix').toBeTruthy();
});
