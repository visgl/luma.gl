// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getTestDevices} from '@luma.gl/test-utils';
import {ShaderPassRenderer, DynamicTexture, ShaderInputs} from '@luma.gl/engine';
import type {ShaderPass} from '@luma.gl/shadertools';
import {Buffer, Texture} from '@luma.gl/core';

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
  const devices = await getTestDevices();
  for (const device of devices) {
    // TODO - fix, we are getting close
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }
    t.comment(`Testing ${device.type}`);
    const sourceTexture = new DynamicTexture(device, {
      id: 'source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    // Sanity check
    const pixels1 = await readPixels(sourceTexture.texture);
    t.deepEqual(Array.from(pixels1), [255, 0, 0, 255], 'initialization success');

    const shaderInputs = new ShaderInputs({invert: invertPass});
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [invertPass],
      shaderInputs
    });
    const output = renderer.renderToTexture({sourceTexture});

    t.ok(output, 'produces output texture');

    const pixelsOut = await readPixels(output!);
    t.deepEqual(Array.from(pixelsOut), [0, 255, 255, 255], 'applies filter');

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});

async function readPixels(texture: Texture): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 1, height: 1}, buffer);
    const arrayBufferView = await buffer.readAsync(0, layout.byteLength);
    return new Uint8Array(arrayBufferView.buffer, arrayBufferView.byteOffset, 4);
  } finally {
    buffer.destroy();
  }
}

test('ShaderPassRenderer reuses BackgroundTextureModel', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }
    const sourceTexture = new DynamicTexture(device, {
      id: 'source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [],
      shaderInputs: new ShaderInputs({})
    });
    const firstModel = renderer.textureModel;

    renderer.renderToTexture({sourceTexture});
    renderer.renderToTexture({sourceTexture});

    t.equal(renderer.textureModel, firstModel, 'reuses existing BackgroundTextureModel');

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});
