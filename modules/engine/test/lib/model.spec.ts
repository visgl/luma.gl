// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  Buffer,
  CommandEncoder,
  Device,
  luma,
  PipelineFactory,
  ShaderFactory,
  type ShaderLayout,
  type Texture
} from '@luma.gl/core';
import {DynamicBuffer, Model, type TextureBindingSource} from '@luma.gl/engine';
import {ShaderInputs} from '../../src/shader-inputs';
import {
  getNullTestDevice,
  getWebGLTestDevice,
  getWebGPUTestDevice,
  getTestDevices
} from '@luma.gl/test-utils';
import {skin} from '@luma.gl/shadertools';
import {pbrProjection} from '../../../shadertools/src/modules/lighting/pbr-material/pbr-projection';

const stats = luma.stats.get('GPU Resource Counts');

const DUMMY_WGSL = /* WGSL */ `
@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment fn fragmentMain(@builtin(position) coord_in: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(coord_in.x, coord_in.y, 0.0, 1.0);
}
`;

const DUMMY_WGSL_WITH_BINDING = /* wgsl */ `
struct AppFrameUniforms {
  scale: f32
};

@group(0) @binding(auto) var<uniform> appFrame: AppFrameUniforms;

@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(appFrame.scale, 0.0, 0.0, 1.0);
}

@fragment fn fragmentMain(@builtin(position) coord_in: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(coord_in.x, coord_in.y, 0.0, 1.0);
}
`;

const DUMMY_VS = `#version 300 es
  void main() { gl_Position = vec4(1.0); }
`;

const DUMMY_FS = `#version 300 es
  precision highp float;
  out vec4 fragColor;
  void main() { fragColor = vec4(1.0); }
`;

const DYNAMIC_BUFFER_ATTRIBUTE_VS = `#version 300 es
  precision highp float;
  in vec4 positions;
  void main() {
    gl_Position = positions;
  }
`;

const INVALID_PIPELINE_WGSL = /* WGSL */ `
@vertex fn wrongVertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5)
  );
  let position = positions[vertexIndex];
  return vec4<f32>(position, 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
`;

const mockModule = {
  name: 'test-module',
  vs: '',
  fs: '',
  getUniforms: (opts, context) => ({}),
  dependencies: []
};

const appFrameModule = {
  name: 'appFrame',
  uniformTypes: {
    scale: 'f32'
  },
  dependencies: []
};

function makeCountingTextureBindingSource(texture: Texture): TextureBindingSource & {
  readonly resolutionCount: number;
} {
  let resolutionCount = 0;

  return {
    id: 'counting-texture-source',
    isReady: true,
    generation: 0,
    updateTimestamp: texture.updateTimestamp,
    get resolutionCount() {
      return resolutionCount;
    },
    resolveTextureBinding() {
      resolutionCount++;
      return texture;
    }
  };
}

