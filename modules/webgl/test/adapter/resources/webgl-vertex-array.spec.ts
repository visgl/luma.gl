// luma.gl, MIT license

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';

import {GL} from '@luma.gl/constants';
import {WEBGLVertexArray} from '@luma.gl/webgl';

// BACKEND INDEPENDENT TESTS

test('VertexArray construct/delete', t => {
  for (const device of getWebGLTestDevices()) {
    const renderPipeline = device.createRenderPipeline({});
    const vertexAttributes = device.createVertexArray({renderPipeline});
    t.ok(vertexAttributes instanceof WEBGLVertexArray, 'VertexArray construction successful');

    vertexAttributes.destroy();
    t.ok(vertexAttributes instanceof WEBGLVertexArray, 'VertexArray delete successful');

    vertexAttributes.destroy();
    t.ok(vertexAttributes instanceof WEBGLVertexArray, 'VertexArray repeated destroy successful');
  }
  t.end();
});

// WEBGL specific tests

test('WebGL#vertexArrayObject#divisors', t => {
  for (const device of getWebGLTestDevices()) {
    const vertexAttributes = new WEBGLVertexArray(device);

    const maxVertexAttributes = device.limits.maxVertexAttributes;

    for (let i = 0; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexAttributes.handle);
      const divisor = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_DIVISOR);
      device.gl2?.bindVertexArray(null);

      t.equal(divisor, 0, `vertex attribute ${i} should have 0 divisor`);
    }

    vertexAttributes.destroy();
  }
  t.end();
});

test('WEBGLVertexArray#enable', t => {
  for (const device of getWebGLTestDevices()) {
    const renderPipeline = device.createRenderPipeline({});
    const vertexAttributes = device.createVertexArray({renderPipeline});

    const maxVertexAttributes = device.limits.maxVertexAttributes;
    t.ok(maxVertexAttributes >= 8, 'maxVertexAttributes >= 8');

    for (let i = 1; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexAttributes.handle);
      const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
      device.gl2?.bindVertexArray(null);

      t.equal(enabled, false, `vertex attribute ${i} should initially be disabled`);
    }

    for (let i = 0; i < maxVertexAttributes; i++) {
      vertexAttributes.enable(i);
    }

    for (let i = 0; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexAttributes.handle);
      const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
      device.gl2?.bindVertexArray(null);

      t.equal(enabled, true, `vertex attribute ${i} should now be enabled`);
    }

    for (let i = 1; i < maxVertexAttributes; i++) {
      vertexAttributes.enable(i, false);
    }

    // t.equal(vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: 0}), true,
    //   'vertex attribute 0 should **NOT** be disabled');

    for (let i = 1; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexAttributes.handle);
      const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
      device.gl2?.bindVertexArray(null);

      t.equal(enabled, false, `vertex attribute ${i} should now be disabled`);
    }

    vertexAttributes.destroy();
    renderPipeline.destroy();
  }

  t.end();
});

/**
test('WEBGLVertexArray#getConstantBuffer', (t) => {
  for (const device of getWebGLTestDevices()) {

    const vertexAttributes = new WEBGLVertexArray(device);

    let buffer = vertexAttributes.getConstantBuffer(100, new Float32Array([5, 4, 3]));

    t.equal(buffer.byteLength, 1200, 'byteLength should match');
    t.equal(buffer.bytesUsed, 1200, 'bytesUsed should match');

    buffer = vertexAttributes.getConstantBuffer(5, new Float32Array([5, 3, 2]));
    t.equal(buffer.byteLength, 1200, 'byteLength should be unchanged');
    t.equal(buffer.bytesUsed, 60, 'bytesUsed should have changed');

    vertexAttributes.destroy();

    if (device.isWebGL2) {
      const vertexAttributes2 = WEBGLVertexArray.getDefaultArray(gl2);
      buffer = vertexAttributes2.getConstantBuffer(5, new Float32Array([5, 3, 2]));
      t.equal(buffer.byteLength, 60, 'byteLength should be unchanged');
      t.equal(buffer.bytesUsed, 60, 'bytesUsed should have changed');
      const data = buffer.getData();
      t.deepEqual(
        data,
        new Float32Array([5, 3, 2, 5, 3, 2, 5, 3, 2, 5, 3, 2, 5, 3, 2]),
        'Constant buffer was correctly set'
      );
      t.comment(JSON.stringify(data));
    }

  }
  t.end();
});
 */
