// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('ShaderAssembler#hooks', () => {
  const shaderAssembler = new GLSLShaderAssembler();

  const preHookShaders = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  shaderAssembler.addShaderHook('vs:LUMAGL_pickColor(inout vec4 color)');
  shaderAssembler.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  });

  const assemblyResults = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  expect(Boolean(preHookShaders !== assemblyResults), 'Adding hooks changes hash').toBe(true);

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

  expect(Boolean(preHookShaders !== noModuleProgram), 'Adding hooks changes hash').toBe(true);

  const noModuleVs = noModuleProgram.vs;
  const noModuleFs = noModuleProgram.fs;

  expect(
    Boolean(noModuleVs.indexOf('LUMAGL_pickColor') > -1),
    'hook function injected into vertex shader'
  ).toBe(true);
  expect(
    Boolean(noModuleFs.indexOf('LUMAGL_fragmentColor') > -1),
    'hook function injected into fragment shader'
  ).toBe(true);

  expect(
    Boolean(noModuleVs.indexOf('picking_setPickingColor(color.rgb)') === -1),
    'injection code not included in vertex shader without module'
  ).toBe(true);
  expect(
    Boolean(noModuleFs.indexOf('color = picking_filterColor(color)') === -1),
    'injection code not included in fragment shader without module'
  ).toBe(true);

  const modulesProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    modules: [pickingInjection]
  });
  const modulesVs = modulesProgram.vs;
  const modulesFs = modulesProgram.fs;

  expect(
    Boolean(modulesVs.indexOf('LUMAGL_pickColor') > -1),
    'hook function injected into vertex shader'
  ).toBe(true);
  expect(
    Boolean(modulesFs.indexOf('LUMAGL_fragmentColor') > -1),
    'hook function injected into fragment shader'
  ).toBe(true);

  expect(
    Boolean(modulesVs.indexOf('picking_setPickingColor(color.rgb)') > -1),
    'injection code included in vertex shader with module'
  ).toBe(true);
  expect(
    Boolean(modulesFs.indexOf('color = picking_filterColor(color)') > -1),
    'injection code included in fragment shader with module'
  ).toBe(true);
  expect(
    Boolean(modulesFs.indexOf('if (color.a == 0.0) discard;') > -1),
    'hook header injected into fragment shader'
  ).toBe(true);
  expect(
    Boolean(
      modulesFs.indexOf('color.a *= 1.2;') > modulesFs.indexOf('color = picking_filterColor(color)')
    ),
    'hook footer injected after injection code'
  ).toBe(true);

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

  expect(
    Boolean(injectVs.indexOf('color *= 0.1') > -1),
    'argument injection code included in shader hook'
  ).toBe(true);
  expect(
    Boolean(injectFs.indexOf('color += 0.1') > -1),
    'argument injection code included in shader hook'
  ).toBe(true);

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

  void 0;
});

it('ShaderAssembler#defaultModules', () => {
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

  expect(program, 'Program with new default module properly cached').not.toEqual(
    defaultModuleProgram
  );
  expect(preDefaultModuleProgram.vs, '').toEqual(defaultModuleProgram.vs);
  expect(preDefaultModuleProgram.fs, 'Default module injected correctly').toBe(
    defaultModuleProgram.fs
  );
  expect(moduleProgram.vs, 'Program with new default module matches regular module').toBe(
    defaultModuleProgram.vs
  );

  shaderAssembler.removeDefaultModule(dirlight);

  const noDefaultModuleProgram = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  expect(Boolean(program.fs === noDefaultModuleProgram.fs), 'Default module was removed').toBe(
    true
  );
  expect(
    Boolean(moduleProgram.fs !== noDefaultModuleProgram.fs),
    'Default module was removed'
  ).toBe(true);

  // Reset program manager

  shaderAssembler.addDefaultModule(dirlight);
  const uncachedProgram = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});
  const defaultModuleSource = uncachedProgram.fs;

  // TODO - this deep equal thing doesn't make sense due to getUniforms
  expect(defaultModuleProgram, 'Program is not cached').not.toEqual(uncachedProgram);
  expect(preDefaultModuleSource, 'Default modules create correct source').toEqual(
    defaultModuleSource
  );

  void 0;
});

