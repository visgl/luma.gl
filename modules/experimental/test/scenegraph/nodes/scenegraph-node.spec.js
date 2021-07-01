// Copyright (c) 2015 - 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

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
    // @ts-ignore props is not documented
    t.deepEqual(sgNode.props[key], PROPS[key], `prop: ${key} should get set on the object.props`);
    t.deepEqual(sgNode[key], PROPS[key], `prop: ${key} should get set on the object`);
  }
  t.end();
});

test('ScenegraphNode#delete', (t) => {
  const sgNode = new ScenegraphNode();
  t.doesNotThrow(() => sgNode.delete(), 'delete should work');

  t.end();
});

test('ScenegraphNode#setProps', (t) => {
  const sgNode = new ScenegraphNode();
  sgNode.setProps(PROPS);
  for (const key in PROPS) {
    // @ts-ignore props is not documented
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

  // @ts-ignore
  t.throws(() => sgNode.getCoordinateUniforms(), 'should throw on missing viewMatrix');

  const uniforms = sgNode.getCoordinateUniforms(new Matrix4());
  t.ok(uniforms.viewMatrix, 'should return viewMatrix');
  t.ok(uniforms.modelMatrix, 'should return modelMatrix');
  t.ok(uniforms.objectMatrix, 'should return objectMatrix');
  t.ok(uniforms.worldMatrix, 'should return worldMatrix');
  t.ok(uniforms.worldInverseMatrix, 'should return worldInverseMatrix');
  t.ok(uniforms.worldInverseTransposeMatrix, 'should return worldInverseTransposeMatrix');

  t.end();
});
