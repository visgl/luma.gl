// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Device} from '@luma.gl/core';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {
  assembleGLSLShaderPair,
  picking,
  fp64,
  pbrMaterial,
  PlatformInfo,
  WGSLShaderAssembler
} from '@luma.gl/shadertools';
import type {WebGLDevice} from '@luma.gl/webgl';
import {isBrowser} from '@probe.gl/env';

function getInfo(device: Device): PlatformInfo {
  return {
    type: device.type,
    gpu: device.info.gpu,
    shaderLanguage: device.info.shadingLanguage,
    shaderLanguageVersion: device.info.shadingLanguageVersion as 100 | 300,
    features: new Set(device.features)
  };
}

const VS_GLSL_300 = /* glsl */ `\
#version 300 es

in vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;

const FS_GLSL_300 = /* glsl */ `\
#version 300 es

precision highp float;

out vec4 fragmentColor;

void main(void) {
  fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const VS_GLSL_300_2 = /* glsl */ `\
#version 300 es

in vec4 positions;
in vec2 uvs;
in vec3 normals;

out vec2 vUV;
out vec3 vNormal;

// Make sure in and out args don't get transpiled
void setPosition1(in vec4 inPosition, out vec4 outPosition) {
  outPosition = inPosition;
}

void setPosition2(
  in vec4 inPosition,
  out vec4 outPosition
) {
  outPosition = inPosition;
}

void main(void) {
  vUV = uvs;
  vNormal = normals;

  setPosition1(positions, gl_Position);
  setPosition2(positions, gl_Position);
}
`;

const FS_GLSL_300_2 = /* glsl */ `\
#version 300 es

precision highp float;

uniform sampler2D tex;

in vec2 vUV;
in vec3 vNormal;

out vec4 fragmentColor;

void main(void) {
  fragmentColor = texture(tex, vUV) * vec4(vNormal, 1.0);
}
`;

const VS_GLSL_300_FP64 = /* glsl */ `\
#version 300 es

in vec2 positions64xy;

out float resultValue;

void main(void) {
  vec2 position64xy = sum_fp64(positions64xy, vec2(0.5, 1.0e-7));
  gl_Position = vec4(position64xy.x, position64xy.y, 0.0, 1.0);
  resultValue = position64xy.x + position64xy.y;
}
`;

const FS_GLSL_300_FP64 = /* glsl */ `\
#version 300 es

precision highp float;

in float resultValue;

out vec4 fragmentColor;

void main(void) {
  fragmentColor = vec4(resultValue, resultValue, resultValue, 1.0);
}
`;

// deck.gl mesh layer shaders
// TODO - broken tests

const VS_GLSL_300_DECK = /* glsl */ `\
#version 300 es
#define SHADER_NAME simple-mesh-layer-vs

// Scale the model
uniform float sizeScale;
uniform bool composeModelMatrix;

// Primitive attributes
in vec3 positions;
in vec3 normals;
in vec2 texCoords;

// Instance attributes
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
in mat3 instanceModelMatrix;
in vec3 instanceTranslation;

// Outputs to fragment shader
out vec2 vTexCoord;
out vec3 cameraPosition;
out vec3 normals_commonspace;
out vec4 position_commonspace;
out vec4 vColor;

void main(void) {
  vTexCoord = texCoords;
  cameraPosition = vec3(1.0);
  normals_commonspace = vec3(1.0);
  vColor = instanceColors;

  vec3 pos = (instanceModelMatrix * positions) * sizeScale + instanceTranslation;

  if (composeModelMatrix) {
    gl_Position = vec4(1.0);
  }
  else {
    gl_Position = vec4(1.0);
  }
}
`;

const FS_GLSL_300_DECK = /* glsl */ `\
#version 300 es
#define SHADER_NAME simple-mesh-layer-fs

precision highp float;

uniform bool hasTexture;
uniform sampler2D sampler;
uniform bool flatShading;
uniform float opacity;

in vec2 vTexCoord;
in vec3 cameraPosition;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;

out vec4 fragColor;

void main(void) {
  vec3 normal;
  if (flatShading) {
    normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
  } else {
    normal = normals_commonspace;
  }

  vec4 color = hasTexture ? texture(sampler, vTexCoord) : vColor;
  vec3 lightColor = vec3(1.0);
  fragColor = vec4(lightColor, color.a * opacity);
}
`;

const VS_GLSL_300_GLTF = /* glsl */ `\
#version 300 es

#if (__VERSION__ < 300)
  #define _attr attribute
#else
  #define _attr in
#endif

  _attr vec4 POSITION;

  #ifdef HAS_NORMALS
    _attr vec4 NORMAL;
  #endif

  #ifdef HAS_TANGENTS
    _attr vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    _attr vec2 TEXCOORD_0;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);
    vec2 _TEXCOORD_1 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = NORMAL;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = TEXCOORD_0;
    #endif

    pbr_setPositionNormalTangentUV(POSITION, _NORMAL, _TANGENT, _TEXCOORD_0, _TEXCOORD_1);
    gl_Position = u_MVPMatrix * POSITION;
  }
`;

const FS_GLSL_300_GLTF = /* glsl */ `\
#version 300 es

  out vec4 fragmentColor;

  void main(void) {
    fragmentColor = pbr_filterColor(vec4(0));
  }
`;

const TEST_MODULE = {
  name: 'TEST_MODULE',
  inject: {
    'vs:#decl': 'uniform float vsFloat;',
    // Hook function has access to injected variable
    'vs:HOOK_FUNCTION': 'value = vsFloat;',

    'fs:#decl': 'uniform vec4 fsVec4;',
    // Hook function has access to injected variable
    'fs:HOOK_FUNCTION': 'value = fsVec4;'
  }
};

const VS_GLSL_300_MODULES = /* glsl */ `\
#version 300 es

in float floatAttribute;

out float floatVarying;

void main(void) {
  HOOK_FUNCTION(floatVarying);
}
`;

const FS_GLSL_300_MODULES = /* glsl */ `\
#version 300 es
precision highp float;

in float floatVarying;

out vec4 fragmentColor;

void main(void) {
  HOOK_FUNCTION(fragmentColor);
}
`;

const STATIC_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

function createTestLog() {
  return {
    warnCalled: [] as unknown[][],
    warn(...args: unknown[]) {
      this.warnCalled.push(args);
      return () => {};
    }
  };
}

it('assembleGLSLShaderPair#import', async () => {
  expect(
    Boolean(assembleGLSLShaderPair !== undefined),
    'assembleGLSLShaderPair import successful'
  ).toBe(true);
  void 0;
});

it('assembleGLSLShaderPair#version_directive', async () => {
  const webglDevice = await getWebGLTestDevice();

  const assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [picking]
  });
  // Verify version directive remains as first line.
  expect(
    assembleResult.vs.indexOf('#version 300'),
    'version directive should be first statement'
  ).toBe(0);
  expect(
    assembleResult.fs.indexOf('#version 300'),
    'version directive should be first statement'
  ).toBe(0);
  void 0;
});

