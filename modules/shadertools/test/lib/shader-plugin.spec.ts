// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  mergeShaderPluginModules,
  resolveShaderPlugins,
  GLSLShaderAssembler,
  WGSLShaderAssembler,
  type PlatformInfo,
  type ShaderModule
} from '@luma.gl/shadertools';

const SHARED_MODULE: ShaderModule = {name: 'shared-plugin-module'};
const WGSL_MODULE: ShaderModule = {name: 'wgsl-plugin-module'};
const EXPLICIT_MODULE: ShaderModule = {name: 'explicit-module'};
const DUPLICATE_PLUGIN_MODULE: ShaderModule = {name: 'explicit-module'};

const WGSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const GLSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const WGSL_SOURCE = /* wgsl */ `\
@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  return color;
}
`;

it('ShaderPlugin#resolve shared and backend contributions', () => {
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'backend-aware-plugin',
        modules: [SHARED_MODULE],
        defines: {
          COMMON: true,
          OVERRIDDEN: false
        },
        injections: [{target: 'fs:#decl', injection: 'fn sharedPlugin() {}'}],
        vertexInputs: {sharedValue: 'f32'},
        varyings: {
          sharedColor: {type: 'vec4<f32>'},
          category: {type: 'u32'}
        },
        wgsl: {
          modules: [WGSL_MODULE],
          defines: {
            OVERRIDDEN: true,
            WGSL_ONLY: true
          },
          injections: [
            {
              target: 'fs:#decl',
              injection: 'fn wgslPlugin() {}',
              order: 10
            }
          ],
          vertexInputs: {sharedValue: 'f32', backendValue: 'vec2<f32>'},
          varyings: {sharedColor: {type: 'vec4<f32>', interpolation: 'smooth'}}
        }
      }
    ],
    'wgsl'
  );

  expect(
    resolved.modules.map(module => module.name),
    'shared and WGSL modules are combined'
  ).toEqual(['shared-plugin-module', 'wgsl-plugin-module']);
  expect(resolved.defines, 'backend define overrides shared plugin define').toEqual({
    COMMON: true,
    OVERRIDDEN: true,
    WGSL_ONLY: true
  });
  expect(
    resolved.injections['fs:#decl'].map(injection => injection.injection),
    'shared and backend injections retain order'
  ).toEqual(['fn sharedPlugin() {}', 'fn wgslPlugin() {}']);
  expect(resolved.injections['fs:#decl'][1].order, 'explicit order is preserved').toBe(10);
  expect(
    resolved.vertexInputs,
    'identical declarations merge once and preserve declaration order'
  ).toEqual({sharedValue: 'f32', backendValue: 'vec2<f32>'});
  expect(
    resolved.varyings,
    'varyings are normalized, deduplicated, and retain declaration order'
  ).toEqual({
    sharedColor: {type: 'vec4<f32>', interpolation: 'smooth'},
    category: {type: 'u32', interpolation: 'flat'}
  });
  void 0;
});

it('ShaderPlugin#rejects invalid and conflicting vertex inputs', () => {
  expect(
    () =>
      resolveShaderPlugins(
        [{name: 'invalid-input', vertexInputs: {'invalid-name': 'f32'} as any}],
        'glsl'
      ),
    'invalid identifiers are rejected'
  ).toThrow(/valid non-reserved identifier/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {name: 'first-input', vertexInputs: {value: 'f32'}},
          {name: 'second-input', vertexInputs: {value: 'vec2<f32>'}}
        ],
        'wgsl'
      ),
    'conflicting declarations are rejected'
  ).toThrow(/conflicting types/);
  void 0;
});

