import GL from '@luma.gl/constants';
import luma from 'luma.gl/init';
import {Buffer, _Attribute as Attribute, Model, Cube} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';

const {stats} = luma;

test('Model#construct/destruct', t => {
  const {gl} = fixture;

  const model = new Model(gl, {
    drawMode: GL.POINTS,
    vertexCount: 0
  });

  t.ok(model, 'Model constructor does not throw errors');
  t.ok(model.program.handle, 'Created new program');

  model.delete();
  t.notOk(model.vertexArray.handle, 'Deleted vertexArray');
  t.notOk(model.program.handle, 'Deleted program');

  t.end();
});

test('Model#setAttribute', t => {
  const {gl} = fixture;

  const buffer1 = new Buffer(gl, {size: 2, data: new Float32Array(4).fill(1)});
  const buffer2 = new Buffer(gl, {data: new Float32Array(8)});

  const {active: initialActiveBuffers = 0} = stats.resourceMap.Buffer || {};

  const model = new Cube(gl, {});

  t.is(
    stats.resourceMap.Buffer.active - initialActiveBuffers,
    4,
    'Created new buffers for attributes'
  );

  model.setAttributes({
    instanceSizes: new Attribute(gl, {size: 1, buffer: buffer1}),
    instancePositions: buffer2,
    instanceWeight: {size: 1, constant: true, value: new Float32Array([10])}
  });

  t.is(stats.resourceMap.Buffer.active - initialActiveBuffers, 4, 'Did not create new buffers');

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
