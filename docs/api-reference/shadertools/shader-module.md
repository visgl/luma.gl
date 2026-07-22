import {ShadertoolsDocsTabs} from '@site/src/components/docs/shadertools-docs-tabs';

# ShaderModule

<ShadertoolsDocsTabs active="shader-module" />

`ShaderModule` is the reusable shader feature descriptor used by
`@luma.gl/shadertools`. A module may contribute WGSL and/or GLSL source,
shader-facing uniform descriptors, resource bindings, dependencies, defines,
and ordered injections.

`ShaderModule`s are used by [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler)
and engine classes such as [`Model`](/docs/api-reference/engine/model) and
[`Computation`](/docs/api-reference/engine/compute/computation). The assembler
resolves dependencies, prepends module source, applies injections, and returns
assembled source plus a combined uniform getter.

For the composition model, see
[Shader Assembly](/docs/api-guide/shaders/shader-assembly).

## Usage

Attach modules through an engine class:

```typescript
import {Model} from '@luma.gl/engine';

const model = new Model(device, {
  source: wgslSource,
  vs: glslVertexSource,
  fs: glslFragmentSource,
  modules: [color]
});
```

Or pass modules directly to `ShaderAssembler`.

To define a new shader module, create a descriptor that brings together the
source, uniforms, injections, and dependencies that belong to one reusable
shader feature:

```typescript
import type {ShaderModule} from '@luma.gl/shadertools';

type MyShaderModuleProps = {
  intensity: number;
};

export const myShaderModule = {
  name: 'my-shader-module',
  source: '...',
  vs: '...',
  fs: '...',
  uniformTypes: {
    intensity: 'f32'
  },
  inject: {},
  dependencies: [],
  getUniforms: props => ({intensity: props.intensity})
} as const satisfies ShaderModule<MyShaderModuleProps>;
```

Use `source` for WGSL, `vs` and `fs` for GLSL stage source, or all three when
the module supports both backends. `uniformTypes` declares shader-facing
layouts; `getUniforms` maps application props to the uniforms and bindings
consumed by the shader; `dependencies` brings in other modules first; and
`inject` targets hooks or named injection points when the module needs to
modify base shader flow.

## Fields

#### `props`, `uniforms`, `bindings`

- `props?`, `uniforms?`, `bindings?` - Type-inference fields. They are not
  currently used as runtime values.

#### `name`

- `name` (string) - The name of the shader module.

#### `source`

- `source?` (string) - WGSL code contributed by the module.

#### `vs`

- `vs?` (string) - GLSL vertex shader code contributed by the module.

#### `fs`

- `fs?` (string) - GLSL fragment shader code contributed by the module.

#### `uniformTypes` (_Object_) - Uniform shader types

The `uniformTypes` map describes the shader-facing uniform layout for the
module. Primitive uniform leaves use string shader types such as `'f32'`,
`'vec3<f32>'`, and `'mat4x4<f32>'`.

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

luma.gl also supports composite uniform descriptors:

- structs use object literals
- fixed-size arrays use `[elementType, length]`

See [Core Shader Types](/docs/api-reference/core/shader-types) for the
descriptor syntax, TypeScript inference, array handling, and how nested values
flow through `ShaderInputs` and uniform-buffer packing.

#### `propTypes` (_Object_) - Uniform JS prop types

#### `defaultUniforms` (_Object_) - Default uniform values

#### `getUniforms` (_function_) - Function that maps props to uniforms and bindings

When `getUniforms` is not provided, shadertools validates props using
`propTypes` and returns the matching values.

#### `bindingLayout` (_Array_) - Logical bind-group assignment for bindings

Each entry has `name` and `group`. For current bind-group guidance, see
[Bind Groups and Bindings](/docs/api-guide/gpu/gpu-bindings).

#### `firstBindingSlot` (_Number_) - Preferred WGSL auto-binding start slot

This affects module-owned WGSL `@binding(auto)` relocation.

#### `requiredFeatures` (_Array_) - Required shader-language capabilities

