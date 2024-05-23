// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';
import {TextureTransform} from '@luma.gl/engine';
import {Device, Texture} from '@luma.gl/core';

/** Creates a minimal, no-op transform. */
test('TextureTransform#constructor', async t => {
  const targetTexture = webglDevice.createTexture({
    data: new Float32Array([201, 202, 203, 1.0]),
    width: 1,
    height: 1,
    format: 'rgba32float'
  });
  const transform = new TextureTransform(webglDevice, {
    vs: BASIC_VS,
    topology: 'point-list',
    targetTexture,
    targetTextureChannels: 1,
    targetTextureVarying: 'vSrc',
    vertexCount: 1
  });
  t.ok(transform, 'creates transform');

  t.end();
});

/** Computes a sum over vertex attribute values by writing to framebuffer. */
test('TextureTransform#attribute', async t => {
  const src = webglDevice.createBuffer({data: new Float32Array([10, 20, 30, 70, 80, 90])});
  const targetTexture = webglDevice.createTexture({
    data: new Float32Array([201, 202, 203, 1.0]),
    width: 1,
    height: 1,
    format: 'rgba32float'
  });
  const transform = new TextureTransform(webglDevice, {
    vs: SUM_VS,
    attributes: {src},
    bufferLayout: [{name: 'src', format: 'float32'}],
    topology: 'point-list',
    targetTexture,
    targetTextureChannels: 1,
    targetTextureVarying: 'vSrc',
    vertexCount: 6,
    parameters: {
      depthCompare: 'always',
      blend: true,
      blendColorOperation: 'add',
      blendColorSrcFactor: 'one',
      blendColorDstFactor: 'one'
    }
  });
  const source = transform.getTargetTexture();

  // TODO(donmccurdy): Consider having Transform inherit from Model, or at
  // least mimic its API by accepting a RenderPass in .run().
  transform.run({clearColor: [0, 0, 0, 0]});

  const sum = await readF32(webglDevice, source, 16);
  t.is(sum[0], 300, 'computes sum');

  transform.destroy();

  t.end();
});

/** Computes a sum over texture pixels by writing to framebuffer. */
test('TextureTransform#texture', async t => {
  const srcData = new Uint8Array([2, 10, 255, 255]);
  const dstData = new Uint8Array([8, 40, 255, 255]); // src x 4
  const dstOffsetData = new Uint8Array([108, 140, 255, 255]); // src x 4 + 100

  const inputTexture = webglDevice.createTexture({
    data: srcData,
    width: 1,
    height: 1,
    format: 'rgba8unorm'
  });
  const targetTexture = webglDevice.createTexture({
    data: new Uint8Array([0, 0, 0, 1]),
    width: 1,
    height: 1,
    format: 'rgba8unorm'
  });
  const transform = new TextureTransform(webglDevice, {
    vs: BLEND_VS,
    fs: BLEND_FS,
    topology: 'point-list',
    vertexCount: 4,
    targetTexture,
    targetTextureChannels: 4,
    targetTextureVarying: 'vUv',
    bindings: {uSampler: inputTexture},
    parameters: {
      depthCompare: 'always',
      blendColorOperation: 'add',
      blendColorSrcFactor: 'one',
      blendColorDstFactor: 'one'
    }
  });

  // TODO(donmccurdy): Consider having Transform inherit from Model, or at
  // least mimic its API by accepting a RenderPass in .run().
  transform.run({clearColor: [0, 0, 0, 0]});
  let blend = await readU8(webglDevice, targetTexture, 4);
  t.deepEqual(Array.from(blend), Array.from(dstData), 'computes blend');

  const offset = 100 / 255;
  transform.run({clearColor: [offset, offset, offset, 1]});
  blend = await readU8(webglDevice, targetTexture, 4);
  t.deepEqual(Array.from(blend), Array.from(dstOffsetData), 'computes blend');

  transform.destroy();
  inputTexture.destroy();
  targetTexture.destroy();

  t.end();
});

async function readF32(
  webglDevice: Device,
  source: Texture,
  byteLength: number
): Promise<Float32Array> {
  const bytes = await readU8(webglDevice, source, byteLength);
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

async function readU8(
  webglDevice: Device,
  source: Texture,
  byteLength: number
): Promise<Uint8Array> {
  const destination = webglDevice.createBuffer({byteLength});
  try {
    const cmd = webglDevice.createCommandEncoder();
    cmd.copyTextureToBuffer({source, destination});
    cmd.finish();
    return destination.readAsync();
  } finally {
    destination.destroy();
  }
}

const BASIC_VS = `\
#version 300 es
#define SHADER_NAME texture-transform-basic
precision highp float;
out float vSrc;

void main()
{
  vSrc = 1.0;
  gl_PointSize = 1.0;
}
`;

const SUM_VS = `\
#version 300 es
#define SHADER_NAME texture-transform-sum
precision highp float;
in float src;
out float vSrc;

void main()
{
  vSrc = src;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

const BLEND_VS = `\
#version 300 es
#define SHADER_NAME texture-transform-blend
precision highp float;
out vec2 vUv;

void main()
{
  vUv = vec2(0.5, 0.5);
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

const BLEND_FS = `\
#version 300 es
#define SHADER_NAME texture-transform-blend
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSampler;

void main()
{
  fragColor = texture(uSampler, vUv);
}
`;