it('Model#construct/destruct', async () => {
  const webglDevice = await getWebGLTestDevice();

  const model = new Model(webglDevice, {
    id: 'construct-destruct-test',
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  expect(Boolean(model), 'Model constructor does not throw errors').toBe(true);
  expect(Boolean(model.id), 'Model has an id').toBe(true);
  expect(Boolean(model.pipeline), 'Created pipeline').toBe(true);
  expect(Boolean(model.pipeline.destroyed), 'Pipeline starts alive').toBe(false);

  model.destroy();
  expect(
    Boolean(model.pipeline.destroyed),
    'Pipeline wrapper remains cached by default after last release'
  ).toBe(false);

  void 0;
});

it('Model#draw skips zero-instance submissions', async () => {
  const device = await getNullTestDevice();
  const model = new Model(device, {
    id: 'zero-draw-test',
    topology: 'point-list',
    vertexCount: 3,
    instanceCount: 0,
    isInstanced: true,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });
  const renderPass = device.getDefaultRenderPass();
  const draw = renderPass.draw.bind(renderPass);
  let drawCallCount = 0;
  renderPass.draw = options => {
    drawCallCount++;
    return draw(options);
  };

  expect(Boolean(model.draw(renderPass)), 'zero-instance draw is a successful no-op').toBe(true);
  expect(drawCallCount, 'zero-instance draw is not submitted').toBe(0);

  model.setInstanceCount(1);
  expect(Boolean(model.draw(renderPass)), 'non-empty draw succeeds').toBe(true);
  expect(drawCallCount, 'non-empty draw is submitted').toBe(1);

  renderPass.end();
  model.destroy();
  void 0;
});

it('Model#multiple delete', async () => {
  const webglDevice = await getWebGLTestDevice();

  const model1 = new Model(webglDevice, {
    id: 'multiple-delete-test-1',
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  const model2 = new Model(webglDevice, {
    id: 'multiple-delete-test-2',
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  model1.destroy();
  expect(Boolean(model2.pipeline.destroyed === false), 'program still in use').toBe(true);
  model1.destroy();
  expect(Boolean(model2.pipeline.destroyed === false), 'program still in use').toBe(true);
  model2.destroy();
  expect(
    Boolean(model2.pipeline.destroyed === false),
    'program remains cached after last release by default'
  ).toBe(true);

  void 0;
});

it('Model reuses one texture source resolution while preparing bind groups', async () => {
  const webglDevice = await getWebGLTestDevice();
  const texture = webglDevice.createTexture({width: 1, height: 1});
  const textureBindingSource = makeCountingTextureBindingSource(texture);
  const model = new Model(webglDevice, {
    id: 'texture-binding-source-resolution-test',
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [{name: 'videoTexture', type: 'texture', group: 0, location: 0}]
  };

  model.setBindings({videoTexture: textureBindingSource});
  const bindings = (model as any)._getBindings(shaderLayout);
  (model as any)._getBindGroups(shaderLayout, bindings);

  expect(textureBindingSource.resolutionCount, 'bind group preparation reuses resolution').toBe(1);

  model.destroy();
  texture.destroy();
  void 0;
});

it('Model#setAttributes', async () => {
  const webglDevice = await getWebGLTestDevice();

  const buffer1 = webglDevice.createBuffer({data: new Float32Array(9).fill(0)});
  const buffer2 = webglDevice.createBuffer({data: new Float32Array(9).fill(1)});

  const initialActiveBuffers = stats.get('Buffers Active').count;

  const model = new Model(webglDevice, {
    id: 'set-attributes-test',
    vs: `#version 300 es
  in vec4 positions;
  in vec3 normals;
  void main() { gl_Position = positions + vec4(normals, 0.); }
`,
    fs: DUMMY_FS,
    attributes: {
      positions: webglDevice.createBuffer({data: new Float32Array(12).fill(2)}),
      normals: webglDevice.createBuffer({data: new Float32Array(12).fill(3)})
    },
    bufferLayout: [
      {name: 'positions', format: 'float32x3'},
      {name: 'normals', format: 'float32x3'},
      {name: 'texCoords', format: 'float32x2'}
    ]
  });

  expect(
    stats.get('Buffers Active').count - initialActiveBuffers,
    'Created new buffers for attributes'
  ).toBe(2);

  model.setAttributes({positions: buffer1, normals: buffer2});

  expect(model.bufferAttributes, 'no longer stores local attributes').toEqual({});

  expect(
    stats.get('Buffers Active').count - initialActiveBuffers,
    'Did not create new buffers'
  ).toBe(2);

  model.destroy();

  buffer1.destroy();
  buffer2.destroy();

  void 0;
});

it('Model#setters, getters', async () => {
  const webglDevice = await getWebGLTestDevice();
  const model = new Model(webglDevice, {
    id: 'setters-getters-test',
    topology: 'point-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  model.setVertexCount(12);
  expect(model.vertexCount, 'set vertex count').toBe(12);

  model.setInstanceCount(4);
  expect(model.instanceCount, 'set instance count').toBe(4);

  model.setTopology('triangle-list');
  expect(model.topology, 'set topology').toBe('triangle-list');

  model.destroy();

  void 0;
});

it('Model#draw', async () => {
  const webglDevice = await getWebGLTestDevice();

  const model = new Model(webglDevice, {
    id: 'draw-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    attributes: {
      positions: webglDevice.createBuffer({data: new Float32Array(12).fill(2)}),
      normals: webglDevice.createBuffer({data: new Float32Array(12).fill(3)})
    },
    bufferLayout: [
      {name: 'positions', format: 'float32x3'},
      {name: 'normals', format: 'float32x3'}
    ]
  });

  const renderPass = webglDevice.beginRenderPass({clearColor: [0, 0, 0, 0]});

  model.draw(renderPass);

  renderPass.destroy();

  model.destroy();

  void 0;
});

it('Model#draw skips implicit predraw on WebGPU', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  class PredrawTrackingModel extends Model {
    predrawCallCount = 0;

    override predraw(commandEncoder: CommandEncoder): void {
      this.predrawCallCount++;
      super.predraw(commandEncoder);
    }
  }

  const framebuffer = webgpuDevice.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: ['rgba8unorm']
  });
  const model = new PredrawTrackingModel(webgpuDevice, {
    id: 'webgpu-predraw-test',
    source: DUMMY_WGSL,
    vertexCount: 1
  });

  const renderPass = webgpuDevice.beginRenderPass({
    clearColor: [0, 0, 0, 0],
    framebuffer
  });

  expect(Boolean(model.draw(renderPass)), 'WebGPU model draw succeeds').toBe(true);
  expect(model.predrawCallCount, 'WebGPU draw does not call predraw implicitly').toBe(0);

  renderPass.end();
  webgpuDevice.submit();
  renderPass.destroy();
  framebuffer.destroy();
  model.destroy();

  void 0;
});

it('Model#draw records WebGPU render bundles', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const framebuffer = webgpuDevice.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: ['rgba8unorm'],
    depthStencilAttachment: 'depth24plus'
  });
  const model = new Model(webgpuDevice, {
    id: 'webgpu-render-bundle-model-test',
    source: DUMMY_WGSL,
    vertexCount: 1
  });
  const renderBundleEncoder = webgpuDevice.createRenderBundleEncoder({
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: 'depth24plus'
  });

  expect(
    Boolean(model.draw(renderBundleEncoder)),
    'WebGPU model draw records into render bundle encoder'
  ).toBe(true);

  const renderBundle = renderBundleEncoder.finish();
  const renderPass = webgpuDevice.beginRenderPass({
    clearColor: [0, 0, 0, 0],
    clearDepth: 1,
    framebuffer
  });
  renderPass.executeBundles([renderBundle]);
  renderPass.end();
  webgpuDevice.submit();

  renderBundle.destroy();
  framebuffer.destroy();
  model.destroy();

  void 0;
});

it('Model#draw skips WebGPU render pipelines that failed init', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const model = new Model(webgpuDevice, {
    id: 'errored-webgpu-model-test',
    source: INVALID_PIPELINE_WGSL,
    vertexCount: 3
  });

  const linkStatus = await waitForPipelineError(model.pipeline);
  expect(linkStatus, 'model render pipeline is marked errored').toBe('error');
  expect(Boolean(model.pipeline.isErrored), 'model render pipeline reports errored state').toBe(
    true
  );

  const framebuffer = webgpuDevice
    .getDefaultCanvasContext()
    .getCurrentFramebuffer({depthStencilFormat: false});
  const renderPass = webgpuDevice.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});

  expect(model.draw(renderPass), 'first draw is skipped when the pipeline is errored').toBe(false);
  expect(model.draw(renderPass), 'repeated draws remain skipped').toBe(false);
  expect(model.needsRedraw(), 'model keeps failure reason').toBe(
    'render pipeline initialization failed'
  );

  renderPass.end();
  renderPass.destroy();
  model.destroy();
  void 0;
});

