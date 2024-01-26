/*
import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';

import {GL} from '@luma.gl/constants';
import {luma} from '@luma.gl/core';
// TODO - Model test should not depend on Cube
import {Model, ProgramManager} from '@luma.gl/engine';
import {Buffer} from '@luma.gl/webgl';
import {CubeGeometry} from '@luma.gl/engine';
import {picking} from '@luma.gl/shadertools';

const stats = luma.stats.get('Resource Counts');

const DUMMY_VS = `
  void main() { gl_Position = vec4(1.0); }
`;

const DUMMY_FS = `
  precision highp float;
  void main() { gl_FragColor = vec4(1.0); }
`;

const VS_300 = `#version 300 es

  in vec4 positions;
  in vec2 uvs;

  out vec2 vUV;

  void main() {
    vUV = uvs;
    gl_Position = positions;
  }
`;

const FS_300 = `#version 300 es
  precision highp float;

  in vec2 vUV;

  uniform sampler2D tex;

  out vec4 fragColor;
  void main() {
    fragColor = texture(tex, vUV);
  }
`;

test('Model#construct/destruct', (t) => {
  // Avoid re-using program from ProgramManager
  const vs = '/* DO_NOT_CACHE Model#construct/destruct * void main() {gl_Position = vec4(0.0);}';
  const fs = '/* DO_NOT_CACHE Model#construct/destruct * void main() {gl_FragColor = vec4(0.0);}';

  const model = new Model(webglDevice, {
    drawMode: GL.POINTS,
    vertexCount: 0,
    vs,
    fs
  });

  t.ok(model, 'Model constructor does not throw errors');
  t.ok(model.id, 'Model has an id');
  t.ok(model.getProgram().handle, 'Created new program');

  model.destroy();
  t.notOk(model.vertexArray.handle, 'Deleted vertexArray');
  t.notOk(model.program.handle, 'Deleted program');

  t.end();
});

test('Model#multiple delete', (t) => {
  // Avoid re-using program from ProgramManager
  const vs = '/* DO_NOT_CACHE Model#construct/destruct * void main() {gl_Position = vec4(0.0);}';
  const fs = '/* DO_NOT_CACHE Model#construct/destruct * void main() {gl_FragColor = vec4(0.0);}';

  const model1 = new Model(webglDevice, {
    drawMode: GL.POINTS,
    vertexCount: 0,
    vs,
    fs
  });

  const model2 = new Model(webglDevice, {
    drawMode: GL.POINTS,
    vertexCount: 0,
    vs,
    fs
  });

  model1.destroy();
  t.ok(model2.program.handle, 'program still in use');
  model1.destroy();
  t.ok(model2.program.handle, 'program still in use');
  model2.destroy();
  t.notOk(model2.program.handle, 'program is released');

  t.end();
});

test('Model#setAttribute', (t) => {
  const buffer1 = webglDevice.createBuffer({
    accessor: {size: 2},
    data: new Float32Array(4).fill(1)
  });
  const buffer2 = webglDevice.createBuffer({data: new Float32Array(8)});

  const initialActiveBuffers = stats.get('Buffers Active').count;

  const model = new Model(webglDevice, {
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    geometry: new CubeGeometry()
  });

  t.is(
    stats.get('Buffers Active').count - initialActiveBuffers,
    4,
    'Created new buffers for attributes'
  );

  model.setAttributes({
    instanceSizes: [buffer1, {size: 1}],
    instancePositions: buffer2,
    instanceWeight: new Float32Array([10]),
    instanceColors: {getValue: () => new Float32Array([0, 0, 0, 1])}
  });

  t.deepEqual(model.getAttributes(), {}, 'no longer stores local attributes');

  t.is(stats.get('Buffers Active').count - initialActiveBuffers, 4, 'Did not create new buffers');

  model.destroy();

  buffer1.destroy();
  buffer2.destroy();

  t.end();
});

test('Model#setters, getters', (t) => {
  const model = new Model(webglDevice, {vs: DUMMY_VS, fs: DUMMY_FS});

  model.setUniforms({
    isPickingActive: 1
  });
  t.deepEqual(model.getUniforms(), {isPickingActive: 1}, 'uniforms are set');

  model.setInstanceCount(4);
  t.is(model.getInstanceCount(), 4, 'instance count is set');

  model.setDrawMode(1);
  t.is(model.getDrawMode(), 1, 'draw mode is set');

  model.destroy();

  t.end();
});

test('Model#draw', (t) => {
  const model = new Model(webglDevice, {
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    geometry: new CubeGeometry(),
    timerQueryEnabled: true
  });

  model.draw();

  model.render({
    isPickingActive: 1
  });
  t.deepEqual(model.getUniforms(), {isPickingActive: 1}, 'uniforms are set');

  t.end();
});

test('Model#program management', (t) => {
  const pm = new ProgramManager(webglDevice);

  const vs = `
    uniform float x;

    void main() {
      gl_Position = vec4(x);
    }
  `;

  const fs = `
    void main() {
      gl_FragColor = vec4(1.0);
    }
  `;

  const model1 = new Model(webglDevice, {
    programManager: pm,
    vs,
    fs,
    uniforms: {
      x: 0.5
    }
  });

  const model2 = new Model(webglDevice, {
    programManager: pm,
    vs,
    fs,
    uniforms: {
      x: -0.5
    }
  });

  t.ok(model1.program === model2.program, 'Programs are shared.');

  model1.draw();
  t.deepEqual(model1.getUniforms(), model1.program.uniforms, 'Program uniforms set');

  model2.draw();
  t.deepEqual(model2.getUniforms(), model2.program.uniforms, 'Program uniforms set');

  model2.setProgram({
    vs,
    fs,
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(model1.program === model2.program, 'Program not updated before draw.');

  model2.draw();
  t.ok(model1.program !== model2.program, 'Program updated after draw.');
  t.deepEqual(model2.getUniforms(), model2.program.uniforms, 'Program uniforms set');

  // This part is checking that the use counts
  // don't get bloated by multiple checks.
  const model3 = new Model(webglDevice, {
    programManager: pm,
    vs,
    fs,
    defines: {
      MODEL3_DEFINE1: true
    }
  });

  const oldProgram = model3.program;

  // Check for program updates a few times
  model3.draw();
  model3.draw();

  model3.setProgram({
    vs,
    fs,
    defines: {
      MODEL3_DEFINE2: true
    }
  });

  model3.draw();
  t.ok(model3.program !== oldProgram, 'Program updated after draw.');
  t.ok(oldProgram.handle === null, 'Old program released after update');

  t.end();
});

test('Model#program management - getModuleUniforms', (t) => {
  const pm = new ProgramManager(webglDevice);

  const vs = 'void main() {}';
  const fs = 'void main() {}';

  const model = new Model(webglDevice, {
    programManager: pm,
    vs,
    fs
  });

  t.deepEqual(model.getModuleUniforms(), {}, 'Module uniforms empty with no modules');

  model.setProgram({
    vs,
    fs,
    modules: [picking]
  });

  t.deepEqual(
    model.getModuleUniforms(),
    picking.getUniforms(),
    'Module uniforms correct after update'
  );

  t.end();
});

test('Model#getBuffersFromGeometry', (t) => {
  let buffers = getBuffersFromGeometry(webglDevice.gl, {
    indices: new Uint16Array([0, 1, 2, 3]),
    attributes: {
      positions: {size: 3, value: new Float32Array(12)},
      colors: {constant: true, value: [255, 255, 255, 255]},
      uvs: {size: 2, value: new Float32Array(8)}
    }
  });

  t.deepEqual(buffers.colors, [255, 255, 255, 255], 'colors mapped');
  t.ok(buffers.positions[0] instanceof Buffer, 'positions mapped');
  t.is(buffers.positions[1].size, 3, 'positions mapped');
  t.ok(buffers.uvs[0] instanceof Buffer, 'uvs mapped');
  t.is(buffers.uvs[1].size, 2, 'uvs mapped');
  t.ok(buffers.indices[0] instanceof Buffer, 'indices mapped');

  buffers.positions[0].destroy();
  buffers.uvs[0].destroy();
  buffers.indices[0].destroy();

  // Inferring attribute size
  buffers = getBuffersFromGeometry(webglDevice.gl, {
    attributes: {
      indices: {value: new Uint16Array([0, 1, 2, 3])},
      normals: {value: new Float32Array(12)},
      texCoords: {value: new Float32Array(8)}
    }
  });
  t.is(buffers.indices[1].size, 1, 'texCoords size');
  t.is(buffers.normals[1].size, 3, 'normals size');
  t.is(buffers.texCoords[1].size, 2, 'texCoords size');

  buffers.indices[0].destroy();
  buffers.normals[0].destroy();
  buffers.texCoords[0].destroy();

  t.throws(
    () =>
      getBuffersFromGeometry(webglDevice.gl, {
        indices: [0, 1, 2, 3]
      }),
    'invalid indices'
  );

  t.throws(
    () =>
      getBuffersFromGeometry(webglDevice.gl, {
        attributes: {
          heights: {value: new Float32Array([0, 1, 2, 3])}
        }
      }),
    'invalid size'
  );

  t.end();
});

test('Model#transpileToGLSL100', (t) => {
  let model;

  t.throws(() => {
    model = new Model(webglDevice, {
      vs: VS_300,
      fs: FS_300
    });
  }, "Can't compile 300 shader with WebGL 1");

  t.doesNotThrow(() => {
    model = new Model(webglDevice, {
      vs: VS_300,
      fs: FS_300
    });
  }, 'Can compile transpiled 300 shader with WebGL 1');

  @ts-expect-error object possibly undefined
  t.ok(model.program, 'Created a program');
  t.end();
});
*/



