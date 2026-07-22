import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Rendering Techniques and Tradeoffs

<ShaderLevelDocsTabs active="rendering-techniques" />

luma.gl deliberately provides several approaches to similar visual problems. A cheap effect,
a higher-quality effect, a material shader, and a scene-aware fullscreen pipeline are not
interchangeable just because they all produce reflections, shadows, blur, or ambient occlusion.

Choose the technique by identifying which data it needs, what information it cannot see, and
whether its cost scales with scene geometry, visible pixels, light count, or temporal history.

## Quick Selection

| Goal | Start with | Upgrade when | Important constraint |
| --- | --- | --- | --- |
| Stable environment reflections | `pbrMaterial` with `ibl` and `loadPBREnvironment()` | Add screen-space reflections for nearby animated scene detail. | Environment maps do not automatically capture the current local scene. |
| Dynamic reflections of visible geometry | `createSSRShaderPassPipeline()` | Increase tracing resolution, ray samples, and temporal history quality. | Screen-space rays cannot reflect geometry outside the current depth/color buffers. |
| Colored light bouncing between visible surfaces | `createSSGIShaderPassPipeline()` | Increase hemisphere rays, ray steps, tracing radius, and temporal quality. | Indirect light is limited to visible scene radiance and is not full-scene ray tracing. |
| Low-cost contact darkening | `createSSAOShaderPassPipeline()` | Switch to GTAO when contact quality and temporal stability matter. | Use SSAO **or** GTAO; stacking both normally double-darkens surfaces. |
| Higher-quality ambient visibility | `createGTAOShaderPassPipeline()` | Tune radius, history, and denoising for the scene scale. | Requires coherent depth, view normals, velocity, and projection matrices. |
| A modest number of local lights | `createDeferredLightingShaderPassPipeline()` | Switch to clustered lighting when many lights overlap the scene. | The baseline shader supports at most 64 point lights. |
| Hundreds of local lights | `ClusteredLightGrid` plus `createClusteredDeferredLightingShaderPassPipeline()` | Tune grid dimensions, light ranges, and per-cluster capacity. | Overflow stays correct but can fall back to a more expensive full light scan. |
| Inexpensive atmospheric depth | `createVolumetricFogShaderPassPipeline()` | Upgrade to clustered volumetric lighting when visible local lights or shafts matter. | Simple height fog does not evaluate the scene's actual point-light list. |
| Colored light halos and crepuscular god rays | `createClusteredVolumetricLightingShaderPassPipeline()` | Tune media density, anisotropy, radial shaft quality, and temporal history. | Requires WebGPU point-light and compute-built cluster storage buffers. |
| Sun, spot, or point-light visibility | `ShadowMapRenderer` | Add contact shadows for missing near-surface detail. | Light-space shadows need caster geometry; they are not a color-only effect. |
| Tiny near-surface shadow detail | `createContactShadowShaderPassPipeline()` | Combine with stable cascaded or local-light shadow maps. | Camera-space contact rays cannot see occluders outside the current depth buffer. |
| Fast transparent layering | `WBOITRenderer` | Use `ABufferRenderer` when exact fragment ordering is more important. | Weighted blending approximates heavily overlapping transparent layers. |
| Broad cinematic glow | `bloomShaderPassPipeline` | Keep the single `bloom` pass for simpler, cheaper glow. | Bloom operates on color; it is not reflected lighting or global illumination. |

## Example Profiles: Visualization City Versus Illumination Lab

The two WebGPU showcases emphasize different rendering problems; they are not independent
implementations of the same effect catalog.

