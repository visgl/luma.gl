// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';
import {BufferTransform} from '@luma.gl/engine';
import {Buffer, Device, glsl} from '@luma.gl/core';

const VS = glsl`\
#version 300 es
in float src;
out float dst;
void main() { dst = src * src; }
`;

const FS = glsl`\
#version 300 es
in float dst;
out vec4 fragColor;
void main() { fragColor.x = dst; }
`;

test('BufferTransform#constructor', async (t) => {
  for (const device of getWebGLTestDevices()) {
    if (device.isWebGL1) {
      t.throws(() => createBufferTransform(device), /transform feedback/i, 'WebGL 1 throws');
    } else {
      t.ok(createBufferTransform(device), 'WebGL 2 succeeds');
    }
  }
  t.end();
});

test('BufferTransform#run', async (t) => {
  const SRC_ARRAY = new Float32Array([0, 1, 2, 3, 4, 5]);
  const DST_ARRAY = new Float32Array([0, 1, 4, 9, 16, 25]);

  for (const device of getWebGLTestDevices()) {
    if (device.isWebGL1) {
      t.comment('Skipping WebGL 1 device.');
    } else {
      const src = device.createBuffer({data: SRC_ARRAY});
      const dst = device.createBuffer({byteLength: 24});
      const elementCount = 6;
      const transform = createBufferTransform(device, src, dst, elementCount);

      transform.run();

      const bytes = await transform.readAsync('dst');
      const array = new Float32Array(bytes.buffer, bytes.byteOffset, elementCount);
      t.deepEqual(array, DST_ARRAY, 'output transformed');
    }
  }
  t.end();
});

function createBufferTransform(device: Device, src?: Buffer, dst?: Buffer, vertexCount?: number): BufferTransform {
  return new BufferTransform(device, {
    vs: VS,
    fs: FS,
    vertexCount,
    attributes: src ? {src} : undefined,
    bufferLayout: [{name: 'src', format: 'float32'}],
    feedbackBuffers: dst ? {dst} : undefined,
    varyings: ['dst'],
    topology: 'point-list',
  });
}