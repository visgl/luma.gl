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
  type ShaderModule,
  type ShaderPlugin,
  type ShaderInjectionTarget,
  type ShaderInjection
} from '@luma.gl/shaders';

const SHARED_MODULE: ShaderModule = {name: 'shared-plugin-module'};
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

it('ShaderPlugin#shares its interface and selects injection sources by language', () => {
  const plugin: ShaderPlugin = {
    name: 'portable-plugin',
    module: SHARED_MODULE,
    defines: {ENABLED: true},
    vertexInputs: {filterValue: 'f32'},
    interStageVariables: {color: {type: 'vec4<f32>'}, category: {type: 'u32'}},
    injections: [
      {
        stage: 'fragment',
        target: '#decl',
        glsl: 'void portable() {}',
        wgsl: 'fn portable() {}',
        order: 10
      },
      {stage: 'fragment', target: '#decl', wgsl: 'fn wgslOnly() {}'},
      {stage: 'fragment', target: '#decl', glsl: ''}
    ]
  };
  const before = JSON.stringify(plugin);
  for (const language of ['glsl', 'wgsl'] as const) {
    const resolved = resolveShaderPlugins([plugin], language);
    expect(resolved.modules).toEqual([SHARED_MODULE]);
    expect(resolved.defines).toEqual({ENABLED: true});
    expect(resolved.vertexInputs).toEqual({filterValue: 'f32'});
    expect(resolved.interStageVariables).toEqual({
      color: {type: 'vec4<f32>', interpolation: 'smooth'},
      category: {type: 'u32', interpolation: 'flat'}
    });
    expect(resolved.injections['fs:#decl']).toEqual(
      language === 'glsl'
        ? [
            {pluginName: 'portable-plugin', injection: 'void portable() {}', order: 10},
            {pluginName: 'portable-plugin', injection: '', order: 0}
          ]
        : [
            {pluginName: 'portable-plugin', injection: 'fn portable() {}', order: 10},
            {pluginName: 'portable-plugin', injection: 'fn wgslOnly() {}', order: 0}
          ]
    );
  }
  expect(JSON.stringify(plugin)).toBe(before);
});

it('ShaderPlugin#preserves contribution order across plugins', () => {
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'first',
        defines: {ENABLED: false},
        injections: [{stage: 'fragment', target: '#decl', wgsl: 'first', order: 2}]
      },
      {
        name: 'second',
        defines: {ENABLED: true},
        injections: [{stage: 'fragment', target: '#decl', wgsl: 'second', order: 2}]
      }
    ],
    'wgsl'
  );
  expect(resolved.defines).toEqual({ENABLED: true});
  expect(resolved.injections['fs:#decl'].map(entry => entry.injection)).toEqual([
    'first',
    'second'
  ]);
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

it('ShaderPlugin#rejects invalid and conflicting interStageVariables', () => {
  expect(
    () =>
      resolveShaderPlugins(
        [{name: 'invalid-varying', interStageVariables: {'invalid-name': {type: 'f32'}} as any}],
        'glsl'
      ),
    'invalid varying identifiers are rejected'
  ).toThrow(/valid non-reserved identifier/);
  expect(
    () =>
      resolveShaderPlugins(
        [{name: 'reserved-varying', interStageVariables: {_luma_value: {type: 'f32'}}}],
        'wgsl'
      ),
    'reserved varying identifiers are rejected'
  ).toThrow(/valid non-reserved identifier/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {name: 'first-varying', interStageVariables: {value: {type: 'f32'}}},
          {name: 'second-varying', interStageVariables: {value: {type: 'vec2<f32>'}}}
        ],
        'wgsl'
      ),
    'conflicting varying types are rejected'
  ).toThrow(/conflicting declarations/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {name: 'smooth-varying', interStageVariables: {value: {type: 'f32'}}},
          {
            name: 'flat-varying',
            interStageVariables: {value: {type: 'f32', interpolation: 'flat'}}
          }
        ],
        'wgsl'
      ),
    'conflicting varying interpolation is rejected'
  ).toThrow(/conflicting declarations/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {
            name: 'smooth-integer',
            interStageVariables: {value: {type: 'u32', interpolation: 'smooth'}}
          }
        ],
        'wgsl'
      ),
    'integer interStageVariables cannot use smooth interpolation'
  ).toThrow(/must use flat interpolation/);
  expect(
    () =>
      resolveShaderPlugins(
        [
          {
            name: 'input-varying-collision',
            vertexInputs: {value: 'f32'},
            interStageVariables: {value: {type: 'f32'}}
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
            injections: [
              {
                stage: 'fragment',
                target: 'fragmentColor = vec4(1.0);',
                glsl: 'ignored',
                wgsl: 'ignored'
              }
            ]
          }
        ],
        'glsl'
      ),
    'raw replacement targets are rejected'
  ).toThrow(/must be a named shader injection target/);
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
        injections: [
          {stage: 'vertex', target: '#main-start', wgsl: 'let pluginVertexStart = 1u;'},
          {stage: 'fragment', target: '#main-end', wgsl: 'let pluginFragmentEnd = 2u;'}
        ]
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
        injections: [
          {
            stage: 'fragment',
            target: '#decl',
            wgsl: 'fn pluginGetColor() -> vec4<f32> { return vec4<f32>(1.0); }'
          }
        ]
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
  shaderAssembler.addShaderInjectionTarget({
    name: 'FILTER_POSITION',
    stage: 'vertex',
    wgsl: {parameters: 'position: ptr<function, vec4<f32>>'}
  });

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

