// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';
import {TextureTransform} from '@luma.gl/engine';
import {Device, Buffer, Texture} from '@luma.gl/core';

test('TextureTransform#constructor', async t => {
  for (const device of getWebGLTestDevices()) {
    if (device.isWebGL1) {
      t.comment('TextureTransform aggregation not yet supported in WebGL2');
    } else {
      t.ok(createSumTextureTransform(device, new Float32Array(8)), 'creates transform');
    }
  }
  t.end();
});

test('TextureTransform#sum', async t => {
  for (const device of getWebGLTestDevices()) {
    if (device.isWebGL1) {
      t.comment('TextureTransform aggregation not yet supported in WebGL2');
    } else {
      const values = new Float32Array([10, 20, 30, 70, 80, 90]);
      const transform = createSumTextureTransform(device, values);
      const source = transform.getTargetTexture();
      const destination = device.createBuffer({byteLength: 16});
    
      // TODO(donmccurdy): Consider having Transform inherit from Model, or at
      // least mimic its API by accepting a RenderPass in .run().
      transform.run({clearColor: [0, 0, 0, 0]});

      const sum = await readF32(device, source, destination);
      t.is(sum[0], 300, 'computes sum');

      transform.destroy();
      destination.destroy();
    }
  }
  t.end();
});

test('TextureTransform#blend', async t => {
  for (const device of getWebGLTestDevices()) {
    if (device.isWebGL1) {
      t.comment('TextureTransform aggregation not yet supported in WebGL2');
    } else {
      const srcData = new Uint8Array([2, 10, 255, 255]);
      const dstData = new Uint8Array([8, 40, 255, 255]); // src x 4
      const dstOffsetData = new Uint8Array([108, 140, 255, 255]); // src x 4 + 100

      const inputTexture = device.createTexture({
        data: srcData,
        width: 1,
        height: 1,
        format: 'rgba8unorm',
      });
      const targetTexture = device.createTexture({
        data: new Uint8Array([0, 0, 0, 1.0]),
        width: 1,
        height: 1,
        format: 'rgba8unorm',
      });
      const transform = new TextureTransform(device, {
        vs: BLEND_VS,
        fs: BLEND_FS,
        topology: 'point-list',
        elementCount: 4,
        targetTexture,
        targetTextureChannels: 4,
        targetTextureVarying: 'vUv',
        bindings: {uSampler: inputTexture},
        parameters: {
          depthCompare: 'always',
          blendColorOperation: 'add',
          blendColorSrcFactor: 'one',
          blendColorDstFactor: 'one',
        },
      });

      // TODO(donmccurdy): Consider having Transform inherit from Model, or at
      // least mimic its API by accepting a RenderPass in .run().
      transform.run({clearColor: [0, 0, 0, 0]});
      const destination = device.createBuffer({byteLength: 4});
      let blend = await readU8(device, targetTexture, destination);
      t.deepEqual(Array.from(blend), Array.from(dstData), 'computes blend');

      const offset = 100 / 255;
      transform.run({clearColor: [offset, offset, offset, 1]});
      blend = await readU8(device, targetTexture, destination);
      t.deepEqual(Array.from(blend), Array.from(dstOffsetData), 'computes blend');

      transform.destroy();
      inputTexture.destroy();
      targetTexture.destroy();
      destination.destroy();
    }
  }
  t.end();
});

function createSumTextureTransform(device: Device, values: Float32Array): TextureTransform {
  const inputValue = device.createBuffer({data: values});
  const targetTexture = device.createTexture({
    data: new Float32Array([201, 202, 203, 1.0]),
    width: 1,
    height: 1,
    format: 'rgba32float',
  });
  return new TextureTransform(device, {
    vs: SUM_VS,
    attributes: {inputValue},
    bufferLayout: [{name: 'inputValue', format: 'float32'}],
    topology: 'point-list',
    targetTexture,
    targetTextureChannels: 1,
    targetTextureVarying: 'vTmpValue',
    elementCount: values.length,
    parameters: {
      depthCompare: 'always',
      blendColorOperation: 'add',
      blendColorSrcFactor: 'one',
      blendColorDstFactor: 'one',
    },
  });
}

async function readF32(device: Device, source: Texture, destination: Buffer): Promise<Float32Array> {
  const cmd = device.createCommandEncoder();
  cmd.copyTextureToBuffer({source, destination});
  cmd.finish();
  const bytes = await destination.readAsync();
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

async function readU8(device: Device, source: Texture, destination: Buffer): Promise<Uint8Array> {
  const cmd = device.createCommandEncoder();
  cmd.copyTextureToBuffer({source, destination});
  cmd.finish();
  return destination.readAsync();
}

const SUM_VS = `\
#version 300 es
#define SHADER_NAME texture-transform-sum
precision highp float;
in float inputValue;
out float vTmpValue;

void main()
{
  vTmpValue = inputValue;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

const BLEND_VS = `\
#version 300 es
#define SHADER_NAME texture-transform-blend
precision highp float;
// in vec2 uv;
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
  fragColor = texture2D(uSampler, vUv);
}
`;
