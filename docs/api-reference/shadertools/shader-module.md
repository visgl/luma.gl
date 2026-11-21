# ShaderModule

[ShaderModule](https://luma.gl/docs/api-reference/shadertools/shader-module.md)[ShaderPlugin](https://luma.gl/docs/api-reference/shadertools/shader-plugin.md)[Assembler](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md)[Conventions](https://luma.gl/docs/api-reference/shadertools/shader-conventions.md)

`ShaderModule` is the reusable shader feature descriptor used by `@luma.gl/shadertools`. A module may contribute WGSL and/or GLSL source, shader-facing uniform descriptors, resource bindings, dependencies, defines, and ordered injections.

`ShaderModule`s are used by [`ShaderAssembler`](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md) and engine classes such as [`Model`](https://luma.gl/docs/api-reference/engine/model.md) and [`Computation`](https://luma.gl/docs/api-reference/engine/compute/computation.md). The assembler resolves dependencies, prepends module source, applies injections, and returns assembled source plus a combined uniform getter.

For the composition model, see [Shader Assembly](https://luma.gl/docs/api-guide/shaders/shader-assembly.md).

**ShaderModule**

* Languages

  WGSL source, GLSL vertex/fragment source, or both

* Dependencies

  Resolved transitively and de-duplicated in deterministic order

* Hooks and injections

  Named extension contracts and ordered source contributions

* Props and bindings

  Typed descriptors mapped through getUniforms()

* Assembly output

  Combined source, uniforms, bindings, and dependency metadata

* Cost

  Assemble before pipeline creation and reuse the result

## Usage[​](#usage "Direct link to Usage")

Attach modules through an engine class:

```
import {Model} from '@luma.gl/engine';



const model = new Model(device, {

  source: wgslSource,

  vs: glslVertexSource,

  fs: glslFragmentSource,

  modules: [color]

});
```

Or pass modules directly to `ShaderAssembler`.

To define a new shader module, create a descriptor that brings together the source, uniforms, injections, and dependencies that belong to one reusable shader feature:

```
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

Use `source` for WGSL, `vs` and `fs` for GLSL stage source, or all three when the module supports both backends. `uniformTypes` declares shader-facing layouts; `getUniforms` maps application props to the uniforms and bindings consumed by the shader; `dependencies` brings in other modules first; and `inject` targets hooks or named injection points when the module needs to modify base shader flow.

## Fields[​](#fields "Direct link to Fields")

#### `props`, `uniforms`, `bindings`[​](#props-uniforms-bindings "Direct link to props-uniforms-bindings")

* `props?`, `uniforms?`, `bindings?` - Type-inference fields. They are not currently used as runtime values.

#### `name`[​](#name "Direct link to name")

* `name` (string) - The name of the shader module.

#### `source`[​](#source "Direct link to source")

* `source?` (string) - WGSL code contributed by the module.

#### `vs`[​](#vs "Direct link to vs")

* `vs?` (string) - GLSL vertex shader code contributed by the module.

#### `fs`[​](#fs "Direct link to fs")

* `fs?` (string) - GLSL fragment shader code contributed by the module.

#### `uniformTypes` (*Object*) - Uniform shader types[​](#uniformtypes-object---uniform-shader-types "Direct link to uniformtypes-object---uniform-shader-types")

The `uniformTypes` map describes the shader-facing uniform layout for the module. Primitive uniform leaves use string shader types such as `'f32'`, `'vec3<f32>'`, and `'mat4x4<f32>'`.

From v9.3

luma.gl also supports composite uniform descriptors:

* structs use object literals
* fixed-size arrays use `[elementType, length]`

See [Core Shader Types](https://luma.gl/docs/api-reference/core/shader-types.md) for the descriptor syntax, TypeScript inference, array handling, and how nested values flow through `ShaderInputs` and uniform-buffer packing.

#### `propTypes` (*Object*) - Uniform JS prop types[​](#proptypes-object---uniform-js-prop-types "Direct link to proptypes-object---uniform-js-prop-types")

#### `defaultUniforms` (*Object*) - Default uniform values[​](#defaultuniforms-object---default-uniform-values "Direct link to defaultuniforms-object---default-uniform-values")

#### `getUniforms` (*function*) - Function that maps props to uniforms and bindings[​](#getuniforms-function---function-that-maps-props-to-uniforms-and-bindings "Direct link to getuniforms-function---function-that-maps-props-to-uniforms-and-bindings")

When `getUniforms` is not provided, shadertools validates props using `propTypes` and returns the matching values.

#### `bindingLayout` (*Array*) - Logical bind-group assignment for bindings[​](#bindinglayout-array---logical-bind-group-assignment-for-bindings "Direct link to bindinglayout-array---logical-bind-group-assignment-for-bindings")

Each entry has `name` and `group`. For current bind-group guidance, see [Bind Groups and Bindings](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md).

#### `firstBindingSlot` (*Number*) - Preferred WGSL auto-binding start slot[​](#firstbindingslot-number---preferred-wgsl-auto-binding-start-slot "Direct link to firstbindingslot-number---preferred-wgsl-auto-binding-start-slot")

This affects module-owned WGSL `@binding(auto)` relocation.

#### `defines` (*Object*) - Constant defines to be injected into shader[​](#defines-object---constant-defines-to-be-injected-into-shader "Direct link to defines-object---constant-defines-to-be-injected-into-shader")

#### `inject` (*Object*) - Injections the module will make into shader hooks or anchors[​](#inject-object---injections-the-module-will-make-into-shader-hooks-or-anchors "Direct link to inject-object---injections-the-module-will-make-into-shader-hooks-or-anchors")

See [`ShaderAssembler`](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md#hooks-and-injections) for hook and standard injection target syntax.

#### `dependencies` (*Array*) - Shader modules that this module depends on[​](#dependencies-array---shader-modules-that-this-module-depends-on "Direct link to dependencies-array---shader-modules-that-this-module-depends-on")

Dependencies are resolved before the module source is assembled.

#### `deprecations` (*Array*) - Deprecated APIs detected during assembly[​](#deprecations-array---deprecated-apis-detected-during-assembly "Direct link to deprecations-array---deprecated-apis-detected-during-assembly")

If `deprecations` is supplied, `assembleShaders` will scan shader source code for the deprecated constructs and issue a console warning if found. Each API is described in the following format:

* `type`: `uniform <type>` or `function`
* `old`: name of the deprecated uniform/function
* `new`: name of the new uniform/function
* `deprecated`: whether the old API is still supported.

#### `instance` (*Object*) - Runtime initialization state[​](#instance-object---runtime-initialization-state "Direct link to instance-object---runtime-initialization-state")

Generated by `initializeShaderModule()` or shader assembly. Application module descriptors should normally leave this unset.

### Statically defining Uniforms[​](#statically-defining-uniforms "Direct link to Statically defining Uniforms")

If the uniforms of this module can be directly pulled from user props, they may be declaratively defined by a `defaultUniforms` object:

```
{

  name: 'my-shader-module',

  defaultUniforms: {center: [0.5, 0.5], strength: 0.9},

  uniformTypes: {center: 'vec2<f32>', strength: 'f32'}

}
```

At runtime, this map will be used to generate the uniforms needed by the shaders. If either `strength` or `center` is present in the user's module props, then the user's value will be used; otherwise, the default value in the original definition will be used.

### Dynamically defining Uniforms[​](#dynamically-defining-uniforms "Direct link to Dynamically defining Uniforms")

The shader module may want to perform more complex logic when mapping the user's module props to uniforms. This can be achieved using `getUniforms()`:

```
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

## Defining Injections[​](#defining-injections "Direct link to Defining Injections")

A map from hook or standard anchor target to either the injection code string, or an object containing the injection code and an `order` option indicating ordering within the hook function. See [`ShaderAssembler`](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md) for more information on shader hooks and standard anchors.

For example:

```
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

## Functions[​](#functions "Direct link to Functions")

#### `initializeShaderModule()`[​](#initializeshadermodule "Direct link to initializeshadermodule")

```
initializeShaderModule(module: ShaderModule): void
```

Initializes one module's dependencies, normalized injections, parsed deprecations, prop validators, and default uniforms. Assembly calls this as needed.

#### `initializeShaderModules()`[​](#initializeshadermodules "Direct link to initializeshadermodules")

```
initializeShaderModules(modules: ShaderModule[]): void
```

Initializes each module in an array.

#### `getShaderModuleUniforms()`[​](#getshadermoduleuniforms "Direct link to getshadermoduleuniforms")

```
getShaderModuleUniforms(

  module: ShaderModule,

  props?: Record<string, unknown>,

  oldUniforms?: Record<string, ShaderModuleUniformValue>

): Record<string, Binding | ShaderModuleUniformValue>
```

Returns the uniforms and bindings produced for one module update. When the module has `getUniforms` and `props` are supplied, shadertools calls `getUniforms(props, oldUniforms || defaultUniforms)`. Otherwise it validates and returns matching props through `propTypes`.

#### `getShaderModuleDependencies()`[​](#getshadermoduledependencies "Direct link to getshadermoduledependencies")

```
getShaderModuleDependencies(modules: ShaderModule[]): ShaderModule[]
```

Returns modules and transitive dependencies sorted so dependencies are assembled before modules that use them.

#### `checkShaderModuleDeprecations()`[​](#checkshadermoduledeprecations "Direct link to checkshadermoduledeprecations")

```
checkShaderModuleDeprecations(

  shaderModule: ShaderModule,

  shaderSource: string,

  log: any

): void
```

Checks shader source against the module's deprecation definitions and logs matching warnings or removals.