it('ShaderPlugin#rejects invalid and conflicting varyings', () => {
  expect(
    () =>
      resolveShaderPlugins(
        [{name: 'invalid-varying', varyings: {'invalid-name': {type: 'f32'}} as any}],
        'glsl'
      ),
    'invalid varying identifiers are rejected'
  ).toThrow(/valid non-reserved identifier/);
  expect(
    () =>
      resolveShaderPlugins(
        [{name: 'reserved-varying', varyings: {_luma_value: {type: 'f32'}}}],
        'wgsl'
      ),
    'reserved varying identifiers are rejected'
  ).toThrow(/valid non-reserved identifier/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {name: 'first-varying', varyings: {value: {type: 'f32'}}},
          {name: 'second-varying', varyings: {value: {type: 'vec2<f32>'}}}
        ],
        'wgsl'
      ),
    'conflicting varying types are rejected'
  ).toThrow(/conflicting declarations/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {name: 'smooth-varying', varyings: {value: {type: 'f32'}}},
          {
            name: 'flat-varying',
            varyings: {value: {type: 'f32', interpolation: 'flat'}}
          }
        ],
        'wgsl'
      ),
    'conflicting varying interpolation is rejected'
  ).toThrow(/conflicting declarations/);
  expect(
    () =>
      resolveShaderPlugins(
        [{name: 'smooth-integer', varyings: {value: {type: 'u32', interpolation: 'smooth'}}}],
        'wgsl'
      ),
    'integer varyings cannot use smooth interpolation'
  ).toThrow(/must use flat interpolation/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {
            name: 'input-varying-collision',
            vertexInputs: {value: 'f32'},
            varyings: {value: {type: 'f32'}}
          }
        ],
        'glsl'
      ),
    'vertex input and varying namespaces are disjoint'
  ).toThrow(/both a vertex input and a varying/);
  void 0;
});

it('ShaderPlugin#rejects raw replacement targets', () => {
  expect(
    () =>
      resolveShaderPlugins(
        [
          {
            name: 'invalid-target',
            injections: [{target: 'fragmentColor = vec4(1.0);' as any, injection: 'ignored'}]
          }
        ],
        'glsl'
      ),
    'raw replacement targets are rejected'
  ).toThrow(/must be a named shader anchor or hook/);
  void 0;
});

it('ShaderPlugin#explicit modules win duplicate names', () => {
  const modules = mergeShaderPluginModules(
    [EXPLICIT_MODULE],
    [DUPLICATE_PLUGIN_MODULE, SHARED_MODULE]
  );

  expect(modules.length, 'duplicate plugin module is skipped').toBe(2);
  expect(modules[0], 'explicit module instance is preserved').toBe(EXPLICIT_MODULE);
  expect(modules[1], 'new plugin module is appended').toBe(SHARED_MODULE);
  void 0;
});

it('ShaderPlugin#WGSL main injections land in stage bodies', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'wgsl-main-plugin-injections',
        wgsl: {
          injections: [
            {target: 'vs:#main-start', injection: 'let pluginVertexStart = 1u;'},
            {target: 'fs:#main-end', injection: 'let pluginFragmentEnd = 2u;'}
          ]
        }
      }
    ],
    'wgsl'
  );

  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_SOURCE,
    pluginInjections: resolved.injections
  });

  expect(
    Boolean(assembled.source.includes('let pluginVertexStart = 1u;')),
    'vertex-stage start injection is emitted'
  ).toBe(true);
  expect(
    Boolean(assembled.source.includes('let pluginFragmentEnd = 2u;')),
    'fragment-stage end injection is emitted'
  ).toBe(true);
  expect(
    Boolean(
      assembled.source.indexOf('let pluginFragmentEnd = 2u;') < assembled.source.lastIndexOf('}')
    ),
    'fragment-stage end injection lands before the stage closing brace'
  ).toBe(true);
  void 0;
});

it('ShaderPlugin#WGSL fragment declarations enter unified shader source', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'wgsl-plugin-fragment-declaration',
        wgsl: {
          injections: [
            {
              target: 'fs:#decl',
              injection: 'fn pluginGetColor() -> vec4<f32> { return vec4<f32>(1.0); }'
            }
          ]
        }
      }
    ],
    'wgsl'
  );

  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_SOURCE.replace(
      'var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);',
      'var color = pluginGetColor();'
    ),
    pluginInjections: resolved.injections
  });

  expect(
    Boolean(assembled.source.includes('fn pluginGetColor() -> vec4<f32>')),
    'fragment declaration injection is emitted into unified WGSL source'
  ).toBe(true);
  void 0;
});

