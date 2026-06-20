import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Writing Portable Shaders

<ShaderLevelDocsTabs active="writing-portable-shaders" />

luma.gl does not transpile an application shader from WGSL to GLSL or from GLSL
to WGSL. A rendering feature that must run on WebGPU and WebGL 2 normally keeps
matching shader implementations for both languages and gives them the same
application-facing inputs.

## Backend Shape

| Backend | Source passed to luma.gl | Entry-point shape | Binding guidance |
| --- | --- | --- | --- |
| WebGPU | One WGSL `source` string. | The source contains the entry points needed by the render or compute pipeline. | For WGSL assembled through `Model`, `Computation`, or `ShaderAssembler`, prefer named `@binding(auto)` declarations. |
| WebGL 2 | GLSL ES 3.00 `vs` and `fs` strings. | Vertex and fragment stages are separate source strings. | Use luma.gl binding and shader-layout metadata; WebGL has no native bind groups. |

`Model` accepts both render-path forms. `Computation` is WebGPU-only and accepts
WGSL compute source.

## Keep The Public Shader Contract Stable

A portable shader pair is easier to maintain when both backend sources expose
the same logical contract:

| Contract | Keep aligned |
| --- | --- |
| Attributes | Attribute names, formats, and buffer layout expected by the model. |
| Varyings | Values passed from vertex to fragment stage. |
| Module props | `ShaderModule.uniformTypes`, `defaultUniforms`, and `getUniforms()` output. |
| Bindings | Resource names passed from JavaScript, even when WGSL and GLSL syntax differs. |
| Plugins | Shared plugin behavior and shader-facing vertex input names, with `glsl` and `wgsl` variants only where syntax differs. |

Do not make the shader language difference leak into application props unless
the feature is genuinely backend-specific. Prefer one JavaScript prop model and
two shader implementations.

## WGSL Binding Rule

WGSL used through shadertools should usually declare named resources with
`@binding(auto)`:

```wgsl
@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var colorTexture: texture_2d<f32>;
@group(0) @binding(auto) var colorTextureSampler: sampler;
```

Then bind by resource name:

```ts
model.setBindings({
  app: uniformBuffer,
  colorTexture: texture
});
```

The assembler assigns concrete WGSL binding numbers before WebGPU reflects and
compiles the shader. Raw low-level WebGPU shader creation that bypasses
shadertools still needs ordinary numeric WGSL bindings.

## Portable Modules And Plugins

A portable `ShaderModule` may provide `source` for WGSL, `vs` and `fs` for GLSL,
or all three. A portable `ShaderPlugin` can keep backend-neutral modules and
defines at the top level while placing language-specific injection source under
`glsl` and `wgsl`. If a plugin declares `vertexInputs`, keep those shader-facing
names and types aligned with the caller-owned buffer layout and attribute data.

Use defines for real source variants, not as a substitute for two clear shader
implementations. WGSL conditionals are preprocessed by luma.gl before binding
assignment, so inactive resource declarations do not consume binding slots.

## Verification Checklist

- Run the feature through the WebGPU and WebGL 2 device tabs when both are
  supported.
- Keep assembled WGSL binding debug output readable when bindings are involved.
- Keep module uniform descriptors aligned with the shader declarations.
- Use shader plugins when a reusable behavior needs different GLSL and WGSL
  source but one application-facing attachment point.

For exact WGSL rules, see [`WGSL Support`](/docs/api-reference/shadertools/wgsl-support).
For render model props, see [`Model`](/docs/api-reference/engine/model). For a
working dual-backend example, see the
[Shader Plugins tutorial](/docs/tutorials/shader-plugins).
