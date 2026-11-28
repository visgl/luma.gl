# Declarative fullscreen effects

An effect definition is a typed object you can export from a module and reuse with
multiple renderers. It describes the textures and draws needed for an effect.
`EffectRenderer` allocates the textures, runs the passes, and manages history.
The API is a prototype for fullscreen processing of rendered scene textures.

## Apply effects to a scene

Render the scene to sampleable color and depth textures. If you use shadow maps,
render those and bind them to the scene materials during scene shading. The
fullscreen stack then processes the shaded scene color.

```ts
import {EffectRenderer} from '@luma.gl/engine';
import {bloomLow, ssao} from '@luma.gl/engine/effects';

const effects = new EffectRenderer(device, {
  effects: [ssao, bloomLow],
  colorFormat: 'rgba16float'
});

effects.resize([width, height]);

// Run after scene rendering on each frame.
effects.renderToScreen({
  sourceTexture: sceneColor,
  bindings: {depthTexture: sceneDepth},
  uniforms: {
    ssaoEvaluate: {nearPlane: 0.1, farPlane: 200},
    bloomComposite: {intensity: 0.75}
  }
});
```

The effects run in array order. SSAO samples the scene depth and updates the
color image. Bloom reads that updated image and adds glow. Use
`renderToTexture` when another stage needs to sample the result. Call `resize`
when the output dimensions change and `destroy` when the stack is no longer
needed. The scene supplies and owns the input textures.

To use camera-reprojection TAA, add `cameraReprojectionTaa` between SSAO and
bloom. Supply the camera matrices and jitter each frame as
`cameraReprojectionTaaResolve` uniforms. After a camera cut, call
`resetHistory()` before rendering the next frame. See the
[camera-reprojection shader definition](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/effects/passes/screen-space/camera-reprojection-temporal-antialiasing.ts)
for its camera uniform types.

The other fullscreen definitions include `motionBlur`, `taa`, and
`depthOfField`. Motion blur and standard TAA use the scene velocity texture.
Depth of field uses scene depth and camera and lens uniforms. Use
`depthOfField` for separable blur or `bokehDofEffect` for a circular aperture.
`depthAwareBlurEffect` runs horizontal and vertical filtering with scene depth
and preserves edges across depth discontinuities.
For a display-ready chain, place `toneMappingEffect` after HDR bloom and
`fxaaEffect` after tone mapping.

## Apply glfx image filters

Import `sepiaEffect`, `vignetteEffect`, or another glfx definition from
`@luma.gl/engine/effects` and add it to the stack. Use uniforms keyed by the
shader name, for example `uniforms: {sepia: {amount: 0.6}}`.

| Category | Definitions |
| --- | --- |
| Adjust | `brightnessContrastEffect`, `denoiseEffect`, `hueSaturationEffect`, `noiseEffect`, `persistence`, `sepiaEffect`, `vibranceEffect`, `vignetteEffect` |
| Blur | `bloomEffect`, `gaussianBlurEffect`, `tiltShiftEffect`, `triangleBlurEffect`, `zoomBlurEffect` |
| Stylize | `colorHalftoneEffect`, `dotScreenEffect`, `edgeWorkEffect`, `hexagonalPixelateEffect`, `inkEffect`, `magnifyEffect` |
| Warp | `bulgePinchEffect`, `swirlEffect` |

Use `bloomEffect` for the simple image filter and `bloomLow` for the HDR
pyramid. Separable and repeated glfx filters declare both draws and reuse the
shared color chain between them.

## Configure an effect

Set an effect entry’s `options` field for settings that affect resources or pass
order. The renderer resolves the definition once at construction. Keep animated
controls in the render call’s `uniforms` so they can change without reallocating those resources.

```ts
import {EffectRenderer} from '@luma.gl/engine';
import {hdrBloom, ssaoEffect, ssr} from '@luma.gl/engine/effects';

const renderer = new EffectRenderer(device, {
  effects: [
    {effect: ssaoEffect, options: {normalSource: 'normal-texture', resolutionScale: 0.5}},
    {effect: ssr, options: {reprojection: 'camera', quality: 'fast'}},
    {effect: hdrBloom, options: {quality: 'ultra', downsample: 'auto'}}
  ],
  colorFormat: 'rgba16float'
});
```