it('assembleGLSLShaderPair#warns on non-std140 app-authored uniform blocks', () => {
  const log = createTestLog();
  const vs = `\
#version 300 es
uniform AppBlock {
  float opacity;
  vec2 offsets;
} appBlock;
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`;

  assembleGLSLShaderPair({
    platformInfo: STATIC_PLATFORM_INFO,
    vs,
    fs: FS_GLSL_300,
    log
  });

  expect(log.warnCalled.length, 'warns once for the non-std140 block').toBe(1);
  expect(
    Boolean(String(log.warnCalled[0][0]).includes('vertex shader uniform block AppBlock')),
    'warning includes stage and block name'
  ).toBe(true);
  expect(
    Boolean(String(log.warnCalled[0][0]).includes('layout(std140)')),
    'warning recommends explicit std140'
  ).toBe(true);

  void 0;
});

it('assembleGLSLShaderPair#does not warn for explicit std140 uniform blocks', () => {
  const log = createTestLog();
  const vs = `\
#version 300 es
layout(std140) uniform AppBlock {
  float opacity;
} appBlock;
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`;

  assembleGLSLShaderPair({
    platformInfo: STATIC_PLATFORM_INFO,
    vs,
    fs: FS_GLSL_300,
    log
  });

  expect(log.warnCalled.length, 'does not warn for explicit std140').toBe(0);
  void 0;
});

