import test from 'tape-promise/tape';
import {luma} from '@luma.gl/core';
import {Model, PipelineFactory, ShaderFactory} from '@luma.gl/engine';
import {webglDevice, getTestDevices} from '@luma.gl/test-utils';

const stats = luma.stats.get('Resource Counts');

const DUMMY_WGSL = /* WGSL */ `
@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
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

test('Model#construct/destruct', t => {
  const model = new Model(webglDevice, {
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  t.ok(model, 'Model constructor does not throw errors');
  t.ok(model.id, 'Model has an id');
  t.ok(model.pipeline, 'Created pipeline');

  model.destroy();
  t.true(model.pipeline.destroyed, 'Deleted pipeline');

  t.end();
});

test('Model#multiple delete', t => {
  const model1 = new Model(webglDevice, {
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  const model2 = new Model(webglDevice, {
    topology: 'point-list',
    vertexCount: 0,
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  model1.destroy();
  t.ok(model2.pipeline.destroyed === false, 'program still in use');
  model1.destroy();
  t.ok(model2.pipeline.destroyed === false, 'program still in use');
  model2.destroy();
  t.ok(model2.pipeline.destroyed === true, 'program is released');

  t.end();
});

test('Model#setAttributes', t => {
  const buffer1 = webglDevice.createBuffer({data: new Float32Array(9).fill(0)});
  const buffer2 = webglDevice.createBuffer({data: new Float32Array(9).fill(1)});

  const initialActiveBuffers = stats.get('Buffers Active').count;

  const model = new Model(webglDevice, {
    vs: DUMMY_VS,
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

  t.is(
    stats.get('Buffers Active').count - initialActiveBuffers,
    2,
    'Created new buffers for attributes'
  );

  model.setAttributes({positions: buffer1, normals: buffer2});

  t.deepEqual(model.bufferAttributes, {}, 'no longer stores local attributes');

  t.is(stats.get('Buffers Active').count - initialActiveBuffers, 2, 'Did not create new buffers');

  model.destroy();

  buffer1.destroy();
  buffer2.destroy();

  t.end();
});

test('Model#setters, getters', t => {
  const model = new Model(webglDevice, {topology: 'point-list', vs: DUMMY_VS, fs: DUMMY_FS});

  model.setVertexCount(12);
  t.is(model.vertexCount, 12, 'set vertex count');

  model.setInstanceCount(4);
  t.is(model.instanceCount, 4, 'set instance count');

  model.setTopology('triangle-list');
  t.is(model.topology, 'triangle-list', 'set topology');

  model.destroy();

  t.end();
});

test('Model#draw', t => {
  const model = new Model(webglDevice, {
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

  t.end();
});

test('Model#topology', async t => {
  for (const device of await getTestDevices()) {
    const model = new Model(device, {
      vs: DUMMY_VS,
      fs: DUMMY_FS,
      source: DUMMY_WGSL,
      vertexEntryPoint: 'vertexMain',
      fragmentEntryPoint: 'fragmentMain'
    });

    t.equal(model.pipeline.props.topology, 'triangle-list', 'Pipeline has triangle-list topology');

    model.setTopology('line-strip');

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 0]});
    model.draw(renderPass);

    t.equal(model.pipeline.props.topology, 'line-strip', 'Pipeline has line-strip topology');

    renderPass.end();
    device.submit();
    renderPass.destroy();
    model.destroy();
  }

  t.end();
});

test('Model#pipeline caching', t => {
  const pipelineFactory = new PipelineFactory(webglDevice);
  const shaderFactory = new ShaderFactory(webglDevice);

  const model1 = new Model(webglDevice, {
    pipelineFactory,
    shaderFactory,
    topology: 'point-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    uniforms: {x: 0.5}
  });

  const model2 = new Model(webglDevice, {
    pipelineFactory,
    shaderFactory,
    topology: 'point-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    uniforms: {x: -0.5}
  });

  t.ok(model1.pipeline === model2.pipeline, 'Pipelines are shared.');

  const renderPass = webglDevice.beginRenderPass({clearColor: [0, 0, 0, 0]});

  let uniforms: Record<string, unknown> = {};
  const setUniformsSpy = _uniforms => (uniforms = _uniforms);

  model1.pipeline.setUniformsWebGL = setUniformsSpy;

  model1.draw(renderPass);
  t.deepEqual(uniforms, {x: 0.5}, 'Pipeline uniforms set');

  model2.draw(renderPass);
  t.deepEqual(uniforms, {x: -0.5}, 'Pipeline uniforms set');

  model2.setBufferLayout([{name: 'a', format: 'float32x3'}]);
  model2.predraw(); // Forces a pipeline update
  t.ok(model1.pipeline !== model2.pipeline, 'Pipeline updated');

  model2.pipeline.setUniformsWebGL = setUniformsSpy;
  model2.draw(renderPass);
  t.deepEqual(uniforms, {x: -0.5}, 'Pipeline uniforms set');

  renderPass.destroy();

  model1.destroy();
  model2.destroy();

  t.end();
});

test('Model#pipeline caching with defines and modules', t => {
  const pipelineFactory = PipelineFactory.getDefaultPipelineFactory(webglDevice);
  const shaderFactory = ShaderFactory.getDefaultShaderFactory(webglDevice);
  const model1 = new Model(webglDevice, {
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS
  });

  t.ok(model1.pipeline, 'Got a pipeline');

  // reuse assembled shaders; this cache is already tested in shader-factory.spec.ts.
  const vs = shaderFactory.createShader({stage: 'vertex', source: model1.vs});
  const fs = shaderFactory.createShader({stage: 'fragment', source: model1.fs});

  const pipeline2 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(model1.pipeline === pipeline2, 'Got cached pipeline');

  const defineModel1 = new Model(webglDevice, {
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    defines: {MY_DEFINE: true}
  });

  t.ok(model1.pipeline !== defineModel1.pipeline, 'Define triggers new pipeline');

  const defineModel2 = new Model(webglDevice, {
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    defines: {MY_DEFINE: true}
  });

  t.ok(defineModel1.pipeline === defineModel2.pipeline, 'Got cached pipeline with defines');

  const moduleModel1 = new Model(webglDevice, {
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    modules: [mockModule]
  });

  t.ok(model1.pipeline !== moduleModel1.pipeline, 'Module triggers new pipeline');
  t.ok(defineModel1.pipeline !== moduleModel1.pipeline, 'Module triggers new pipeline');

  const moduleModel2 = new Model(webglDevice, {
    topology: 'triangle-list',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    modules: [mockModule]
  });

  t.ok(moduleModel1.pipeline === moduleModel2.pipeline, 'Got cached pipeline with modules');

  const defineModuleModel1 = new Model(webglDevice, {
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    topology: 'triangle-list',
    modules: [mockModule],
    defines: {MY_DEFINE: true}
  });

  t.ok(pipeline2 !== defineModuleModel1.pipeline, 'Module and define triggers new pipeline');
  t.ok(
    defineModel1.pipeline !== defineModuleModel1.pipeline,
    'Module and define triggers new pipeline'
  );
  t.ok(
    moduleModel1.pipeline !== defineModuleModel1.pipeline,
    'Module and define triggers new pipeline'
  );

  const defineModuleModel2 = new Model(webglDevice, {
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    topology: 'triangle-list',
    modules: [mockModule],
    defines: {MY_DEFINE: true}
  });

  t.ok(
    defineModuleModel1.pipeline === defineModuleModel2.pipeline,
    'Got cached pipeline with modules and defines'
  );

  t.end();
});

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