Supply each effect's scene bindings at render time. SSAO in normal-texture
mode needs the normal texture in addition to depth. Camera-reprojected SSR
also needs camera uniforms. HDR bloom automatically selects fused compute on
eligible WebGPU devices. Its fragment alternative produces the same named
pyramid levels for the shared downstream passes.

The configurable catalog also includes `outlines`, `selectionOutlineEffect`,
`gtao`, `ssgi`, `hdrAutoExposure`, `volumetricFog`,
`clusteredVolumetricLighting`, and `contactShadows`. Use the `heightFog`
definition for analytic fog with frame uniforms, or configure
`volumetricFog` with `{mode: 'height'}`. Selection outlines sample a
caller-provided `selectionTexture` mask.

## Run compute pipelines

A `ComputePipelineDefinition` is an ordered list of compute passes and reusable
GPU operations. Each compute pass lists its kernels, maps shader binding names
to named resources, and calculates dispatch dimensions from frame state.
`encodeComputePipeline` resolves those bindings and records the passes into
the caller's command encoder. Keep buffer and texture allocation in the
renderer that owns them.

`GPUConvolutionBloom` executes `fftBloomPipeline` from
`@luma.gl/graph/gpu-effects`. The definition makes highlight extraction,
forward FFT, spectral multiplication, inverse FFT, and HDR composition
explicit. The optical kernel transform runs only when its cached spectrum
needs updating. FFTs reuse their existing compiled command graphs.

`ClusteredLightGrid` executes `clusteredLightGridPipeline` from
`@luma.gl/engine/lighting`. Its clear, bin, and compact dispatches share one
compute pass. Deferred and volumetric lighting continue to consume the resulting
light counts and indices through the grid's bindings.


## Capture scene geometry

A `SceneCapturePassDefinition` names a framebuffer, declares attachment clear
and depth settings, and supplies synchronous preparation and geometry hooks.
`encodeSceneCapturePass` prepares GPU resources, opens the render pass, invokes
the draw, and closes the pass. The scene supplies and owns the framebuffers
and their texture attachments.

- `shadowMapCapturePass` in `@luma.gl/engine/lighting` runs with the depth
  attachment view for each directional cascade, spot light, or point cube face.
- `deferredGBufferCapturePass` in `@luma.gl/anari` clears the scene's MRT
  and depth attachments and returns the recorded draw count.
- `wboitCapturePasses` records opaque depth, weighted accumulation, and
  revealage in that order. Both translucent passes reuse opaque depth.
- `aBufferCapturePass` resets the head pointers and scissor before drawing
  a slice. The renderer resolves that slice before reusing its buffers.

Preparation and draw hooks let the scene supply view-specific models and
bindings. The capture outputs remain available to the existing shadow
sampling and fullscreen resolve stages.

## Produce visibility textures for lighting

`ambientOcclusionVisibilityEffect` and `contactShadowVisibilityEffect` in
`@luma.gl/engine/lighting` generate visibility for a later lighting pass.
Each effect traces visibility and filters it in two directions using depth
and normals. The final output is a visibility texture that can be sampled
from its red channel.

For scene lighting, use `AmbientOcclusionPass` or `ContactShadowPass` to
size the renderer from the inputs, set the camera uniforms, and get a borrowed
RGBA8 texture. Callers own the depth and normal textures. The pass owns its
output and may overwrite it on the next render. Ambient occlusion requires
WebGPU unless its mode is `none`, which returns a white texture.

To run either definition directly, configure it in `EffectRenderer`, set
`colorFormat: 'rgba8unorm'`, and call `renderToTexture` with camera uniforms,
the normal texture as the source, and `depthTexture` and `normalTexture`
bindings. Run visibility generation before the lighting pass that samples it.

## Upscale with temporal history

The experimental WebGPU `TemporalUpscaler` records two named framebuffer
passes. Accumulation writes both HDR color and auxiliary history in one draw.
Sharpening reads the new color and writes the caller's output framebuffer.
Both use the same pass encoder as scene capture, which supports multiple
attachments. The upscaler manages its ping-pong framebuffers and only advances
history after both passes have been recorded.

Call `resetHistory()` after a camera cut. Call `setSize()` when the input or
output dimensions change. Submit pending work before rendering another frame,
resizing, or destroying the upscaler.

