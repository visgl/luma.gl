// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GLSLShaderAssembler,
  ShaderAssembler,
  type PlatformInfo,
  picking,
  dirlight
} from '@luma.gl/shaders';

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

const _wgslPlatformInfo: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const _wgslSource = /* wgsl */ `\
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

it('ShaderAssembler#hooks preserves last-registration-wins behavior', () => {
  const shaderAssembler = new GLSLShaderAssembler();
  shaderAssembler.addShaderHook('vs:REPLACED_HOOK(inout vec4 position)', {
    header: 'position.x = 1.0;\n'
  });
  shaderAssembler.addShaderHook('vs:REPLACED_HOOK(inout vec4 position)', {
    header: 'position.x = 2.0;\n'
  });

  const assembled = shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs});

  expect(assembled.vs).not.toContain('position.x = 1.0;');
  expect(assembled.vs).toContain('position.x = 2.0;');
  expect(assembled.vs.match(/void REPLACED_HOOK/g)).toHaveLength(1);
  void 0;
});

it('ShaderAssembler#resetShaderHooks removes registered hooks', () => {
  const shaderAssembler = new GLSLShaderAssembler();
  shaderAssembler.addShaderHook('vs:RESET_HOOK(inout vec4 position)');
  const inject = {'vs:RESET_HOOK': 'position.x += 1.0;'};

  expect(shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs, inject}).vs).toContain(
    'void RESET_HOOK'
  );

  shaderAssembler.resetShaderHooks();
  expect(shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs}).vs).not.toContain(
    'void RESET_HOOK'
  );
  expect(() => shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs, inject})).toThrow(
    'Unknown shader hook vs:RESET_HOOK'
  );

  shaderAssembler.addShaderHook('vs:RESET_HOOK(inout vec4 position)');
  expect(shaderAssembler.assembleGLSLShaderPair({platformInfo, vs, fs, inject}).vs).toContain(
    'position.x += 1.0;'
  );
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

it('ShaderAssembler has explicit instance ownership without a global default factory', () => {
  expect('getDefaultShaderAssembler' in ShaderAssembler).toBe(false);
  const first = new GLSLShaderAssembler();
  const second = new GLSLShaderAssembler();
  first.addDefaultModule({name: 'first-only'});
  expect(first._getModuleList().map(module => module.name)).toEqual(['first-only']);
  expect(second._getModuleList()).toEqual([]);
});
