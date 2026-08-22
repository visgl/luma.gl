// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {ShaderPassRenderer, DynamicTexture, ShaderInputs} from '@luma.gl/engine';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {Buffer, CommandEncoder, Texture, type Device} from '@luma.gl/core';
import {supportsComputeOptimization} from '../../src/passes/shader-pass-renderer';

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

const tintPass: ShaderPass<{tintTexture?: Texture}, {}, {tintTexture?: Texture}> = {
  name: 'tint',
  source: /* wgsl */ `
@group(0) @binding(auto) var tintTexture: texture_2d<f32>;
@group(0) @binding(auto) var tintTextureSampler: sampler;

fn tint_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let tintColor = textureSample(tintTexture, tintTextureSampler, texCoord);
  return vec4f(min(sourceColor.rgb + tintColor.rgb, vec3f(1.0)), sourceColor.a);
}
`,
  fs: /* glsl */ `
uniform sampler2D tintTexture;

vec4 tint_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec4 tintColor = texture(tintTexture, texCoord);
  return vec4(min(sourceColor.rgb + tintColor.rgb, vec3(1.0)), sourceColor.a);
}
`,
  bindingLayout: [{name: 'tintTexture', group: 0}],
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
    blurred: {scale: [0.5, 0.5], sampler: {minFilter: 'linear', magFilter: 'linear'}}
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

test('ShaderPassRenderer compute optimization requires storage-capable output formats', t => {
  const pipeline: ShaderPassPipeline<'output'> = {
    name: 'storage-capability-gate',
    renderTargets: {output: {format: 'bgra8unorm', storage: true}},
    steps: [],
    compute: {
      name: 'storage-capability-compute',
      source: '',
      uniformModule: 'storageCapability',
      uniformBinding: 'storageCapabilityUniforms',
      uniformNames: [],
      uniforms: {},
      input: 'original',
      outputs: {outputTexture: 'output'},
      replacedPasses: [],
      workgroupSize: [8, 8]
    }
  };
  let supportsStorage = false;
  const device = {
    type: 'webgpu',
    preferredColorFormat: 'bgra8unorm',
    limits: {
      maxStorageTexturesPerShaderStage: 4,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeInvocationsPerWorkgroup: 256
    },
    getTextureFormatCapabilities: (format: 'bgra8unorm') => ({
      format,
      create: true,
      render: true,
      filter: true,
      blend: true,
      store: supportsStorage
    })
  } as unknown as Device;

  t.equal(
    supportsComputeOptimization(device, pipeline),
    false,
    'unsupported storage format selects the render-pass fallback'
  );
  supportsStorage = true;
  t.equal(
    supportsComputeOptimization(device, pipeline),
    true,
    'storage-capable format enables the compute optimization'
  );
  t.end();
});

const tintPipeline: ShaderPassPipeline<'scratch'> = {
  name: 'tintPipeline',
  renderTargets: {scratch: {}},
  steps: [
    {
      shaderPass: tintPass,
      inputs: {sourceTexture: 'original'},
      output: 'scratch'
    },
    {
      shaderPass: copyPass,
      inputs: {sourceTexture: 'scratch'},
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

const reusedTargetPipeline: ShaderPassPipeline<'extract' | 'reconstructed'> = {
  name: 'reusedTarget',
  renderTargets: {
    extract: {sampler: {minFilter: 'linear', magFilter: 'linear'}},
    reconstructed: {
      aliasFor: 'extract',
      sampler: {minFilter: 'linear', magFilter: 'linear'}
    }
  },
  steps: [
    {
      shaderPass: copyPass,
      inputs: {sourceTexture: 'original'},
      output: 'extract'
    },
    {
      shaderPass: copyPass,
      inputs: {sourceTexture: 'extract'},
      output: 'previous'
    },
    {
      shaderPass: invertPass,
      inputs: {sourceTexture: 'previous'},
      output: 'reconstructed'
    },
    {
      shaderPass: copyPass,
      inputs: {sourceTexture: 'reconstructed'},
      output: 'previous'
    }
  ]
};

const indirectlyAliasingPipeline: ShaderPassPipeline<'extract' | 'reconstructed'> = {
  name: 'indirectlyAliasing',
  renderTargets: {
    extract: {},
    reconstructed: {aliasFor: 'extract'}
  },
  steps: [
    {
      shaderPass: combinePass,
      inputs: {sourceTexture: 'previous', mixTexture: 'extract'},
      output: 'reconstructed'
    }
  ]
};

const historyPipeline: ShaderPassPipeline<'historyColor'> = {
  name: 'historyPipeline',
  renderTargets: {
    historyColor: {lifetime: 'history', initialize: 'original'}
  },
  steps: [
    {
      shaderPass: invertPass,
      inputs: {sourceTexture: 'historyColor'},
      output: 'historyColor'
    },
    {
      shaderPass: copyPass,
      inputs: {sourceTexture: 'historyColor'},
      output: 'previous'
    }
  ]
};

const reservedTargetPipeline: ShaderPassPipeline<'original'> = {
  name: 'reservedTarget',
  renderTargets: {original: {}},
  steps: [{shaderPass: copyPass}]
};

test('ShaderPassRenderer uses the configured previous-chain color format', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [],
    colorFormat: 'rgba16float'
  });

  t.equal(
    renderer.swapFramebuffers.current.colorAttachments[0]?.texture.props.format,
    'rgba16float',
    'current previous-chain texture keeps the requested HDR format'
  );
  t.equal(
    renderer.swapFramebuffers.next.colorAttachments[0]?.texture.props.format,
    'rgba16float',
    'next previous-chain texture keeps the requested HDR format'
  );

  renderer.destroy();
  t.end();
});

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

test('ShaderPassRenderer resolves module-scoped default bindings and lets draw bindings override them', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const sourceTexture = new DynamicTexture(device, {
      id: 'binding-default-source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    const defaultTintTexture = new DynamicTexture(device, {
      id: 'binding-default-tint-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([0, 255, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    const overrideTintTexture = new DynamicTexture(device, {
      id: 'binding-override-tint-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([0, 0, 255, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await Promise.all([sourceTexture.ready, defaultTintTexture.ready, overrideTintTexture.ready]);

    const shaderInputs = new ShaderInputs({tint: tintPass});
    shaderInputs.setProps({
      tint: {
        tintTexture: defaultTintTexture.texture
      }
    });
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [tintPass],
      shaderInputs
    });

    const defaultOutput = renderer.renderToTexture({sourceTexture});
    t.ok(defaultOutput, 'renders using module-scoped default bindings');
    t.deepEqual(
      Array.from(await readPixels(defaultOutput!)),
      [255, 255, 0, 255],
      'uses the default binding stored in shaderInputs'
    );

    const overrideOutput = renderer.renderToTexture({
      sourceTexture,
      bindings: {tintTexture: overrideTintTexture.texture}
    });
    t.ok(overrideOutput, 'renders using per-draw binding overrides');
    t.deepEqual(
      Array.from(await readPixels(overrideOutput!)),
      [255, 0, 255, 255],
      'per-draw bindings override the stored module default'
    );

    renderer.destroy();
    sourceTexture.destroy();
    defaultTintTexture.destroy();
    overrideTintTexture.destroy();
  }
  t.end();
});

