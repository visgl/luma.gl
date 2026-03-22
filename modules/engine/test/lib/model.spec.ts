import {expect, test} from 'vitest';
import { Device, luma, PipelineFactory, ShaderFactory } from '@luma.gl/core';
import { Model } from '@luma.gl/engine';
import { getWebGLTestDevice, getWebGPUTestDevice, getTestDevices } from '@luma.gl/test-utils';
import { skin } from '@luma.gl/shadertools';
import { pbrProjection } from '../../../shadertools/src/modules/lighting/pbr-material/pbr-projection';
const stats = luma.stats.get('GPU Resource Counts');
const DUMMY_WGSL = /* WGSL */`
@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment fn fragmentMain(@builtin(position) coord_in: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(coord_in.x, coord_in.y, 0.0, 1.0);
}
`;
const DUMMY_WGSL_WITH_BINDING = /* wgsl */`
struct AppFrameUniforms {
  scale: f32
};

@group(0) @binding(0) var<uniform> appFrame: AppFrameUniforms;

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
const mockModule = {
  name: 'test-module',
  vs: '',
  fs: '',
  getUniforms: (opts, context) => ({}),
  dependencies: []
};
test('Model#construct/destruct', async () => {
  const webglDevice = await getWebGLTestDevice();
  const model = new Model(webglDevice, {
    id: 'construct-destruct-test',
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });
  expect(model, 'Model constructor does not throw errors').toBeTruthy();
  expect(model.id, 'Model has an id').toBeTruthy();
  expect(model.pipeline, 'Created pipeline').toBeTruthy();
  expect(model.pipeline.destroyed, 'Pipeline starts alive').toBe(false);
  model.destroy();
  expect(model.pipeline.destroyed, 'Pipeline wrapper remains cached by default after last release').toBe(false);
});
test('Model#multiple delete', async () => {
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
  expect(model2.pipeline.destroyed === false, 'program still in use').toBeTruthy();
  model1.destroy();
  expect(model2.pipeline.destroyed === false, 'program still in use').toBeTruthy();
  model2.destroy();
  expect(model2.pipeline.destroyed === false, 'program remains cached after last release by default').toBeTruthy();
});
test('Model#setAttributes', async () => {
  const webglDevice = await getWebGLTestDevice();
  const buffer1 = webglDevice.createBuffer({
    data: new Float32Array(9).fill(0)
  });
  const buffer2 = webglDevice.createBuffer({
    data: new Float32Array(9).fill(1)
  });
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
      positions: webglDevice.createBuffer({
        data: new Float32Array(12).fill(2)
      }),
      normals: webglDevice.createBuffer({
        data: new Float32Array(12).fill(3)
      })
    },
    bufferLayout: [{
      name: 'positions',
      format: 'float32x3'
    }, {
      name: 'normals',
      format: 'float32x3'
    }, {
      name: 'texCoords',
      format: 'float32x2'
    }]
  });
  expect(stats.get('Buffers Active').count - initialActiveBuffers, 'Created new buffers for attributes').toBe(2);
  model.setAttributes({
    positions: buffer1,
    normals: buffer2
  });
  expect(model.bufferAttributes, 'no longer stores local attributes').toEqual({});
  expect(stats.get('Buffers Active').count - initialActiveBuffers, 'Did not create new buffers').toBe(2);
  model.destroy();
  buffer1.destroy();
  buffer2.destroy();
});
test('Model#setters, getters', async () => {
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
});
test('Model#draw', async () => {
  const webglDevice = await getWebGLTestDevice();
  const model = new Model(webglDevice, {
    id: 'draw-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    attributes: {
      positions: webglDevice.createBuffer({
        data: new Float32Array(12).fill(2)
      }),
      normals: webglDevice.createBuffer({
        data: new Float32Array(12).fill(3)
      })
    },
    bufferLayout: [{
      name: 'positions',
      format: 'float32x3'
    }, {
      name: 'normals',
      format: 'float32x3'
    }]
  });
  const renderPass = webglDevice.beginRenderPass({
    clearColor: [0, 0, 0, 0]
  });
  model.draw(renderPass);
  renderPass.destroy();
  model.destroy();
});
test('Model#getBindingDebugTable', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    return;
  }
  const wgslModel = new Model(webgpuDevice, {
    id: 'binding-debug-table-test',
    source: DUMMY_WGSL_WITH_BINDING,
    modules: [pbrProjection, skin],
    vertexCount: 3
  });
  expect(wgslModel.getBindingDebugTable().map(row => ({
    name: row.name,
    group: row.group,
    binding: row.binding,
    owner: row.owner,
    moduleName: row.moduleName
  })), 'WGSL model exposes assembled binding debug rows before draw').toEqual([{
    name: 'appFrame',
    group: 0,
    binding: 0,
    owner: 'application',
    moduleName: undefined
  }, {
    name: 'pbrProjection',
    group: 0,
    binding: 100,
    owner: 'module',
    moduleName: 'pbrProjection'
  }, {
    name: 'skin',
    group: 0,
    binding: 101,
    owner: 'module',
    moduleName: 'skin'
  }]);
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
});
test('Model#topology', async () => {
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
      expect(model.pipeline.props.topology, 'Pipeline has triangle-list topology').toBe('triangle-list');
    }
    model.setTopology('line-strip');
    const framebuffer = device.getDefaultCanvasContext().getCurrentFramebuffer({
      depthStencilFormat: false
    });
    const renderPass = device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0]
    });
    model.draw(renderPass);
    expect(model.topology, 'Pipeline has line-strip topology').toBe('line-strip');
    if (device.type === 'webgpu') {
      // Cached model in WebGL can have a different topology
      expect(model.pipeline.props.topology, 'Pipeline has triangle-list topology').toBe('line-strip');
    }
    renderPass.end();
    device.submit();
    renderPass.destroy();
    model.destroy();
  }
});
test('Model#pipeline caching', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(webglDevice)) {
    return;
  }
  if (!webglDevice.props._cachePipelines) {
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
    uniforms: {
      x: 0.5
    }
  });
  const model2 = new Model(webglDevice, {
    id: 'pipeline-caching-test-2',
    pipelineFactory,
    shaderFactory,
    topology: 'point-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    uniforms: {
      x: -0.5
    }
  });
  expect(model1.pipeline === model2.pipeline, 'Pipelines are shared.').toBeTruthy();
  const renderPass = webglDevice.beginRenderPass({
    clearColor: [0, 0, 0, 0]
  });
  expect(model1.draw(renderPass), 'First model draw succeeded').toBeTruthy();
  expect(model2.draw(renderPass), 'Second model draw succeeded').toBeTruthy();
  model2.setBufferLayout([{
    name: 'a',
    format: 'float32x3'
  }]);
  model2.predraw(); // Forces a pipeline update
  expect(model1.pipeline !== model2.pipeline, 'Pipeline updated').toBeTruthy();
  expect(model2.draw(renderPass), 'Pipeline updates still draw').toBeTruthy();
  renderPass.destroy();
  model1.destroy();
  model2.destroy();
});
test('Model#pipeline caching with defines and modules', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (isSoftwareBackedDevice(webglDevice)) {
    return;
  }
  if (!webglDevice.props._cachePipelines) {
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
  expect(model1.pipeline, 'Got a pipeline').toBeTruthy();

  // reuse assembled shaders; this cache is already tested in shader-factory.spec.ts.
  const vs = shaderFactory.createShader({
    stage: 'vertex',
    source: model1.vs
  });
  const fs = shaderFactory.createShader({
    stage: 'fragment',
    source: model1.fs
  });
  const pipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list'
  });
  expect(model1.pipeline === pipeline2, 'Got cached pipeline').toBeTruthy();
  const defineModel1 = new Model(webglDevice, {
    id: 'caching-with-modules-test-2',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    defines: {
      MY_DEFINE: true
    }
  });
  expect(model1.pipeline !== defineModel1.pipeline, 'Define triggers new pipeline').toBeTruthy();
  const defineModel2 = new Model(webglDevice, {
    id: 'caching-with-modules-test-3',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    defines: {
      MY_DEFINE: true
    }
  });
  expect(defineModel1.pipeline === defineModel2.pipeline, 'Got cached pipeline with defines').toBeTruthy();
  const moduleModel1 = new Model(webglDevice, {
    id: 'caching-with-modules-test-4',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    modules: [mockModule]
  });
  expect(model1.pipeline !== moduleModel1.pipeline, 'Module triggers new pipeline').toBeTruthy();
  expect(defineModel1.pipeline !== moduleModel1.pipeline, 'Module triggers new pipeline').toBeTruthy();
  const moduleModel2 = new Model(webglDevice, {
    id: 'caching-with-modules-test-5',
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    modules: [mockModule]
  });
  expect(moduleModel1.pipeline === moduleModel2.pipeline, 'Got cached pipeline with modules').toBeTruthy();
  const defineModuleModel1 = new Model(webglDevice, {
    id: 'caching-with-modules-test-6',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    topology: 'triangle-list',
    modules: [mockModule],
    defines: {
      MY_DEFINE: true
    }
  });
  expect(pipeline2 !== defineModuleModel1.pipeline, 'Module and define triggers new pipeline').toBeTruthy();
  expect(defineModel1.pipeline !== defineModuleModel1.pipeline, 'Module and define triggers new pipeline').toBeTruthy();
  expect(moduleModel1.pipeline !== defineModuleModel1.pipeline, 'Module and define triggers new pipeline').toBeTruthy();
  const defineModuleModel2 = new Model(webglDevice, {
    id: 'caching-with-modules-test-7',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    topology: 'triangle-list',
    modules: [mockModule],
    defines: {
      MY_DEFINE: true
    }
  });
  expect(defineModuleModel1.pipeline === defineModuleModel2.pipeline, 'Got cached pipeline with modules and defines').toBeTruthy();
});
function isSoftwareBackedDevice(device: Device): boolean {
  return device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback);
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
