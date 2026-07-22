import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';
import {PostprocessingExample} from '@site/src/examples';

# Shader Passes

<ShaderLevelDocsTabs active="shader-passes" />

A shader pass is a shader module that can run as a fullscreen texture-processing
stage. The pass descriptor lives in `@luma.gl/shadertools`; the renderer that
executes pass chains lives in `@luma.gl/engine` as `ShaderPassRenderer`.

Choose an effect and adjust its parameters to see a shader pass update the source texture live:

<PostprocessingExample embedded showStats={false} />

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

## Composable Scene Render Stack

The advanced-effects path has three separate responsibilities:

1. Application geometry produces one scene color texture plus semantic surface attachments.
2. `ShaderPassRenderer` orders fullscreen effects and owns their internal named and temporal
   targets.
3. The application presents the final texture, or passes it to another explicit workflow such as
   transparency capture and resolve.

On WebGPU, experimental [`GBuffer`](/docs/api-reference/experimental/g-buffer) packages the common
surface attachments without owning scene traversal or material shading. Multiple render targets
(MRT) means one fragment shader writes several color attachments in the same render pass:

| Render-stack value | Producer | Consumers |
| --- | --- | --- |
| `sourceTexture` | `GBuffer.colorTexture` | Every shader pass through `previous` or `original`. |
| `depthTexture` | `GBuffer.depthTexture` | DOF, depth-aware blur, SSAO, GTAO, SSR, outlines, contact shadows, TAA, motion blur, fog. |
| `normalTexture` | `GBuffer.normalRoughnessTexture` | SSAO, GTAO, SSR, normal-aware outlines, contact-shadow filtering. |
| `velocityTexture` | `GBuffer.velocityTexture` | GTAO temporal reprojection, TAA, and motion blur. |
| named extras | `GBuffer.getExtraColorTexture(name)` | Application-specific material, debug, lighting, or resolve passes. |

```ts
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  createMotionBlurShaderPassPipeline,
  createGTAOShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline
} from '@luma.gl/effects';
import {GBuffer} from '@luma.gl/experimental';

const gBuffer = new GBuffer(device, {width, height});

// Geometry shaders write color, normalRoughness, and velocity in one MRT render pass.
const scenePass = device.beginRenderPass({
  framebuffer: gBuffer.framebuffer,
  clearColors: [
    new Float32Array([0, 0, 0, 1]),
    new Float32Array([0.5, 0.5, 1, 1]),
    new Float32Array([0, 0, 0, 0])
  ],
  clearDepth: 1
});
sceneModel.draw(scenePass);
scenePass.end();

const effects = new ShaderPassRenderer(device, {
  shaderPasses: [
    createGTAOShaderPassPipeline(),
    createSSRShaderPassPipeline(),
    createTAAShaderPassPipeline(),
    createMotionBlurShaderPassPipeline()
  ]
});

effects.renderToScreen({
  sourceTexture: gBuffer.colorTexture,
  bindings: gBuffer.getShaderPassBindings()
});
```

`GBuffer` is intentionally a target and binding contract, not a scene renderer. Experimental
[`deferredLighting`](/docs/api-reference/experimental/deferred-lighting) consumes two named material
extras plus depth and normal-roughness, reconstructs view position, and writes a Cook-Torrance
lighting result into the same ordered color chain:

```ts
const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [
    createDeferredLightingShaderPassPipeline(),
    createGTAOShaderPassPipeline(),
    createSSRShaderPassPipeline(),
    createTAAShaderPassPipeline()
  ]
});
```

More specialized clustered-lighting or visibility-buffer workflows can replace the first resolve
while preserving the same effect-facing depth, normal, velocity, and scene-color contract.

### Recommended ordering

| Phase | Typical work | Why |
| --- | --- | --- |
| Geometry and opaque surface capture | MRT scene color, normal-roughness, velocity, depth, material extras | Establish one coherent surface snapshot. |
| Opaque lighting resolve | Deferred PBR lighting, contact shadows, other direct-light corrections | These still need unwarped depth, normals, and material terms. |
| Surface effects | SSAO, GTAO, SSR, fog, outlines, depth-aware blur | These consume the original semantic attachments. |
| Transparency resolve | WBOIT or A-buffer resolve pipeline | Resolve translucent geometry before temporal accumulation when it should participate in TAA. |
| Temporal effects | TAA, then motion blur | Reproject the composed image before display-space processing. |
| Display effects | Bloom, color adjustment, vignette, tone mapping | These operate on final color and usually do not need scene attachments. |

This is a default, not a hard rule. A debug view may intentionally bypass earlier color processing
through `original`, and a stylized stack may place display-space effects earlier.

### Temporal history and resize

Pass pipelines with persistent history targets keep those textures inside `ShaderPassRenderer`.
Call `renderer.resetHistory()` after a camera cut, a discontinuous animation jump, or a semantic
change in the G-buffer. When the drawing size changes, call both `gBuffer.resize()` and
`renderer.resize()`; resizing invalidates history because old pixels no longer describe the same
screen locations.

### Transparency composition

Opaque geometry should populate the G-buffer first. [`WBOITRenderer`](/docs/api-reference/experimental/wboit-renderer)
and [`ABufferRenderer`](/docs/api-reference/experimental/a-buffer-renderer) keep transparent geometry
capture separate, then expose resolve as ordinary `ShaderPassPipeline` steps. Put the chosen
resolve pipeline into the same ordered `shaderPasses` array so transparency participates in later
effects without creating a second postprocessing system.

The [Advanced Effects example](/examples/experimental/advanced-effects) shows the full MRT surface
pass feeding shadows, SSAO, SSR, fog, outlines, TAA, motion blur, and debug views.

The [Deferred Material Lab](/examples/experimental/deferred-rendering) shows the opaque phase and
its first screen-space consumer: one five-target geometry pass, depth reconstruction, clustered
directional/point lighting, temporally stabilized GTAO, tone mapping, and direct G-buffer/AO debug
views.

## When To Use Shader Passes

- Postprocessing color, blur, bloom, depth-of-field, and temporal effects.
- Fullscreen effects whose inputs and outputs are textures.
- Reusable effects that should be configured as shader modules but executed by
  an engine-owned pass renderer.

For FXAA, TAA, and the ordering between resolved render targets and postprocessing, see
[Antialiasing and Multisampling](/docs/api-guide/gpu/gpu-antialiasing).

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