test('ShaderPassRenderer resolves module-scoped bindings inside ShaderPassPipeline steps', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const sourceTexture = new DynamicTexture(device, {
      id: 'pipeline-binding-source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    const tintTexture = new DynamicTexture(device, {
      id: 'pipeline-binding-tint-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([0, 255, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await Promise.all([sourceTexture.ready, tintTexture.ready]);

    const shaderInputs = new ShaderInputs({tint: tintPass, copy: copyPass});
    shaderInputs.setProps({
      tint: {
        tintTexture: tintTexture.texture
      }
    });
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [tintPipeline],
      shaderInputs
    });

    const output = renderer.renderToTexture({sourceTexture});
    t.ok(output, 'renders a pipeline using module-scoped bindings');
    t.deepEqual(
      Array.from(await readPixels(output!)),
      [255, 255, 0, 255],
      'pipeline steps read shaderInputs bindings from the correct pass module'
    );

    renderer.destroy();
    sourceTexture.destroy();
    tintTexture.destroy();
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

test('ShaderPassRenderer accepts its previous output as the next source', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    const sourceTexture = new DynamicTexture(device, {
      id: 'repeated-pass-source-texture',
      usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [invertPass],
      shaderInputs: new ShaderInputs({}),
      flipY: false
    });
    const firstOutput = renderer.renderToTexture({sourceTexture});
    const secondOutput = renderer.renderToTexture({sourceTexture: firstOutput!});
    device.submit();

    t.deepEqual(
      Array.from(await readPixels(secondOutput!)),
      device.preferredColorFormat.startsWith('bgra') ? [0, 0, 255, 255] : [255, 0, 0, 255],
      `${device.type} safely reuses ping-pong output as the next input`
    );

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});

