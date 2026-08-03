# Shader Passes

[Overview](https://luma.gl/next/docs/api-guide/shaders.md)[Shader Assembly](https://luma.gl/next/docs/api-guide/shaders/shader-assembly.md)[Customizable Shaders](https://luma.gl/next/docs/api-guide/shaders/writing-customizable-shaders.md)[Portable Shaders](https://luma.gl/next/docs/api-guide/shaders/writing-portable-shaders.md)[GPU Precision](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md)[Shader Passes](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md)[Rendering Techniques](https://luma.gl/next/docs/api-guide/shaders/rendering-techniques.md)[Transparency](https://luma.gl/next/docs/api-guide/shaders/transparency.md)[Glass Effects](https://luma.gl/next/docs/api-guide/shaders/glass-effects.md)

A shader pass is a shader module that can run as a fullscreen texture-processing stage. The pass descriptor lives in `@luma.gl/shadertools`; the renderer that executes pass chains lives in `@luma.gl/engine` as `ShaderPassRenderer`.

Choose an effect and adjust its parameters to see a shader pass update the source texture live:

### Postprocessing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

## Components[​](#components "Direct link to Components")

| Component                                                                                                          | Role                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md)         | Owns the fullscreen draw path, swap framebuffers, named targets, shader inputs, and presentation step. |
| [`ShaderPassPipeline`](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md#shaderpasspipeline) | Chains existing passes with named intermediate render targets.                                         |
| [`ShaderPass`](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md)                            | Describes one standalone texture-processing effect and its optional subpasses.                         |
| [`ShaderSubPass`](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md#shadersubpass)           | Describes one draw inside a pass, including source routing, output routing, and subpass uniforms.      |

Use a plain `ShaderPass` when each stage only needs the original input texture or the previous result. Use a `ShaderPassPipeline` when later steps need named intermediate textures such as an extracted highlight texture and its blurred version.

## Execution Model[​](#execution-model "Direct link to Execution Model")

`ShaderPassRenderer` receives a source texture, runs each pass or pipeline step, and either returns the final texture or presents it to the current framebuffer. It always exposes two logical texture sources:

| Source     | Meaning                                                          |
| ---------- | ---------------------------------------------------------------- |
| `original` | The texture passed to `renderToTexture()` or `renderToScreen()`. |
| `previous` | The current output in the shared pass chain.                     |

Pipelines may add named render targets. The renderer validates routing, manages their size, and prevents a subpass from reading and writing the same named target in one draw.

Built-in effects consume `previous`, so the `shaderPasses` array has strict ordered-composition semantics even when it mixes plain `ShaderPass` objects and multi-step `ShaderPassPipeline` objects. Route an input from `original` only when an effect intentionally needs to bypass all preceding color processing.

Scene-aware effects may also sample application-owned depth, normal, or velocity attachments. Color adjustments can be placed anywhere in the chain, but an effect that warps screen coordinates should run after scene-aware effects unless the application applies the same transform to those auxiliary attachments.

## Composable Scene Render Stack[​](#composable-scene-render-stack "Direct link to Composable Scene Render Stack")

The advanced-effects path has three separate responsibilities:

1. Application geometry produces one scene color texture plus semantic surface attachments.
2. `ShaderPassRenderer` orders fullscreen effects and owns their internal named and temporal targets.
3. The application presents the final texture, or passes it to another explicit workflow such as transparency capture and resolve.

On WebGPU, experimental [`GBuffer`](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md) packages the common surface attachments without owning scene traversal or material shading. Multiple render targets (MRT) means one fragment shader writes several color attachments in the same render pass:

| Render-stack value | Producer                             | Consumers                                                                                                                      |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `sourceTexture`    | `GBuffer.colorTexture`               | Every shader pass through `previous` or `original`.                                                                            |
| `depthTexture`     | `GBuffer.depthTexture`               | DOF, depth-aware blur, SSAO, GTAO, SSGI, SSR, outlines, contact shadows, TAA, motion blur, fog, clustered volumetric lighting. |
| `normalTexture`    | `GBuffer.normalRoughnessTexture`     | SSAO, GTAO, SSGI, SSR, normal-aware outlines, contact-shadow filtering.                                                        |
| `velocityTexture`  | `GBuffer.velocityTexture`            | GTAO/SSGI/SSR/volumetric temporal reprojection, TAA, and motion blur.                                                          |
| named extras       | `GBuffer.getExtraColorTexture(name)` | Application-specific material, debug, lighting, or resolve passes.                                                             |

```
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  createBloomShaderPassPipeline,
  createMotionBlurShaderPassPipeline,
  createGTAOShaderPassPipeline,
  createHDRAutoExposureShaderPassPipeline,
  createSSGIShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline,
  toneMapping
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
  colorFormat: 'rgba16float',
  shaderPasses: [
    createGTAOShaderPassPipeline(),
    createSSGIShaderPassPipeline(),
    createSSRShaderPassPipeline(),
    createTAAShaderPassPipeline(),
    createMotionBlurShaderPassPipeline(),
    createHDRAutoExposureShaderPassPipeline(),
    createBloomShaderPassPipeline(),
    toneMapping
  ]
});

effects.renderToScreen({
  sourceTexture: gBuffer.colorTexture,
  bindings: gBuffer.getShaderPassBindings()
});
```

`GBuffer` is intentionally a target and binding contract, not a scene renderer. Experimental [`deferredLighting`](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md) consumes two named material extras plus depth and normal-roughness, reconstructs view position, and writes a Cook-Torrance lighting result into the same ordered color chain:

```
const renderer = new ShaderPassRenderer(device, {
  colorFormat: 'rgba16float',
  shaderPasses: [
    createDeferredLightingShaderPassPipeline(),
    createGTAOShaderPassPipeline(),
    createSSGIShaderPassPipeline(),
    createSSRShaderPassPipeline(),
    createTAAShaderPassPipeline(),
    createHDRAutoExposureShaderPassPipeline(),
    createBloomShaderPassPipeline(),
    toneMapping
  ]
});
```

More specialized clustered-lighting or visibility-buffer workflows can replace the first resolve while preserving the same effect-facing depth, normal, velocity, and scene-color contract.

GTAO defaults to its backward-compatible full-color composite. Deferred applications that can isolate ambient light should request the physically accurate ambient-only mode instead:

```
import {createGTAOShaderPassPipeline} from '@luma.gl/effects';
import {createDeferredAmbientLightingShaderPassPipeline} from '@luma.gl/experimental';

const ambientRenderer = new ShaderPassRenderer(device, {
  shaderPasses: [createDeferredAmbientLightingShaderPassPipeline()]
});
const ambientLightingTexture = ambientRenderer.renderToTexture({
  sourceTexture: gBuffer.colorTexture,
  bindings: {
    depthTexture: gBuffer.depthTexture,
    baseColorMetallicTexture: gBuffer.getExtraColorTexture('baseColorMetallic'),
    emissiveOcclusionTexture: gBuffer.getExtraColorTexture('emissiveOcclusion')
  },
  uniforms: {deferredAmbientLighting: {ambientColor: [0.04, 0.04, 0.05]}}
});

const effects = new ShaderPassRenderer(device, {
  shaderPasses: [
    createDeferredLightingShaderPassPipeline(),
    createGTAOShaderPassPipeline({composition: 'ambient-only'})
  ]
});

effects.renderToScreen({
  sourceTexture: gBuffer.colorTexture,
  bindings: {...gBuffer.getShaderPassBindings(), ambientLightingTexture}
});
```

Ambient-only composition subtracts `ambientLightingTexture * (1 - visibility)` from the lit scene. Direct light, material emission, and alpha therefore remain unchanged. The separate ambient texture is an explicit application-owned integration boundary; the effect does not depend on hidden cross-pipeline render targets.

For side-by-side choices between reflections, ambient occlusion, light assignment, shadows, transparency, blur, and temporal effects, see [Rendering Techniques and Tradeoffs](https://luma.gl/next/docs/api-guide/shaders/rendering-techniques.md).

### Screen-space diffuse global illumination[​](#screen-space-diffuse-global-illumination "Direct link to Screen-space diffuse global illumination")

`createSSGIShaderPassPipeline()` gathers already-lit scene radiance from the hemisphere above each visible surface. Its stages mirror the reusable temporal render-stack contract:

1. Trace cosine-weighted hemisphere rays through the shared scene depth and view normals.
2. Reproject indirect-radiance history with velocity and reject perspective-correct depth disocclusions.
3. Save current depth for the next-frame history comparison.
4. Denoise diffuse bounce horizontally while preserving depth and normal edges.
5. Repeat the bilateral denoising vertically.
6. Add stabilized colored bounce to `previous`, or expose indirect-radiance/confidence debug views.

SSGI adds diffuse energy; GTAO removes unavailable ambient energy, while SSR adds directional specular reflection. They are complementary effects rather than interchangeable copies. Place SSGI after the direct-light/GTAO resolve and before SSR when mirror reflections should include the newly bounced illumination.

### Screen-space reflection composition[​](#screen-space-reflection-composition "Direct link to Screen-space reflection composition")

`createSSRShaderPassPipeline()` consumes the already-lit `previous` color plus the shared depth, normal/roughness, and velocity attachments. Its six explicit stages demonstrate how a complex effect remains one composable pipeline:

1. Trace stochastic, roughness-aware reflection rays against the G-buffer depth at configurable resolution, defaulting to full resolution.
2. Reproject persistent reflection history with screen-space velocity and reject depth disocclusions.
3. Save current depth into the reflection history target for the next frame.
4. Denoise reflection radiance horizontally using roughness, scene depth, and normals.
5. Repeat the depth/normal-aware denoising vertically.
6. Composite the stabilized HDR reflection into `previous`, or expose reflection/confidence debug views.

Mirror-like materials retain narrow highlights, while rough surfaces accumulate wider glossy lobes. Because tracing samples existing scene color, its cost depends on visible pixels and ray steps instead of drawing every reflected object again. Off-screen geometry cannot contribute; screen-edge confidence fades reduce the resulting discontinuities.

### Clustered volumetric lighting[​](#clustered-volumetric-lighting "Direct link to Clustered volumetric lighting")

`createClusteredVolumetricLightingShaderPassPipeline()` turns the same clustered point-light storage buffers used by deferred shading into actual participating-media illumination:

1. March configurable-resolution view rays through exponential world-height density.
2. Integrate a best-scoring bounded set from the compute-retained cluster candidates plus directional light using an anisotropic phase function; work never falls back to scanning every active light per ray step.
3. Trace radial screen-depth visibility toward a configurable sun position to produce recognizable, depth-occluded crepuscular god rays.
4. Reproject empty-space atmospheric history with current/previous camera transforms, apply G-buffer velocity to opaque surfaces, and reject linear-depth disocclusions.
5. Capture compact current linear depth for the next frame.
6. Denoise the radiance/transmittance result with separable depth-aware blur.
7. Composite Beer-Lambert extinction and in-scattered light, or expose volume/transmittance diagnostics.

This is the higher-fidelity alternative to `createVolumetricFogShaderPassPipeline()`, whose compact height fog does not evaluate the real scene-light storage buffers. Both remain composable ordered pipelines; normally choose one atmospheric implementation rather than stacking both.

Unlike the generic `GBuffer` examples above, clustered volumetric lighting requires more than `gBuffer.getShaderPassBindings()`. Encode a `ClusteredLightGrid` for the current point-light buffer each frame, add `pointLights`, `clusteredLightGrid.getShaderPassBindings()`, depth, and velocity to the renderer bindings, and merge `clusteredLightGrid.getShaderPassUniforms(nearPlane, farPlane)` into the `clusteredVolumetricTrace` uniforms alongside its camera, media, and light settings. Provide `inverseViewProjectionMatrix` and `previousViewProjectionMatrix` to `clusteredVolumetricTemporal`, plus `inverseProjectionMatrix` to both the temporal and linear-depth history-copy stages. See the [`ClusteredLightGrid` usage guide](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md) for the buffer setup and encode sequence.

SSAO, GTAO, screen-space global illumination, reflections, and clustered volumetric lighting default to full-resolution intermediate framebuffers. Pass `resolutionScale: 0.5`, for example, to explicitly trade edge quality for fewer shaded pixels and smaller history textures.

### Adaptive HDR exposure and cinematic bloom[​](#adaptive-hdr-exposure-and-cinematic-bloom "Direct link to Adaptive HDR exposure and cinematic bloom")

`createHDRAutoExposureShaderPassPipeline()` meters and adapts scene brightness entirely on the GPU:

1. Extract center-weighted logarithmic luminance from floating-point scene color.
2. Reduce four successively smaller luminance-pyramid levels into a near-global geometric mean.
3. Adapt persistent exposure history with independent brightening and darkening response rates.
4. Apply the adapted exposure to HDR scene color or visualize luminance as a false-color heat map.

Pair it with `createBloomShaderPassPipeline()`, which extracts HDR highlights at half resolution, then successively filters and blurs them at quarter and eighth resolution using `rgba16float` intermediate targets. Its optional `resolutionScale` controls the entire pyramid without clamping highlight radiance to 8-bit normalized color. Use the exact HDR order: temporal effects, auto exposure, bloom, then tone mapping.

### Recommended ordering[​](#recommended-ordering "Direct link to Recommended ordering")

| Phase                               | Typical work                                                           | Why                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Geometry and opaque surface capture | MRT scene color, normal-roughness, velocity, depth, material extras    | Establish one coherent surface snapshot.                                                     |
| Opaque lighting resolve             | Deferred PBR lighting, contact shadows, other direct-light corrections | These still need unwarped depth, normals, and material terms.                                |
| Surface effects                     | SSAO/GTAO, SSGI, SSR, outlines, depth-aware blur                       | These consume the original semantic attachments.                                             |
| Participating media                 | Height fog or clustered volumetric lighting                            | Composite extinction and in-scattering over completed opaque light transport.                |
| Transparency resolve                | WBOIT or A-buffer resolve pipeline                                     | Resolve translucent geometry before temporal accumulation when it should participate in TAA. |
| Temporal effects                    | TAA, then motion blur                                                  | Reproject the composed image before display-space processing.                                |
| Display effects                     | Auto exposure, bloom, color adjustment, vignette, tone mapping         | These operate on final color and usually do not need scene attachments.                      |

This is a default, not a hard rule. A debug view may intentionally bypass earlier color processing through `original`, and a stylized stack may place display-space effects earlier.

### Temporal history and resize[​](#temporal-history-and-resize "Direct link to Temporal history and resize")

Pass pipelines with persistent history targets keep those textures inside `ShaderPassRenderer`. Call `renderer.resetHistory()` after a camera cut, a discontinuous animation jump, or a semantic change in the G-buffer. When the drawing size changes, call both `gBuffer.resize()` and `renderer.resize()`; resizing invalidates history because old pixels no longer describe the same screen locations.

### Transparency composition[​](#transparency-composition "Direct link to Transparency composition")

Opaque geometry should populate the G-buffer first. [`WBOITRenderer`](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md) and [`ABufferRenderer`](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md) keep transparent geometry capture separate, then expose resolve as ordinary `ShaderPassPipeline` steps. Put the chosen resolve pipeline into the same ordered `shaderPasses` array so transparency participates in later effects without creating a second postprocessing system.

The [Advanced Effects example](https://luma.gl/next/examples/experimental/advanced-effects) shows the full MRT surface pass feeding shadows, SSAO, SSR, fog, outlines, TAA, motion blur, and debug views.

The [Deferred Illumination Lab](https://luma.gl/next/examples/experimental/deferred-rendering) shows one five-target geometry pass feeding clustered directional/point lighting, temporally stabilized GTAO, diffuse screen-space global illumination, roughness-aware screen-space reflections, clustered volumetric lighting, adaptive exposure, HDR bloom, tone mapping, and direct G-buffer/AO/bounce/reflection/volume debug views.

## When To Use Shader Passes[​](#when-to-use-shader-passes "Direct link to When To Use Shader Passes")

* Postprocessing color, blur, bloom, depth-of-field, and temporal effects.
* Fullscreen effects whose inputs and outputs are textures.
* Reusable effects that should be configured as shader modules but executed by an engine-owned pass renderer.

For FXAA, TAA, and the ordering between resolved render targets and postprocessing, see [Antialiasing and Multisampling](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md).

Do not use shader passes for ordinary geometry shading. Use `Model` with modules or plugins when the shader participates in a model's vertex and fragment pipeline.

## Minimal Shape[​](#minimal-shape "Direct link to Minimal Shape")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [myShaderPass, myShaderPassPipeline]
});

const outputTexture = renderer.renderToTexture({sourceTexture});
```

For descriptor fields, see [`ShaderPass`](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md). For execution methods and routing details, see [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md). The current built-in effect catalog is under [Shader Pass Catalog](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/image-processing.md).
