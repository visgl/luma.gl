// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  mergeShaderPluginModules,
  resolveShaderPlugins,
  ShaderAssembler,
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

test('ShaderPlugin#resolve shared and backend contributions', t => {
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

  t.deepEqual(
    resolved.modules.map(module => module.name),
    ['shared-plugin-module', 'wgsl-plugin-module'],
    'shared and WGSL modules are combined'
  );
  t.deepEqual(
    resolved.defines,
    {COMMON: true, OVERRIDDEN: true, WGSL_ONLY: true},
    'backend define overrides shared plugin define'
  );
  t.deepEqual(
    resolved.injections['fs:#decl'].map(injection => injection.injection),
    ['fn sharedPlugin() {}', 'fn wgslPlugin() {}'],
    'shared and backend injections retain order'
  );
  t.equal(resolved.injections['fs:#decl'][1].order, 10, 'explicit order is preserved');
  t.deepEqual(
    resolved.vertexInputs,
    {sharedValue: 'f32', backendValue: 'vec2<f32>'},
    'identical declarations merge once and preserve declaration order'
  );
  t.deepEqual(
    resolved.varyings,
    {
      sharedColor: {type: 'vec4<f32>', interpolation: 'smooth'},
      category: {type: 'u32', interpolation: 'flat'}
    },
    'varyings are normalized, deduplicated, and retain declaration order'
  );
  t.end();
});

test('ShaderPlugin#rejects invalid and conflicting vertex inputs', t => {
  t.throws(
    () =>
      resolveShaderPlugins(
        [{name: 'invalid-input', vertexInputs: {'invalid-name': 'f32'} as any}],
        'glsl'
      ),
    /valid non-reserved identifier/,
    'invalid identifiers are rejected'
  );
  t.throws(
    () =>
      resolveShaderPlugins(
        [
          {name: 'first-input', vertexInputs: {value: 'f32'}},
          {name: 'second-input', vertexInputs: {value: 'vec2<f32>'}}
        ],
        'wgsl'
      ),
    /conflicting types/,
    'conflicting declarations are rejected'
  );
  t.end();
});

test('ShaderPlugin#rejects invalid and conflicting varyings', t => {
  t.throws(
    () =>
      resolveShaderPlugins(
        [{name: 'invalid-varying', varyings: {'invalid-name': {type: 'f32'}} as any}],
        'glsl'
      ),
    /valid non-reserved identifier/,
    'invalid varying identifiers are rejected'
  );
  t.throws(
    () =>
      resolveShaderPlugins(
        [{name: 'reserved-varying', varyings: {_luma_value: {type: 'f32'}}}],
        'wgsl'
      ),
    /valid non-reserved identifier/,
    'reserved varying identifiers are rejected'
  );
  t.throws(
    () =>
      resolveShaderPlugins(
        [
          {name: 'first-varying', varyings: {value: {type: 'f32'}}},
          {name: 'second-varying', varyings: {value: {type: 'vec2<f32>'}}}
        ],
        'wgsl'
      ),
    /conflicting declarations/,
    'conflicting varying types are rejected'
  );
  t.throws(
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
    /conflicting declarations/,
    'conflicting varying interpolation is rejected'
  );
  t.throws(
    () =>
      resolveShaderPlugins(
        [{name: 'smooth-integer', varyings: {value: {type: 'u32', interpolation: 'smooth'}}}],
        'wgsl'
      ),
    /must use flat interpolation/,
    'integer varyings cannot use smooth interpolation'
  );
  t.throws(
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
    /both a vertex input and a varying/,
    'vertex input and varying namespaces are disjoint'
  );
  t.end();
});

test('ShaderPlugin#rejects raw replacement targets', t => {
  t.throws(
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
    /must be a named shader anchor or hook/,
    'raw replacement targets are rejected'
  );
  t.end();
});