test('ShaderPassRenderer supports explicit texture orientation', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [copyPass],
      shaderInputs: new ShaderInputs({}),
      flipY: false
    });

    t.equal(renderer.textureModel.flipY, false, `${device.type} disables fullscreen Y flipping`);
    t.equal(
      renderer.passRenderers[0].subPassExecutions[0].subPassRenderer.flipY,
      false,
      `${device.type} disables shader-subpass Y flipping`
    );

    renderer.destroy();
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
    t.equal(
      pipelineTargets.blurred.texture.sampler?.props.minFilter,
      'linear',
      'applies named target sampler configuration'
    );

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});

test('ShaderPassRenderer reuses compatible transient targets without double destruction', async t => {
  const devices = await getTestDevices();
  const device = devices.find(candidate => candidate.type !== 'webgpu');
  if (!device) {
    t.comment('WebGL is not available');
    t.end();
    return;
  }

  const sourceTexture = new DynamicTexture(device, {
    id: 'reused-target-source',
    usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
    dimension: '2d',
    data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
  });
  await sourceTexture.ready;
  const activeTextureCount = device.statsManager.getStats('Resource Counts').get('Textures Active');
  const texturesBeforeRenderer = activeTextureCount.count;
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [reusedTargetPipeline],
    shaderInputs: new ShaderInputs({copy: copyPass, invert: invertPass})
  });

  const targets = renderer.passRenderers[0].renderTargets;
  t.equal(
    targets.extract,
    targets.reconstructed,
    'logical target names share one owned allocation'
  );
  const output = renderer.renderToTexture({sourceTexture});
  t.deepEqual(
    Array.from(await readPixels(output!)),
    [0, 255, 255, 255],
    'expired contents can be replaced by a later non-overlapping pass'
  );

  const previousTexture = targets.extract.texture;
  renderer.resize([4, 4]);
  t.ok(previousTexture.destroyed, 'resizing releases the old allocation');
  t.equal(
    targets.extract.texture,
    targets.reconstructed.texture,
    'resizing preserves target reuse'
  );
  t.equal(targets.extract.texture.width, 4, 'the shared allocation receives the new size');

  const sharedTexture = targets.extract.texture;
  renderer.destroy();
  t.ok(sharedTexture.destroyed, 'renderer destruction releases the shared allocation');
  t.equal(
    activeTextureCount.count,
    texturesBeforeRenderer,
    'all renderer-owned texture allocations are released exactly once'
  );
  sourceTexture.destroy();
  t.end();
});

