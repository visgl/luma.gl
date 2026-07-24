// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {BufferTransform} from '@luma.gl/engine';
import {Buffer, Device} from '@luma.gl/core';

const VS = /* glsl */ `\
#version 300 es
in float src;
out float dst;
void main() { dst = src * src; }
`;

const FS = /* glsl */ `\
#version 300 es
in float dst;
out vec4 fragColor;
void main() { fragColor.x = dst; }
`;

test('BufferTransform#constructor', async t => {
  const webglDevice = await getWebGLTestDevice();

  t.ok(createBufferTransform(webglDevice), 'WebGL succeeds');
  t.end();
});

test('BufferTransform#run', async t => {
  const webglDevice = await getWebGLTestDevice();

  const SRC_ARRAY = new Float32Array([0, 1, 2, 3, 4, 5]);
  const DST_ARRAY = new Float32Array([0, 1, 4, 9, 16, 25]);

  const src = webglDevice.createBuffer({data: SRC_ARRAY});
  const dst = webglDevice.createBuffer({byteLength: 24});
  const elementCount = 6;
  const transform = createBufferTransform(webglDevice, src, dst, elementCount);

  transform.run();

  const bytes = await transform.readAsync('dst');
  const array = new Float32Array(bytes.buffer, bytes.byteOffset, elementCount);
  t.deepEqual(array, DST_ARRAY, 'output transformed');

  t.end();
});

test('BufferTransform#run preserves framebuffer output by default', async t => {
  const webglDevice = await getWebGLTestDevice();
  const src = webglDevice.createBuffer({data: new Float32Array([1])});
  const dst = webglDevice.createBuffer({byteLength: 4});
  const framebuffer = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm'],
    width: 1,
    height: 1
  });
  const transform = new BufferTransform(webglDevice, {
    vs: `#version 300 es
in float src;
out float dst;
void main() {
  dst = src;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`,
    fs: `#version 300 es
precision highp float;
in float dst;
out vec4 fragColor;
void main() {
  fragColor = vec4(dst, 0.0, 0.0, 1.0);
}`,
    vertexCount: 1,
    attributes: {src},
    bufferLayout: [{name: 'src', format: 'float32'}],
    outputs: ['dst'],
    topology: 'point-list',
    feedbackBuffers: {dst}
  });

  transform.run({
    framebuffer,
    clearColor: [0, 0, 0, 0],
    parameters: {viewport: [0, 0, 1, 1]}
  });

  t.deepEqual(
    webglDevice.readPixelsToArrayWebGL(framebuffer),
    new Uint8Array([255, 0, 0, 255]),
    'fragment output is preserved'
  );

  transform.destroy();
  framebuffer.destroy();
  src.destroy();
  dst.destroy();
  t.end();
});

function createBufferTransform(
  webglDevice: Device,
  src?: Buffer,
  dst?: Buffer,
  vertexCount?: number
): BufferTransform {
  return new BufferTransform(webglDevice, {
    vs: VS,
    fs: FS,
    vertexCount,
    attributes: src ? {src} : undefined,
    bufferLayout: [{name: 'src', format: 'float32'}],
    outputs: ['dst'],
    topology: 'point-list',
    feedbackBuffers: dst ? {dst} : undefined
  });
}
