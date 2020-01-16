import test from 'tape-catch';
import GL from '@luma.gl/constants';
import {VertexArray, VertexArrayObject, Buffer, Program} from '@luma.gl/webgl';

import {fixture} from 'test/setup';

const BUFFER_DATA = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);

test('WebGL#VertexArray construct/delete', t => {
  const {gl} = fixture;

  t.throws(() => new VertexArray(), 'VertexArray throws on missing gl context');

  const vao = new VertexArray(gl);
  t.ok(vao instanceof VertexArray, 'VertexArray construction successful');

  vao.delete();
  t.ok(vao instanceof VertexArray, 'VertexArray delete successful');

  vao.delete();
  t.ok(vao instanceof VertexArray, 'VertexArray repeated delete successful');

  t.end();
});

test('WebGL#VertexArray#enable', t => {
  const {gl} = fixture;

  const vertexArray = new VertexArray(gl);

  const MAX_ATTRIBUTES = VertexArrayObject.getMaxAttributes(gl);
  t.ok(MAX_ATTRIBUTES >= 8, 'vertexArray.getMaxAttributes() >= 8');

  for (let i = 1; i < MAX_ATTRIBUTES; i++) {
    const param = vertexArray.vertexArrayObject.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {
      location: i
    });
    t.equal(param, false, `vertex attribute ${i} should initially be disabled`);
  }

  t.end();
});

test('WebGL#VertexArray#setAttributes(unused)', t => {
  const {gl} = fixture;

  const vertexArray = new VertexArray(gl);
  vertexArray.setAttributes({
    unusedAttributeName: new Buffer(gl, {
      target: GL.ARRAY_BUFFER,
      data: BUFFER_DATA,
      accessor: {size: 3}
    })
  });
  t.ok(vertexArray instanceof VertexArray, 'VertexArray set buffers successful');

  t.end();
});

test('WebGL#VertexArray#_getAttributeIndex', t => {
  const {gl} = fixture;

  const vertexArray = new VertexArray(gl);
  vertexArray.setProps({
    configuration: {
      getAttributeLocation: () => 1
    }
  });

  const matrix = vertexArray._getAttributeIndex('matrix');
  t.equal(matrix.location, 1, 'Bad location');
  t.equal(matrix.name, 'matrix', 'Bad name');

  const matrix0 = vertexArray._getAttributeIndex('matrix__LOCATION_0');
  t.equal(matrix0.location, 1, 'Bad location');
  t.equal(matrix0.name, 'matrix', 'Bad name');

  const matrix1 = vertexArray._getAttributeIndex('matrix__LOCATION_1');
  t.equal(matrix1.location, 2, 'Bad location');
  t.equal(matrix1.name, 'matrix', 'Bad name');

  t.end();
});

test('WebGL#VertexArray#constant multi-column attribute', t => {
  const {gl} = fixture;

  const vs = `
  attribute mat4 matrix;

  void main() {
    gl_Position = matrix[0];
  }
  `;

  const fs = `
  void main() {
    gl_FragColor = vec4(1.0);
  }
  `;

  const program = new Program(gl, {vs, fs});

  const vertexArray = new VertexArray(gl, {
    program
  });

  vertexArray.setAttributes({
    matrix__LOCATION_0: new Float32Array([1, 0, 0, 0]),
    matrix__LOCATION_1: new Float32Array([0, 1, 0, 0]),
    matrix__LOCATION_2: new Float32Array([0, 0, 1, 0]),
    matrix__LOCATION_3: new Float32Array([0, 0, 0, 1])
  });

  const location = vertexArray.configuration.getAttributeLocation('matrix');

  t.equal(vertexArray.accessors[location].size, 4, 'Column 0 of correct size');
  t.equal(vertexArray.accessors[location + 1].size, 4, 'Column 1 of correct size');
  t.equal(vertexArray.accessors[location + 2].size, 4, 'Column 2 of correct size');
  t.equal(vertexArray.accessors[location + 3].size, 4, 'Column 3 of correct size');

  t.end();
});