it('ShaderPlugin#GLSL vertex inputs are declared and conflicts are rejected', () => {
  const shaderAssembler = new GLSLShaderAssembler();
  const shaders = shaderAssembler.assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: /* glsl */ `#version 300 es
in vec2 positions;
void main() { gl_Position = vec4(positions, 0.0, 1.0); }`,
    fs: /* glsl */ `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() { fragmentColor = vec4(1.0); }`,
    pluginVertexInputs: {filterValues: 'f32', offsets: 'vec2<f32>'}
  });

  expect(Boolean(shaders.vs.includes('in float filterValues;')), 'scalar input is declared').toBe(
    true
  );
  expect(Boolean(shaders.vs.includes('in vec2 offsets;')), 'vector input is declared').toBe(true);
  expect(
    () =>
      shaderAssembler.assembleGLSLShaderPair({
        platformInfo: GLSL_PLATFORM_INFO,
        vs: /* glsl */ `#version 300 es
in float filterValues;
void main() { gl_Position = vec4(0.0); }`,
        fs: /* glsl */ `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() { fragmentColor = vec4(1.0); }`,
        pluginVertexInputs: {filterValues: 'f32'}
      }),
    'application inputs cannot shadow plugin inputs'
  ).toThrow(/conflicts with an existing GLSL input/);
  void 0;
});

it('ShaderPlugin#WGSL vertex inputs support direct and struct entry-point inputs', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  shaderAssembler.addShaderHook('vs:FILTER_POSITION(position: ptr<function, vec4<f32>>)');

  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: /* wgsl */ `
struct VertexInputs {
  @location(2) position: vec2<f32>,
};

@vertex
fn unusedVertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0);
}

@vertex
fn selectedVertexMain(inputs: VertexInputs, @location(0) scale: f32) -> @builtin(position) vec4<f32> {
  var position = vec4<f32>(inputs.position * scale, 0.0, 1.0);
  FILTER_POSITION(&position);
  return position;
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`,
    vertexEntryPoint: 'selectedVertexMain',
    pluginVertexInputs: {filterValues: 'f32', categoryValues: 'u32'},
    pluginInjections: {
      'vs:FILTER_POSITION': [{injection: '(*position).x += filterValues;', order: 0}],
      'vs:#main-start': [{injection: 'let initializedValue = filterValues;', order: 0}]
    }
  });

  expect(
    Boolean(assembled.source.includes('@location(1) _luma_filterValues: f32')),
    'first unused direct or struct location is assigned first'
  ).toBe(true);
  expect(
    Boolean(assembled.source.includes('@location(3) _luma_categoryValues: u32')),
    'locations are assigned deterministically in declaration order'
  ).toBe(true);
  expect(
    Boolean(assembled.source.includes('var<private> filterValues: f32;')),
    'public input name is declared as a private variable for generated hooks'
  ).toBe(true);
  expect(
    Boolean(
      assembled.source.indexOf('filterValues = _luma_filterValues;') <
        assembled.source.indexOf('let initializedValue = filterValues;')
    ),
    'private input variables initialize before other main-start injections'
  ).toBe(true);
  expect(
    Boolean(
      assembled.source.indexOf('@location(1) _luma_filterValues: f32') >
        assembled.source.indexOf('fn selectedVertexMain')
    ),
    'plugin parameters are appended to the selected entry point'
  ).toBe(true);
  expect(
    Boolean(
      assembled.source
        .slice(
          assembled.source.indexOf('fn unusedVertexMain'),
          assembled.source.indexOf('fn selectedVertexMain')
        )
        .includes('_luma_filterValues')
    ),
    'other vertex entry points are preserved'
  ).toBe(false);
  void 0;
});

it('ShaderPlugin#WGSL vertex inputs support an entry point without parameters', () => {
  const assembled = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_SOURCE,
    pluginVertexInputs: {filterValues: 'f32'}
  });

  expect(
    Boolean(assembled.source.includes('fn vertexMain(\n  @location(0) _luma_filterValues: f32\n)')),
    'the first plugin input becomes the first parameter and location'
  ).toBe(true);
  expect(
    Boolean(assembled.source.includes('filterValues = _luma_filterValues;')),
    'the generated private variable is initialized in the parameterless entry point'
  ).toBe(true);
  void 0;
});

