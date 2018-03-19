import {experimental, Buffer} from 'luma.gl';
import test from 'tape-catch';
import {fixture} from 'luma.gl/test/setup';

const {Transform} = experimental;
const VS = `\
#version 300 es
attribute float inValue;
varying float outValue;

void main()
{
  outValue = 2.0 * inValue;
}
`;

test('WebGL#Transform constructor/delete', t => {
  const {gl, gl2} = fixture;

  t.throws(
    () => new Transform(),
    /.*Requires WebGL2.*/,
    'Buffer throws on missing gl context');

  t.throws(
    () => new Transform(gl),
    /.*Requires WebGL2.*/,
    'Buffer throws on missing gl context');

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    sourceDestinationMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  t.ok(transform instanceof Transform, 'Transform construction successful');

  transform.delete();
  t.ok(transform instanceof Transform, 'Transform delete successful');

  transform.delete();
  t.ok(transform instanceof Transform, 'Transform repeated delete successful');

  t.end();
});

test('WebGL#Transform run', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    sourceDestinationMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getBuffer('outValue').getData();

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform swapBuffers', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([10, 20, 31, 0, -57]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    sourceDestinationMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  transform.swapBuffers();
  transform.run();

  const expectedData = sourceData.map(x => x * 4);
  const outData = transform.getBuffer('outValue').getData();

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});

test('WebGL#Transform update', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let sourceData = new Float32Array([10, 20, 31, 0, -57]);
  let sourceBuffer = new Buffer(gl2, {data: sourceData});

  const transform = new Transform(gl2, {
    sourceBuffers: {
      inValue: sourceBuffer
    },
    vs: VS,
    sourceDestinationMap: {
      inValue: 'outValue'
    },
    varyings: ['outValue'],
    elementCount: 5
  });

  transform.run();

  sourceData = new Float32Array([1, 2, 3, 0, -5]);
  sourceBuffer.delete();
  sourceBuffer = new Buffer(gl2, {data: sourceData});

  transform.update({
    sourceBuffers: {
      inValue: sourceBuffer
    }
  });
  transform.run();

  const expectedData = sourceData.map(x => x * 2);
  const outData = transform.getBuffer('outValue').getData();

  t.deepEqual(outData, expectedData, 'Transform.getData: is successful');

  t.end();
});
