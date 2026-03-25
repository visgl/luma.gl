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

const stagedCompositePass: ShaderPass<
  {stage?: number; mixTexture?: Texture},
  {stage?: number},
  {mixTexture?: Texture},
  'extract' | 'mix'
> = {
  name: 'stagedComposite',
  source: /* wgsl */ `
struct stagedCompositeUniforms {
  stage: i32,
};

@group(0) @binding(auto) var<uniform> stagedComposite: stagedCompositeUniforms;
@group(0) @binding(auto) var mixTexture: texture_2d<f32>;
@group(0) @binding(auto) var mixTextureSampler: sampler;

fn stagedComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);

  if (stagedComposite.stage == 0) {
    return vec4f(sourceColor.r, 0.0, 0.0, 1.0);
  }

  if (stagedComposite.stage == 1) {
    return vec4f(sourceColor.r, sourceColor.r * 0.5, 0.0, 1.0);
  }

  let mixColor = textureSample(mixTexture, mixTextureSampler, texCoord);
  return vec4f(sourceColor.rgb + mixColor.rgb, 1.0);
}
`,
  fs: /* glsl */ `
layout(std140) uniform stagedCompositeUniforms {
  int stage;
} stagedComposite;

uniform sampler2D mixTexture;

vec4 stagedComposite_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);

  if (stagedComposite.stage == 0) {
    return vec4(sourceColor.r, 0.0, 0.0, 1.0);
  }

  if (stagedComposite.stage == 1) {
    return vec4(sourceColor.r, sourceColor.r * 0.5, 0.0, 1.0);
  }

  vec4 mixColor = texture(mixTexture, texCoord);
  return vec4(sourceColor.rgb + mixColor.rgb, 1.0);
}
`,
  bindingLayout: [{name: 'mixTexture', group: 0}],
  uniformTypes: {
    stage: 'i32'
  },
  propTypes: {
    stage: {value: 0, private: true}
  },
  renderTargets: {
    extract: {},
    mix: {scale: [0.5, 0.5]}
  },
  passes: [
    {sampler: true, output: 'extract', uniforms: {stage: 0}},
    {sampler: true, inputs: {sourceTexture: 'extract'}, output: 'mix', uniforms: {stage: 1}},
    {sampler: true, inputs: {mixTexture: 'mix'}, uniforms: {stage: 2}}
  ]
};

const invalidInputPass: ShaderPass = {
  ...invertPass,
  name: 'invalidInput',
  passes: [{filter: true, inputs: {sourceTexture: 'missing'}}]
};

const invalidOutputPass: ShaderPass = {
  ...invertPass,
  name: 'invalidOutput',
  renderTargets: {scratch: {}},
  passes: [{filter: true, output: 'missing' as any}]
};

const selfAliasingPass: ShaderPass<any, any, any, 'scratch'> = {
  name: 'invert',
  source: invertPass.source,
  fs: invertPass.fs,
  renderTargets: {scratch: {}},
  passes: [{filter: true, inputs: {sourceTexture: 'scratch'}, output: 'scratch'}]
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

test('ShaderPassRenderer supports named private render targets', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const sourceTexture = new DynamicTexture(device, {
      id: 'staged-source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [stagedCompositePass],
      shaderInputs: new ShaderInputs({stagedComposite: stagedCompositePass})
    });
    const output = renderer.renderToTexture({sourceTexture});

    t.ok(output, 'produces output texture for staged pass');

    const pixelsOut = await readPixels(output!);
    t.deepEqual(
      Array.from(pixelsOut),
      [255, 127, 0, 255],
      'keeps previous bound to original until a subpass writes to previous'
    );

    renderer.resize([4, 4]);
    const privateRenderTargets = (renderer.passRenderers[0] as any).renderTargets as Record<
      string,
      {texture: Texture}
    >;
    t.equal(
      privateRenderTargets.extract.texture.width,
      4,
      'resizes full-size private target width'
    );
    t.equal(privateRenderTargets.mix.texture.height, 2, 'resizes scaled private target height');

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});

test('ShaderPassRenderer validates private render target routing', async t => {
  const devices = await getTestDevices();
  const webglDevice = devices.find(device => device.type !== 'webgpu');
  t.ok(webglDevice, 'has a test device');

  if (!webglDevice) {
    t.end();
    return;
  }

  t.throws(
    () =>
      new ShaderPassRenderer(webglDevice, {
        shaderPasses: [invalidInputPass],
        shaderInputs: new ShaderInputs({invalidInput: invalidInputPass})
      }),
    /unknown input source "missing"/,
    'throws on unknown input source'
  );

  t.throws(
    () =>
      new ShaderPassRenderer(webglDevice, {
        shaderPasses: [invalidOutputPass],
        shaderInputs: new ShaderInputs({invalidOutput: invalidOutputPass})
      }),
    /unknown output target "missing"/,
    'throws on unknown output target'
  );

  const sourceTexture = new DynamicTexture(webglDevice, {
    id: 'aliasing-source-texture',
    usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
    dimension: '2d',
    data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
  });
  await sourceTexture.ready;

  const aliasingRenderer = new ShaderPassRenderer(webglDevice, {
    shaderPasses: [selfAliasingPass],
    shaderInputs: new ShaderInputs({invert: selfAliasingPass})
  });
  t.throws(
    () => aliasingRenderer.renderToTexture({sourceTexture}),
    /cannot read and write render target "scratch"/,
    'throws on self-aliasing named target'
  );

  aliasingRenderer.destroy();
  sourceTexture.destroy();
  t.end();
});
