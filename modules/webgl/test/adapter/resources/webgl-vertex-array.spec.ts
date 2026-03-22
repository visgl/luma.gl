import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { GL } from '@luma.gl/constants';
import { WEBGLBuffer, WEBGLVertexArray } from '@luma.gl/webgl';
function createVertexArray(device): WEBGLVertexArray {
  return device.createVertexArray({
    shaderLayout: {
      attributes: [],
      bindings: []
    },
    bufferLayout: []
  }) as WEBGLVertexArray;
}
test('WEBGLVertexArray#divisors', async () => {
  const device = await getWebGLTestDevice();
  const vertexArray = createVertexArray(device);
  const maxVertexAttributes = device.limits.maxVertexAttributes;
  for (let i = 0; i < maxVertexAttributes; i++) {
    device.gl.bindVertexArray(vertexArray.handle);
    const divisor = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_DIVISOR);
    device.gl.bindVertexArray(null);
    expect(divisor, `vertex attribute ${i} should have 0 divisor`).toBe(0);
  }
  vertexArray.destroy();
});
test('WEBGLVertexArray#enable', async () => {
  const device = await getWebGLTestDevice();
  const vertexArray = createVertexArray(device);
  const maxVertexAttributes = device.limits.maxVertexAttributes;
  expect(maxVertexAttributes >= 8, 'maxVertexAttributes >= 8').toBeTruthy();
  for (let i = 1; i < maxVertexAttributes; i++) {
    device.gl.bindVertexArray(vertexArray.handle);
    const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
    device.gl.bindVertexArray(null);
    expect(enabled, `vertex attribute ${i} should initially be disabled`).toBe(false);
  }
  for (let i = 0; i < maxVertexAttributes; i++) {
    // @ts-ignore
    vertexArray._enable(i);
  }
  for (let i = 0; i < maxVertexAttributes; i++) {
    device.gl.bindVertexArray(vertexArray.handle);
    const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
    device.gl.bindVertexArray(null);
    expect(enabled, `vertex attribute ${i} should now be enabled`).toBe(true);
  }
  for (let i = 1; i < maxVertexAttributes; i++) {
    // @ts-ignore
    vertexArray._enable(i, false);
  }

  // t.equal(vertexArray.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: 0}), true,
  //   'vertex attribute 0 should **NOT** be disabled');

  for (let i = 1; i < maxVertexAttributes; i++) {
    device.gl.bindVertexArray(vertexArray.handle);
    const enabled = device.gl.getVertexAttrib(i, GL.VERTEX_ATTRIB_ARRAY_ENABLED);
    device.gl.bindVertexArray(null);
    expect(enabled, `vertex attribute ${i} should now be disabled`).toBe(false);
  }
  vertexArray.destroy();
});
test('WEBGLVertexArray#getConstantBuffer', async () => {
  const device = await getWebGLTestDevice();
  const vertexArray = createVertexArray(device);
  const buffer = vertexArray.getConstantBuffer(100, new Float32Array([5, 4, 3])) as WEBGLBuffer;
  expect(buffer.byteLength, 'byteLength should match').toBe(1200);
  expect(buffer.bytesUsed, 'bytesUsed should match').toBe(1200);
  const reusedBuffer = vertexArray.getConstantBuffer(100, new Float32Array([5, 3, 2])) as WEBGLBuffer;
  expect(reusedBuffer, 'buffer should be reused when element count is unchanged').toBe(buffer);
  expect(reusedBuffer.byteLength, 'byteLength should be unchanged').toBe(1200);
  expect(reusedBuffer.bytesUsed, 'bytesUsed should reflect the fixed backing allocation').toBe(1200);
  expect(() => vertexArray.getConstantBuffer(5, new Float32Array([5, 3, 2])), 'changing element count should throw because the backing buffer size is immutable').toThrow();
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
});