| | Visualization City | Deferred Illumination Lab |
| --- | --- | --- |
| Main purpose | Demonstrate a broad, switchable hybrid shadow/effect stack on recognizable city geometry. | Inspect physically based materials and advanced direct, diffuse-indirect, and specular light transport. |
| Direct-light strategy | Scene shading with directional, spot, and point-light shadow maps. | Deferred Cook-Torrance shading with hundreds of compute-clustered point lights. |
| Ambient visibility | Lower-cost SSAO and optional screen-space contact shadows. | Temporally stabilized horizon-based GTAO. |
| Indirect diffuse light | Not included. | Cosine-weighted, temporally stabilized screen-space global illumination. |
| Reflections | Shared `createSSRShaderPassPipeline()`, tuned by city quality presets. | The **same** SSR pipeline, tuned for polished materials and edge-aware upsampling. |
| Atmospheric effects | Compact height fog with an inexpensive stylized directional glow. | Real clustered point-light scattering, depth-occluded crepuscular god rays, height-dependent extinction, and anisotropic phase response. |
| Other strengths | Cascaded shadows, split comparisons, outlines, temporal AA, and motion blur. | Roughness/metalness inspection, emissive color bleeding, and transport-confidence diagnostics. |

Visualization City is therefore broader in shadow and presentation effects, while Illumination
Lab goes deeper into deferred shading and higher-order light transport. Shared techniques such
as SSR remain composable, reusable implementations rather than duplicated algorithms.

## Atmosphere: Height Fog Versus Clustered Participating Media

Both atmospheric effects compose into the same ordered scene-color chain, but answer different
questions.

| | Compact volumetric fog | Clustered volumetric lighting |
| --- | --- | --- |
| Public entry point | `createVolumetricFogShaderPassPipeline()` | `createClusteredVolumetricLightingShaderPassPipeline()` |
| Light source | A configurable fog color plus a compact stylized sun response. | The actual clustered point-light storage buffer and directional scene light. |
| Medium | Screen-depth-guided exponential height fog. | View-ray integration through world-height density with Beer-Lambert extinction. |
| Local colored halos | Not evaluated. | Each ray sample looks up nearby lights through the existing compute-built cluster lists. |
| Directional shafts | Approximate stylized screen-space glow. | Anisotropic directional scattering plus configurable radial, depth-occluded crepuscular god rays. |
| Stabilization | Persistent fog-color history. | Velocity reprojection, linear-depth disocclusion rejection, and depth-aware denoising. |
| Main cost | One lightweight fullscreen integration and copy. | Reduced-resolution pixels × ray steps × nearby cluster lights, plus history and blur. |

Use the compact fog pass when atmospheric depth is sufficient and cost matters. Choose clustered
volumetric lighting when visible light transport through dust, haze, or mist is central to the
scene. Neither pass is hardware ray tracing, and camera-depth shaft visibility cannot include
off-screen occluders without an application-provided shadow-volume or light-space fallback.

## Reflections: Environment Maps Versus Screen-Space Rays

The two reflection mechanisms answer different questions.

| | Image-based lighting | Screen-space reflections |
| --- | --- | --- |
| Public entry points | `pbrMaterial`, `ibl`, `loadPBREnvironment()` | `createSSRShaderPassPipeline()` |
| Where it runs | Inside material shading. | After opaque lighting, as an ordered fullscreen pipeline. |
| Reflected source | Prefiltered diffuse/specular environment cubemaps and a BRDF lookup texture. | The already-lit scene color and scene depth visible to the current camera. |
| Off-screen environment | Supported through the cubemap. | Unavailable unless the application supplies another fallback. |
| Moving local geometry and lights | Only if the environment map is recaptured externally. | Visible changes appear automatically in the traced scene color. |
| Roughness response | Specular environment mip levels approximate broader glossy lobes. | Roughness jitters rays and controls depth/normal-aware denoising. |
| Typical cost | A small, predictable number of material texture samples. | Visible reflection pixels × ray samples, plus history and denoising passes. |
| Temporal behavior | Stable when the environment texture is stable. | Velocity reprojection and linear-depth disocclusion rejection stabilize noise. |
| Backend | The PBR shader path supports WebGPU and WebGL 2. | The current advanced SSR pipeline is WebGPU-first. |

These techniques are usually complementary: image-based lighting supplies a stable off-screen
fallback, while screen-space reflections add dynamic nearby objects and lights. Avoid blindly
adding both full-strength contributions; use reflection confidence, Fresnel, roughness, or a
material-specific blend to prevent counting the same reflected energy twice.