/*
test.skip('PipelineFactory#basic', (t) => {
  const pipelineFactory = new PipelineFactory(webglDevice);

  const program1 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(program1, 'Got a pipeline');

  const pipeline2 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(program1 === pipeline2, 'Got cached pipeline');

  const definePipeline1 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(program1 !== definePipeline1, 'Define triggers new pipeline');

  const definePipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(definePipeline1 === definePipeline2, 'Got cached pipeline with defines');

  const modulePipeline1 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [picking]
  });

  t.ok(program1 !== modulePipeline1, 'Module triggers new pipeline');
  t.ok(definePipeline1 !== modulePipeline1, 'Module triggers new pipeline');

  const modulePipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [picking]
  });

  t.ok(modulePipeline1 === modulePipeline2, 'Got cached pipeline with modules');

  const defineModulePipeline1 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [picking],
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(program1 !== defineModulePipeline1, 'Module and define triggers new pipeline');
  t.ok(definePipeline1 !== defineModulePipeline1, 'Module and define triggers new pipeline');
  t.ok(modulePipeline1 !== defineModulePipeline1, 'Module and define triggers new pipeline');

  const defineModulePipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [picking],
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(
    defineModulePipeline1 === defineModulePipeline2,
    'Got cached pipeline with modules and defines'
  );

  t.end();
});
*/

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
test.skip('PipelineFactory#defaultModules', (t) => {
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

// TODO - Move to model: transpilation functionality was moved to model
test.skip('PipelineFactory#transpileToGLSL100', (t) => {
  const pipelineFactory = new PipelineFactory(webglDevice);

  t.throws(() => {
    pipelineFactory.createRenderPipeline({
      vs: VS_300,
      fs: FS_300,
      topology: 'triangle-list'
    });
  }, 'Can\'t compile 300 shader with WebGL 1');

  t.doesNotThrow(() => {
    pipelineFactory.createRenderPipeline({
      vs: VS_300,
      fs: FS_300,
      topology: 'triangle-list'
    });
  }, 'Can compile transpiled 300 shader with WebGL 1');

  const programTranspiled = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const programUntranspiled = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const programTranspiled2 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.equals(programTranspiled, programTranspiled2, 'Transpiled programs match');
  t.notEquals(
    programTranspiled,
    programUntranspiled,
    'Transpiled pipeline does not match untranspiled pipeline'
  );

  t.end();
});
*/