it('Model resolves DynamicBuffer shader bindings to the current backing buffer', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const dynamicBuffer = new DynamicBuffer(webgpuDevice, {
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const model = new Model(webgpuDevice, {
    id: 'dynamic-buffer-binding-test',
    source: DUMMY_WGSL_WITH_BINDING,
    vertexCount: 1,
    bindings: {
      appFrame: dynamicBuffer
    }
  });

  const initialBuffer = dynamicBuffer.buffer;
  expect(
    (model as any)._getBindings().appFrame,
    'initial binding resolves to the current DynamicBuffer backing buffer'
  ).toBe(initialBuffer);

  dynamicBuffer.resize({byteLength: 32});
  expect(
    (model as any)._getBindings().appFrame,
    'binding resolution uses the resized backing buffer'
  ).toBe(dynamicBuffer.buffer);
  expect(
    Boolean(dynamicBuffer.buffer !== initialBuffer),
    'resize replaces the backing buffer'
  ).toBe(true);

  model.destroy();
  dynamicBuffer.destroy();
  void 0;
});

// TODO - Re-enable after headless Chromium stops rejecting this valid GLSL shader with no compiler log.
it.skip('Model rebinds DynamicBuffer attributes during predraw', async () => {
  const webglDevice = await getWebGLTestDevice();
  const dynamicBuffer = new DynamicBuffer(webglDevice, {
    data: new Float32Array(16).fill(1),
    usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const model = new Model(webglDevice, {
    id: 'dynamic-buffer-attribute-test',
    vs: DYNAMIC_BUFFER_ATTRIBUTE_VS,
    fs: DUMMY_FS,
    attributes: {
      positions: dynamicBuffer
    },
    bufferLayout: [{name: 'positions', format: 'float32x4'}]
  });

  const initialBuffer = dynamicBuffer.buffer;
  expect(model.vertexArray.attributes[0], 'initial attribute buffer is bound').toBe(initialBuffer);

  dynamicBuffer.resize({
    byteLength: dynamicBuffer.byteLength + Float32Array.BYTES_PER_ELEMENT * 4
  });
  model.predraw(webglDevice.commandEncoder);

  expect(model.vertexArray.attributes[0], 'predraw rebinds resized DynamicBuffer attributes').toBe(
    dynamicBuffer.buffer
  );
  expect(
    Boolean(dynamicBuffer.buffer !== initialBuffer),
    'attribute buffer handle was replaced'
  ).toBe(true);

  model.destroy();
  dynamicBuffer.destroy();
  void 0;
});

// TODO - Re-enable after headless Chromium stops rejecting this valid GLSL shader with no compiler log.
it.skip('Model rebinds DynamicBuffer index buffers during predraw', async () => {
  const webglDevice = await getWebGLTestDevice();
  const dynamicIndexBuffer = new DynamicBuffer(webglDevice, {
    data: new Uint16Array([0, 1, 2]),
    usage: Buffer.INDEX | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const model = new Model(webglDevice, {
    id: 'dynamic-buffer-index-test',
    vs: DYNAMIC_BUFFER_ATTRIBUTE_VS,
    fs: DUMMY_FS,
    indexBuffer: dynamicIndexBuffer,
    attributes: {
      positions: webglDevice.createBuffer({data: new Float32Array(16).fill(1)})
    },
    bufferLayout: [{name: 'positions', format: 'float32x4'}]
  });

  const initialIndexBuffer = dynamicIndexBuffer.buffer;
  expect(model.vertexArray.indexBuffer, 'initial index buffer is bound').toBe(initialIndexBuffer);

  dynamicIndexBuffer.resize({byteLength: 8, preserveData: true});
  model.predraw(webglDevice.commandEncoder);

  expect(model.vertexArray.indexBuffer, 'predraw rebinds resized DynamicBuffer index buffers').toBe(
    dynamicIndexBuffer.buffer
  );
  expect(model.vertexArray.indexBuffer?.byteLength, 'index buffer uses resized byteLength').toBe(8);
  expect(
    Boolean(dynamicIndexBuffer.buffer !== initialIndexBuffer),
    'index buffer handle was replaced'
  ).toBe(true);

  model.destroy();
  dynamicIndexBuffer.destroy();
  void 0;
});

it('Model#getBindingDebugTable', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const wgslModel = new Model(webgpuDevice, {
    id: 'binding-debug-table-test',
    source: DUMMY_WGSL_WITH_BINDING,
    modules: [pbrProjection, skin],
    vertexCount: 3
  });

  expect(
    wgslModel.getBindingDebugTable().map(row => ({
      name: row.name,
      group: row.group,
      binding: row.binding,
      owner: row.owner,
      moduleName: row.moduleName
    })),
    'WGSL model exposes assembled binding debug rows before draw'
  ).toEqual([
    {
      name: 'appFrame',
      group: 0,
      binding: 0,
      owner: 'application',
      moduleName: undefined
    },
    {
      name: 'pbrProjection',
      group: 0,
      binding: 100,
      owner: 'module',
      moduleName: 'pbrProjection'
    },
    {
      name: 'skin',
      group: 0,
      binding: 101,
      owner: 'module',
      moduleName: 'skin'
    }
  ]);

  wgslModel.destroy();

  const webglDevice = await getWebGLTestDevice();
  const glslModel = new Model(webglDevice, {
    id: 'binding-debug-table-glsl-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    vertexCount: 3
  });

  expect(glslModel.getBindingDebugTable(), 'GLSL model reports no WGSL binding rows').toEqual([]);

  glslModel.destroy();
  void 0;
});

it('Model merges WGSL inferred bindings with explicit shader layout', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  let reflectionCount = 0;
  const originalGetShaderLayout = webgpuDevice.getShaderLayout;
  webgpuDevice.getShaderLayout = shaderSource => {
    reflectionCount++;
    return originalGetShaderLayout.call(webgpuDevice, shaderSource);
  };

  let model: Model;
  try {
    model = new Model(webgpuDevice, {
      id: 'wgsl-explicit-shader-layout-merge-test',
      source: DUMMY_WGSL_WITH_BINDING,
      shaderLayout: {attributes: [], bindings: []},
      vertexCount: 3
    });
  } finally {
    webgpuDevice.getShaderLayout = originalGetShaderLayout;
  }

  expect(
    Boolean(model.pipeline.shaderLayout.bindings.some(binding => binding.name === 'appFrame')),
    'pipeline layout includes bindings inferred from WGSL'
  ).toBe(true);
  expect(reflectionCount, 'model uses the interface scanned during shader assembly').toBe(0);

  model.destroy();
  void 0;
});

it('Model assembles shader input modules alongside explicit modules', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const model = new Model(webgpuDevice, {
    id: 'shader-input-and-explicit-module-merge-test',
    source: DUMMY_WGSL_WITH_BINDING,
    modules: [mockModule],
    shaderInputs: new ShaderInputs({appFrame: appFrameModule}),
    vertexCount: 3
  });

  expect(
    Boolean(model.source.includes('@binding(auto)')),
    'application auto binding is resolved'
  ).toBe(false);
  expect(
    Boolean(model.pipeline.shaderLayout.bindings.some(binding => binding.name === 'appFrame')),
    'shader input binding is included in the pipeline layout'
  ).toBe(true);

  model.destroy();
  void 0;
});

it('Model#topology', async () => {
  for (const device of await getTestDevices()) {
    const model = new Model(device, {
      id: 'topology-test',
      vs: DUMMY_VS,
      fs: DUMMY_FS,
      source: DUMMY_WGSL,
      vertexEntryPoint: 'vertexMain',
      fragmentEntryPoint: 'fragmentMain',
      vertexCount: 3
    });

    expect(model.topology, 'Pipeline has triangle-list topology').toBe('triangle-list');
    if (device.type === 'webgpu') {
      // Cached model in WebGL can have a different topology
      expect(model.pipeline.props.topology, 'Pipeline has triangle-list topology').toBe(
        'triangle-list'
      );
    }

    model.setTopology('line-strip');

    const framebuffer = device
      .getDefaultCanvasContext()
      .getCurrentFramebuffer({depthStencilFormat: false});
    const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    model.draw(renderPass);

    expect(model.topology, 'Pipeline has line-strip topology').toBe('line-strip');
    if (device.type === 'webgpu') {
      // Cached model in WebGL can have a different topology
      expect(model.pipeline.props.topology, 'Pipeline has triangle-list topology').toBe(
        'line-strip'
      );
    }

    renderPass.end();
    device.submit();
    renderPass.destroy();
    model.destroy();
  }

  void 0;
});

async function waitForPipelineError(pipeline: {
  linkStatus: 'pending' | 'success' | 'error';
}): Promise<'pending' | 'success' | 'error'> {
  for (let iteration = 0; iteration < 50 && pipeline.linkStatus !== 'error'; iteration++) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  return pipeline.linkStatus;
}

it('Model#pipeline caching', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(webglDevice)) {
    void 0;
    void 0;
    return;
  }
  if (!webglDevice.props._cachePipelines) {
    void 0;
    void 0;
    return;
  }

  const pipelineFactory = new PipelineFactory(webglDevice);
  const shaderFactory = new ShaderFactory(webglDevice);

  const model1 = new Model(webglDevice, {
    id: 'pipeline-caching-test-1',
    pipelineFactory,
    shaderFactory,
    topology: 'point-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    uniforms: {x: 0.5}
  });

  const model2 = new Model(webglDevice, {
    id: 'pipeline-caching-test-2',
    pipelineFactory,
    shaderFactory,
    topology: 'point-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    uniforms: {x: -0.5}
  });

  expect(Boolean(model1.pipeline === model2.pipeline), 'Pipelines are shared.').toBe(true);

  const renderPass = webglDevice.beginRenderPass({clearColor: [0, 0, 0, 0]});

  expect(Boolean(model1.draw(renderPass)), 'First model draw succeeded').toBe(true);

  expect(Boolean(model2.draw(renderPass)), 'Second model draw succeeded').toBe(true);

  model2.setBufferLayout([{name: 'a', format: 'float32x3'}]);
  model2.predraw(webglDevice.commandEncoder); // Forces a pipeline update
  expect(Boolean(model1.pipeline !== model2.pipeline), 'Pipeline updated').toBe(true);

  expect(Boolean(model2.draw(renderPass)), 'Pipeline updates still draw').toBe(true);

  renderPass.destroy();

  model1.destroy();
  model2.destroy();

  void 0;
});

