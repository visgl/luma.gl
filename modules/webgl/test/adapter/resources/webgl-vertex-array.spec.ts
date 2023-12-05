// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';

import {GL} from '@luma.gl/constants';
import {WEBGLBuffer, WEBGLVertexArray} from '@luma.gl/webgl';

// TODO(v9): Fix and re-enable test.
test.skip('WEBGLVertexArray#divisors', t => {
  for (const device of getWebGLTestDevices()) {
    const vertexArray = new WEBGLVertexArray(device);

    const maxVertexAttributes = device.limits.maxVertexAttributes;

    for (let i = 0; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexArray.handle);
      const divisor = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_DIVISOR);
      device.gl2?.bindVertexArray(null);

      t.equal(divisor, 0, `vertex attribute ${i} should have 0 divisor`);
    }

    vertexArray.destroy();
  }
  t.end();
});

// TODO(v9): Fix and re-enable test.
test.skip('WEBGLVertexArray#enable', t => {
  for (const device of getWebGLTestDevices()) {
    const renderPipeline = device.createRenderPipeline({});
    const vertexArray = device.createVertexArray({renderPipeline}) as WEBGLVertexArray;

    const maxVertexAttributes = device.limits.maxVertexAttributes;
    t.ok(maxVertexAttributes >= 8, 'maxVertexAttributes >= 8');

    for (let i = 1; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexArray.handle);
      const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
      device.gl2?.bindVertexArray(null);

      t.equal(enabled, false, `vertex attribute ${i} should initially be disabled`);
    }

    for (let i = 0; i < maxVertexAttributes; i++) {
      // @ts-ignore
      vertexArray._enable(i);
    }

    for (let i = 0; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexArray.handle);
      const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
      device.gl2?.bindVertexArray(null);

      t.equal(enabled, true, `vertex attribute ${i} should now be enabled`);
    }

    for (let i = 1; i < maxVertexAttributes; i++) {
      // @ts-ignore
      vertexArray._enable(i, false);
    }

    // t.equal(vertexArray.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: 0}), true,
    //   'vertex attribute 0 should **NOT** be disabled');

    for (let i = 1; i < maxVertexAttributes; i++) {
      device.gl2?.bindVertexArray(vertexArray.handle);
      const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
      device.gl2?.bindVertexArray(null);

      t.equal(enabled, false, `vertex attribute ${i} should now be disabled`);
    }

    vertexArray.destroy();
    renderPipeline.destroy();
  }

  t.end();
});

// TODO(v9): Fix and re-enable test.
test.skip('WEBGLVertexArray#getConstantBuffer', t => {
  for (const device of getWebGLTestDevices()) {
    const vertexArray = new WEBGLVertexArray(device);

    let buffer = vertexArray.getConstantBuffer(100, new Float32Array([5, 4, 3])) as WEBGLBuffer;

    t.equal(buffer.byteLength, 1200, 'byteLength should match');
    t.equal(buffer.bytesUsed, 1200, 'bytesUsed should match');

    buffer = vertexArray.getConstantBuffer(5, new Float32Array([5, 3, 2])) as WEBGLBuffer;
    t.equal(buffer.byteLength, 1200, 'byteLength should be unchanged');
    t.equal(buffer.bytesUsed, 60, 'bytesUsed should have changed');

    vertexArray.destroy();

    // if (device.isWebGL2) {
    //   const vertexArray2 = WEBGLVertexArray.getDefaultArray(gl2);
    //   buffer = vertexArray2.getConstantBuffer(5, new Float32Array([5, 3, 2]));
    //   t.equal(buffer.byteLength, 60, 'byteLength should be unchanged');
    //   t.equal(buffer.bytesUsed, 60, 'bytesUsed should have changed');
    //   const data = buffer.getData();
    //   t.deepEqual(
    //     data,
    //     new Float32Array([5, 3, 2, 5, 3, 2, 5, 3, 2, 5, 3, 2, 5, 3, 2]),
    //     'Constant buffer was correctly set'
    //   );
    //   t.comment(JSON.stringify(data));
    // }
  }
  t.end();
});
