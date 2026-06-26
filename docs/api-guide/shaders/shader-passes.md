import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Shader Passes

<ShaderLevelDocsTabs active="shader-passes" />

A shader pass is a shader module that can run as a fullscreen texture-processing
stage. The pass descriptor lives in `@luma.gl/shadertools`; the renderer that
executes pass chains lives in `@luma.gl/engine` as `ShaderPassRenderer`.

## Components

| Component | Role |
| --- | --- |
| [`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer) | Owns the fullscreen draw path, swap framebuffers, named targets, shader inputs, and presentation step. |
| [`ShaderPassPipeline`](/docs/api-reference/shadertools/shader-pass#shaderpasspipeline) | Chains existing passes with named intermediate render targets. |
| [`ShaderPass`](/docs/api-reference/shadertools/shader-pass) | Describes one standalone texture-processing effect and its optional subpasses. |
| [`ShaderSubPass`](/docs/api-reference/shadertools/shader-pass#shadersubpass) | Describes one draw inside a pass, including source routing, output routing, and subpass uniforms. |

Use a plain `ShaderPass` when each stage only needs the original input texture
or the previous result. Use a `ShaderPassPipeline` when later steps need named
intermediate textures such as an extracted highlight texture and its blurred
version.

## Execution Model

`ShaderPassRenderer` receives a source texture, runs each pass or pipeline step,
and either returns the final texture or presents it to the current framebuffer.
It always exposes two logical texture sources:

| Source | Meaning |
| --- | --- |
| `original` | The texture passed to `renderToTexture()` or `renderToScreen()`. |
| `previous` | The current output in the shared pass chain. |

Pipelines may add named render targets. The renderer validates routing, manages
their size, and prevents a subpass from reading and writing the same named
target in one draw.

Built-in effects consume `previous`, so the `shaderPasses` array has strict
ordered-composition semantics even when it mixes plain `ShaderPass` objects and
multi-step `ShaderPassPipeline` objects. Route an input from `original` only
when an effect intentionally needs to bypass all preceding color processing.

Scene-aware effects may also sample application-owned depth, normal, or velocity
attachments. Color adjustments can be placed anywhere in the chain, but an
effect that warps screen coordinates should run after scene-aware effects unless
the application applies the same transform to those auxiliary attachments.

## When To Use Shader Passes

- Postprocessing color, blur, bloom, depth-of-field, and temporal effects.
- Fullscreen effects whose inputs and outputs are textures.
- Reusable effects that should be configured as shader modules but executed by
  an engine-owned pass renderer.

Do not use shader passes for ordinary geometry shading. Use `Model` with
modules or plugins when the shader participates in a model's vertex and
fragment pipeline.

## Minimal Shape

```typescript
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass, myShaderPassPipeline]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

For descriptor fields, see [`ShaderPass`](/docs/api-reference/shadertools/shader-pass).
For execution methods and routing details, see
[`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer).
The current built-in effect catalog is under
[Shader Pass Catalog](/docs/api-reference/shadertools/shader-passes/image-processing).