Planar reflections and ray-traced reflections are different techniques again. luma.gl exposes
the render-target, camera, and shader building blocks needed for an application-owned planar
reflection pass, but does not currently provide a packaged planar-reflection renderer or a
hardware ray-tracing pipeline. Neither should be confused with the implemented SSR pipeline.

### One SSR Implementation, Multiple Examples

[Effects: Visualization City](/examples/experimental/advanced-effects) and
[Deferred Rendering: Illumination Lab](/examples/experimental/deferred-rendering) use the **same**
exported `createSSRShaderPassPipeline()`. They are examples of one implementation in different
render stacks, not competing copies of the reflection algorithm.

- Visualization City selects approximately 35%, 50%, or 100% tracing resolution from its quality
  preset and combines reflections with light-space shadows, SSAO, fog, and temporal AA.
- Illumination Lab defaults to full-resolution reflection tracing and uses depth/normal-aware
  reconstruction to showcase polished floors, chrome accents, roughness variation,
  reflection-confidence diagnostics, and clustered animated lights. Its SSR **Buffer
  Resolution** control can explicitly lower tracing cost when desired.
- `ssrTrace`, `ssrTemporal`, `ssrDepthHistoryCopy`, `ssrSpatial`, and `ssrComposite` are the
  reusable stages of that same pipeline, exposed for applications that need custom composition.

The default `createSSRShaderPassPipeline()` uses full-resolution internal targets. Lowering
`resolutionScale` reduces ray-tracing and history memory approximately with the square of the
scale. Increasing `sampleCount` increases ray work approximately linearly. Longer ray distances
usually require more samples to avoid visible marching bands. Temporal history and bilateral
denoising improve stability, but are not substitutes for adequate ray density.

## Ambient Occlusion: SSAO Versus GTAO

Both techniques estimate visibility from the current depth buffer; neither traces off-screen
geometry or computes full global illumination.

| | SSAO | GTAO |
| --- | --- | --- |
| Public entry point | `createSSAOShaderPassPipeline()` | `createGTAOShaderPassPipeline()` |
| Main estimator | A compact depth-neighborhood sample kernel. | A multi-direction horizon search in reconstructed view space. |
| Pipeline stages | Evaluate, horizontal blur, vertical blur, composite. | Evaluate, temporal reprojection, depth-history capture, two blur passes, composite. |
| Required inputs | Depth, with optional supplied view normals. | Depth, view normals, velocity, and camera projection/inverse projection. |
| History targets | None. | Persistent AO and previous-depth targets. |
| Main strength | Smaller setup cost and an inexpensive contact-darkening option. | Better grounding, larger-scale creases, and steadier animated results. |
| Typical tradeoff | More visible noise or less faithful horizon detail. | More samples, texture memory, and temporal-history management. |

Use one AO estimator per stack. GTAO is usually the higher-quality replacement for SSAO, not a
second layer to multiply on top of it. Reset history after camera cuts, resize events, or changes
that invalidate scene velocity.

## Indirect Lighting: Ambient Occlusion, SSGI, and SSR

Ambient occlusion, diffuse global illumination, and specular reflections all read similar
G-buffer attachments, but transfer different kinds of light.

| | SSAO / GTAO | Diffuse screen-space global illumination | Screen-space reflections |
| --- | --- | --- | --- |
| Public entry point | `createSSAOShaderPassPipeline()` or `createGTAOShaderPassPipeline()` | `createSSGIShaderPassPipeline()` | `createSSRShaderPassPipeline()` |
| Effect on color | Darkens regions with limited ambient visibility. | Adds colored radiance bounced from nearby visible lit surfaces. | Adds directional glossy or mirror-like reflected scene color. |
| Sample distribution | Local visibility kernel or horizon search. | Cosine-weighted rays over the surface hemisphere. | Roughness-jittered rays around the mirror-reflection direction. |
| Strongest visual cue | Grounded corners and sphere/floor contacts. | Cyan, magenta, or amber color bleeding onto nearby diffuse materials. | Reflected lights and geometry on polished floors or chrome. |
| Typical surface | Any visible opaque surface. | Primarily rough and diffuse surfaces. | Primarily smooth, glossy, or metallic surfaces. |
| Typical cost | Neighborhood/horizon samples; GTAO also has temporal history. | Visible tracing pixels × hemisphere rays × ray steps, plus temporal denoising. | Visible tracing pixels × reflection-ray steps, plus temporal denoising. |
| Off-screen information | Unavailable. | Unavailable without an application-provided fallback. | Unavailable without an environment-map or other fallback. |

