import test from 'tape-promise/tape';
import {webgl1Device} from '@luma.gl/test-utils';

import {glsl} from '@luma.gl/api';
import {PipelineFactory} from '@luma.gl/engine';
import {dirlight, picking} from '@luma.gl/shadertools';


// TODO - this doesn't test that parameters etc are properly cached

const vs = glsl`\
attribute vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;
const fs = glsl`\
precision highp float;

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

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

test('PipelineFactory#import', (t) => {
  t.ok(PipelineFactory !== undefined, 'PipelineFactory import successful');
  t.end();
});

test('PipelineFactory#getDefaultPipelineFactory', (t) => {
  const pm1 = PipelineFactory.getDefaultPipelineFactory(webgl1Device);
  const pm2 = PipelineFactory.getDefaultPipelineFactory(webgl1Device);

  t.ok(pm1 instanceof PipelineFactory, 'Default pipeline manager created');
  t.ok(pm1 === pm2, 'Default pipeline manager cached');

  t.end();
});

test('PipelineFactory#basic', (t) => {
  const pipelineFactory = new PipelineFactory(webgl1Device);

  const {pipeline: program1} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(program1, 'Got a pipeline');

  const {pipeline: pipeline2} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(program1 === pipeline2, 'Got cached pipeline');

  const {pipeline: definePipeline1} = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(program1 !== definePipeline1, 'Define triggers new pipeline');

  const {pipeline: definePipeline2} = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(definePipeline1 === definePipeline2, 'Got cached pipeline with defines');

  const {pipeline: modulePipeline1} = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [picking]
  });

  t.ok(program1 !== modulePipeline1, 'Module triggers new pipeline');
  t.ok(definePipeline1 !== modulePipeline1, 'Module triggers new pipeline');

  const {pipeline: modulePipeline2} = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [picking]
  });

  t.ok(modulePipeline1 === modulePipeline2, 'Got cached pipeline with modules');

  const {pipeline: defineModulePipeline1} = pipelineFactory.createRenderPipeline({
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

  const {pipeline: defineModulePipeline2} = pipelineFactory.createRenderPipeline({
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

test('PipelineFactory#hooks', (t) => {
  const pipelineFactory = new PipelineFactory(webgl1Device);

  const {pipeline: preHookPipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  pipelineFactory.addShaderHook('vs:LUMAGL_pickColor(inout vec4 color)');
  pipelineFactory.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  });

  const {pipeline: postHookPipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

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

  const {pipeline: noModulePipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

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

  const {pipeline: modulesPipeline} = pipelineFactory.createRenderPipeline({
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

  const {pipeline: injectPipeline} = pipelineFactory.createRenderPipeline({
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

  const {pipeline: injectDefinePipeline1} = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;'
    }
  });

  const {pipeline: injectDefinePipeline2} = pipelineFactory.createRenderPipeline({
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

test('PipelineFactory#defaultModules', (t) => {
  const pipelineFactory = new PipelineFactory(webgl1Device);

  const {pipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  const  {pipeline: preDefaultModulePipeline} = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    modules: [dirlight]
  });

  const preDefaultModuleSource = preDefaultModulePipeline.fs.source;

  pipelineFactory.addDefaultModule(dirlight);

  const {pipeline: defaultModulePipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const {pipeline: modulePipeline} = pipelineFactory.createRenderPipeline({
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

  const {pipeline: noDefaultModulePipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  t.ok(pipeline.fs.source === noDefaultModulePipeline.fs.source, 'Default module was removed');
  t.ok(modulePipeline.fs.source !== noDefaultModulePipeline.fs.source, 'Default module was removed');

  // Reset pipeline manager
  pipelineFactory.release(pipeline);
  pipelineFactory.release(modulePipeline);
  pipelineFactory.release(defaultModulePipeline);
  pipelineFactory.release(noDefaultModulePipeline);

  pipelineFactory.addDefaultModule(dirlight);
  const {pipeline: uncachedPipeline} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const defaultModuleSource = uncachedPipeline.fs.source;

  t.ok(defaultModulePipeline !== uncachedPipeline, 'Pipeline is not cached');
  t.ok(preDefaultModuleSource === defaultModuleSource, 'Default modules create correct source');

  t.end();
});

test('PipelineFactory#release', (t) => {
  const pipelineFactory = new PipelineFactory(webgl1Device);

  const {pipeline: pipeline1} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const {pipeline: pipeline2} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  pipelineFactory.release(pipeline1);
  t.ok(!pipeline1.destroyed, 'Pipeline not deleted when still referenced.');

  pipelineFactory.release(pipeline2);
  t.ok(pipeline2.destroyed, 'Pipeline deleted when all references released.');

  t.end();
});

test('PipelineFactory#transpileToGLSL100', (t) => {
  const pipelineFactory = new PipelineFactory(webgl1Device);

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
      topology: 'triangle-list',
      transpileToGLSL100: true
    });
  }, 'Can compile transpiled 300 shader with WebGL 1');

  const {pipeline: programTranspiled} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list', transpileToGLSL100: true});
  const {pipeline: programUntranspiled} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const {pipeline: programTranspiled2} = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list', transpileToGLSL100: true});

  t.equals(programTranspiled, programTranspiled2, 'Transpiled programs match');
  t.notEquals(
    programTranspiled,
    programUntranspiled,
    'Transpiled pipeline does not match untranspiled pipeline'
  );

  t.end();
});
