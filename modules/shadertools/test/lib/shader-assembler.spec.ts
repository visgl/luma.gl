// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  GLSLShaderAssembler,
  ShaderAssembler,
  WGSLShaderAssembler,
  type PlatformInfo,
  picking,
  dirlight
} from '@luma.gl/shadertools';

const platformInfo: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const vs = /* glsl */ `\
#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`;

const fs = /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const wgslPlatformInfo: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const wgslSource = /* wgsl */ `\
@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
`;

/*
const VS_300 = /* glsl *`\
#version 300 es

  in vec4 positions;
  in vec2 uvs;

  out vec2 vUV;

  void main() {
    vUV = uvs;
    gl_Position = positions;
  }
`;

const FS_300 = /* glsl *`\
#version 300 es
  precision highp float;

  in vec2 vUV;

  uniform sampler2D tex;

  out vec4 fragColor;
  void main() {
    fragColor = texture(tex, vUV);
  }
`;
*/

test('ShaderAssembler#hooks', t => {
  const shaderAssembler = new GLSLShaderAssembler();

  const preHookShaders = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  shaderAssembler.addShaderHook('vs:LUMAGL_pickColor(inout vec4 color)');
  shaderAssembler.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  });

  const assemblyResults = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  t.ok(preHookShaders !== assemblyResults, 'Adding hooks changes hash');

  const pickingInjection = {
    ...picking,
    instance: undefined,
    inject: {
      'vs:LUMAGL_pickColor': 'picking_setPickingColor(color.rgb);',
      'fs:LUMAGL_fragmentColor': {
        injection: 'color = picking_filterColor(color);',
        order: Number.POSITIVE_INFINITY
      }
    }
  };

  const noModuleProgram = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  t.ok(preHookShaders !== noModuleProgram, 'Adding hooks changes hash');

  const noModuleVs = noModuleProgram.vs;
  const noModuleFs = noModuleProgram.fs;

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

  const modulesProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    modules: [pickingInjection]
  });
  const modulesVs = modulesProgram.vs;
  const modulesFs = modulesProgram.fs;

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

  const injectedShaders = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;',
      'fs:LUMAGL_fragmentColor': 'color += 0.1;'
    }
  });
  const injectVs = injectedShaders.vs;
  const injectFs = injectedShaders.fs;

  t.ok(injectVs.indexOf('color *= 0.1') > -1, 'argument injection code included in shader hook');
  t.ok(injectFs.indexOf('color += 0.1') > -1, 'argument injection code included in shader hook');

  // const injectDefineProgram1 = shaderAssembler.assembleGLSLShaderPair({
  //   platformInfo,
  //   vs,
  //   fs,
  //   inject: {
  //     'vs:LUMAGL_pickColor': 'color *= 0.1;'
  //   }
  // });

  // const injectDefineProgram2 = shaderAssembler.assembleGLSLShaderPair({
  //   platformInfo,
  //   vs,
  //   fs,
  //   defines: {
  //     'vs:LUMAGL_pickColor': 'color *= 0.1;'
  //   }
  // });

  // t.ok(injectDefineProgram1 !== injectDefineProgram2, 'Injects and defines hashed separately.');

  t.end();
});

test('ShaderAssembler#defaultModules', t => {
  const shaderAssembler = new GLSLShaderAssembler();

  const program = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  const preDefaultModuleProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    modules: [dirlight]
  });

  const preDefaultModuleSource = preDefaultModuleProgram.fs;

  shaderAssembler.addDefaultModule(dirlight);

  const defaultModuleProgram = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});
  const moduleProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    modules: [dirlight]
  });

  t.notDeepEqual(program, defaultModuleProgram, 'Program with new default module properly cached');
  t.deepEqual(preDefaultModuleProgram.vs, defaultModuleProgram.vs);
  t.equal(preDefaultModuleProgram.fs, defaultModuleProgram.fs, 'Default module injected correctly');
  t.equal(
    moduleProgram.vs,
    defaultModuleProgram.vs,
    'Program with new default module matches regular module'
  );

  shaderAssembler.removeDefaultModule(dirlight);

  const noDefaultModuleProgram = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  t.ok(program.fs === noDefaultModuleProgram.fs, 'Default module was removed');
  t.ok(moduleProgram.fs !== noDefaultModuleProgram.fs, 'Default module was removed');

  // Reset program manager

  shaderAssembler.addDefaultModule(dirlight);
  const uncachedProgram = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});
  const defaultModuleSource = uncachedProgram.fs;

  // TODO - this deep equal thing doesn't make sense due to getUniforms
  t.notDeepEqual(defaultModuleProgram, uncachedProgram, 'Program is not cached');
  t.deepEqual(preDefaultModuleSource, defaultModuleSource, 'Default modules create correct source');

  t.end();
});