it('ShaderPlugin#GLSL varyings generate matched stage interfaces', () => {
  const shaderAssembler = new GLSLShaderAssembler();
  shaderAssembler.addShaderHook('vs:SET_PLUGIN_VARYINGS()');
  shaderAssembler.addShaderHook('fs:USE_PLUGIN_VARYINGS(inout vec4 color)');
  const shaders = shaderAssembler.assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: /* glsl */ `#version 300 es
void main() {
  SET_PLUGIN_VARYINGS();
  gl_Position = vec4(0.0);
}`,
    fs: /* glsl */ `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() {
  fragmentColor = vec4(1.0);
  USE_PLUGIN_VARYINGS(fragmentColor);
}`,
    pluginVaryings: {
      pluginColor: {type: 'vec4<f32>', interpolation: 'smooth'},
      pluginCategory: {type: 'u32', interpolation: 'flat'}
    },
    pluginInjections: {
      'vs:SET_PLUGIN_VARYINGS': [
        {injection: 'pluginColor = vec4(1.0); pluginCategory = 1u;', order: 0}
      ],
      'fs:USE_PLUGIN_VARYINGS': [
        {injection: 'color *= pluginColor * float(pluginCategory);', order: 0}
      ],
      'vs:#main-start': [{injection: 'pluginColor.x = 0.5;', order: 0}]
    }
  });

  expect(
    Boolean(shaders.vs.includes('out vec4 pluginColor;')),
    'smooth vertex output is declared'
  ).toBe(true);
  expect(
    Boolean(shaders.fs.includes('in vec4 pluginColor;')),
    'smooth fragment input is declared'
  ).toBe(true);
  expect(
    Boolean(shaders.vs.includes('flat out uint pluginCategory;')),
    'flat vertex output is declared'
  ).toBe(true);
  expect(
    Boolean(shaders.fs.includes('flat in uint pluginCategory;')),
    'flat fragment input is declared'
  ).toBe(true);
  expect(
    Boolean(
      shaders.vs.indexOf('pluginColor = vec4(0.0);') < shaders.vs.indexOf('pluginColor.x = 0.5;')
    ),
    'varyings initialize before other main-start injections'
  ).toBe(true);
  expect(
    () =>
      shaderAssembler.assembleGLSLShaderPair({
        platformInfo: GLSL_PLATFORM_INFO,
        vs: /* glsl */ `#version 300 es
out vec4 pluginColor;
void main() { gl_Position = vec4(0.0); }`,
        fs: /* glsl */ `#version 300 es
precision highp float;
in vec4 pluginColor;
out vec4 fragmentColor;
void main() { fragmentColor = pluginColor; }`,
        pluginVaryings: {pluginColor: {type: 'vec4<f32>', interpolation: 'smooth'}}
      }),
    'application stage I/O cannot shadow plugin varyings'
  ).toThrow(/conflicts with existing GLSL stage I\/O/);
  void 0;
});

it('ShaderPlugin#WGSL varyings extend named stage structs', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  shaderAssembler.addShaderHook('vs:SET_PLUGIN_VARYINGS()');
  shaderAssembler.addShaderHook('fs:USE_PLUGIN_VARYINGS(color: ptr<function, vec4<f32>>)');
  const source = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) baseValue: f32,
};

struct FragmentInput {
  @builtin(position) position: vec4<f32>,
  @location(0) baseValue: f32,
};

@vertex
fn unusedVertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0);
}

@vertex
fn selectedVertexMain(@location(0) inputValue: f32) -> VertexOutput {
  SET_PLUGIN_VARYINGS();
  if (inputValue < 0.0) {
    return VertexOutput(vec4<f32>(0.0), inputValue);
  }
  var output: VertexOutput;
  output.position = vec4<f32>(0.0);
  output.baseValue = inputValue;
  return output;
}