test('ShaderPassRenderer supports persistent history targets', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const sourceTexture = new DynamicTexture(device, {
      id: 'history-source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [historyPipeline],
      shaderInputs: new ShaderInputs({invert: invertPass, copy: copyPass})
    });

    const firstOutput = renderer.renderToTexture({sourceTexture});
    t.deepEqual(
      Array.from(await readPixels(firstOutput!)),
      [0, 255, 255, 255],
      'first frame reads initialized history'
    );

    const secondOutput = renderer.renderToTexture({sourceTexture});
    t.deepEqual(
      Array.from(await readPixels(secondOutput!)),
      [255, 0, 0, 255],
      'second frame reads previous successful output'
    );

    const resetOutput = renderer.renderToTexture({sourceTexture, resetHistory: true});
    t.deepEqual(
      Array.from(await readPixels(resetOutput!)),
      [0, 255, 255, 255],
      'explicit reset reinitializes history'
    );

    const historyTarget = renderer.passRenderers[0].renderTargets.historyColor.texture;
    renderer.resize([historyTarget.width + 1, historyTarget.height + 1]);
    const resizedOutput = renderer.renderToTexture({sourceTexture});
    t.deepEqual(
      Array.from(await readPixels(resizedOutput!)).slice(0, 4),
      [0, 255, 255, 255],
      'resize resets history'
    );

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

  for (const [description, alias] of [
    ['unknown target', {aliasFor: 'missing'}],
    ['mismatched scale', {aliasFor: 'extract', scale: [0.5, 0.5] as [number, number]}],
    ['mismatched sampler', {aliasFor: 'extract', sampler: {minFilter: 'linear' as const}}],
    ['persistent history', {aliasFor: 'extract', lifetime: 'history' as const}]
  ] as const) {
    const invalidAliasPipeline: ShaderPassPipeline<'extract' | 'reconstructed'> = {
      name: 'invalidTargetAlias',
      renderTargets: {extract: {}, reconstructed: alias},
      steps: [{shaderPass: copyPass}]
    };
    t.throws(
      () =>
        new ShaderPassRenderer(webglDevice, {
          shaderPasses: [invalidAliasPipeline],
          shaderInputs: new ShaderInputs({copy: copyPass})
        }),
      /target alias/,
      `rejects ${description} aliases`
    );
  }

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

  const indirectAliasRenderer = new ShaderPassRenderer(webglDevice, {
    shaderPasses: [indirectlyAliasingPipeline],
    shaderInputs: new ShaderInputs({combine: combinePass})
  });
  t.throws(
    () => indirectAliasRenderer.renderToTexture({sourceTexture}),
    /cannot sample from the render target it is writing to/,
    'rejects aliased targets sampled through a secondary texture binding'
  );

  aliasingRenderer.destroy();
  indirectAliasRenderer.destroy();
  sourceTexture.destroy();
  t.end();
});

test('ShaderPassRenderer calls BackgroundTextureModel.predraw before drawing', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const sourceTexture = new DynamicTexture(device, {
      id: 'predraw-source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [],
      shaderInputs: new ShaderInputs({})
    });
    let predrawCallCount = 0;
    const originalPredraw = renderer.textureModel.predraw.bind(renderer.textureModel);
    renderer.textureModel.predraw = (commandEncoder: CommandEncoder) => {
      predrawCallCount++;
      originalPredraw(commandEncoder);
    };

    renderer.renderToTexture({sourceTexture});
    renderer.renderToScreen({sourceTexture});

    t.equal(predrawCallCount, 2, `${device.type} prepares background model before each pass`);

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});

