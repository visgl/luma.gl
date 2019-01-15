import GL from '@luma.gl/constants';
import {Buffer, _Attribute as Attribute, Framebuffer, Model, readPixelsToArray} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';

const value1 = new Float32Array([0, 0, 0, 0, 1, 2, 3, 4]);
const value2 = new Float32Array([0, 0, 0, 0, 1, 2, 3, 4]);

function isHeadlessGL(gl) {
  return gl.getExtension('STACKGL_resize_drawingbuffer');
}

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
  t.is(attribute.divisor, 0, 'divisor prop is set');

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

  attribute = new Attribute(gl, {size: 1, isIndexed: true});
  t.is(attribute.type, GL.UNSIGNED_INT, 'type is auto inferred');

  attribute = new Attribute(null, {size: 4, value: value1});
  t.ok(attribute instanceof Attribute, 'Attribute construction successful without GL context');

  t.end();
});

test('WebGL#Attribute update', t => {
  const {gl, gl2} = fixture;

  const attribute = new Attribute(gl2 || gl, {size: 4, value: value1});
  let {buffer} = attribute;

  attribute.update({value: value2});
  t.is(attribute.buffer, buffer, 'Buffer is reused');
  if (gl2) {
    t.deepEqual(buffer.getData(), value2, 'Buffer value is updated');
  }

  attribute.update({isInstanced: true});
  t.is(attribute.divisor, 1, 'divisor prop is updated');

  attribute.update({isInstanced: false});
  t.is(attribute.divisor, 0, 'divisor prop is updated');

  // gpu aggregation use case
  buffer = new Buffer(gl, {bytes: 1024, type: GL.FLOAT, instanced: 1});
  attribute.update({buffer});
  t.is(attribute.divisor, 1, 'divisor prop is updated using buffer prop');

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

// If the vertex shader has more components than the array provides,
// the extras are given values from the vector (0, 0, 0, 1) for the missing XYZW components.
// https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_format
test('Attribute#missing component', t => {

  if (isHeadlessGL(fixture.gl)) {
    // headless-gl does not seem to implement this behavior
    t.comment('Skipping headless-gl');
    t.end();
    return;
  }

  const contexts = {
    WebGL1: fixture.gl,
    WebGL2: fixture.gl2
  };

  const modelProps = {
    vs: `
  attribute vec3 position;
  attribute vec4 color;
  varying vec4 vColor;
  void main(void) {
    vColor = vec4(position.xz, color.ra / 255.);
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = 2.0;
  }
  `,
    fs: `
  precision highp float;
  varying vec4 vColor;
  void main(void) {
    gl_FragColor = vColor;
  }
  `,
    drawMode: GL.POINTS,
    vertexCount: 4
  };

  const testCases = [
    {
      position: {
        size: 2,
        value: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
      },
      color: {
        size: 3,
        value: new Uint8ClampedArray([32, 0, 0, 64, 0, 0, 128, 0, 0, 255, 0, 0])
      }
    },
    {
      position: {
        size: 2,
        stride: 12, // 3 * 4 bytes per element
        value: new Float32Array([-1, -1, 0.5, 1, -1, 1, -1, 1, 0.5, 1, 1, 1])
      },
      color: {
        size: 3,
        stride: 4, // 4 * 1 byte per element
        value: new Uint8ClampedArray([32, 0, 0, 100, 64, 0, 0, 100, 128, 0, 0, 100, 255, 0, 0, 100])
      }
    }
  ];

  for (const contextName in contexts) {
    const gl = contexts[contextName];

    if (gl) {
      t.comment(contextName);
      const model = new Model(gl, modelProps);
      const framebuffer = new Framebuffer(gl, {width: 2, height: 2});

      testCases.forEach(attributes => {
        model.draw({
          framebuffer,
          attributes,
          parameters: {viewport: [0, 0, 2, 2]}
        });

        t.deepEqual(
          Array.from(readPixelsToArray(framebuffer)),
          [0, 0, 32, 1, 255, 0, 64, 1, 0, 0, 128, 1, 255, 0, 255, 1],
          'missing components have expected values'
        );
      });

      // Release resources
      framebuffer.delete();
      model.delete();
    }
  }

  t.end();
});