These are not duplicate effects: GTAO controls how much ambient light reaches a surface, SSGI
adds indirect diffuse light, and SSR adds indirect specular light. A representative order is
**direct lighting → GTAO → SSGI → SSR**, allowing mirror reflections to include the bounced
diffuse result. Half-resolution tracing and stable velocity history are useful starting points
for both SSGI and SSR.

## Lighting: Baseline Deferred Versus Clustered Deferred

Both lighting resolves consume the same `GBuffer` material attachments and emit HDR color into
the normal ordered `previous` chain.

| | Baseline deferred lighting | Clustered deferred lighting |
| --- | --- | --- |
| Public entry point | `createDeferredLightingShaderPassPipeline()` | `ClusteredLightGrid` and `createClusteredDeferredLightingShaderPassPipeline()` |
| Maximum point lights | 64. | 512 in the current implementation. |
| Per-pixel light work | Checks every active point light. | Normally checks only the lights assigned to the pixel's screen/depth cluster. |
| Additional setup | One fixed-capacity point-light storage buffer. | Compute-built cluster count/index buffers plus the same point-light buffer. |
| Best fit | Smaller scenes, simpler integration, or modest light counts. | Large dynamic light counts with reasonably localized light ranges. |
| Failure mode | Cost grows with every active light, even when most do not affect the pixel. | Dense or oversized lights saturate clusters and trigger a slower correctness fallback. |

Clustering changes the common-case cost from roughly **visible pixels × all lights** to
**light binning + visible pixels × nearby lights**. It does not make lighting free: a scene in
which every light overlaps every cluster still has substantial work. The occupancy debug view
shows whether cluster dimensions, retained capacity, or light ranges should be adjusted.

## Shadows: Light-Space Maps Versus Screen-Space Contacts

`ShadowMapRenderer` renders directional cascades, spot-light maps, or point-light cube maps from
the lights' point of view. It can account for off-screen casters and should modulate the matching
direct-light contribution during scene shading.

`createContactShadowShaderPassPipeline()` traces short rays through the camera depth buffer. It
recovers fine contact detail that finite-resolution shadow maps can miss, but cannot see
off-screen or hidden occluders. Its composition must affect the associated direct-light term,
not ambient or emissive color.

Use shadow maps as the primary visibility solution and contact shadows as an optional refinement.
SSAO/GTAO are ambient-visibility estimators, not replacements for either directional or local
light shadows.

## Transparency: Weighted Blending Versus A-Buffer

| | Weighted blended OIT | A-buffer OIT |
| --- | --- | --- |
| Public entry point | `WBOITRenderer` | `ABufferRenderer` |
| Backend | WebGPU or WebGL 2 with supported floating-point blending. | WebGPU with fragment-stage storage buffers. |
| Fragment order | Weighted approximation without per-pixel sorting. | Captures bounded per-pixel fragment lists and sorts them during resolve. |
| Memory | Fixed accumulation/revealage targets independent of layer count. | Scales with configured fragment storage and per-pixel limits. |
| Best fit | Broad compatibility and many translucent fragments at predictable cost. | Intersections and layering where more accurate depth ordering matters. |
| Limitation | Strongly overlapping layers can blend inaccurately. | Over-capacity fragments are dropped or require bounded capture slices. |

Both resolve into the same shader-pass color chain, so later bloom, temporal AA, or display
effects remain composable.

## Bloom, Blur, and Depth of Field