test('ShaderPassRenderer encodes into a caller-owned command encoder', async t => {
  const devices = await getTestDevices();
  const device = devices.find(candidate => candidate.type !== 'webgpu');
  t.ok(device, 'has a test device');

  if (!device) {
    t.end();
    return;
  }

  const sourceTexture = new DynamicTexture(device, {
    id: 'explicit-encoder-source-texture',
    usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
    dimension: '2d',
    data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
  });
  await sourceTexture.ready;

  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [copyPass],
    shaderInputs: new ShaderInputs({copy: copyPass})
  });
  const foreignDevice = devices.find(candidate => candidate !== device);
  if (foreignDevice) {
    const foreignCommandEncoder = foreignDevice.createCommandEncoder({
      id: 'shader-pass-foreign-encoder'
    });
    t.throws(
      () => renderer.encodeToTexture(foreignCommandEncoder, {sourceTexture}),
      /must belong to the renderer device/,
      'rejects a command encoder from another device'
    );
    foreignCommandEncoder.destroy();
  }
  const commandEncoder = device.createCommandEncoder({id: 'shader-pass-explicit-encoder'});
  let renderPassCount = 0;
  const originalBeginRenderPass = commandEncoder.beginRenderPass.bind(commandEncoder);
  commandEncoder.beginRenderPass = props => {
    renderPassCount++;
    return originalBeginRenderPass(props);
  };
  const observedEncoders: CommandEncoder[] = [];
  const originalPredraw = renderer.textureModel.predraw.bind(renderer.textureModel);
  renderer.textureModel.predraw = observedCommandEncoder => {
    observedEncoders.push(observedCommandEncoder);
    originalPredraw(observedCommandEncoder);
  };

  const rendered = renderer.encodeToScreen(commandEncoder, {sourceTexture});

  t.ok(rendered, 'encodes the pass chain and presentation');
  t.equal(
    renderPassCount,
    3,
    'opens seed, shader, and presentation passes on the supplied encoder'
  );
  t.equal(
    observedEncoders.filter(observedCommandEncoder => observedCommandEncoder === commandEncoder)
      .length,
    2,
    'prepares source seeding and presentation on the supplied encoder'
  );

  commandEncoder.destroy();
  renderer.destroy();
  sourceTexture.destroy();
  t.end();
});

test('ShaderPassRenderer submits caller-owned WebGPU command encoders', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const sourceTexture = new DynamicTexture(device, {
    id: 'webgpu-explicit-encoder-source-texture',
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
    dimension: '2d',
    data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
  });
  await sourceTexture.ready;

  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [invertPass],
    shaderInputs: new ShaderInputs({invert: invertPass}),
    colorFormat: 'rgba8unorm'
  });
  const commandEncoder = device.createCommandEncoder({id: 'shader-pass-webgpu-explicit-encoder'});
  const outputTexture = renderer.encodeToTexture(commandEncoder, {sourceTexture});
  const commandBuffer = commandEncoder.finish();
  device.submit(commandBuffer);

  t.ok(outputTexture, 'encodes an output texture');
  t.deepEqual(
    Array.from(await readPixels(outputTexture!)),
    [0, 255, 255, 255],
    'submitted custom encoder produces the expected pixels'
  );

  renderer.destroy();
  sourceTexture.destroy();
  t.end();
});

test('ShaderPassRenderer prepares each subpass before drawing', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const sourceTexture = new DynamicTexture(device, {
      id: 'subpass-prepare-source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [stagedPipeline],
      shaderInputs: new ShaderInputs({stagedColor: stagedColorPass, combine: combinePass})
    });
    const subPassRenderers = renderer.passRenderers[0].subPassExecutions.map(
      execution => execution.subPassRenderer
    ) as Array<{prepare: (options: unknown) => void}>;
    let prepareCallCount = 0;
    for (const subPassRenderer of subPassRenderers) {
      const originalPrepare = subPassRenderer.prepare.bind(subPassRenderer);
      subPassRenderer.prepare = (options: unknown) => {
        prepareCallCount++;
        originalPrepare(options);
      };
    }

    renderer.renderToTexture({sourceTexture});

    t.equal(
      prepareCallCount,
      subPassRenderers.length,
      `${device.type} prepares each subpass before beginRenderPass`
    );

    renderer.destroy();
    sourceTexture.destroy();
  }
  t.end();
});
