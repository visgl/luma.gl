import {expect, test} from 'vitest';
import { ShaderAssembler, PlatformInfo, picking, dirlight } from '@luma.gl/shadertools';
const platformInfo: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};
const vs = /* glsl */`\
#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`;
const fs = /* glsl */`\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
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

test('ShaderAssembler#hooks', () => {
  const shaderAssembler = new ShaderAssembler();
  const preHookShaders = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  });
  shaderAssembler.addShaderHook('vs:LUMAGL_pickColor(inout vec4 color)');
  shaderAssembler.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  });
  const assemblyResults = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  });
  expect(preHookShaders !== assemblyResults, 'Adding hooks changes hash').toBeTruthy();
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
  const noModuleProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  });
  expect(preHookShaders !== noModuleProgram, 'Adding hooks changes hash').toBeTruthy();
  const noModuleVs = noModuleProgram.vs;
  const noModuleFs = noModuleProgram.fs;
  expect(noModuleVs.indexOf('LUMAGL_pickColor') > -1, 'hook function injected into vertex shader').toBeTruthy();
  expect(noModuleFs.indexOf('LUMAGL_fragmentColor') > -1, 'hook function injected into fragment shader').toBeTruthy();
  expect(noModuleVs.indexOf('picking_setPickingColor(color.rgb)') === -1, 'injection code not included in vertex shader without module').toBeTruthy();
  expect(noModuleFs.indexOf('color = picking_filterColor(color)') === -1, 'injection code not included in fragment shader without module').toBeTruthy();
  const modulesProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    modules: [pickingInjection]
  });
  const modulesVs = modulesProgram.vs;
  const modulesFs = modulesProgram.fs;
  expect(modulesVs.indexOf('LUMAGL_pickColor') > -1, 'hook function injected into vertex shader').toBeTruthy();
  expect(modulesFs.indexOf('LUMAGL_fragmentColor') > -1, 'hook function injected into fragment shader').toBeTruthy();
  expect(modulesVs.indexOf('picking_setPickingColor(color.rgb)') > -1, 'injection code included in vertex shader with module').toBeTruthy();
  expect(modulesFs.indexOf('color = picking_filterColor(color)') > -1, 'injection code included in fragment shader with module').toBeTruthy();
  expect(modulesFs.indexOf('if (color.a == 0.0) discard;') > -1, 'hook header injected into fragment shader').toBeTruthy();
  expect(modulesFs.indexOf('color.a *= 1.2;') > modulesFs.indexOf('color = picking_filterColor(color)'), 'hook footer injected after injection code').toBeTruthy();
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
  expect(injectVs.indexOf('color *= 0.1') > -1, 'argument injection code included in shader hook').toBeTruthy();
  expect(injectFs.indexOf('color += 0.1') > -1, 'argument injection code included in shader hook').toBeTruthy();

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
});
test('ShaderAssembler#defaultModules', () => {
  const shaderAssembler = new ShaderAssembler();
  const program = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  });
  const preDefaultModuleProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    modules: [dirlight]
  });
  const preDefaultModuleSource = preDefaultModuleProgram.fs;
  shaderAssembler.addDefaultModule(dirlight);
  const defaultModuleProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  });
  const moduleProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs,
    modules: [dirlight]
  });
  expect(program, 'Program with new default module properly cached').not.toEqual(defaultModuleProgram);
  expect(preDefaultModuleProgram.vs).toEqual(defaultModuleProgram.vs);
  expect(preDefaultModuleProgram.fs, 'Default module injected correctly').toBe(defaultModuleProgram.fs);
  expect(moduleProgram.vs, 'Program with new default module matches regular module').toBe(defaultModuleProgram.vs);
  shaderAssembler.removeDefaultModule(dirlight);
  const noDefaultModuleProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  });
  expect(program.fs === noDefaultModuleProgram.fs, 'Default module was removed').toBeTruthy();
  expect(moduleProgram.fs !== noDefaultModuleProgram.fs, 'Default module was removed').toBeTruthy();

  // Reset program manager

  shaderAssembler.addDefaultModule(dirlight);
  const uncachedProgram = shaderAssembler.assembleGLSLShaderPair({
    platformInfo,
    vs,
    fs
  });
  const defaultModuleSource = uncachedProgram.fs;

  // TODO - this deep equal thing doesn't make sense due to getUniforms
  expect(defaultModuleProgram, 'Program is not cached').not.toEqual(uncachedProgram);
  expect(preDefaultModuleSource, 'Default modules create correct source').toEqual(defaultModuleSource);
});