it('ShaderAssembler#getDefaultShaderAssembler isolates shader language state', () => {
  const glslShaderAssembler = ShaderAssembler.getDefaultShaderAssembler('glsl');
  const wgslShaderAssembler = ShaderAssembler.getDefaultShaderAssembler('wgsl');

  expect(
    Boolean(glslShaderAssembler instanceof GLSLShaderAssembler),
    'GLSL selects the GLSL assembler'
  ).toBe(true);
  expect(
    Boolean(wgslShaderAssembler instanceof WGSLShaderAssembler),
    'WGSL selects the WGSL assembler'
  ).toBe(true);
  expect(glslShaderAssembler.shaderLanguage, 'the GLSL default identifies its language').toBe(
    'glsl'
  );
  expect(wgslShaderAssembler.shaderLanguage, 'the WGSL default identifies its language').toBe(
    'wgsl'
  );
  expect(
    ShaderAssembler.getDefaultShaderAssembler('glsl'),
    'explicit GLSL requests reuse the GLSL assembler'
  ).toBe(glslShaderAssembler);
  expect(
    ShaderAssembler.getDefaultShaderAssembler('wgsl'),
    'explicit WGSL requests reuse the WGSL assembler'
  ).toBe(wgslShaderAssembler);
  expect(glslShaderAssembler, 'shader languages never share an assembler').not.toBe(
    wgslShaderAssembler
  );
  expect(
    typeof glslShaderAssembler.assembleGLSLShaderPair,
    'GLSL assemblers expose GLSL assembly'
  ).toBe('function');
  expect(
    Boolean('assembleWGSLShader' in glslShaderAssembler),
    'GLSL assemblers do not expose WGSL assembly'
  ).toBe(false);
  expect(
    typeof wgslShaderAssembler.assembleWGSLShader,
    'WGSL assemblers expose WGSL assembly'
  ).toBe('function');
  expect(
    Boolean('assembleGLSLShaderPair' in wgslShaderAssembler),
    'WGSL assemblers do not expose GLSL assembly'
  ).toBe(false);
  expect(
    () => Reflect.apply(ShaderAssembler.getDefaultShaderAssembler, ShaderAssembler, []),
    'a shader language must be supplied explicitly'
  ).toThrow();
  expect(
    () => Reflect.apply(ShaderAssembler.getDefaultShaderAssembler, ShaderAssembler, ['spirv']),
    'unsupported shader languages are rejected'
  ).toThrow();

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

  expect(
    Boolean(assembledGLSLSource.includes('void LUMAGL_isolatedHook(inout vec4 value)')),
    'GLSL assemblers retain their own GLSL hook signatures'
  ).toBe(true);
  expect(
    Boolean(
      assembledWGSLSource.includes('fn LUMAGL_isolatedHook(value: ptr<function, vec4<f32>>)')
    ),
    'WGSL assemblers retain their own WGSL hook signatures'
  ).toBe(true);
  expect(retainedGLSLDefaultSource, 'isolated hooks never mutate the GLSL default').toBe(
    initialGLSLDefaultSource
  );
  expect(retainedWGSLDefaultSource, 'isolated hooks never mutate the WGSL default').toBe(
    initialWGSLDefaultSource
  );
  expect(
    Boolean(retainedGLSLDefaultSource.includes('LUMAGL_isolatedHook')),
    'isolated hooks are absent from shared GLSL source'
  ).toBe(false);
  expect(
    Boolean(retainedWGSLDefaultSource.includes('LUMAGL_isolatedHook')),
    'isolated hooks are absent from shared WGSL source'
  ).toBe(false);

  void 0;
});