test('ShaderAssembler#getDefaultShaderAssembler isolates shader language state', t => {
  const glslShaderAssembler = ShaderAssembler.getDefaultShaderAssembler('glsl');
  const wgslShaderAssembler = ShaderAssembler.getDefaultShaderAssembler('wgsl');

  t.ok(glslShaderAssembler instanceof GLSLShaderAssembler, 'GLSL selects the GLSL assembler');
  t.ok(wgslShaderAssembler instanceof WGSLShaderAssembler, 'WGSL selects the WGSL assembler');
  t.equal(glslShaderAssembler.shaderLanguage, 'glsl', 'the GLSL default identifies its language');
  t.equal(wgslShaderAssembler.shaderLanguage, 'wgsl', 'the WGSL default identifies its language');
  t.equal(
    ShaderAssembler.getDefaultShaderAssembler('glsl'),
    glslShaderAssembler,
    'explicit GLSL requests reuse the GLSL assembler'
  );
  t.equal(
    ShaderAssembler.getDefaultShaderAssembler('wgsl'),
    wgslShaderAssembler,
    'explicit WGSL requests reuse the WGSL assembler'
  );
  t.notEqual(glslShaderAssembler, wgslShaderAssembler, 'shader languages never share an assembler');
  t.equal(
    typeof glslShaderAssembler.assembleGLSLShaderPair,
    'function',
    'GLSL assemblers expose GLSL assembly'
  );
  t.notOk(
    'assembleWGSLShader' in glslShaderAssembler,
    'GLSL assemblers do not expose WGSL assembly'
  );
  t.equal(
    typeof wgslShaderAssembler.assembleWGSLShader,
    'function',
    'WGSL assemblers expose WGSL assembly'
  );
  t.notOk(
    'assembleGLSLShaderPair' in wgslShaderAssembler,
    'WGSL assemblers do not expose GLSL assembly'
  );
  t.throws(
    () => Reflect.apply(ShaderAssembler.getDefaultShaderAssembler, ShaderAssembler, []),
    'a shader language must be supplied explicitly'
  );
  t.throws(
    () => Reflect.apply(ShaderAssembler.getDefaultShaderAssembler, ShaderAssembler, ['spirv']),
    'unsupported shader languages are rejected'
  );

  const isolatedGLSLShaderAssembler = new GLSLShaderAssembler();
  const isolatedWGSLShaderAssembler = new WGSLShaderAssembler();
  const initialGLSLDefaultSource = glslShaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  }).vs;
  const initialWGSLDefaultSource = wgslShaderAssembler.assembleWGSLShader({
    platformInfo: wgslPlatformInfo,
    source: wgslSource
  }).source;
  isolatedGLSLShaderAssembler.addShaderHook('vs:LUMAGL_isolatedHook(inout vec4 value)');
  isolatedWGSLShaderAssembler.addShaderHook(
    'vs:LUMAGL_isolatedHook(value: ptr<function, vec4<f32>>)'
  );

  const assembledGLSLSource = isolatedGLSLShaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  }).vs;
  const assembledWGSLSource = isolatedWGSLShaderAssembler.assembleWGSLShader({
    platformInfo: wgslPlatformInfo,
    source: wgslSource
  }).source;
  const retainedGLSLDefaultSource = glslShaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  }).vs;
  const retainedWGSLDefaultSource = wgslShaderAssembler.assembleWGSLShader({
    platformInfo: wgslPlatformInfo,
    source: wgslSource
  }).source;

  t.ok(
    assembledGLSLSource.includes('void LUMAGL_isolatedHook(inout vec4 value)'),
    'GLSL assemblers retain their own GLSL hook signatures'
  );
  t.ok(
    assembledWGSLSource.includes('fn LUMAGL_isolatedHook(value: ptr<function, vec4<f32>>)'),
    'WGSL assemblers retain their own WGSL hook signatures'
  );
  t.equal(
    retainedGLSLDefaultSource,
    initialGLSLDefaultSource,
    'isolated hooks never mutate the GLSL default'
  );
  t.equal(
    retainedWGSLDefaultSource,
    initialWGSLDefaultSource,
    'isolated hooks never mutate the WGSL default'
  );
  t.notOk(
    retainedGLSLDefaultSource.includes('LUMAGL_isolatedHook'),
    'isolated hooks are absent from shared GLSL source'
  );
  t.notOk(
    retainedWGSLDefaultSource.includes('LUMAGL_isolatedHook'),
    'isolated hooks are absent from shared WGSL source'
  );

  t.end();
});
