import GL from '@luma.gl/constants';
import luma from '@luma.gl/webgl/init';
// TODO - Model test should not depend on Cube
import {Buffer, Model, CubeGeometry} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture} from 'test/setup';

const stats = luma.stats.get('Resource Counts');

test('Model#construct/destruct', t => {
  const {gl} = fixture;

  const model = new Model(gl, {
    drawMode: GL.POINTS,
    vertexCount: 0
  });

  t.ok(model, 'Model constructor does not throw errors');
  t.ok(model.id, 'Model has an id');
  t.ok(model.program.handle, 'Created new program');

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
    instanceWeight: new Float32Array([10])
  });

  t.is(stats.get('Buffers Active').count - initialActiveBuffers, 4, 'Did not create new buffers');

  model.delete();

  // TODO - restore this was broken in model refactor (Deleted created buffers for attributes)
  // https://github.com/uber/luma.gl/issues/878
  // t.is(
  //   stats.resourceMap.Buffer.active - initialActiveBuffers,
  //   0,
  //   'Deleted created buffers for attributes'
  // );

  buffer1.delete();
  buffer2.delete();

  t.end();
});
