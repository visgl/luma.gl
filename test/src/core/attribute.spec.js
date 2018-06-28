import GL from 'luma.gl/constants';
import {Buffer, _Attribute as Attribute} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';

const value1 = new Float32Array([0, 0, 0, 0, 1, 2, 3, 4]);
const value2 = new Float32Array([0, 0, 0, 0, 1, 2, 3, 4]);

test('WebGL#Attribute constructor/update/delete', t => {
  const {gl, gl2} = fixture;

  let attribute = new Attribute(gl2 || gl, {size: 4, value: value1});
  let {buffer} = attribute;

  t.ok(attribute instanceof Attribute, 'Attribute construction successful');
  t.ok(buffer instanceof Buffer, 'Attribute creates buffer');
  if (gl2) {
    t.deepEqual(buffer.getData(), value1, 'Buffer value is set');
  }
  t.is(attribute.target, GL.ARRAY_BUFFER, 'Attribute target is inferred');
  t.is(attribute.type, GL.FLOAT, 'Attribute type is inferred');
  t.is(attribute.instanced, 0, 'instanced prop is set');

  attribute.delete();
  t.notOk(buffer._handle, 'Buffer resource is released');
  t.notOk(attribute.buffer, 'Attribute buffer is deleted');

  /* Indexed attribute */
  buffer = new Buffer(gl, {data: value2});
  attribute = new Attribute(gl, {size: 4, isIndexed: true, buffer});

  t.ok(attribute instanceof Attribute, 'Indexed attribute construction successful');
  t.notOk(attribute.buffer, 'Attribute does not create buffer when external buffer is supplied');
  t.is(attribute.target, GL.ELEMENT_ARRAY_BUFFER, 'Attribute target is inferred');

  attribute.delete();
  t.ok(buffer._handle, 'External buffer is not deleted');

  t.end();
});

test('WebGL#Attribute update', t => {
  const {gl, gl2} = fixture;

  const attribute = new Attribute(gl2 || gl, {size: 4, value: value1});
  const {buffer} = attribute;

  attribute.update({value: value2});
  t.is(attribute.buffer, buffer, 'Buffer is reused');
  if (gl2) {
    t.deepEqual(buffer.getData(), value2, 'Buffer value is updated');
  }

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
  attribute.update({buffer});
  t.is(attribute.getBuffer(), buffer, 'getBuffer returns user supplied buffer');

  attribute.update({value: value2});
  t.is(attribute.getBuffer(), attribute.buffer, 'getBuffer returns own buffer');

  attribute.update({constant: true, value: [0, 0, 0, 0]});
  t.is(attribute.getBuffer(), null, 'getBuffer returns null for generic attributes');

  attribute.update({buffer});
  t.is(attribute.getBuffer(), buffer, 'getBuffer returns user supplied buffer');

  attribute.delete();

  t.end();
});

test('WebGL#Attribute getValue', t => {
  const {gl} = fixture;

  const attribute = new Attribute(gl, {size: 4, value: value1});
  t.is(attribute.getValue()[0], attribute.buffer, 'getValue returns own buffer');

  const buffer = new Buffer(gl, {data: value1});
  attribute.update({buffer});
  t.is(attribute.getValue()[0], buffer, 'getValue returns user supplied buffer');

  attribute.update({value: value2});
  t.is(attribute.getValue()[0], attribute.buffer, 'getValue returns own buffer');

  attribute.update({constant: true, value: value1});
  t.is(attribute.getValue(), value1, 'getValue returns generic value');

  attribute.update({buffer});
  t.is(attribute.getValue()[0], buffer, 'getValue returns user supplied buffer');

  attribute.delete();

  t.end();
});