it('assembleGLSLShaderPair#warns on handwritten module GLSL uniform blocks without std140', () => {
  const log = createTestLog();
  const moduleWithDefaultBlock = {
    name: 'module-default-block',
    uniformTypes: {
      opacity: 'f32'
    },
    vs: `\
uniform module_default_blockUniforms {
  float opacity;
} moduleDefaultBlock;
`
  };

  assembleGLSLShaderPair({
    platformInfo: STATIC_PLATFORM_INFO,
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [moduleWithDefaultBlock],
    log
  });

  expect(log.warnCalled.length, 'warns for handwritten module block').toBe(1);
  expect(
    Boolean(String(log.warnCalled[0][0]).includes('module_default_blockUniforms')),
    'warning includes module block name'
  ).toBe(true);

  void 0;
});

it('assembleGLSLShaderPair#warns only for non-std140 blocks and deduplicates by block name', () => {
  const log = createTestLog();
  const vs = `\
#version 300 es
layout(std140) uniform GoodBlock {
  float opacity;
} goodBlock;
uniform BadBlock {
  float opacity;
} badBlock;
uniform BadBlock {
  float opacity;
} badBlock2;
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`;

  assembleGLSLShaderPair({
    platformInfo: STATIC_PLATFORM_INFO,
    vs,
    fs: FS_GLSL_300,
    log
  });

  expect(log.warnCalled.length, 'warns once for the non-std140 block name').toBe(1);
  expect(
    Boolean(String(log.warnCalled[0][0]).includes('BadBlock')),
    'warning targets the non-std140 block'
  ).toBe(true);
  expect(
    Boolean(!String(log.warnCalled[0][0]).includes('GoodBlock')),
    'warning ignores std140 blocks'
  ).toBe(true);

  void 0;
});

it('assembleGLSLShaderPair#getUniforms', async () => {
  const webglDevice = await getWebGLTestDevice();

  // inject spy into the picking module's getUniforms
  // const module = getShaderModule(picking);
  // const getUniformsSpy = makeSpy(module, 'getUniforms');

  let assembleResult;

  // Without shader modules
  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300
  });
  // Verify getUniforms is function
  expect(typeof assembleResult.getUniforms, 'getUniforms should be function').toBe('function');

  // With shader modules
  const testModule = {
    name: 'test-module',
    vs: '',
    fs: '',
    getUniforms: (opts, context) => {
      // Check a uniform generated by its dependency
      expect(
        Boolean(context.picking_uActive),
        'module getUniforms is called with correct context'
      ).toBe(true);
      return {};
    },
    dependencies: [picking]
  };

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [picking, testModule, fp64]
  });

  // Verify getUniforms is function
  expect(typeof assembleResult.getUniforms, 'getUniforms should be function').toBe('function');

  void 0;
});

it('assembleGLSLShaderPair#defines', async () => {
  const webglDevice = await getWebGLTestDevice();

  const assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    defines: {IS_TEST: true}
  });

  expect(
    Boolean(assembleResult.vs.indexOf('#define IS_TEST true') > 0),
    'has application defines'
  ).toBe(true);
  expect(
    Boolean(assembleResult.fs.indexOf('#define IS_TEST true') > 0),
    'has application defines'
  ).toBe(true);

  void 0;
});

it('assembleGLSLShaderPair#fp64 platform defines compile', async () => {
  const webglDevice = await getWebGLTestDevice();
  const basePlatformInfo = getInfo(webglDevice);
  const platformTestCases = [
    {
      label: 'apple',
      platformInfo: {...basePlatformInfo, gpu: 'apple'},
      expectedDefines: [
        '#define APPLE_GPU',
        '#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1',
        '#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1'
      ]
    },
    {
      label: 'intel',
      platformInfo: {...basePlatformInfo, gpu: 'intel'},
      expectedDefines: [
        '#define INTEL_GPU',
        '#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1',
        '#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1'
      ]
    },
    {
      label: 'unknown',
      platformInfo: {...basePlatformInfo, gpu: 'unknown'},
      expectedDefines: [
        '#define DEFAULT_GPU',
        '#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1',
        '#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1'
      ]
    }
  ];

  for (const platformTestCase of platformTestCases) {
    const assembleResult = assembleGLSLShaderPair({
      platformInfo: platformTestCase.platformInfo,
      vs: VS_GLSL_300_FP64,
      fs: FS_GLSL_300_FP64,
      modules: [fp64]
    });

    for (const expectedDefine of platformTestCase.expectedDefines) {
      expect(
        Boolean(assembleResult.vs.includes(expectedDefine)),
        `${platformTestCase.label} includes ${expectedDefine}`
      ).toBe(true);
    }

    expect(
      Boolean(compileAndLinkShaders(webglDevice, assembleResult)),
      `${platformTestCase.label} fp64 assembly compiles and links`
    ).toBe(true);
  }

  void 0;
});

