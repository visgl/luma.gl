# Shadertools cookbook

[Overview](https://luma.gl/next/docs/api-reference/shadertools.md)[Programming guide](https://luma.gl/next/docs/api-guide/shaders.md)[Cookbook](https://luma.gl/next/docs/api-guide/shaders/cookbook.md)

These snippets show the smallest useful descriptor or assembly action. Add both WGSL and GLSL source when the feature must run on both backends.

| Goal                             | Use                                | Result                                   |
| -------------------------------- | ---------------------------------- | ---------------------------------------- |
| Package reusable shader behavior | `ShaderModule`                     | Source plus typed configuration          |
| Convert props to shader values   | `uniformTypes` and `getUniforms()` | Uniforms and bindings for `ShaderInputs` |
| Declare an extension point       | `addShaderHook()`                  | A stable callable hook                   |
| Extend a shader                  | `inject`                           | Ordered code at a supported target       |
| Share lower-level behavior       | `dependencies`                     | De-duplicated module ordering            |
| Package optional behavior        | `ShaderPlugin`                     | Modules, inputs, defines, and injections |
| Define an image operation        | `ShaderPass`                       | A reusable fullscreen stage              |

## Author a module[​](#author-a-module "Direct link to Author a module")

```
const tint = {

  name: 'tint',

  source: 'struct Tint { color: vec4f }; @group(0) @binding(auto) var<uniform> tint: Tint;',

  uniformTypes: {color: 'vec4<f32>'}

} as const satisfies ShaderModule<{color: [number, number, number, number]}>;
```

Keep the name stable and supply a GLSL path too when WebGL 2 is supported.

## Expose props and bindings[​](#expose-props-and-bindings "Direct link to Expose props and bindings")

```
const exposure = {

  name: 'exposure',

  uniformTypes: {value: 'f32'},

  getUniforms: ({stops = 0}) => ({value: 2 ** stops})

} as const satisfies ShaderModule<{stops?: number}, {value: number}>;
```

`ShaderInputs.setProps()` calls `getUniforms()` and separates ordinary values from resource bindings.

## Add a hook[​](#add-a-hook "Direct link to Add a hook")

```
const assembler = ShaderAssembler.getDefaultShaderAssembler('wgsl');

assembler.addShaderHook(

  'fs:FILTER_COLOR(color: ptr<function, vec4<f32>>)'

);
```

The application shader calls `FILTER_COLOR(&color)`. With no contributors, the generated hook is a no-op.

## Inject source[​](#inject-source "Direct link to Inject source")

```
const fade = {

  name: 'fade',

  inject: {

    'fs:FILTER_COLOR': '(*color).a *= 0.5;'

  }

};
```

Prefer semantic hooks for supported extension contracts; use raw source anchors sparingly.

## Compose dependencies[​](#compose-dependencies "Direct link to Compose dependencies")

```
const lighting = {

  name: 'lighting',

  dependencies: [math],

  source: 'fn shade(color: vec3f) -> vec3f { return saturate(color); }'

};
```

Pass only direct dependencies. The assembler orders and de-duplicates the transitive graph.

## Create a plugin[​](#create-a-plugin "Direct link to Create a plugin")

```
const tintPlugin: ShaderPlugin = {

  name: 'tint-plugin',

  modules: [tint],

  wgsl: {injections: [{target: 'fs:#main-end', injection: 'color *= tint.color;'}]},

  glsl: {injections: [{target: 'fs:#main-end', injection: 'color *= tint.color;'}]}

};
```

Attach it with `new Model(device, {...props, plugins: [tintPlugin]})`.

## Author a pass[​](#author-a-pass "Direct link to Author a pass")

```
const vignette = {

  name: 'vignette',

  source: vignetteWGSL,

  fs: vignetteGLSL,

  uniformTypes: {amount: 'f32'},

  passes: [{sampler: true}]

} as const satisfies ShaderPass<{amount: number}>;
```

Execute it with Engine’s `ShaderPassRenderer`. Each subpass is a draw and may need an intermediate texture.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Shader programming guide](https://luma.gl/next/docs/api-guide/shaders.md)
* [Shader assembly](https://luma.gl/next/docs/api-guide/shaders/shader-assembly.md)
* [Writing customizable shaders](https://luma.gl/next/docs/api-guide/shaders/writing-customizable-shaders.md)
* [`ShaderModule`](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md)