test('ShaderPlugin#explicit modules win duplicate names', t => {
  const modules = mergeShaderPluginModules(
    [EXPLICIT_MODULE],
    [DUPLICATE_PLUGIN_MODULE, SHARED_MODULE]
  );

  t.equal(modules.length, 2, 'duplicate plugin module is skipped');
  t.equal(modules[0], EXPLICIT_MODULE, 'explicit module instance is preserved');
  t.equal(modules[1], SHARED_MODULE, 'new plugin module is appended');
  t.end();
});

test('ShaderPlugin#WGSL main injections land in stage bodies', t => {
  const shaderAssembler = new ShaderAssembler();
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

  t.ok(
    assembled.source.includes('let pluginVertexStart = 1u;'),
    'vertex-stage start injection is emitted'
  );
  t.ok(
    assembled.source.includes('let pluginFragmentEnd = 2u;'),
    'fragment-stage end injection is emitted'
  );
  t.ok(
    assembled.source.indexOf('let pluginFragmentEnd = 2u;') < assembled.source.lastIndexOf('}'),
    'fragment-stage end injection lands before the stage closing brace'
  );
  t.end();
});

test('ShaderPlugin#WGSL fragment declarations enter unified shader source', t => {
  const shaderAssembler = new ShaderAssembler();
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

  t.ok(
    assembled.source.includes('fn pluginGetColor() -> vec4<f32>'),
    'fragment declaration injection is emitted into unified WGSL source'
  );
  t.end();
});

test('ShaderPlugin#GLSL vertex inputs are declared and conflicts are rejected', t => {
  const shaderAssembler = new ShaderAssembler();
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

  t.ok(shaders.vs.includes('in float filterValues;'), 'scalar input is declared');
  t.ok(shaders.vs.includes('in vec2 offsets;'), 'vector input is declared');
  t.throws(
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
    /conflicts with an existing GLSL input/,
    'application inputs cannot shadow plugin inputs'
  );
  t.end();
});

test('ShaderPlugin#WGSL vertex inputs support direct and struct entry-point inputs', t => {
  const shaderAssembler = new ShaderAssembler();
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

  t.ok(
    assembled.source.includes('@location(1) _luma_filterValues: f32'),
    'first unused direct or struct location is assigned first'
  );
  t.ok(
    assembled.source.includes('@location(3) _luma_categoryValues: u32'),
    'locations are assigned deterministically in declaration order'
  );
  t.ok(
    assembled.source.includes('var<private> filterValues: f32;'),
    'public input name is declared as a private variable for generated hooks'
  );
  t.ok(
    assembled.source.indexOf('filterValues = _luma_filterValues;') <
      assembled.source.indexOf('let initializedValue = filterValues;'),
    'private input variables initialize before other main-start injections'
  );
  t.ok(
    assembled.source.indexOf('@location(1) _luma_filterValues: f32') >
      assembled.source.indexOf('fn selectedVertexMain'),
    'plugin parameters are appended to the selected entry point'
  );
  t.notOk(
    assembled.source
      .slice(
        assembled.source.indexOf('fn unusedVertexMain'),
        assembled.source.indexOf('fn selectedVertexMain')
      )
      .includes('_luma_filterValues'),
    'other vertex entry points are preserved'
  );
  t.end();
});

test('ShaderPlugin#WGSL vertex inputs support an entry point without parameters', t => {
  const assembled = new ShaderAssembler().assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_SOURCE,
    pluginVertexInputs: {filterValues: 'f32'}
  });

  t.ok(
    assembled.source.includes('fn vertexMain(\n  @location(0) _luma_filterValues: f32\n)'),
    'the first plugin input becomes the first parameter and location'
  );
  t.ok(
    assembled.source.includes('filterValues = _luma_filterValues;'),
    'the generated private variable is initialized in the parameterless entry point'
  );
  t.end();
});

