// luma.gl, MIT license

import test from 'tape-promise/tape';
import {ScenegraphNode} from '@luma.gl/experimental';
import {Matrix4, Vector3} from '@math.gl/core';

const PROPS = {
  display: true,
  position: new Vector3(1, 1, 1),
  rotation: new Vector3(2, 2, 2),
  scale: new Vector3(3, 3, 3),
  matrix: new Matrix4().scale(4)
};

test('ScenegraphNode#constructor', (t) => {
  const sgNode = new ScenegraphNode(PROPS);
  t.ok(sgNode instanceof ScenegraphNode, 'should construct the object');
  for (const key in PROPS) {
    t.deepEqual(sgNode.props[key], PROPS[key], `prop: ${key} should get set on the object.props`);
    t.deepEqual(sgNode[key], PROPS[key], `prop: ${key} should get set on the object`);
  }
  t.end();
});

test('ScenegraphNode#delete', (t) => {
  const sgNode = new ScenegraphNode();
  t.doesNotThrow(() => sgNode.destroy(), 'delete should work');

  t.end();
});

test('ScenegraphNode#setProps', (t) => {
  const sgNode = new ScenegraphNode();
  sgNode.setProps(PROPS);
  for (const key in PROPS) {
    t.deepEqual(sgNode.props[key], PROPS[key], `prop: ${key} should get set on the object.props`);
    t.deepEqual(sgNode[key], PROPS[key], `prop: ${key} should get set on the object`);
  }
  t.end();
});

test('ScenegraphNode#toString', (t) => {
  const sgNode = new ScenegraphNode();
  t.doesNotThrow(() => sgNode.toString(), 'delete should work');

  t.end();
});

test('ScenegraphNode#setMatrix', (t) => {
  const sgNode = new ScenegraphNode();
  const matrix = new Matrix4().scale(1.5);

  sgNode.setMatrix(matrix);
  t.deepEqual(sgNode.matrix, matrix, 'should copy the matrix');

  sgNode.setMatrix(matrix, false);
  t.equal(sgNode.matrix, matrix, 'should asign the matrix');

  t.end();
});

test('ScenegraphNode#setMatrixComponents', (t) => {
  const sgNode = new ScenegraphNode();
  const position = new Vector3(1, 1, 1);
  const rotation = new Vector3(2, 2, 2);
  const scale = new Vector3(3, 3, 3);

  sgNode.setMatrixComponents({update: false});
  t.deepEqual(sgNode.matrix, new Matrix4(), 'should not update the matrix');

  sgNode.setMatrixComponents({position, rotation, scale});
  t.deepEqual(
    sgNode.matrix,
    new Matrix4().translate(position).rotateXYZ(rotation).scale(scale),
    'should update the matrix'
  );

  t.end();
});

test('ScenegraphNode#update', (t) => {
  const sgNode = new ScenegraphNode();
  const position = new Vector3(1, 1, 1);
  const rotation = new Vector3(2, 2, 2);
  const scale = new Vector3(3, 3, 3);

  sgNode.update();
  t.deepEqual(sgNode.matrix, new Matrix4(), 'should update the matrix');

  sgNode.update({position, rotation, scale});
  t.deepEqual(
    sgNode.matrix,
    new Matrix4().translate(position).rotateXYZ(rotation).scale(scale),
    'should update the matrix'
  );

  t.end();
});

test('ScenegraphNode#getCoordinateUniforms', (t) => {
  const sgNode = new ScenegraphNode();

  const uniforms = sgNode.getCoordinateUniforms(new Matrix4());
  t.ok(uniforms.viewMatrix, 'should return viewMatrix');
  t.ok(uniforms.modelMatrix, 'should return modelMatrix');
  t.ok(uniforms.objectMatrix, 'should return objectMatrix');
  t.ok(uniforms.worldMatrix, 'should return worldMatrix');
  t.ok(uniforms.worldInverseMatrix, 'should return worldInverseMatrix');
  t.ok(uniforms.worldInverseTransposeMatrix, 'should return worldInverseTransposeMatrix');

  t.end();
});