## Resolve scene buffers

ANARI exposes fullscreen definitions for deferred direct lighting, ambient
lighting, clustered deferred lighting, weighted blended transparency, and
A-buffer transparency. Import them from `@luma.gl/anari`.

```ts
import {EffectRenderer} from '@luma.gl/engine';
import {clusteredDeferredLightingEffect} from '@luma.gl/anari';

const lighting = new EffectRenderer(device, {
  effects: [clusteredDeferredLightingEffect],
  colorFormat: 'rgba16float'
});

lighting.resize([width, height]);
const litColor = lighting.renderToTexture({
  sourceTexture: gBuffer.colorTexture,
  bindings: {...gBuffer.getShaderPassBindings(), ...clusteredLightBindings},
  uniforms: lightingUniforms
});
```

The scene renderer supplies and owns the G-buffer or transparency captures.
The resolve samples those resources and writes the color result. For A-buffer
resolve, use `{effect: aBufferResolveEffect, options: {maxFragmentsPerPixel}}`
and match the limit used to capture fragments. The higher-level A-buffer,
weighted blended transparency, and deferred scene renderers wire their own
inputs automatically.

## Author an effect

Start with a fullscreen shader that follows the
[shader pass convention](../../api-reference/engine/passes/shader-pass-renderer.md).
Declare a pass for each draw and route each shader's inputs to the textures it
samples. Use `as const satisfies EffectDefinition<...>` to check the definition
while preserving its literal names and pass structure. This example adjusts
contrast and then applies a vignette, reusing two built-in shaders.

```ts
import type {EffectDefinition} from '@luma.gl/engine';
import {brightnessContrast, vignette} from '@luma.gl/engine/effects';

export const softVignette = {
  name: 'softVignette',
  resources: {
    adjusted: {}
  },
  passes: [
    {
      kind: 'fullscreen',
      shaderPass: brightnessContrast,
      inputs: {sourceTexture: 'previous'},
      output: 'adjusted',
      uniforms: {contrast: 0.15}
    },
    {
      kind: 'fullscreen',
      shaderPass: vignette,
      inputs: {sourceTexture: 'adjusted'},
      output: 'previous'
    }
  ]
} as const satisfies EffectDefinition<'adjusted'>;
```

- **Resources** are private to each occurrence of the effect. Set the texture
  format and scale when the default format or full resolution is unsuitable.
  `EffectDefinition<...>` checks that named targets are declared.
- **Inputs** map shader binding names to textures. `previous` reads the current
  color chain and `original` reads the input to the entire stack. Supply scene
  textures such as depth in the render call's `bindings`.
- **Outputs** select a named target or update the shared color chain with
  `previous`. Set per-pass defaults in `uniforms` and apply per-frame
  overrides by shader module name in the render call.
- **History** uses `lifetime: 'history'`. Specify how to initialize the texture
  on the first frame or after a reset. A pass can read the previous frame and
  write the current frame using the same history target name.

## Offer a WebGPU implementation with a fragment fallback

Put the two implementations in `initialPasses`, then list their shared
downstream draws in `passes`. Bloom declares half- and quarter-resolution
extraction textures. Its compute branch writes both in one dispatch. Its
fragment branch extracts highlights at half resolution, then downsamples to
quarter resolution. Both feed the same blur and reconstruction passes.

For your own compute variant, map each storage binding to a named output and
mark those resources with `storage: true`. The first output's dimensions
determine the dispatch grid. The renderer checks WebGPU, storage-format
support, binding limits, and workgroup dimensions. On other devices it runs
the fragment sequence. Both paths should populate every resource the shared
passes read.

## Temporal frame conventions

Supply projection jitter in top-left UV units. Divide jitter in render pixels
by the render width and height to convert it. Motion vectors point from the
previous unjittered position to the current unjittered position, in UV units.
Subtract the motion vector from the current unjittered UV to find the previous
position. Apply previous jitter only when sampling history stored in jittered
coordinates.

The velocity-based TAA effect takes motion from the scene. Camera-reprojection
TAA derives it from current depth and unjittered camera matrices. Supply
hardware depth from the same view used to render the current color. Reset
history after a camera cut, scene replacement, or a change in resolution that
invalidates history.