it('ShaderPlugin#GLSL interStageVariables generate matched stage interfaces', () => {
  const shaderAssembler = new GLSLShaderAssembler();
  shaderAssembler.addShaderInjectionTarget({
    name: 'SET_PLUGIN_VARYINGS',
    stage: 'vertex',
    glsl: {parameters: ''}
  });
  shaderAssembler.addShaderInjectionTarget({
    name: 'USE_PLUGIN_VARYINGS',
    stage: 'fragment',
    glsl: {parameters: 'inout vec4 color'}
  });
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
    pluginInterStageVariables: {
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
    'interStageVariables initialize before other main-start injections'
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
        pluginInterStageVariables: {pluginColor: {type: 'vec4<f32>', interpolation: 'smooth'}}
      }),
    'application stage I/O cannot shadow plugin interStageVariables'
  ).toThrow(/conflicts with existing GLSL stage I\/O/);
  void 0;
});

it('ShaderPlugin#WGSL detects fragment structs around comments', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  for (const parameters of [
    'inputs: FragmentInput // trailing comment\n',
    'inputs: FragmentInput /* comment, with comma */, @builtin(front_facing) facing: bool'
  ]) {
    const source = `
struct VertexOutput { @builtin(position) position: vec4<f32>, };
struct FragmentInput { @builtin(position) position: vec4<f32>, };
@vertex fn vertexMain() -> VertexOutput { return VertexOutput(vec4<f32>(0.0)); }
@fragment fn fragmentMain(${parameters}) -> @location(0) vec4<f32> { return vec4<f32>(0.0); }
`;
    const assembled = shaderAssembler.assembleWGSLShader({
      platformInfo: WGSL_PLATFORM_INFO,
      source,
      vertexEntryPoint: 'vertexMain',
      fragmentEntryPoint: 'fragmentMain',
      pluginInterStageVariables: {pluginValue: {type: 'f32', interpolation: 'smooth'}}
    });
    expect(assembled.source.match(/@location\(0\) pluginValue: f32/g)?.length).toBe(2);
    expect(assembled.source).toContain('pluginValue = inputs.pluginValue;');
    expect(assembled.source).not.toContain('_luma_pluginValue:');
  }
});

