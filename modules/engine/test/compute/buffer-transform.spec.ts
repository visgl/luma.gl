import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { BufferTransform } from '@luma.gl/engine';
import { Buffer, Device } from '@luma.gl/core';
const VS = /* glsl */`\
#version 300 es
in float src;
out float dst;
void main() { dst = src * src; }
`;
const FS = /* glsl */`\
#version 300 es
in float dst;
out vec4 fragColor;
void main() { fragColor.x = dst; }
`;
test('BufferTransform#constructor', async () => {
  const webglDevice = await getWebGLTestDevice();
  expect(createBufferTransform(webglDevice), 'WebGL succeeds').toBeTruthy();
});
test('BufferTransform#run', async () => {
  const webglDevice = await getWebGLTestDevice();
  const SRC_ARRAY = new Float32Array([0, 1, 2, 3, 4, 5]);
  const DST_ARRAY = new Float32Array([0, 1, 4, 9, 16, 25]);
  const src = webglDevice.createBuffer({
    data: SRC_ARRAY
  });
  const dst = webglDevice.createBuffer({
    byteLength: 24
  });
  const elementCount = 6;
  const transform = createBufferTransform(webglDevice, src, dst, elementCount);
  transform.run();
  const bytes = await transform.readAsync('dst');
  const array = new Float32Array(bytes.buffer, bytes.byteOffset, elementCount);
  expect(array, 'output transformed').toEqual(DST_ARRAY);
});
function createBufferTransform(webglDevice: Device, src?: Buffer, dst?: Buffer, vertexCount?: number): BufferTransform {
  return new BufferTransform(webglDevice, {
    vs: VS,
    fs: FS,
    vertexCount,
    attributes: src ? {
      src
    } : undefined,
    bufferLayout: [{
      name: 'src',
      format: 'float32'
    }],
    outputs: ['dst'],
    topology: 'point-list',
    feedbackBuffers: dst ? {
      dst
    } : undefined
  });
}