it('Model#setBufferLayout is idempotent', async () => {
  const webglDevice = await getWebGLTestDevice();
  const model = new Model(webglDevice, {
    id: 'set-buffer-layout-idempotent-test',
    topology: 'point-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    bufferLayout: [{name: 'a', format: 'float32x3'}]
  });
  const pipeline = model.pipeline;
  const vertexArray = model.vertexArray;

  model.setBufferLayout([{name: 'a', format: 'float32x3'}]);

  expect(model.pipeline, 'same buffer layout does not recreate pipeline').toBe(pipeline);
  expect(model.vertexArray, 'same buffer layout does not recreate vertex array').toBe(vertexArray);

  model.destroy();
  void 0;
});

it('Model#pipeline caching with defines and modules', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(webglDevice)) {
    void 0;
    void 0;
    return;
  }
  if (!webglDevice.props._cachePipelines) {
    void 0;
    void 0;
    return;
  }

  const pipelineFactory = PipelineFactory.getDefaultPipelineFactory(webglDevice);
  const shaderFactory = ShaderFactory.getDefaultShaderFactory(webglDevice);
  const model1 = new Model(webglDevice, {
    id: 'caching-with-modules-test-1',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  expect(Boolean(model1.pipeline), 'Got a pipeline').toBe(true);

  // reuse assembled shaders; this cache is already tested in shader-factory.spec.ts.
  const vs = shaderFactory.createShader({stage: 'vertex', source: model1.vs});
  const fs = shaderFactory.createShader({stage: 'fragment', source: model1.fs});

  const pipeline2 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  expect(Boolean(model1.pipeline === pipeline2), 'Got cached pipeline').toBe(true);

  const defineModel1 = new Model(webglDevice, {
    id: 'caching-with-modules-test-2',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    defines: {MY_DEFINE: true}
  });

  expect(Boolean(model1.pipeline !== defineModel1.pipeline), 'Define triggers new pipeline').toBe(
    true
  );

  const defineModel2 = new Model(webglDevice, {
    id: 'caching-with-modules-test-3',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    defines: {MY_DEFINE: true}
  });

  expect(
    Boolean(defineModel1.pipeline === defineModel2.pipeline),
    'Got cached pipeline with defines'
  ).toBe(true);

  const moduleModel1 = new Model(webglDevice, {
    id: 'caching-with-modules-test-4',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    modules: [mockModule]
  });

  expect(Boolean(model1.pipeline !== moduleModel1.pipeline), 'Module triggers new pipeline').toBe(
    true
  );
  expect(
    Boolean(defineModel1.pipeline !== moduleModel1.pipeline),
    'Module triggers new pipeline'
  ).toBe(true);

  const moduleModel2 = new Model(webglDevice, {
    id: 'caching-with-modules-test-5',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    modules: [mockModule]
  });

  expect(
    Boolean(moduleModel1.pipeline === moduleModel2.pipeline),
    'Got cached pipeline with modules'
  ).toBe(true);

  const defineModuleModel1 = new Model(webglDevice, {
    id: 'caching-with-modules-test-6',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    topology: 'triangle-list',
    modules: [mockModule],
    defines: {MY_DEFINE: true}
  });

  expect(
    Boolean(pipeline2 !== defineModuleModel1.pipeline),
    'Module and define triggers new pipeline'
  ).toBe(true);
  expect(
    Boolean(defineModel1.pipeline !== defineModuleModel1.pipeline),
    'Module and define triggers new pipeline'
  ).toBe(true);
  expect(
    Boolean(moduleModel1.pipeline !== defineModuleModel1.pipeline),
    'Module and define triggers new pipeline'
  ).toBe(true);

  const defineModuleModel2 = new Model(webglDevice, {
    id: 'caching-with-modules-test-7',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    topology: 'triangle-list',
    modules: [mockModule],
    defines: {MY_DEFINE: true}
  });

  expect(
    Boolean(defineModuleModel1.pipeline === defineModuleModel2.pipeline),
    'Got cached pipeline with modules and defines'
  ).toBe(true);

  void 0;
});