/** Note that */
const pickingInject = {
  ...picking,
  instance: undefined,
  inject: {
    'vs:LUMAGL_pickColor': 'picking_setPickingColor(color.rgb);',
    'fs:LUMAGL_fragmentColor': {
      injection: 'color = picking_filterColor(color);',
      order: Number.POSITIVE_INFINITY
    },
    'fs:#main-end': 'fragmentColor = picking_filterColor(fragmentColor);'
  }
};

it('assembleGLSLShaderPair#shaderhooks', async () => {
  const webglDevice = await getWebGLTestDevice();

  const hookFunctions = [
    'vs:LUMAGL_pickColor(inout vec4 color)',
    {
      hook: 'fs:LUMAGL_fragmentColor(inout vec4 color)',
      header: 'if (color.a == 0.0) discard;\n',
      footer: 'color.a *= 1.2;\n'
    }
  ];

  const testInject = {
    name: 'test-injection',
    inject: {
      'fs:LUMAGL_fragmentColor': 'color.r = 1.0;'
    }
  };

  let assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    hookFunctions
  });
  // Verify version directive remains as first line.
  expect(
    Boolean(assembleResult.vs.indexOf('LUMAGL_pickColor') > -1),
    'hook function injected into vertex shader'
  ).toBe(true);
  expect(
    Boolean(assembleResult.fs.indexOf('LUMAGL_fragmentColor') > -1),
    'hook function injected into fragment shader'
  ).toBe(true);
  expect(
    Boolean(assembleResult.fs.indexOf('if (color.a == 0.0) discard;') > -1),
    'hook header injected into fragment shader'
  ).toBe(true);
  expect(
    Boolean(assembleResult.vs.indexOf('picking_setPickingColor(color.rgb)') === -1),
    'injection code not included in vertex shader without module'
  ).toBe(true);
  expect(
    Boolean(assembleResult.fs.indexOf('color = picking_filterColor(color)') === -1),
    'injection code not included in fragment shader without module'
  ).toBe(true);

  expect(
    Boolean(assembleResult.fs.indexOf('fragmentColor = picking_filterColor(fragmentColor)') === -1),
    'regex injection code not included in fragment shader without module'
  ).toBe(true);

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [pickingInject],
    hookFunctions
  });
  // Verify version directive remains as first line.
  expect(
    Boolean(assembleResult.vs.indexOf('LUMAGL_pickColor') > -1),
    'hook function injected into vertex shader'
  ).toBe(true);
  expect(
    Boolean(assembleResult.fs.indexOf('LUMAGL_fragmentColor') > -1),
    'hook function injected into fragment shader'
  ).toBe(true);

  expect(
    Boolean(assembleResult.vs.indexOf('picking_setPickingColor(color.rgb)') > -1),
    'injection code included in vertex shader with module'
  ).toBe(true);
  expect(
    Boolean(assembleResult.fs.indexOf('color = picking_filterColor(color)') > -1),
    'injection code included in fragment shader with module'
  ).toBe(true);
  expect(
    Boolean(
      assembleResult.fs.indexOf('color.a *= 1.2;') >
        assembleResult.fs.indexOf('color = picking_filterColor(color)')
    ),
    'hook footer injected after injection code'
  ).toBe(true);

  expect(
    Boolean(assembleResult.fs.indexOf('fragmentColor = picking_filterColor(fragmentColor)') > -1),
    'regex injection code included in fragment shader with module'
  ).toBe(true);

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;',
      'fs:LUMAGL_fragmentColor': 'color += 0.1;'
    },
    modules: [pickingInject],
    hookFunctions
  });

  expect(
    Boolean(assembleResult.vs.indexOf('color *= 0.1') > -1),
    'argument injection code included in shader hook'
  ).toBe(true);
  expect(
    Boolean(assembleResult.fs.indexOf('color += 0.1') > -1),
    'argument injection code included in shader hook'
  ).toBe(true);
  expect(
    Boolean(
      assembleResult.fs.indexOf('color += 0.1') <
        assembleResult.fs.indexOf('color = picking_filterColor(color)')
    ),
    'argument injection code injected in the correct order'
  ).toBe(true);

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [pickingInject, testInject],
    hookFunctions
  });

  expect(
    Boolean(assembleResult.fs.indexOf('color.r = 1.0') > -1),
    'module injection code included in shader hook'
  ).toBe(true);
  expect(
    Boolean(
      assembleResult.fs.indexOf('color.r = 1.0') <
        assembleResult.fs.indexOf('color = picking_filterColor(color)')
    ),
    'module injection code injected in the correct order'
  ).toBe(true);

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    inject: {
      'fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);': 'fragmentColor -= 0.1;'
    },
    hookFunctions
  });

  expect(
    Boolean(assembleResult.fs.indexOf('fragmentColor -= 0.1;') > -1),
    'regex injection code included in shader hook'
  ).toBe(true);

  void 0;
});