test('ShaderPlugin#GLSL varyings generate matched stage interfaces', t => {
  const shaderAssembler = new ShaderAssembler();
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

  t.ok(shaders.vs.includes('out vec4 pluginColor;'), 'smooth vertex output is declared');
  t.ok(shaders.fs.includes('in vec4 pluginColor;'), 'smooth fragment input is declared');
  t.ok(shaders.vs.includes('flat out uint pluginCategory;'), 'flat vertex output is declared');
  t.ok(shaders.fs.includes('flat in uint pluginCategory;'), 'flat fragment input is declared');
  t.ok(
    shaders.vs.indexOf('pluginColor = vec4(0.0);') < shaders.vs.indexOf('pluginColor.x = 0.5;'),
    'varyings initialize before other main-start injections'
  );
  t.throws(
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
    /conflicts with existing GLSL stage I\/O/,
    'application stage I/O cannot shadow plugin varyings'
  );
  t.end();
});

test('ShaderPlugin#WGSL varyings extend named stage structs', t => {
  const shaderAssembler = new ShaderAssembler();
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

  t.equal(
    assembled.source.match(/@location\(1\) pluginCoordinates: vec2<f32>/g)?.length,
    2,
    'same location is appended to separate vertex and fragment structs'
  );
  t.equal(
    assembled.source.match(/@location\(2\) @interpolate\(flat\) pluginCategory: u32/g)?.length,
    2,
    'flat integer varying is appended to both structs'
  );
  t.ok(
    assembled.source.includes(
      'VertexOutput(vec4<f32>(0.0), inputValue, pluginCoordinates, pluginCategory)'
    ),
    'selected-entry positional constructor receives plugin values'
  );
  t.equal(
    assembled.source.match(/_luma_vertexOutput\d+\.pluginCoordinates = pluginCoordinates;/g)
      ?.length,
    2,
    'every selected-entry return copies current varying values'
  );
  t.ok(
    assembled.source.indexOf('pluginCoordinates = inputs.pluginCoordinates;') <
      assembled.source.indexOf('let initializedCoordinates = pluginCoordinates;'),
    'fragment private variables initialize before other main-start injections'
  );
  t.notOk(
    assembled.source
      .slice(
        assembled.source.indexOf('fn unusedVertexMain'),
        assembled.source.indexOf('fn selectedVertexMain')
      )
      .includes('_luma_vertexOutput'),
    'unselected entry points are preserved'
  );
  t.end();
});

test('ShaderPlugin#WGSL varyings reject unsupported interfaces', t => {
  const assembler = new ShaderAssembler();
  t.throws(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: WGSL_SOURCE,
        pluginVaryings: {value: {type: 'f32', interpolation: 'smooth'}}
      }),
    /vertex entry point to return a named struct/,
    'direct vertex return types are rejected'
  );

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
  t.throws(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: sourceWithExternalConstructor,
        pluginVaryings: {value: {type: 'f32', interpolation: 'smooth'}}
      }),
    /constructed outside the selected vertex entry point/,
    'output struct constructors outside the selected entry point are rejected'
  );

  const namedVertexOutput = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
};
@vertex fn vertexMain() -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(0.0);
  return output;
}`;
  t.throws(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: `${namedVertexOutput}
@fragment fn fragmentMain() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }`,
        pluginVaryings: {value: {type: 'f32', interpolation: 'smooth'}}
      }),
    /exactly one named WGSL fragment input struct; found 0/,
    'a missing fragment input struct is rejected'
  );

  t.throws(
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
    /exactly one named WGSL fragment input struct; found 2/,
    'ambiguous fragment input structs are rejected'
  );

  t.throws(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: `${namedVertexOutput}
@fragment fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}`,
        pluginVaryings: {position: {type: 'vec4<f32>', interpolation: 'smooth'}}
      }),
    /conflicts with existing WGSL stage I\/O/,
    'application WGSL stage I/O cannot shadow plugin varyings'
  );
  t.end();
});
