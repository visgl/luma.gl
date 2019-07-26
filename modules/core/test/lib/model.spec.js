import GL from '@luma.gl/constants';
import luma from '@luma.gl/webgl/init';
// TODO - Model test should not depend on Cube
import {Buffer, Model, CubeGeometry} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture} from 'test/setup';

import {getBuffersFromGeometry} from '@luma.gl/core/lib/model-utils';

const stats = luma.stats.get('Resource Counts');

test('Model#construct/destruct', t => {
  const {gl} = fixture;

  const model = new Model(gl, {
    drawMode: GL.POINTS,
    vertexCount: 0
  });

  t.ok(model, 'Model constructor does not throw errors');
  t.ok(model.id, 'Model has an id');
  t.ok(model.getProgram().handle, 'Created new program');

  model.delete();
  t.notOk(model.vertexArray.handle, 'Deleted vertexArray');
  t.notOk(model.program.handle, 'Deleted program');

  t.end();
});

test('Model#setAttribute', t => {
  const {gl} = fixture;

  const buffer1 = new Buffer(gl, {accessor: {size: 2}, data: new Float32Array(4).fill(1)});
  const buffer2 = new Buffer(gl, {data: new Float32Array(8)});

  const initialActiveBuffers = stats.get('Buffers Active').count;

  const model = new Model(gl, {geometry: new CubeGeometry()});

  t.is(
    stats.get('Buffers Active').count - initialActiveBuffers,
    4,
    'Created new buffers for attributes'
  );

  model.setAttributes({
    instanceSizes: [buffer1, {size: 1}],
    instancePositions: buffer2,
    instanceWeight: new Float32Array([10]),
    instanceColors: {getValue: () => new Float32Array([0, 0, 0, 1])}
  });

  t.deepEqual(model.getAttributes(), {}, 'no longer stores local attributes');

  t.is(stats.get('Buffers Active').count - initialActiveBuffers, 4, 'Did not create new buffers');

  model.delete();

  buffer1.delete();
  buffer2.delete();

  t.end();
});

test('Model#setters, getters', t => {
  const {gl} = fixture;

  const model = new Model(gl);

  t.notOk(model.isAnimated(), 'model is not animated');

  model.setUniforms({
    isPickingActive: 1,
    rotationX: ({tick}) => (tick / 12) * 180
  });
  t.deepEqual(model.getUniforms(), {isPickingActive: 1}, 'uniforms are set');

  t.ok(model.isAnimated(), 'model is animated');

  model.setProps({
    _animationProps: {tick: 6}
  });
  t.deepEqual(model.getUniforms(), {isPickingActive: 1, rotationX: 90}, 'uniforms are set');

  model.setInstanceCount(4);
  t.is(model.getInstanceCount(), 4, 'instance count is set');

  model.setDrawMode(1);
  t.is(model.getDrawMode(), 1, 'draw mode is set');

  model.delete();

  t.end();
});

test('Model#draw', t => {
  const {gl} = fixture;

  const model = new Model(gl, {
    geometry: new CubeGeometry(),
    timerQueryEnabled: true
  });

  model.draw();

  model.render({
    isPickingActive: 1
  });
  t.deepEqual(model.getUniforms(), {isPickingActive: 1}, 'uniforms are set');

  t.end();
});

test('getBuffersFromGeometry', t => {
  const {gl} = fixture;

  let buffers = getBuffersFromGeometry(gl, {
    indices: new Uint16Array([0, 1, 2, 3]),
    attributes: {
      positions: {size: 3, value: new Float32Array(12)},
      colors: {constant: true, value: [255, 255, 255, 255]},
      uvs: {size: 2, value: new Float32Array(8)}
    }
  });

  t.deepEqual(buffers.colors, [255, 255, 255, 255], 'colors mapped');
  t.ok(buffers.positions[0] instanceof Buffer, 'positions mapped');
  t.is(buffers.positions[1].size, 3, 'positions mapped');
  t.ok(buffers.uvs[0] instanceof Buffer, 'uvs mapped');
  t.is(buffers.uvs[1].size, 2, 'uvs mapped');
  t.ok(buffers.indices[0] instanceof Buffer, 'indices mapped');

  buffers.positions[0].delete();
  buffers.uvs[0].delete();
  buffers.indices[0].delete();

  // Inferring attribute size
  buffers = getBuffersFromGeometry(gl, {
    attributes: {
      indices: {value: new Uint16Array([0, 1, 2, 3])},
      normals: {value: new Float32Array(12)},
      texCoords: {value: new Float32Array(8)}
    }
  });
  t.is(buffers.indices[1].size, 1, 'texCoords size');
  t.is(buffers.normals[1].size, 3, 'normals size');
  t.is(buffers.texCoords[1].size, 2, 'texCoords size');

  buffers.indices[0].delete();
  buffers.normals[0].delete();
  buffers.texCoords[0].delete();

  t.throws(
    () =>
      getBuffersFromGeometry(gl, {
        indices: [0, 1, 2, 3]
      }),
    'invalid indices'
  );

  t.throws(
    () =>
      getBuffersFromGeometry(gl, {
        attributes: {
          heights: {value: new Float32Array([0, 1, 2, 3])}
        }
      }),
    'invalid size'
  );

  t.end();
});