it('WGSLShaderAssembler#assembleWGSLShader supports hooks and named injections', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  shaderAssembler.addShaderHook('vs:OFFSET_POSITION(position: ptr<function, vec4<f32>>)');
  shaderAssembler.addShaderHook('fs:FILTER_COLOR(color: ptr<function, vec4<f32>>)');

  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: {
      type: 'webgpu',
      gpu: 'test-gpu',
      shaderLanguage: 'wgsl',
      shaderLanguageVersion: 300,
      features: new Set()
    },
    source: /* wgsl */ `\
@vertex
fn vertexMain(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
  var shaderPosition = vec4<f32>(position, 0.0, 1.0);
  OFFSET_POSITION(&shaderPosition);
  return shaderPosition;
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  var color = getColor();
  FILTER_COLOR(&color);
  return color;
}
`,
    modules: [
      {
        name: 'wgsl-injections',
        inject: {
          'vs:OFFSET_POSITION': '(*position).x += 0.5;',
          'fs:FILTER_COLOR': '(*color).r = 0.25;',
          'fs:#decl': 'fn getColor() -> vec4<f32> { return vec4<f32>(1.0); }',
          'vs:#main-start': 'let vertexStart = 1u;',
          'fs:#main-end': 'let fragmentEnd = 2u;'
        }
      }
    ]
  });

  expect(
    Boolean(
      assembledShader.source.includes('fn OFFSET_POSITION(position: ptr<function, vec4<f32>>) {')
    ),
    'WGSL vertex hook functions use WGSL syntax'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('fn FILTER_COLOR(color: ptr<function, vec4<f32>>) {')),
    'WGSL fragment hook functions use WGSL syntax'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('(*position).x += 0.5;')),
    'WGSL vertex hook injections are included'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('(*color).r = 0.25;')),
    'WGSL fragment hook injections are included'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('fn getColor() -> vec4<f32>')),
    'WGSL fragment declaration injections enter unified shader source'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('let vertexStart = 1u;')),
    'WGSL vertex start injection lands'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('let fragmentEnd = 2u;')),
    'WGSL fragment end injection lands'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('void OFFSET_POSITION')),
    'WGSL hook functions do not use GLSL declarations'
  ).toBe(false);
  void 0;
});