it('Model#plugins assemble backend contributions', async () => {
  const nullDevice = await getNullTestDevice();
  const pluginModule = {name: 'model-plugin-module', vs: '', fs: ''};

  const glslModel = new Model(nullDevice, {
    id: 'glsl-model-plugin-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    plugins: [
      {
        name: 'glsl-model-plugin',
        modules: [pluginModule],
        glsl: {
          injections: [{target: 'fs:#decl', injection: 'float pluginMarker = 1.0;'}]
        }
      }
    ]
  });

  expect(
    Boolean(glslModel.fs.includes('float pluginMarker = 1.0;')),
    'GLSL plugin injection is assembled'
  ).toBe(true);
  expect(
    Boolean(glslModel.shaderInputs.getModules().some(module => module.name === pluginModule.name)),
    'plugin modules participate in shader inputs'
  ).toBe(true);
  glslModel.destroy();

  const webgpuDevice = await getWebGPUTestDevice();
  if (webgpuDevice) {
    const wgslModel = new Model(webgpuDevice, {
      id: 'wgsl-model-plugin-test',
      source: DUMMY_WGSL,
      plugins: [
        {
          name: 'wgsl-model-plugin',
          wgsl: {
            injections: [{target: 'fs:#decl', injection: 'const PLUGIN_MARKER: f32 = 1.0;'}]
          }
        }
      ]
    });

    expect(
      Boolean(wgslModel.source.includes('const PLUGIN_MARKER: f32 = 1.0;')),
      'WGSL plugin injection is assembled'
    ).toBe(true);
    wgslModel.destroy();
  }

  void 0;
});

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

