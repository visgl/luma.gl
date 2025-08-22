// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {ShaderPassRenderer, DynamicTexture, ShaderInputs} from '@luma.gl/engine';
import type {ShaderPass} from '@luma.gl/shadertools';
import type {Device, Texture} from '@luma.gl/core';

const invertPass: ShaderPass = {
  name: 'invert',
  source: /* wgsl */ `
fn invert_filterColor_ext(color: vec4f, texSize: vec2f, texCoord: vec2f) -> vec4f {
  return vec4f(1.0 - color.rgb, color.a);
}
`,
  fs: /* glsl */ `
vec4 invert_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  return vec4(1.0 - color.rgb, color.a);
}
`,
  passes: [{filter: true}]
};

test('ShaderPassRenderer#renderToTexture', async t => {
  const device = await getWebGLTestDevice();

  const sourceTexture = new DynamicTexture(device, {
    dimension: '2d',
    data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
  });
  await sourceTexture.ready;

  const shaderInputs = new ShaderInputs({invert: invertPass});
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [invertPass],
    shaderInputs
  });

  const output = renderer.renderToTexture({sourceTexture});
  t.ok(output, 'produces output texture');

  const pixels = await readTexture(device, output!, 4);
  t.deepEqual(Array.from(pixels), [0, 255, 255, 255], 'applies filter');

  renderer.destroy();
  sourceTexture.destroy();

  t.end();
});

async function readTexture(
  device: Device,
  texture: Texture,
  byteLength: number
): Promise<Uint8Array> {
  const buffer = device.createBuffer({byteLength});
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer({sourceTexture: texture, destinationBuffer: buffer});
  const commandBuffer = encoder.finish();
  device.submit(commandBuffer);
  try {
    return await buffer.readAsync();
  } finally {
    buffer.destroy();
  }
}