| Technique | Public entry point | Choose it when | Avoid confusing it with |
| --- | --- | --- | --- |
| Compact bloom | `bloom` | A lightweight single-pass highlight glow is sufficient. | Multiscale bloom or physically based reflected light. |
| Multiscale bloom | `bloomShaderPassPipeline` | Highlights should spread across several image scales with softer falloff. | A duplicate bloom layer; normally choose this **instead of** `bloom`. |
| Gaussian blur | `gaussianBlur` | A smooth, general-purpose image blur is needed. | Depth-aware filtering or camera lens simulation. |
| Triangle blur | `triangleBlur` | A simpler separable smoothing kernel is sufficient. | A Gaussian distribution or edge-preserving bilateral blur. |
| Edge-preserving blur | `depthAwareBlurShaderPassPipeline` | Depth discontinuities must stay sharp while denoising. | Lens depth of field; this pass filters by depth similarity. |
| Lens depth of field | `dofShaderPassPipeline` | Blur should vary with focus distance and scene depth. | The low-level `dof` pass, which represents one separable blur axis. |
| Motion blur | `createMotionBlurShaderPassPipeline()` | Real screen-space velocity should produce motion streaks. | `zoomBlur`, which intentionally applies a stylized radial effect. |

For bloom and depth of field, the pipeline owns the appropriate intermediate targets and ordering.
The low-level pass remains useful when building a custom pipeline, but does not need to be added
alongside its own complete pipeline.

## Antialiasing: FXAA, TAA, and Multisampling

- `fxaa` smooths a resolved image in one frame and does not require scene velocity or persistent
  history. It is a useful low-cost final-image option.
- `createTAAShaderPassPipeline()` accumulates a jittered scene over time using depth, velocity,
  and persistent history. It handles subpixel shimmer more effectively but can ghost if motion
  vectors or disocclusion rejection are wrong.
- Multisampling and supersampling address coverage during geometry rendering rather than replacing
  a final-image postprocess. Managed offscreen multisample resolve remains a separate GPU API
  concern.

For backend-specific constraints and combined ordering, see
[Antialiasing and Multisampling](/docs/api-guide/gpu/gpu-antialiasing).

## Compose by Contract, Not by Visual Name

A representative WebGPU stack is:

```ts
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  bloomShaderPassPipeline,
  createGTAOShaderPassPipeline,
  createSSGIShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline
} from '@luma.gl/effects';
import {createClusteredDeferredLightingShaderPassPipeline} from '@luma.gl/experimental';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [
    createClusteredDeferredLightingShaderPassPipeline(),
    createGTAOShaderPassPipeline({resolutionScale: 0.5}),
    createSSGIShaderPassPipeline({resolutionScale: 0.5}),
    createSSRShaderPassPipeline({resolutionScale: 0.5}),
    createTAAShaderPassPipeline(),
    bloomShaderPassPipeline
  ],
  colorFormat: 'rgba16float'
});

renderer.renderToScreen({
  sourceTexture: gBuffer.colorTexture,
  bindings: {
    ...gBuffer.getShaderPassBindings(),
    baseColorMetallicTexture: gBuffer.getExtraColorTexture('baseColorMetallic'),
    emissiveOcclusionTexture: gBuffer.getExtraColorTexture('emissiveOcclusion'),
    pointLights,
    ...clusteredLightGrid.getShaderPassBindings()
  },
  uniforms: {
    clusteredDeferredLighting: {
      inverseProjectionMatrix,
      ...clusteredLightGrid.getShaderPassUniforms(nearPlane, farPlane)
    },
    gtaoEvaluate: {projectionMatrix, inverseProjectionMatrix},
    gtaoTemporal: {inverseProjectionMatrix},
    ssgiTrace: {projectionMatrix, inverseProjectionMatrix},
    ssgiTemporal: {inverseProjectionMatrix},
    ssrTrace: {projectionMatrix, inverseProjectionMatrix},
    ssrTemporal: {inverseProjectionMatrix}
  }
});
```

The application still owns geometry, light updates, cluster encoding, shadow-map rendering,
camera matrices, and presentation. `GBuffer` standardizes surface attachments, while
`ShaderPassRenderer` manages ordered color routing, intermediate targets, and temporal history.

For the underlying execution model, see [Shader Passes](/docs/api-guide/shaders/shader-passes).
For complete live stacks, compare
[Effects: Visualization City](/examples/experimental/advanced-effects) and
[Deferred Rendering: Illumination Lab](/examples/experimental/deferred-rendering).
