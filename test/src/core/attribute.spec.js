import {Attribute, Buffer, GL} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';

const value1 = new Float32Array([0, 0, 0, 0, 1, 2, 3, 4]);
const value2 = new Float32Array([0, 0, 0, 0, 1, 2, 3, 4]);

test('WebGL#Attribute constructor/update/delete', t => {
  const {gl} = fixture;

  let attribute = new Attribute(gl, {size: 4, value: value1});
  let {buffer} = attribute;

  t.ok(attribute instanceof Attribute, 'Attribute construction successful');
  t.ok(buffer instanceof Buffer, 'Attribute creates buffer');
  t.is(buffer.data, value1, 'Buffer value is set');
  t.is(attribute.target, GL.ARRAY_BUFFER, 'Attribute target is inferred');
  t.is(attribute.type, GL.FLOAT, 'Attribute type is inferred');
  t.is(attribute.instanced, 0, 'instanced prop is set');

  attribute.delete();
  t.notOk(buffer._handle, 'Buffer resource is released');
  t.notOk(attribute.buffer, 'Attribute buffer is deleted');

  /* Indexed attribute */
  buffer = new Buffer(gl, {data: value2});
  attribute = new Attribute(gl, {isIndexed: true, value: buffer});

  t.ok(attribute instanceof Attribute, 'Indexed attribute construction successful');
  t.notOk(attribute.buffer, 'Attribute does not create buffer when value is Buffer');
  t.is(attribute.target, GL.ELEMENT_ARRAY_BUFFER, 'Attribute target is inferred');

  attribute.delete();
  t.ok(buffer._handle, 'External buffer is not deleted');

  t.throws(() => new Attribute(gl, {size: 6}), /invalid size/,
    'Attribute constructor throws error if attribute definition is invalid');

  t.end();
});

test('WebGL#Attribute update', t => {
  const {gl} = fixture;

  const attribute = new Attribute(gl, {size: 4, value: value1});
  const {buffer} = attribute;

  attribute.update({value: value2});
  t.is(attribute.buffer, buffer, 'Buffer is reused');
  t.is(buffer.data, value2, 'Buffer value is updated');

  attribute.update({isInstanced: true});
  t.is(attribute.instanced, 1, 'instanced prop is updated');

  attribute.delete();

  t.end();
});

test('WebGL#Attribute getBuffer', t => {
  const {gl} = fixture;

  const attribute = new Attribute(gl, {size: 4, value: value1});
  t.is(attribute.getBuffer(), attribute.buffer, 'getBuffer returns own buffer');

  const buffer = new Buffer(gl, {data: value1});
  attribute.update({value: buffer});
  t.is(attribute.getBuffer(), buffer, 'getBuffer returns user supplied buffer');

  attribute.update({value: value2});
  t.is(attribute.getBuffer(), attribute.buffer, 'getBuffer returns own buffer');

  attribute.update({isGeneric: true, value: [0, 0, 0, 0]});
  t.is(attribute.getBuffer(), null, 'getBuffer returns null for generic attributes');

  attribute.delete();

  t.end();
});

test('WebGL#Attribute clone', t => {
  const {gl} = fixture;

  const attribute1 = new Attribute(gl, {size: 4, value: value1});
  const {buffer} = attribute1;

  buffer.setData = () => t.fail('clone should not call buffer.setData');

  const attribute2 = attribute1.clone({isInstanced: true});
  t.is(attribute1.size, attribute2.size, 'sizes are the same');
  t.is(attribute1.target, attribute2.target, 'targets are the same');
  t.is(attribute1.type, attribute2.type, 'types are the same');
  t.is(attribute1.getBuffer(), attribute2.getBuffer(), 'buffers are the same');
  t.not(attribute1.instanced, attribute2.instanced, 'instanced is overridden');

  attribute2.delete();
  t.ok(buffer._handle, 'buffer is not deleted by the clone');

  attribute1.delete();
  t.notOk(buffer._handle, 'buffer is deleted by the original');

  t.end();
});
