// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {ShaderPassRenderer, DynamicTexture, ShaderInputs} from '@luma.gl/engine';
import type {ShaderPass, CompositeShaderPass} from '@luma.gl/shadertools';
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

const stagedPipeline: CompositeShaderPass<'extract' | 'blurred'> = {
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

it('ShaderPassRenderer compute optimization requires storage-capable output formats', () => {
  const compositeShaderPass: CompositeShaderPass<'output'> = {
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

  expect(
    supportsComputeOptimization(device, compositeShaderPass),
    'unsupported storage format selects the render-pass fallback'
  ).toBe(false);
  supportsStorage = true;
  expect(
    supportsComputeOptimization(device, compositeShaderPass),
    'storage-capable format enables the compute optimization'
  ).toBe(true);
  void 0;
});

const tintPipeline: CompositeShaderPass<'scratch'> = {
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

const selfAliasingPipeline: CompositeShaderPass<'scratch'> = {
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

const reusedTargetPipeline: CompositeShaderPass<'extract' | 'reconstructed'> = {
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

const indirectlyAliasingPipeline: CompositeShaderPass<'extract' | 'reconstructed'> = {
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

const historyPipeline: CompositeShaderPass<'historyColor'> = {
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

const reservedTargetPipeline: CompositeShaderPass<'original'> = {
  name: 'reservedTarget',
  renderTargets: {original: {}},
  steps: [{shaderPass: copyPass}]
};

it('ShaderPassRenderer uses the configured previous-chain color format', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [],
    colorFormat: 'rgba16float'
  });

  expect(
    renderer.swapFramebuffers.current.colorAttachments[0]?.texture.props.format,
    'current previous-chain texture keeps the requested HDR format'
  ).toBe('rgba16float');
  expect(
    renderer.swapFramebuffers.next.colorAttachments[0]?.texture.props.format,
    'next previous-chain texture keeps the requested HDR format'
  ).toBe('rgba16float');

  renderer.destroy();
  void 0;
});

it('ShaderPassRenderer#renderToTexture', async () => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }
    void 0;
    const sourceTexture = new DynamicTexture(device, {
      id: 'source-texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await sourceTexture.ready;

    const pixels1 = await readPixels(sourceTexture.texture);
    expect(Array.from(pixels1), 'initialization success').toEqual([255, 0, 0, 255]);

    const shaderInputs = new ShaderInputs({invert: invertPass});
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [invertPass],
      shaderInputs
    });
    const output = renderer.renderToTexture({sourceTexture});

    expect(Boolean(output), 'produces output texture').toBe(true);

    const pixelsOut = await readPixels(output!);
    expect(Array.from(pixelsOut), 'applies filter').toEqual([0, 255, 255, 255]);

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer applies runtime uniforms and accepts Texture inputs', async () => {
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

    expect(Boolean(output), 'produces output texture from plain Texture input').toBe(true);

    const pixelsOut = await readPixels(output!);
    expect(Array.from(pixelsOut), 'applies runtime uniforms on top of pass defaults').toEqual([
      255, 128, 0, 255
    ]);

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer resolves module-scoped default bindings and lets draw bindings override them', async () => {
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
    expect(Boolean(defaultOutput), 'renders using module-scoped default bindings').toBe(true);
    expect(
      Array.from(await readPixels(defaultOutput!)),
      'uses the default binding stored in shaderInputs'
    ).toEqual([255, 255, 0, 255]);

    const overrideOutput = renderer.renderToTexture({
      sourceTexture,
      bindings: {tintTexture: overrideTintTexture.texture}
    });
    expect(Boolean(overrideOutput), 'renders using per-draw binding overrides').toBe(true);
    expect(
      Array.from(await readPixels(overrideOutput!)),
      'per-draw bindings override the stored module default'
    ).toEqual([255, 0, 255, 255]);

    renderer.destroy();
    sourceTexture.destroy();
    defaultTintTexture.destroy();
    overrideTintTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer resolves module-scoped bindings inside CompositeShaderPass steps', async () => {
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
    expect(Boolean(output), 'renders a pipeline using module-scoped bindings').toBe(true);
    expect(
      Array.from(await readPixels(output!)),
      'pipeline steps read shaderInputs bindings from the correct pass module'
    ).toEqual([255, 255, 0, 255]);

    renderer.destroy();
    sourceTexture.destroy();
    tintTexture.destroy();
  }
  void 0;
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

it('ShaderPassRenderer reuses BackgroundTextureModel', async () => {
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

    expect(renderer.textureModel, 'reuses existing BackgroundTextureModel').toBe(firstModel);

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer accepts its previous output as the next source', async () => {
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

    expect(
      Array.from(await readPixels(secondOutput!)),
      `${device.type} safely reuses ping-pong output as the next input`
    ).toEqual(device.preferredColorFormat.startsWith('bgra') ? [0, 0, 255, 255] : [255, 0, 0, 255]);

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer supports explicit texture orientation', async () => {
  const devices = await getTestDevices();
  for (const device of devices) {
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [copyPass],
      shaderInputs: new ShaderInputs({}),
      flipY: false
    });

    expect(renderer.textureModel.flipY, `${device.type} disables fullscreen Y flipping`).toBe(
      false
    );
    expect(
      renderer.passRenderers[0].subPassExecutions[0].subPassRenderer.flipY,
      `${device.type} disables shader-subpass Y flipping`
    ).toBe(false);

    renderer.destroy();
  }
  void 0;
});

it('ShaderPassRenderer supports CompositeShaderPass targets', async () => {
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

    expect(Boolean(output), 'produces output texture for staged pipeline').toBe(true);

    const pixelsOut = await readPixels(output!);
    expect(
      Array.from(pixelsOut),
      'reads a pipeline target in a later step and writes back to previous'
    ).toEqual([255, 128, 0, 255]);

    renderer.resize([4, 4]);
    const pipelineTargets = renderer.passRenderers[0].renderTargets as Record<
      string,
      {texture: Texture}
    >;
    expect(pipelineTargets.extract.texture.width, 'resizes full-size pipeline target width').toBe(
      4
    );
    expect(pipelineTargets.blurred.texture.height, 'resizes scaled pipeline target height').toBe(2);
    expect(
      pipelineTargets.blurred.texture.sampler?.props.minFilter,
      'applies named target sampler configuration'
    ).toBe('linear');

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer reuses compatible transient targets without double destruction', async () => {
  const devices = await getTestDevices();
  const device = devices.find(candidate => candidate.type !== 'webgpu');
  if (!device) {
    void 0;
    void 0;
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
  expect(targets.extract, 'logical target names share one owned allocation').toBe(
    targets.reconstructed
  );
  const output = renderer.renderToTexture({sourceTexture});
  expect(
    Array.from(await readPixels(output!)),
    'expired contents can be replaced by a later non-overlapping pass'
  ).toEqual([0, 255, 255, 255]);

  const previousTexture = targets.extract.texture;
  renderer.resize([4, 4]);
  expect(Boolean(previousTexture.destroyed), 'resizing releases the old allocation').toBe(true);
  expect(targets.extract.texture, 'resizing preserves target reuse').toBe(
    targets.reconstructed.texture
  );
  expect(targets.extract.texture.width, 'the shared allocation receives the new size').toBe(4);

  const sharedTexture = targets.extract.texture;
  renderer.destroy();
  expect(
    Boolean(sharedTexture.destroyed),
    'renderer destruction releases the shared allocation'
  ).toBe(true);
  expect(
    activeTextureCount.count,
    'all renderer-owned texture allocations are released exactly once'
  ).toBe(texturesBeforeRenderer);
  sourceTexture.destroy();
  void 0;
});

it('ShaderPassRenderer supports persistent history targets', async () => {
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
    expect(
      Array.from(await readPixels(firstOutput!)),
      'first frame reads initialized history'
    ).toEqual([0, 255, 255, 255]);

    const secondOutput = renderer.renderToTexture({sourceTexture});
    expect(
      Array.from(await readPixels(secondOutput!)),
      'second frame reads previous successful output'
    ).toEqual([255, 0, 0, 255]);

    const resetOutput = renderer.renderToTexture({sourceTexture, resetHistory: true});
    expect(
      Array.from(await readPixels(resetOutput!)),
      'explicit reset reinitializes history'
    ).toEqual([0, 255, 255, 255]);

    const historyTarget = renderer.passRenderers[0].renderTargets.historyColor.texture;
    renderer.resize([historyTarget.width + 1, historyTarget.height + 1]);
    const resizedOutput = renderer.renderToTexture({sourceTexture});
    expect(
      Array.from(await readPixels(resizedOutput!)).slice(0, 4),
      'resize resets history'
    ).toEqual([0, 255, 255, 255]);

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer validates CompositeShaderPass routing', async () => {
  const devices = await getTestDevices();
  const webglDevice = devices.find(device => device.type !== 'webgpu');
  expect(Boolean(webglDevice), 'has a test device').toBe(true);

  if (!webglDevice) {
    void 0;
    return;
  }

  expect(
    () =>
      new ShaderPassRenderer(webglDevice, {
        shaderPasses: [invalidInputPass],
        shaderInputs: new ShaderInputs({invalidInput: invalidInputPass})
      }),
    'throws on unknown input source outside a pipeline'
  ).toThrow(/unknown input source "missing"/);

  expect(
    () =>
      new ShaderPassRenderer(webglDevice, {
        shaderPasses: [invalidOutputPass],
        shaderInputs: new ShaderInputs({invalidOutput: invalidOutputPass})
      }),
    'throws on unknown output target outside a pipeline'
  ).toThrow(/unknown output target "missing"/);

  expect(
    () =>
      new ShaderPassRenderer(webglDevice, {
        shaderPasses: [reservedTargetPipeline],
        shaderInputs: new ShaderInputs({copy: copyPass})
      }),
    'throws on reserved pipeline target names'
  ).toThrow(/render target name "original" is reserved/);

  for (const [description, alias] of [
    ['unknown target', {aliasFor: 'missing'}],
    ['mismatched scale', {aliasFor: 'extract', scale: [0.5, 0.5] as [number, number]}],
    ['mismatched sampler', {aliasFor: 'extract', sampler: {minFilter: 'linear' as const}}],
    ['persistent history', {aliasFor: 'extract', lifetime: 'history' as const}]
  ] as const) {
    const invalidAliasPipeline: CompositeShaderPass<'extract' | 'reconstructed'> = {
      name: 'invalidTargetAlias',
      renderTargets: {extract: {}, reconstructed: alias},
      steps: [{shaderPass: copyPass}]
    };
    expect(
      () =>
        new ShaderPassRenderer(webglDevice, {
          shaderPasses: [invalidAliasPipeline],
          shaderInputs: new ShaderInputs({copy: copyPass})
        }),
      `rejects ${description} aliases`
    ).toThrow(/target alias/);
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
  expect(
    () => aliasingRenderer.renderToTexture({sourceTexture}),
    'throws on self-aliasing pipeline target'
  ).toThrow(/cannot read and write render target "scratch"/);

  const indirectAliasRenderer = new ShaderPassRenderer(webglDevice, {
    shaderPasses: [indirectlyAliasingPipeline],
    shaderInputs: new ShaderInputs({combine: combinePass})
  });
  expect(
    () => indirectAliasRenderer.renderToTexture({sourceTexture}),
    'rejects aliased targets sampled through a secondary texture binding'
  ).toThrow(/cannot sample from the render target it is writing to/);

  aliasingRenderer.destroy();
  indirectAliasRenderer.destroy();
  sourceTexture.destroy();
  void 0;
});

it('ShaderPassRenderer calls BackgroundTextureModel.predraw before drawing', async () => {
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

    expect(predrawCallCount, `${device.type} prepares background model before each pass`).toBe(2);

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});

it('ShaderPassRenderer encodes into a caller-owned command encoder', async () => {
  const devices = await getTestDevices();
  const device = devices.find(candidate => candidate.type !== 'webgpu');
  expect(Boolean(device), 'has a test device').toBe(true);

  if (!device) {
    void 0;
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
    expect(
      () => renderer.encodeToTexture(foreignCommandEncoder, {sourceTexture}),
      'rejects a command encoder from another device'
    ).toThrow(/must belong to the renderer device/);
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

  expect(Boolean(rendered), 'encodes the pass chain and presentation').toBe(true);
  expect(
    renderPassCount,
    'opens seed, shader, and presentation passes on the supplied encoder'
  ).toBe(3);
  expect(
    observedEncoders.filter(observedCommandEncoder => observedCommandEncoder === commandEncoder)
      .length,
    'prepares source seeding and presentation on the supplied encoder'
  ).toBe(2);

  commandEncoder.destroy();
  renderer.destroy();
  sourceTexture.destroy();
  void 0;
});

it('ShaderPassRenderer submits caller-owned WebGPU command encoders', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

  expect(Boolean(outputTexture), 'encodes an output texture').toBe(true);
  expect(
    Array.from(await readPixels(outputTexture!)),
    'submitted custom encoder produces the expected pixels'
  ).toEqual([0, 255, 255, 255]);

  renderer.destroy();
  sourceTexture.destroy();
  void 0;
});

it('ShaderPassRenderer prepares each subpass before drawing', async () => {
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

    expect(prepareCallCount, `${device.type} prepares each subpass before beginRenderPass`).toBe(
      subPassRenderers.length
    );

    renderer.destroy();
    sourceTexture.destroy();
  }
  void 0;
});