it('ShaderPlugin#WGSL interStageVariables extend named stage structs', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  shaderAssembler.addShaderInjectionTarget({
    name: 'SET_PLUGIN_VARYINGS',
    stage: 'vertex',
    wgsl: {parameters: ''}
  });
  shaderAssembler.addShaderInjectionTarget({
    name: 'USE_PLUGIN_VARYINGS',
    stage: 'fragment',
    wgsl: {parameters: 'color: ptr<function, vec4<f32>>'}
  });
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
    pluginInterStageVariables: {
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

it('ShaderPlugin#WGSL interStageVariables reject unsupported interfaces', () => {
  const assembler = new WGSLShaderAssembler();
  expect(
    () =>
      assembler.assembleWGSLShader({
        platformInfo: WGSL_PLATFORM_INFO,
        source: WGSL_SOURCE,
        pluginInterStageVariables: {value: {type: 'f32', interpolation: 'smooth'}}
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
        pluginInterStageVariables: {value: {type: 'f32', interpolation: 'smooth'}}
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
struct OtherInput { @location(0) other: f32, };
@fragment fn fragmentMain(vertex: VertexOutput, other: OtherInput) -> @location(0) vec4<f32> {
  return vec4<f32>(other.other);
}`,
        pluginInterStageVariables: {value: {type: 'f32', interpolation: 'smooth'}}
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
        pluginInterStageVariables: {position: {type: 'vec4<f32>', interpolation: 'smooth'}}
      }),
    'application WGSL stage I/O cannot shadow plugin interStageVariables'
  ).toThrow(/conflicts with existing WGSL stage I\/O/);
  void 0;
});

it('ShaderPlugin#unknown hooks identify the contributing plugin', () => {
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'missing-color',
        injections: [{stage: 'fragment', target: 'MISSING_COLOR', wgsl: ''}]
      }
    ],
    'wgsl'
  );
  expect(() =>
    new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: WGSL_PLATFORM_INFO,
      source: WGSL_SOURCE,
      pluginInjections: resolved.injections
    })
  ).toThrow('Unknown shader injection target fs:MISSING_COLOR (plugins: missing-color)');
});

it('ShaderPlugin#assembly-local hooks do not leak between calls', () => {
  const assembler = new WGSLShaderAssembler();
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'local-color',
        injections: [{stage: 'fragment', target: 'LOCAL_COLOR', wgsl: '*color *= 0.5;'}]
      }
    ],
    'wgsl'
  );
  const props = {
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_SOURCE,
    pluginInjections: resolved.injections
  };
  expect(
    assembler.assembleWGSLShader({
      ...props,
      injectionTargets: [
        {
          name: 'LOCAL_COLOR',
          stage: 'fragment',
          wgsl: {parameters: 'color: ptr<function, vec4<f32>>'}
        }
      ]
    }).source
  ).toContain('*color *= 0.5;');
  expect(() => assembler.assembleWGSLShader(props)).toThrow(
    'Unknown shader injection target fs:LOCAL_COLOR'
  );
});

it('ShaderPlugin#GLSL local hooks override registered hooks without mutation', () => {
  const assembler = new GLSLShaderAssembler();
  assembler.addShaderInjectionTarget({
    name: 'LOCAL_POSITION',
    stage: 'vertex',
    glsl: {parameters: 'inout vec4 position', header: 'position.x += 1.0;'}
  });
  const props = {
    platformInfo: GLSL_PLATFORM_INFO,
    vs: '#version 300 es\nvoid main() { gl_Position = vec4(0.0); }',
    fs: '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() { color = vec4(1.0); }'
  };
  const local = assembler.assembleGLSLShaderPair({
    ...props,
    injectionTargets: [
      {
        name: 'LOCAL_POSITION',
        stage: 'vertex',
        glsl: {parameters: 'inout vec4 position', header: 'position.x += 2.0;'}
      }
    ]
  });
  expect(local.vs).toContain('position.x += 2.0;');
  expect(local.vs).not.toContain('position.x += 1.0;');
  expect(assembler.assembleGLSLShaderPair(props).vs).toContain('position.x += 1.0;');
});

it('ShaderPlugin#module conflict diagnostics preserve selection and descriptor identity', () => {
  const first: ShaderModule = {name: 'filter'};
  const second: ShaderModule = {name: 'filter', vs: 'float alternate;'};
  const conflicts: string[] = [];
  const modules = mergeShaderPluginModules([first], [first, second], {
    onConflict: (name, selected, ignored) => {
      conflicts.push(name);
      expect(selected).toBe(first);
      expect(ignored).toBe(second);
    }
  });
  expect(modules).toEqual([first]);
  expect(conflicts).toEqual(['filter']);
  expect(mergeShaderPluginModules([first], [second])).toEqual([first]);
});

it('ShaderPlugin#equal-order plugin injections retain declaration order on both backends', () => {
  for (const language of ['glsl', 'wgsl'] as const) {
    const resolved = resolveShaderPlugins(
      [
        {
          name: 'first',
          injections: [
            {
              stage: 'fragment',
              target: 'FILTER_COLOR',
              glsl: language === 'wgsl' ? 'let firstMarker = 1.0;' : 'float firstMarker = 1.0;',
              wgsl: language === 'wgsl' ? 'let firstMarker = 1.0;' : 'float firstMarker = 1.0;'
            }
          ]
        },
        {
          name: 'second',
          injections: [
            {
              stage: 'fragment',
              target: 'FILTER_COLOR',
              glsl: language === 'wgsl' ? 'let secondMarker = 1.0;' : 'float secondMarker = 1.0;',
              wgsl: language === 'wgsl' ? 'let secondMarker = 1.0;' : 'float secondMarker = 1.0;'
            }
          ]
        }
      ],
      language
    );
    const source =
      language === 'wgsl'
        ? (() => {
            const assembler = new WGSLShaderAssembler();
            assembler.addShaderInjectionTarget({
              name: 'FILTER_COLOR',
              stage: 'fragment',
              wgsl: {parameters: 'color: ptr<function, vec4<f32>>'}
            });
            return assembler.assembleWGSLShader({
              platformInfo: WGSL_PLATFORM_INFO,
              source: WGSL_SOURCE,
              inject: {
                'fs:FILTER_COLOR':
                  language === 'wgsl' ? 'let legacyMarker = 1.0;' : 'float legacyMarker = 1.0;'
              },
              pluginInjections: resolved.injections
            }).source;
          })()
        : (() => {
            const assembler = new GLSLShaderAssembler();
            assembler.addShaderInjectionTarget({
              name: 'FILTER_COLOR',
              stage: 'fragment',
              glsl: {parameters: 'inout vec4 color'}
            });
            return assembler.assembleGLSLShaderPair({
              platformInfo: GLSL_PLATFORM_INFO,
              vs: '#version 300 es\nvoid main() { gl_Position = vec4(0.0); }',
              fs: '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() { color = vec4(1.0); }',
              inject: {
                'fs:FILTER_COLOR':
                  language === 'wgsl' ? 'let legacyMarker = 1.0;' : 'float legacyMarker = 1.0;'
              },
              pluginInjections: resolved.injections
            }).fs;
          })();
    expect(source.indexOf('firstMarker')).toBeGreaterThan(-1);
    expect(source.indexOf('legacyMarker')).toBeGreaterThan(source.indexOf('secondMarker'));
    expect(source.indexOf('secondMarker')).toBeGreaterThan(source.indexOf('firstMarker'));
  }
});

it('ShaderPlugin#mixed main anchors preserve numeric order on both backends', () => {
  for (const language of ['glsl', 'wgsl'] as const) {
    for (const stage of ['vs', 'fs'] as const) {
      for (const anchor of ['#main-start', '#main-end'] as const) {
        const target = `${stage}:${anchor}` as const;
        const declaration = language === 'wgsl' ? 'let' : 'float';
        const resolved = resolveShaderPlugins(
          [
            {
              name: 'ordered-main',
              injections: [
                {
                  stage: stage === 'vs' ? 'vertex' : 'fragment',
                  target: anchor,
                  order: 10,
                  glsl: `${declaration} pluginOrdered = 1.0;`,
                  wgsl: `${declaration} pluginOrdered = 1.0;`
                }
              ]
            }
          ],
          language
        );
        const inject = {[target]: {injection: `${declaration} legacyOrdered = 2.0;`, order: -10}};
        const source =
          language === 'wgsl'
            ? new WGSLShaderAssembler().assembleWGSLShader({
                platformInfo: WGSL_PLATFORM_INFO,
                source: WGSL_SOURCE,
                pluginInjections: resolved.injections,
                inject
              }).source
            : (() => {
                const shaders = new GLSLShaderAssembler().assembleGLSLShaderPair({
                  platformInfo: GLSL_PLATFORM_INFO,
                  vs: '#version 300 es\nvoid main() { gl_Position = vec4(0.0); }',
                  fs: '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() { color = vec4(1.0); }',
                  pluginInjections: resolved.injections,
                  inject
                });
                return shaders[stage];
              })();
        expect(
          source.indexOf('legacyOrdered'),
          `${language} ${target} retains legacy injection`
        ).toBeGreaterThan(-1);
        expect(
          source.indexOf('pluginOrdered'),
          `${language} ${target} sorts by numeric order`
        ).toBeGreaterThan(source.indexOf('legacyOrdered'));
      }
    }
  }
});

it('ShaderPlugin#injection-only plugins contribute no module', () => {
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'source-only',
        injections: [{stage: 'fragment', target: '#decl', wgsl: 'fn helper() {}'}]
      }
    ],
    'wgsl'
  );
  expect(resolved.modules).toEqual([]);
  expect(resolved.injections['fs:#decl'][0]).toEqual({
    pluginName: 'source-only',
    injection: 'fn helper() {}',
    order: 0
  });
});

it('ShaderPlugin#typed modules and numeric specialization', () => {
  const module: ShaderModule<{threshold: number}, {threshold: number}, {}> = {
    name: 'typed-plugin-module',
    uniformTypes: {threshold: 'f32'},
    getUniforms: (props, previous) => ({threshold: props.threshold ?? previous?.threshold ?? 0})
  };
  const plugin: ShaderPlugin = {name: 'numeric-plugin', module, defines: {CHANNELS: 3}};
  const resolved = resolveShaderPlugins([plugin], 'wgsl');
  expect(resolved.modules).toEqual([module]);
  expect(resolved.defines).toEqual({CHANNELS: 3});
  const wgsl = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source:
      '@vertex fn vertexMain() -> @builtin(position) vec4<f32> {\n#if CHANNELS == 3\nreturn vec4<f32>(3.0);\n#else\nreturn vec4<f32>(0.0);\n#endif\n}',
    defines: resolved.defines
  });
  expect(wgsl.source).toContain('vec4<f32>(3.0)');
  expect(wgsl.source).not.toContain('vec4<f32>(0.0)');
  const glsl = new GLSLShaderAssembler().assembleGLSLShaderPair({
    platformInfo: {...WGSL_PLATFORM_INFO, type: 'webgl'},
    vs: '#version 300 es\nvoid main() { gl_Position = vec4(float(CHANNELS)); }',
    fs: '#version 300 es\nprecision highp float; out vec4 color; void main() { color = vec4(1.0); }',
    defines: resolved.defines
  });
  expect(glsl.vs).toContain('#define CHANNELS 3');
});

it.each([
  '',
  '@builtin(position) position: vec4<f32>',
  '@location(2) color: vec4<f32>, @builtin(front_facing) front: bool,'
])('ShaderPlugin#WGSL varying extends direct fragment inputs (%s)', parameters => {
  const source = `
struct VertexOutput { @builtin(position) position: vec4<f32>, @location(2) color: vec4<f32>, };
@vertex fn vertexMain() -> VertexOutput {
  return VertexOutput(vec4<f32>(0.0), vec4<f32>(1.0));
}
@fragment fn fragmentMain(${parameters}) -> @location(0) vec4<f32> {
  return vec4<f32>(filterWeight);
}`;
  const result = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source,
    pluginInterStageVariables: {filterWeight: {type: 'f32', interpolation: 'smooth'}}
  });
  expect(result.source).toContain('@location(0) _luma_filterWeight: f32');
  expect(result.source).toContain('filterWeight = _luma_filterWeight;');
  expect(result.source).toContain('@location(0) filterWeight: f32');
  expect(result.source).toContain('vec4<f32>(filterWeight)');
});

it.each([
  ['CHANNELS == 3', true],
  ['CHANNELS != 3', false],
  ['CHANNELS < 4', true],
  ['CHANNELS > 4', false],
  ['CHANNELS <= 3', true],
  ['CHANNELS >= 4', false],
  ['3 == CHANNELS', true],
  ['CHANNELS == LIMIT', true],
  ['MISSING == 0', true],
  ['-1 < CHANNELS', true]
] as const)('ShaderPlugin#numeric condition %s', (condition, enabled) => {
  const result = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: `#if ${condition}\nconst selected = 1;\n#else\nconst selected = 0;\n#endif`,
    defines: resolveShaderPlugins([{name: 'channels', defines: {CHANNELS: 3, LIMIT: 3}}], 'wgsl')
      .defines
  });
  expect(result.source).toContain(`const selected = ${enabled ? 1 : 0};`);
});

it.each([
  'glsl',
  'wgsl'
] as const)('ShaderPlugin#language-selected hook providers compose on %s', language => {
  const provider: ShaderPlugin = {
    name: 'hooks',
    injectionTargets: [
      {
        stage: 'fragment',
        name: 'FILTER_COLOR',
        glsl: {parameters: '\n  inout vec4 color\n'},
        wgsl: {parameters: '\n  color: ptr<function, vec4<f32>>\n'}
      }
    ]
  };
  const consumer: ShaderPlugin = {
    name: 'tint',
    injections: [
      {stage: 'fragment', target: 'FILTER_COLOR', glsl: 'color.r = 0.5;', wgsl: '(*color).r = 0.5;'}
    ]
  };
  const resolved = resolveShaderPlugins([consumer, provider, provider], language);
  expect(resolved.injectionTargets).toHaveLength(1);
  expect(resolved.injectionTargets[0][language]?.parameters).toContain(
    language === 'glsl' ? 'inout' : 'ptr<function'
  );
  const assembled =
    language === 'glsl'
      ? new GLSLShaderAssembler().assembleGLSLShaderPair({
          platformInfo: GLSL_PLATFORM_INFO,
          vs: '#version 300 es\nvoid main(){gl_Position=vec4(0.0);}',
          fs: '#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.0);FILTER_COLOR(color);}',
          pluginInjectionTargets: resolved.injectionTargets,
          pluginInjections: resolved.injections
        }).fs
      : new WGSLShaderAssembler().assembleWGSLShader({
          platformInfo: WGSL_PLATFORM_INFO,
          source: WGSL_SOURCE,
          pluginInjectionTargets: resolved.injectionTargets,
          pluginInjections: resolved.injections
        }).source;
  expect(assembled).toContain('FILTER_COLOR(');
  expect(assembled).toContain(language === 'glsl' ? 'color.r = 0.5;' : '(*color).r = 0.5;');
  expect(() =>
    resolveShaderPlugins(
      [
        provider,
        {
          name: 'conflict',
          injectionTargets: [
            {stage: 'fragment', name: 'FILTER_COLOR', [language]: {parameters: ''}}
          ]
        }
      ],
      language
    )
  ).toThrow(/Conflicting/);
});

it('ShaderPlugin#qualified shorthand selects language and rejects compact objects', () => {
  const plugin: ShaderPlugin = {
    name: 'short',
    injectionTargets: [
      {name: 'TINT', stage: 'fragment', glsl: {parameters: 'inout vec4 color'}},
      {name: 'TINT', stage: 'fragment', wgsl: {parameters: 'color: ptr<function, vec4<f32>>'}}
    ],
    injections: {'glsl:fs:TINT': 'color.r = 1.0;', 'wgsl:fs:TINT': '(*color).r = 1.0;'}
  };
  expect(resolveShaderPlugins([plugin], 'glsl').injections['fs:TINT'][0].injection).toBe(
    'color.r = 1.0;'
  );
  expect(resolveShaderPlugins([plugin], 'wgsl').injectionTargets).toHaveLength(1);
  expect(() =>
    resolveShaderPlugins(
      [{name: 'old', injections: [{target: 'fs:TINT', glsl: ''} as any]}],
      'glsl'
    )
  ).toThrow(/explicit stage/);
});

it('ShaderPlugin#assembler descriptors select language and reject provider conflicts', () => {
  const assembler = new GLSLShaderAssembler();
  assembler.addShaderInjectionTarget({
    name: 'TINT',
    stage: 'fragment',
    glsl: {parameters: 'inout vec4 color'}
  });
  assembler.addShaderInjectionTarget({
    name: 'TINT',
    stage: 'fragment',
    wgsl: {parameters: 'color: ptr<function, vec4<f32>>'}
  });
  const props = {
    platformInfo: GLSL_PLATFORM_INFO,
    vs: '#version 300 es\nvoid main(){gl_Position=vec4(0.0);}',
    fs: '#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.0);TINT(color);}'
  };
  const source = assembler.assembleGLSLShaderPair(props).fs;
  expect(source).toContain('void TINT(inout vec4 color)');
  expect(source).not.toContain('ptr<function');
  expect(() =>
    assembler.assembleGLSLShaderPair({
      ...props,
      pluginInjectionTargets: [{name: 'TINT', stage: 'fragment', glsl: {parameters: ''}}]
    })
  ).toThrow(/Conflicting/);
});

it('ShaderPlugin#matching declarations preserve assembler hook wrappers', () => {
  const assembler = new GLSLShaderAssembler();
  assembler.addShaderInjectionTarget({
    name: 'TINT',
    stage: 'fragment',
    glsl: {parameters: 'inout vec4 color', header: 'color.r = 0.25;', footer: 'color.b = 0.75;'}
  });
  const resolved = resolveShaderPlugins(
    [
      {
        name: 'provider',
        injectionTargets: [
          {stage: 'fragment', name: 'TINT', glsl: {parameters: 'inout vec4 color'}}
        ],
        injections: [{stage: 'fragment', target: 'TINT', glsl: 'color.g = 0.5;'}]
      }
    ],
    'glsl'
  );
  const source = assembler.assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: '#version 300 es\nvoid main(){gl_Position=vec4(0.0);}',
    fs: '#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.0);TINT(color);}',
    pluginInjectionTargets: resolved.injectionTargets,
    pluginInjections: resolved.injections
  }).fs;
  expect(source.indexOf('color.r = 0.25;')).toBeGreaterThan(-1);
  expect(source.indexOf('color.g = 0.5;')).toBeGreaterThan(source.indexOf('color.r = 0.25;'));
  expect(source.indexOf('color.b = 0.75;')).toBeGreaterThan(source.indexOf('color.g = 0.5;'));
});

it.each([
  'glsl',
  'wgsl'
] as const)('shared hook and injection declarations work globally and in plugins on %s', language => {
  const hook: ShaderInjectionTarget = {
    name: 'TINT',
    stage: 'fragment',
    glsl: {parameters: 'inout vec4 color'},
    wgsl: {parameters: 'color: ptr<function, vec4<f32>>'}
  };
  const injections: ShaderInjection[] = [
    {stage: 'fragment', target: 'TINT', glsl: '// GLSL second', wgsl: '// WGSL second', order: 2},
    {stage: 'fragment', target: 'TINT', glsl: '// GLSL first', wgsl: '// WGSL first', order: 1}
  ];
  const resolved = resolveShaderPlugins(
    [{name: 'shared', injectionTargets: [hook], injections}],
    language
  );
  const assembler = language === 'glsl' ? new GLSLShaderAssembler() : new WGSLShaderAssembler();
  assembler.addShaderInjectionTarget(hook);
  const props = {
    platformInfo: language === 'glsl' ? GLSL_PLATFORM_INFO : WGSL_PLATFORM_INFO,
    vs: '#version 300 es\nvoid main(){gl_Position=vec4(0.0);}',
    fs: '#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.0);TINT(color);}',
    source: WGSL_SOURCE
  };
  const assemble = (
    inject?: readonly ShaderInjection[],
    pluginInjections?: typeof resolved.injections
  ) =>
    assembler instanceof GLSLShaderAssembler
      ? assembler.assembleGLSLShaderPair({...props, inject, pluginInjections}).fs
      : assembler.assembleWGSLShader({...props, inject, pluginInjections}).source;
  const globalSource = assemble(injections);
  expect(globalSource).toBe(assemble(undefined, resolved.injections));
  const prefix = language === 'glsl' ? 'GLSL' : 'WGSL';
  expect(globalSource.indexOf(`${prefix} first`)).toBeLessThan(
    globalSource.indexOf(`${prefix} second`)
  );
  expect(globalSource).not.toContain(language === 'glsl' ? 'WGSL' : 'GLSL');
  expect(assemble([{stage: 'fragment', target: 'TINT', glsl: '', wgsl: ''}])).not.toContain(
    `${prefix} first`
  );
  expect(
    assemble([
      {
        stage: 'fragment',
        target: 'NOT_REGISTERED',
        [language === 'glsl' ? 'wgsl' : 'glsl']: '// inactive'
      }
    ])
  ).not.toContain('inactive');
  expect(() =>
    assemble([{stage: 'fragment', target: 'NOT_REGISTERED', [language]: '// active'}])
  ).toThrow('Unknown shader injection target fs:NOT_REGISTERED');
});