`requiredFeatures?: ShaderFeature[]` declares language features needed by the module, such as
`shader-f16`, `subgroups`, `primitive-index`, `dual-source-blending`, or
`shader-sample-variables-webgl`. Assembly throws before generating source when
`platformInfo.shaderFeatures` lacks a required feature. Modules must still author their own GLSL
`#extension` directives or WGSL feature syntax; shadertools validates but does not inject them.

#### `defines` (_Object_) - Constant defines to be injected into shader

#### `inject` (_Object_) - Injections the module will make into shader hooks or anchors

See [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler#hooks-and-injections)
for hook and standard injection target syntax.

#### `dependencies` (_Array_) - Shader modules that this module depends on

Dependencies are resolved before the module source is assembled.

#### `deprecations` (_Array_) - Deprecated APIs detected during assembly

If `deprecations` is supplied, `assembleShaders` will scan shader source code for the deprecated constructs and issue a console warning if found. Each API is described in the following format:

- `type`: `uniform <type>` or `function`
- `old`: name of the deprecated uniform/function
- `new`: name of the new uniform/function
- `deprecated`: whether the old API is still supported.

#### `instance` (_Object_) - Runtime initialization state

Generated by `initializeShaderModule()` or shader assembly. Application module
descriptors should normally leave this unset.

### Statically defining Uniforms

If the uniforms of this module can be directly pulled from user props, they may
be declaratively defined by a `defaultUniforms` object:

```typescript
{
  name: 'my-shader-module',
  defaultUniforms: {center: [0.5, 0.5], strength: 0.9},
  uniformTypes: {center: 'vec2<f32>', strength: 'f32'}
}
```

At runtime, this map will be used to generate the uniforms needed by the shaders. If either `strength` or `center` is present in the user's module props, then the user's value will be used; otherwise, the default value in the original definition will be used.

### Dynamically defining Uniforms

The shader module may want to perform more complex logic when mapping the
user's module props to uniforms. This can be achieved using `getUniforms()`:

```typescript
{
  name: 'my-shader-module',
  uniformTypes: {center: 'vec2<f32>', strength: 'f32'},
  getUniforms: ({intensity}) => {
    return {
      strength: Math.sqrt(intensity),
      center: intensity > 0 ? [0.5, 0.5] : [0, 0]
    };
  }
}
```

## Defining Injections

A map from hook or standard anchor target to either the injection code string,
or an object containing the injection code and an `order` option indicating
ordering within the hook function. See
[`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler) for more
information on shader hooks and standard anchors.

For example:

```typescript
const picking = {
  name: 'picking',
  inject: {
    'vs:VERTEX_HOOK_FUNCTION': 'picking_setPickingColor(color.rgb);',
    'fs:FRAGMENT_HOOK_FUNCTION': {
      injection: 'color = picking_filterColor(color);',
      order: Number.POSITIVE_INFINITY
    },
    'fs:#main-end': 'gl_FragColor = picking_filterColor(gl_FragColor);'
  }
};
```

## Functions

#### `initializeShaderModule()`

```ts
initializeShaderModule(module: ShaderModule): void
```

Initializes one module's dependencies, normalized injections, parsed
deprecations, prop validators, and default uniforms. Assembly calls this as
needed.

#### `initializeShaderModules()`

```ts
initializeShaderModules(modules: ShaderModule[]): void
```

Initializes each module in an array.

#### `getShaderModuleUniforms()`

```ts
getShaderModuleUniforms(
  module: ShaderModule,
  props?: Record<string, unknown>,
  oldUniforms?: Record<string, ShaderModuleUniformValue>
): Record<string, Binding | ShaderModuleUniformValue>
```

Returns the uniforms and bindings produced for one module update. When the
module has `getUniforms` and `props` are supplied, shadertools calls
`getUniforms(props, oldUniforms || defaultUniforms)`. Otherwise it validates
and returns matching props through `propTypes`.

#### `getShaderModuleDependencies()`

```ts
getShaderModuleDependencies(modules: ShaderModule[]): ShaderModule[]
```

Returns modules and transitive dependencies sorted so dependencies are assembled
before modules that use them.

#### `checkShaderModuleDeprecations()`

```ts
checkShaderModuleDeprecations(
  shaderModule: ShaderModule,
  shaderSource: string,
  log: any
): void
```

Checks shader source against the module's deprecation definitions and logs
matching warnings or removals.