## Record a frame with EffectRenderer

Use `render({sourceTexture, target: null})` to draw to the canvas. Supply a
framebuffer as `target` to draw into it, or omit `target` to return the output
texture. The returned texture is borrowed. A later draw, resize, or destruction
can overwrite or invalidate it. Rendering records commands without submitting.
Use `commandEncoder` to record into a caller-owned encoder on the same device.

Set `resetHistory: true` on the first frame after a camera cut. Scene depth,
normals, prepared light textures and buffers, and uniform values can change on
each call.

A filter can reference its shader module directly:

```ts
const sepiaEffect = {
  name: 'sepia',
  passes: [{kind: 'filter', module: sepia}]
} as const satisfies EffectDefinition;

const renderer = new EffectRenderer(device, {
  effects: [
    {effect: ssaoEffect, options: {normalSource: 'normal-texture', resolutionScale: 0.5}},
    {effect: sepiaEffect}
  ]
});
```

The sepia `amount` remains a shader uniform. SSAO resolves its target scales
and normal-source pass sequence from its definition when the renderer is created.

### Share a resolution option or select a variant

Use `optionDefaults` to give construction options default values. Use
`scaleResources` when several targets should follow one resolution option.
SSGI and clustered volumetric lighting use this to keep their evaluation,
history, and filter textures at the same relative size.

Use `variants` when an option selects a different set of passes or resources.
Each value replaces the listed fields for that instance. A value without an
entry uses the base definition. For example, `volumetricFog` uses screen-space
passes and a history texture by default. Set the effect's `mode` option to
`'height'` to use the analytic pass without allocating a fog history texture.

### Apply presets and initialize history

An option can supply a scale or a uniform default directly, or select a value
from a table. For SSR, an explicit `resolutionScale` takes precedence over the
quality preset. The camera reprojection variant allocates full-resolution
normal and depth history while the reflection buffers use the selected scale.

HDR auto exposure uses fixed scale factors for the luminance reduction levels.
Its history descriptor seeds the exposure value from `initialExposure` after
creation, resize, or history reset. Per-frame uniforms still control adaptation
and override construction-time uniform defaults.

## Run effects in a GPU graph

Use the same effect entries in the WebGPU graph. Declare a graph texture input,
give the effect operation named shader bindings and an output, and install the
engine lowering in the graph compiler.

```ts
import {GPUGraph, gpuGraph} from '@luma.gl/graph';
import {GPUEffectOperation, effectOperationLowering, sepiaEffect} from '@luma.gl/engine/effects';

const graph = new GPUGraph();
graph.addInput('sceneColor', gpuGraph.texture({format: 'rgba8unorm'}));
graph.add(new GPUEffectOperation({
  input: 'sceneColor',
  output: 'filteredColor',
  outputDescriptor: gpuGraph.texture({
    format: 'rgba8unorm',
    extent: {like: 'sceneColor'}
  }),
  effects: [sepiaEffect],
  uniforms: {sepia: {amount: 0.6}}
}));

const compiled = graph.compile(device, {lowerings: [effectOperationLowering]});
```

Call `run` for submission or `prepare` to bind logical textures for a
caller-owned command encoder. Other graph operations can consume the named
result. Effect options, pass ordering, and compute fallback selection use the
same plan as `EffectRenderer`. The graph tracks each draw and dispatch with its
texture uses, so effect-local scratch textures can be reused across passes
when lifetimes allow. Use the command graph integration below for velocity TAA.
Other history-backed effects use `EffectRenderer`.

For WebGL, use `createEffectRenderOperation` from `@luma.gl/engine/effects`
with the device-bound `GPUSimpleGraph`. Give it caller-owned input and
output textures and register it with `graph.addRenderOperation`. This path
uses the same fullscreen plan and fragment fallback as the WebGPU graph.
Choose effects with GLSL implementations. The graph owns any transient
scratch textures and borrows the input, output, and optional shader bindings.

Use `appendEffects(graph, props)` to connect a stack and pass its logical
color result to the next operation. An entry can attach its own `bindings`
and `uniforms`, so two occurrences of the same definition can sample different
graph textures or use different values. Supply a named depth or normal output
from a scene render operation just as you would supply a named imported
texture. Select the final color as a graph output and bind a caller-owned
destination through `prepare({outputTargets})` when recording the frame.