/*
import {dirlight, picking} from '@luma.gl/shadertools';

const VS_300 = glsl`#version 300 es

  in vec4 positions;
  in vec2 uvs;

  out vec2 vUV;

  void main() {
    vUV = uvs;
    gl_Position = positions;
  }
`;

const FS_300 = glsl`#version 300 es
  precision highp float;

  in vec2 vUV;

  uniform sampler2D tex;

  out vec4 fragColor;
  void main() {
    fragColor = texture(tex, vUV);
  }
`;


// TODO - Move to model: transpilation functionality was moved to model
test('PipelineFactory#hooks', (t) => {
  const pipelineFactory = new PipelineFactory(webglDevice);

  const preHookPipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  pipelineFactory.addShaderHook('vs:LUMAGL_pickColor(inout vec4 color)');
  pipelineFactory.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  });

  const postHookPipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(preHookPipeline !== postHookPipeline, 'Adding hooks changes hash');

  const pickingInjection = Object.assign(
    {
      inject: {
        'vs:LUMAGL_pickColor': 'picking_setPickingColor(color.rgb);',
        'fs:LUMAGL_fragmentColor': {
          injection: 'color = picking_filterColor(color);',
          order: Number.POSITIVE_INFINITY
        }
      }
    },
    picking
  );

  const noModulePipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(preHookPipeline !== noModulePipeline, 'Adding hooks changes hash');

  const noModuleVs = noModulePipeline.vs.source;
  const noModuleFs = noModulePipeline.fs.source;

  t.ok(noModuleVs.indexOf('LUMAGL_pickColor') > -1, 'hook function injected into vertex shader');
  t.ok(
    noModuleFs.indexOf('LUMAGL_fragmentColor') > -1,
    'hook function injected into fragment shader'
  );

  t.ok(
    noModuleVs.indexOf('picking_setPickingColor(color.rgb)') === -1,
    'injection code not included in vertex shader without module'
  );
  t.ok(
    noModuleFs.indexOf('color = picking_filterColor(color)') === -1,
    'injection code not included in fragment shader without module'
  );

  const modulesPipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [pickingInjection]
  });
  const modulesVs = modulesPipeline.vs.source;
  const modulesFs = modulesPipeline.fs.source;

  t.ok(modulesVs.indexOf('LUMAGL_pickColor') > -1, 'hook function injected into vertex shader');
  t.ok(
    modulesFs.indexOf('LUMAGL_fragmentColor') > -1,
    'hook function injected into fragment shader'
  );

  t.ok(
    modulesVs.indexOf('picking_setPickingColor(color.rgb)') > -1,
    'injection code included in vertex shader with module'
  );
  t.ok(
    modulesFs.indexOf('color = picking_filterColor(color)') > -1,
    'injection code included in fragment shader with module'
  );
  t.ok(
    modulesFs.indexOf('if (color.a == 0.0) discard;') > -1,
    'hook header injected into fragment shader'
  );
  t.ok(
    modulesFs.indexOf('color.a *= 1.2;') > modulesFs.indexOf('color = picking_filterColor(color)'),
    'hook footer injected after injection code'
  );

  const injectPipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;',
      'fs:LUMAGL_fragmentColor': 'color += 0.1;'
    }
  });
  const injectVs = injectPipeline.vs.source;
  const injectFs = injectPipeline.fs.source;

  t.ok(injectVs.indexOf('color *= 0.1') > -1, 'argument injection code included in shader hook');
  t.ok(injectFs.indexOf('color += 0.1') > -1, 'argument injection code included in shader hook');

  const injectDefinePipeline1 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;'
    }
  });

  const injectDefinePipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    defines: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;'
    }
  });

  t.ok(injectDefinePipeline1 !== injectDefinePipeline2, 'Injects and defines hashed separately.');

  t.end();
});

// TODO - Move to model: transpilation functionality was moved to model
test('PipelineFactory#defaultModules', (t) => {
  const pipelineFactory = new PipelineFactory(webglDevice);

  const {pipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  const  preDefaultModulePipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [dirlight]
  });

  const preDefaultModuleSource = preDefaultModulePipeline.fs.source;

  pipelineFactory.addDefaultModule(dirlight);

  const defaultModulePipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const modulePipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [dirlight]
  });

  t.ok(pipeline !== defaultModulePipeline, 'Pipeline with new default module properly cached');
  t.ok(
    preDefaultModulePipeline !== defaultModulePipeline,
    'Adding a default module changes the pipeline hash'
  );
  t.ok(
    preDefaultModulePipeline.fs.source === defaultModulePipeline.fs.source,
    'Default module injected correctly'
  );
  t.ok(
    modulePipeline === defaultModulePipeline,
    'Pipeline with new default module matches regular module'
  );

  pipelineFactory.removeDefaultModule(dirlight);

  const noDefaultModulePipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(pipeline.fs.source === noDefaultModulePipeline.fs.source, 'Default module was removed');
  t.ok(modulePipeline.fs.source !== noDefaultModulePipeline.fs.source, 'Default module was removed');

  // Reset pipeline manager
  pipelineFactory.release(pipeline);
  pipelineFactory.release(modulePipeline);
  pipelineFactory.release(defaultModulePipeline);
  pipelineFactory.release(noDefaultModulePipeline);

  pipelineFactory.addDefaultModule(dirlight);
  const uncachedPipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const defaultModuleSource = uncachedPipeline.fs.source;

  t.ok(defaultModulePipeline !== uncachedPipeline, 'Pipeline is not cached');
  t.ok(preDefaultModuleSource === defaultModuleSource, 'Default modules create correct source');

  t.end();
});

*/
