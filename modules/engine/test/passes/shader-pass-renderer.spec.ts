// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getTestDevices} from '@luma.gl/test-utils';
import {ShaderPassRenderer, DynamicTexture, ShaderInputs} from '@luma.gl/engine';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
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

const copyPass: ShaderPass = {
  name: 'copy',
  source: /* wgsl */ `
fn copy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  return textureSample(sourceTexture, sourceTextureSampler, texCoord);
}
`,
  fs: /* glsl */ `
vec4 copy_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  return texture(sourceTexture, texCoord);
}
`,
  passes: [{sampler: true}]
};

const combinePass: ShaderPass<{mixTexture?: Texture}, {}, {mixTexture?: Texture}> = {
  name: 'combine',
  source: /* wgsl */ `
@group(0) @binding(auto) var mixTexture: texture_2d<f32>;
@group(0) @binding(auto) var mixTextureSampler: sampler;

fn combine_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let mixColor = textureSample(mixTexture, mixTextureSampler, texCoord);
  return vec4f(min(sourceColor.rgb + mixColor.rgb, vec3f(1.0)), sourceColor.a);
}
`,
  fs: /* glsl */ `
uniform sampler2D mixTexture;

vec4 combine_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec4 mixColor = texture(mixTexture, texCoord);
  return vec4(min(sourceColor.rgb + mixColor.rgb, vec3(1.0)), sourceColor.a);
}
`,
  bindingLayout: [{name: 'mixTexture', group: 0}],
  passes: [{sampler: true}]
};

const stagedColorPass: ShaderPass<
  {greenScale?: number; stage?: number},
  {greenScale?: number; stage?: number}
> = {
  name: 'stagedColor',
  source: /* wgsl */ `
struct stagedColorUniforms {
  greenScale: f32,
  stage: i32,
};

@group(0) @binding(auto) var<uniform> stagedColor: stagedColorUniforms;

fn stagedColor_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  if (stagedColor.stage == 0) {
    return vec4f(sourceColor.r, 0.0, 0.0, 1.0);
  }

  return vec4f(sourceColor.r, sourceColor.r * stagedColor.greenScale, 0.0, 1.0);
}
`,
  fs: /* glsl */ `
layout(std140) uniform stagedColorUniforms {
  float greenScale;
  int stage;
} stagedColor;

vec4 stagedColor_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  if (stagedColor.stage == 0) {
    return vec4(sourceColor.r, 0.0, 0.0, 1.0);
  }

  return vec4(sourceColor.r, sourceColor.r * stagedColor.greenScale, 0.0, 1.0);
}
`,
  uniformTypes: {
    greenScale: 'f32',
    stage: 'i32'
  },
  propTypes: {
    greenScale: {value: 0, min: 0, max: 1},
    stage: {value: 0, private: true}
  },
  passes: [
    {sampler: true, uniforms: {stage: 0}},
    {sampler: true, uniforms: {stage: 1}}
  ]
};

const stagedPipeline: ShaderPassPipeline<'extract' | 'blurred'> = {
  name: 'stagedPipeline',
  renderTargets: {
    extract: {},
    blurred: {scale: [0.5, 0.5]}
  },
  steps: [
    {
      shaderPass: stagedColorPass,
      inputs: {sourceTexture: 'original'},
      output: 'extract',
      uniforms: {greenScale: 0}
    },
    {
      shaderPass: stagedColorPass,
      inputs: {sourceTexture: 'extract'},
      output: 'blurred',
      uniforms: {greenScale: 0.5}
    },
    {
      shaderPass: combinePass,
      inputs: {
        sourceTexture: 'previous',
        mixTexture: 'blurred'
      },
      output: 'previous'
    }
  ]
};

const invalidInputPass: ShaderPass = {
  ...invertPass,
  name: 'invalidInput',
  passes: [{filter: true, inputs: {sourceTexture: 'missing'}}]
};

const invalidOutputPass: ShaderPass = {
  ...copyPass,
  name: 'invalidOutput',
  passes: [{sampler: true, output: 'missing' as any}]
};

const selfAliasingPipeline: ShaderPassPipeline<'scratch'> = {
  name: 'selfAliasing',
  renderTargets: {scratch: {}},
  steps: [
    {
      shaderPass: copyPass,
      inputs: {sourceTexture: 'scratch'},
      output: 'scratch'
    }
  ]
};

const reservedTargetPipeline: ShaderPassPipeline<'original'> = {
  name: 'reservedTarget',
  renderTargets: {original: {}},
  steps: [{shaderPass: copyPass}]
};

test('ShaderPassRenderer#renderToTexture', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
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

test('ShaderPassRenderer applies runtime uniforms and accepts Texture inputs', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const sourceTexture = new DynamicTexture(device, {
      id: 'runtime-uniform-source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [stagedColorPass],
      shaderInputs: new ShaderInputs({stagedColor: stagedColorPass})
    });
    const output = renderer.renderToTexture({
      sourceTexture: sourceTexture.texture,
      uniforms: {
        stagedColor: {
          greenScale: 0.5
        }
      }
    });

    t.ok(output, 'produces output texture from plain Texture input');

    const pixelsOut = await readPixels(output!);
    t.deepEqual(
      Array.from(pixelsOut),
      [255, 128, 0, 255],
      'applies runtime uniforms on top of pass defaults'
    );

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

test('ShaderPassRenderer supports ShaderPassPipeline targets', async t => {
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
      shaderPasses: [stagedPipeline],
      shaderInputs: new ShaderInputs({stagedColor: stagedColorPass, combine: combinePass})
    });
    const output = renderer.renderToTexture({sourceTexture});

    t.ok(output, 'produces output texture for staged pipeline');

    const pixelsOut = await readPixels(output!);
    t.deepEqual(
      Array.from(pixelsOut),
      [255, 128, 0, 255],
      'reads a pipeline target in a later step and writes back to previous'
    );

    renderer.resize([4, 4]);
    const pipelineTargets = renderer.passRenderers[0].renderTargets as Record<
      string,
      {texture: Texture}
    >;
    t.equal(pipelineTargets.extract.texture.width, 4, 'resizes full-size pipeline target width');
    t.equal(pipelineTargets.blurred.texture.height, 2, 'resizes scaled pipeline target height');

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});

test('ShaderPassRenderer validates ShaderPassPipeline routing', async t => {
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
    'throws on unknown input source outside a pipeline'
  );

  t.throws(
    () =>
      new ShaderPassRenderer(webglDevice, {
        shaderPasses: [invalidOutputPass],
        shaderInputs: new ShaderInputs({invalidOutput: invalidOutputPass})
      }),
    /unknown output target "missing"/,
    'throws on unknown output target outside a pipeline'
  );

  t.throws(
    () =>
      new ShaderPassRenderer(webglDevice, {
        shaderPasses: [reservedTargetPipeline],
        shaderInputs: new ShaderInputs({copy: copyPass})
      }),
    /render target name "original" is reserved/,
    'throws on reserved pipeline target names'
  );

  const sourceTexture = new DynamicTexture(webglDevice, {
    id: 'aliasing-source-texture',
    usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
    dimension: '2d',
    data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
  });
  await sourceTexture.ready;

  const aliasingRenderer = new ShaderPassRenderer(webglDevice, {
    shaderPasses: [selfAliasingPipeline],
    shaderInputs: new ShaderInputs({copy: copyPass})
  });
  t.throws(
    () => aliasingRenderer.renderToTexture({sourceTexture}),
    /cannot read and write render target "scratch"/,
    'throws on self-aliasing pipeline target'
  );

  aliasingRenderer.destroy();
  sourceTexture.destroy();
  t.end();
});