The portable operation also accepts per-occurrence overrides. Its bindings
refer to caller-owned textures, while named graph operations refer to graph
texture names.

### Retain temporal history in a WebGPU command graph

Use `addGraphTAA` when the scene already records color, hardware depth, and
velocity in a WebGPU `GPUCommandGraph`. It lowers the same velocity TAA
definition used by `EffectRenderer`. The graph tracks the previous history
as a sampled input and the current history as a render attachment. Within the
same encoding, later passes see the written current color.

Create two `GPUTextureHistory` pairs at the render resolution. Use the
resolved output format for color and `rgba16float` for packed hardware depth.
Both pairs need `Texture.SAMPLE | Texture.RENDER`. Import them once and bind
their current physical roles for each encoding.

```ts
import {
  addGraphTAA,
  importTemporalGraphHistory,
  type TemporalFrame
} from '@luma.gl/engine/effects';
import {GPUCommandGraph, GPUTextureHistory} from '@luma.gl/graph/gpu-core';
import {Texture} from '@luma.gl/core';

const graph = new GPUCommandGraph<TemporalFrame>(device);
const usage = Texture.SAMPLE | Texture.RENDER;
const colorHistory = new GPUTextureHistory(device, {width, height, format: 'rgba16float', usage});
const depthHistory = new GPUTextureHistory(device, {width, height, format: 'rgba16float', usage});
const colorRoles = importTemporalGraphHistory(graph, 'taa-color', colorHistory);
const depthRoles = importTemporalGraphHistory(graph, 'taa-depth', depthHistory);

// These views come from the scene and output operations in the same graph.
addGraphTAA(graph, {
  id: 'taa',
  input: sceneColor,
  depth: sceneDepth,
  velocity: sceneVelocity,
  output: resolvedColor,
  colorHistory: colorRoles,
  depthHistory: depthRoles
});
const compiled = graph.compile();

function renderFrame(frame: TemporalFrame) {
  const encoder = device.createCommandEncoder();
  try {
    compiled.encode(encoder, {
      parameters: frame,
      textures: {...colorRoles.getBindings(), ...depthRoles.getBindings()}
    });
    device.submit(encoder.finish());
    colorHistory.advance();
    depthHistory.advance();
  } finally {
    encoder.destroy();
  }
}
```

Pass jitter in top-left UV units relative to the render resolution. Motion XY
is unjittered current UV minus previous UV. Set `resetHistory: true` on the
first frame and after a camera cut. TAA still writes both current histories
on a reset frame, so the next frame can reuse them. If an encoding is
discarded, leave both roles unchanged. Rebuild the graph and its history
pairs on resize, and destroy the compiled graph before releasing the pairs.

#### How the WebGPU upscaler fits

The upscaler can use the same role bindings and `TemporalFrame` values
with two output-resolution pairs, one for accumulated color and one for
auxiliary data. Its accumulation pass samples both previous views and writes
both current views as MRT attachments. A following sharpening pass samples
the current color and writes the presentation target. The upscaler would use
ordinary graph render nodes for its two existing kernels:

```ts
// Sketch of the upscaler graph adapter. The compile callbacks would reuse its existing kernels.
graph.addRenderPass({
  id: 'upscale-accumulate',
  resources: [
    ...[sceneColor, sceneDepth, sceneVelocity, upscaleColor.previous, upscaleAuxiliary.previous]
      .map(texture => ({texture, usage: 'sampled' as const}))
  ],
  attachments: {colorAttachments: [upscaleColor.current, upscaleAuxiliary.current]},
  compile: compileUpscaleAccumulation
});
graph.addRenderPass({
  id: 'upscale-sharpen',
  resources: [{texture: upscaleColor.current, usage: 'sampled'}],
  attachments: {colorAttachments: [presentationColor]},
  compile: compileUpscaleSharpening
});
```

Bind and advance both pairs together using the same submission lifecycle as
TAA. The accumulation callback would convert `currentJitter` from render UV
to render pixels for the existing kernel and use `resetHistory` to seed
accumulation. The velocity texture keeps the common XY convention and still
supplies the upscaler's Z/W depth and validity channels. The current
`TemporalUpscaler` continues to record its two passes directly.
