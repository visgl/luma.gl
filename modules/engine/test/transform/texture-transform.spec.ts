// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';
import {TextureTransform} from '@luma.gl/engine';
import {Device, Buffer, Texture} from '@luma.gl/core';

test('TextureTransform#constructor', async t => {
  for (const device of getWebGLTestDevices()) {
    t.ok(createTextureTransform(device), 'creates transform');
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
    
      // TODO(donmccurdy): if the transform is just behaving like a Model,
      // perhaps a render pass should be passed in here.
      transform.run({clearColor: [0, 0, 0, 0]});

      const sum = await readTextureTransform(device, source, destination);
      t.is(sum[0], 300, 'computes sum');

      transform.destroy();
      destination.destroy();
    }
  }
  t.end();
});

function createTextureTransform(device: Device): TextureTransform {
  return new TextureTransform(device, {
    vs: vsBasic,
    targetTexture: device.createTexture({width: 2, height: 2}),
    targetTextureChannels: 1,
    targetTextureVarying: 'testtesttest',
    elementCount: 4
  });
}

function createSumTextureTransform(device: Device, values: Float32Array): TextureTransform {
  const inputValue = device.createBuffer({data: values});
  const targetTexture = device.createTexture({
    data: new Float32Array([201, 202, 203, 1.0]),
    width: 1,
    height: 1,
    format: 'rgba32float',
  });
  return new TextureTransform(device, {
    vs: vsSum,
    attributes: {inputValue},
    bufferLayout: [{name: 'inputValue', format: 'float32'}],
    topology: 'point-list',
    targetTexture,
    targetTextureChannels: 1,
    targetTextureVarying: 'tmpValue',
    elementCount: values.length,
    parameters: {
      depthCompare: 'always',
      blendColorOperation: 'add',
      blendColorSrcFactor: 'one',
      blendColorDstFactor: 'one',
      blendAlphaOperation: 'add', // TODO(donmccurdy): unneeded?
      blendAlphaSrcFactor: 'one',
      blendAlphaDstFactor: 'one',
    },
  });
}

async function readTextureTransform(device: Device, source: Texture, destination: Buffer): Promise<Float32Array> {
  const cmd = device.createCommandEncoder();
  cmd.copyTextureToBuffer({source, destination});
  cmd.finish();
  const bytes = await destination.readAsync();
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

const vsBasic = `\
#version 300 es
#define SHADER_NAME texture-transform-basic

void main()
{
  gl_PointSize = 1.0;
}
`;

const vsSum = `\
#version 300 es
#define SHADER_NAME texture-transform-sum
precision highp float;
in float inputValue;
out float tmpValue;

void main()
{
  tmpValue = inputValue;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;
