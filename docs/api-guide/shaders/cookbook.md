import {ShadertoolsDocsTabs} from '@site/src/components/docs/shadertools-docs-tabs';

# Shadertools cookbook

<ShadertoolsDocsTabs group="starting" active="shadertools-cookbook" />

These snippets show the smallest useful descriptor or assembly action. Add both WGSL and GLSL
source when the feature must run on both backends.

| Goal | Use | Result |
| --- | --- | --- |
| Package reusable shader behavior | `ShaderModule` | Source plus typed configuration |
| Convert props to shader values | `uniformTypes` and `getUniforms()` | Uniforms and bindings for `ShaderInputs` |
| Declare an extension point | `addShaderHook()` | A stable callable hook |
| Extend a shader | `inject` | Ordered code at a supported target |
| Share lower-level behavior | `dependencies` | De-duplicated module ordering |
| Package optional behavior | `ShaderPlugin` | Modules, inputs, defines, and injections |
| Define an image operation | `ShaderPass` | A reusable fullscreen stage |

## Author a module

```ts
const tint = {
  name: 'tint',
  source: 'struct Tint { color: vec4f }; @group(0) @binding(auto) var<uniform> tint: Tint;',
  uniformTypes: {color: 'vec4<f32>'}
} as const satisfies ShaderModule<{color: [number, number, number, number]}>;
```

Keep the name stable and supply a GLSL path too when WebGL 2 is supported.

## Expose props and bindings

```ts
const exposure = {
  name: 'exposure',
  uniformTypes: {value: 'f32'},
  getUniforms: ({stops = 0}) => ({value: 2 ** stops})
} as const satisfies ShaderModule<{stops?: number}, {value: number}>;
```

`ShaderInputs.setProps()` calls `getUniforms()` and separates ordinary values from resource bindings.

## Add a hook

```ts
const assembler = ShaderAssembler.getDefaultShaderAssembler('wgsl');
assembler.addShaderHook(
  'fs:FILTER_COLOR(color: ptr<function, vec4<f32>>)'
);
```

The application shader calls `FILTER_COLOR(&color)`. With no contributors, the generated hook is a no-op.

## Inject source

```ts
const fade = {
  name: 'fade',
  inject: {
    'fs:FILTER_COLOR': '(*color).a *= 0.5;'
  }
};
```

Prefer semantic hooks for supported extension contracts; use raw source anchors sparingly.

## Compose dependencies

```ts
const lighting = {
  name: 'lighting',
  dependencies: [math],
  source: 'fn shade(color: vec3f) -> vec3f { return saturate(color); }'
};
```

Pass only direct dependencies. The assembler orders and de-duplicates the transitive graph.

## Create a plugin

```ts
const tintPlugin: ShaderPlugin = {
  name: 'tint-plugin',
  modules: [tint],
  wgsl: {injections: [{target: 'fs:#main-end', injection: 'color *= tint.color;'}]},
  glsl: {injections: [{target: 'fs:#main-end', injection: 'color *= tint.color;'}]}
};
```

Attach it with `new Model(device, {...props, plugins: [tintPlugin]})`.

## Author a pass

```ts
const vignette = {
  name: 'vignette',
  source: vignetteWGSL,
  fs: vignetteGLSL,
  uniformTypes: {amount: 'f32'},
  passes: [{sampler: true}]
} as const satisfies ShaderPass<{amount: number}>;
```

Execute it with Engine’s `ShaderPassRenderer`. Each subpass is a draw and may need an intermediate texture.

## Related pages

- [Shader programming guide](./)
- [Shader assembly](./shader-assembly)
- [Writing customizable shaders](./writing-customizable-shaders)
- [`ShaderModule`](/docs/api-reference/shadertools/shader-module)