it('assembleGLSLShaderPair#injection order', async () => {
  const webglDevice = await getWebGLTestDevice();

  let assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300_MODULES,
    fs: FS_GLSL_300_MODULES,
    inject: {
      'vs:#decl': 'uniform float vsFloat;',
      // Hook function has access to injected variable
      'vs:HOOK_FUNCTION': 'value = vsFloat;',

      'fs:#decl': 'uniform vec4 fsVec4;',
      // Hook function has access to injected variable
      'fs:HOOK_FUNCTION': 'value = fsVec4;'
    },
    hookFunctions: ['vs:HOOK_FUNCTION(inout float value)', 'fs:HOOK_FUNCTION(inout vec4 value)']
  });

  expect(
    Boolean(compileAndLinkShaders(webglDevice, assembleResult)),
    'Hook functions have access to injected variables.'
  ).toBe(true);

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300_MODULES,
    fs: FS_GLSL_300_MODULES,
    modules: [TEST_MODULE],
    hookFunctions: ['vs:HOOK_FUNCTION(inout float value)', 'fs:HOOK_FUNCTION(inout vec4 value)']
  });

  expect(
    Boolean(compileAndLinkShaders(webglDevice, assembleResult)),
    'Hook functions have access to injected variables through modules.'
  ).toBe(true);

  void 0;
});

// TODO - restore if we ever support transpilation of uniform blocks
it.skip('assembleGLSLShaderPair#transpilation', async () => {
  const webglDevice = await getWebGLTestDevice();

  let assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [picking]
  });

  expect(
    Boolean(assembleResult.vs.indexOf('#version 300 es') === -1),
    'es 3.0 version directive removed'
  ).toBe(true);
  expect(Boolean(!/\bin vec4\b/.exec(assembleResult.vs)), '"in" keyword removed').toBe(true);

  expect(
    Boolean(assembleResult.fs.indexOf('#version 300 es') === -1),
    'es 3.0 version directive removed'
  ).toBe(true);
  expect(Boolean(!/\bout vec4\b/.exec(assembleResult.fs)), '"out" keyword removed').toBe(true);

  expect(
    Boolean(compileAndLinkShaders(webglDevice, assembleResult)),
    'assemble GLSL300 + picking and transpile to GLSL100'
  ).toBe(true);

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300_2,
    fs: FS_GLSL_300_2,
    modules: [picking]
  });

  expect(
    Boolean(compileAndLinkShaders(webglDevice, assembleResult)),
    'assemble GLSL300 + picking and transpile to GLSL100'
  ).toBe(true);

  const extension = webglDevice.gl.getExtension('OES_standard_derivatives');
  // TODO - this doesn't work in headless gl
  if (isBrowser() && extension) {
    void 0;
    assembleResult = assembleGLSLShaderPair({
      platformInfo: getInfo(webglDevice),
      vs: VS_GLSL_300_DECK,
      fs: FS_GLSL_300_DECK
    });

    expect(
      Boolean(compileAndLinkShaders(webglDevice, assembleResult)),
      'Deck shaders transpile 300 to 100 valid program'
    ).toBe(true);
  }

  assembleResult = assembleGLSLShaderPair({
    platformInfo: getInfo(webglDevice),
    vs: VS_GLSL_300_GLTF,
    fs: FS_GLSL_300_GLTF,
    modules: [pbrMaterial]
  });

  expect(
    Boolean(compileAndLinkShaders(webglDevice, assembleResult)),
    'assemble GLSL300 + PBR assemble, WebGL2'
  ).toBe(true);

  void 0;
});

// HELPERS

function compileAndLinkShaders(device: WebGLDevice, assembleResult) {
  const gl = device.gl;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const vShader: WebGLShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
  gl.shaderSource(vShader, assembleResult.vs);
  gl.compileShader(vShader);
  let compileStatus = gl.getShaderParameter(vShader, gl.COMPILE_STATUS);
  if (!compileStatus) {
    const _infoLog = gl.getShaderInfoLog(vShader);
    void 0;
    return false;
  }

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, assembleResult.fs);
  gl.compileShader(fShader);
  compileStatus = gl.getShaderParameter(fShader, gl.COMPILE_STATUS);
  if (!compileStatus) {
    const _infoLog = gl.getShaderInfoLog(fShader);
    void 0;
    return false;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linkStatus) {
    const _infoLog = gl.getProgramInfoLog(program);
    void 0;
    // t.comment(assembleResult.fs.slice(1000))
  }

  gl.deleteShader(vShader);
  gl.deleteShader(fShader);
  gl.deleteProgram(program);

  return linkStatus;
}
