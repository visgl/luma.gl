import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Shader Modules

<ShaderLevelDocsTabs active="shader-modules" />

Shader modules package reusable shader functionality so applications can share
WGSL and GLSL snippets across models instead of copying the same functions,
uniform blocks, bindings, and injections into every shader. luma.gl provides
this system through `@luma.gl/shadertools`, whose shader assembler fills the
module/import gap in GLSL and WGSL by composing module source into the final
shader program.

A module can be as small as one reusable helper function or as large as a
lighting/material feature with uniform props, bindings, dependencies, and hook
injections. The built-in `lighting` and `phongMaterial` modules are examples of
larger modules; the [Shader Modules tutorial](/docs/tutorials/shader-modules)
shows a compact custom color module shared by two models.

## Attaching Modules

Pass shader modules to `Model` or directly to `ShaderAssembler`. The assembler
resolves dependencies, prepends module source, applies injections, and returns
assembled shader source plus the combined uniform mapping.

```typescript
const model = new Model(device, {
  source: wgslSource,
  vs: glslVertexSource,
  fs: glslFragmentSource,
  modules: [color]
});
```

For assembled WGSL, prefer `@binding(auto)` in application and module source so
JavaScript can bind resources by name while shadertools assigns concrete binding
numbers before WebGPU compilation. GLSL/WebGL continues to use luma.gl's logical
binding and layout metadata.

## Authoring Modules

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

Use `source` for WGSL, `vs` and `fs` for GLSL stage source, or both when the
module supports both backends. `uniformTypes` declares shader-facing layouts;
`getUniforms` maps application props to the uniforms and bindings consumed by
the shader; `dependencies` brings in other modules first; and `inject` targets
hooks or named injection points when the module needs to modify base shader
flow.

The simplest modules only add generic global functions. More complex modules
define shader chunks, uniform blocks, bindings, and injections that cooperate
with the application's base shader.

For details, see the [`ShaderModule`](/docs/api-reference/shadertools/shader-module)
type reference page. For hook-based customization, see
[Shader Hooks](/docs/api-guide/shaders/shader-hooks). For the uniform descriptor
syntax used by `uniformTypes`, including structs, fixed-size arrays, and
TypeScript inference, see [Core Shader Types](/docs/api-reference/core/shader-types).

For current WGSL-specific assembly and binding-relocation rules, see
[`WGSL Support`](/docs/api-reference/shadertools/wgsl-support). For a larger
module composition example, see the [Lighting tutorial](/docs/tutorials/lighting).