@fragment
fn selectedFragmentMain(inputs: FragmentInput, @builtin(front_facing) frontFacing: bool) -> @location(0) vec4<f32> {
  var color = vec4<f32>(inputs.baseValue);
  USE_PLUGIN_VARYINGS(&color);
  return color;
}
`;
  const assembled = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source,
    vertexEntryPoint: 'selectedVertexMain',
    fragmentEntryPoint: 'selectedFragmentMain',
    pluginVaryings: {
      pluginCoordinates: {type: 'vec2<f32>', interpolation: 'smooth'},
      pluginCategory: {type: 'u32', interpolation: 'flat'}
    },
    pluginInjections: {
      'vs:SET_PLUGIN_VARYINGS': [
        {
          injection: 'pluginCoordinates = vec2<f32>(inputValue); pluginCategory = 2u;',
          order: 0
        }
      ],
      'fs:USE_PLUGIN_VARYINGS': [
        {injection: '(*color).xy += pluginCoordinates * f32(pluginCategory);', order: 0}
      ],
      'fs:#main-start': [{injection: 'let initializedCoordinates = pluginCoordinates;', order: 0}]
    }
  });

  expect(
    assembled.source.match(/@location\(1\) pluginCoordinates: vec2<f32>/g)?.length,
    'same location is appended to separate vertex and fragment structs'
  ).toBe(2);
  expect(
    assembled.source.match(/@location\(2\) @interpolate\(flat\) pluginCategory: u32/g)?.length,
    'flat integer varying is appended to both structs'
  ).toBe(2);
  expect(
    Boolean(
      assembled.source.includes(
        'VertexOutput(vec4<f32>(0.0), inputValue, pluginCoordinates, pluginCategory)'
      )
    ),
    'selected-entry positional constructor receives plugin values'
  ).toBe(true);
  expect(
    assembled.source.match(/_luma_vertexOutput\d+\.pluginCoordinates = pluginCoordinates;/g)
      ?.length,
    'every selected-entry return copies current varying values'
  ).toBe(2);
  expect(
    Boolean(
      assembled.source.indexOf('pluginCoordinates = inputs.pluginCoordinates;') <
        assembled.source.indexOf('let initializedCoordinates = pluginCoordinates;')
    ),
    'fragment private variables initialize before other main-start injections'
  ).toBe(true);
  expect(
    Boolean(
      assembled.source
        .slice(
          assembled.source.indexOf('fn unusedVertexMain'),
          assembled.source.indexOf('fn selectedVertexMain')
        )
        .includes('_luma_vertexOutput')
    ),
    'unselected entry points are preserved'
  ).toBe(false);
  void 0;
});

it('ShaderPlugin#WGSL varyings reject unsupported interfaces', () => {
  const assembler = new WGSLShaderAssembler();
  expect(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: WGSL_SOURCE,
        pluginVaryings: {value: {type: 'f32', interpolation: 'smooth'}}
      }),
    'direct vertex return types are rejected'
  ).toThrow(/vertex entry point to return a named struct/);

  const sourceWithExternalConstructor = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
};
fn makeOutput() -> VertexOutput {
  return VertexOutput(vec4<f32>(0.0));
}
@vertex fn vertexMain() -> VertexOutput {
  return makeOutput();
}
@fragment fn fragmentMain(inputs: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}`;
  expect(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: sourceWithExternalConstructor,
        pluginVaryings: {value: {type: 'f32', interpolation: 'smooth'}}
      }),
    'output struct constructors outside the selected entry point are rejected'
  ).toThrow(/constructed outside the selected vertex entry point/);

  const namedVertexOutput = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
};
@vertex fn vertexMain() -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(0.0);
  return output;
}`;
  expect(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: `${namedVertexOutput}
@fragment fn fragmentMain() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }`,
        pluginVaryings: {value: {type: 'f32', interpolation: 'smooth'}}
      }),
    'a missing fragment input struct is rejected'
  ).toThrow(/exactly one named WGSL fragment input struct; found 0/);

  expect(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: `${namedVertexOutput}
struct OtherInput { @location(0) other: f32, };
@fragment fn fragmentMain(vertex: VertexOutput, other: OtherInput) -> @location(0) vec4<f32> {
  return vec4<f32>(other.other);
}`,
        pluginVaryings: {value: {type: 'f32', interpolation: 'smooth'}}
      }),
    'ambiguous fragment input structs are rejected'
  ).toThrow(/exactly one named WGSL fragment input struct; found 2/);

  expect(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: `${namedVertexOutput}
@fragment fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}`,
        pluginVaryings: {position: {type: 'vec4<f32>', interpolation: 'smooth'}}
      }),
    'application WGSL stage I/O cannot shadow plugin varyings'
  ).toThrow(/conflicts with existing WGSL stage I\/O/);
  void 0;
});
