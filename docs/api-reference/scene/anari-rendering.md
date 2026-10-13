import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# ANARI Cameras, Renderers, and Frames

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="neutral">Private workspace</DocumentationBadge>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
</DocumentationBadges>

An `ANARICamera` describes the view, an `ANARIRenderer` selects shading and presentation settings, and an `ANARIFrame` combines both with a world to produce an image.

## `ANARICamera`

```ts
new ANARICamera(
  device: ANARIDevice,
  subtype: ANARICameraSubtype,
  parameters?: ANARICameraParameters
);

newCamera(
  subtype: 'perspective' | 'orthographic',
  parameters?: ANARICameraParameters
): ANARICamera;
```

### Camera parameters

```ts
type ANARICameraParameters = {
  position?: ANARIVector3;
  direction?: ANARIVector3;
  up?: ANARIVector3;
  aspect?: number;
  fovy?: number;
  height?: number;
  near?: number;
  far?: number;
};
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `position` | `[0, 0, 5]` | World-space camera position. |
| `direction` | `[0, 0, -1]` | World-space viewing direction. The look-at target is `position + direction`. |
| `up` | `[0, 1, 0]` | World-space up direction. |
| `aspect` | Frame width divided by frame height | Explicit projection aspect ratio. |
| `fovy` | `Math.PI / 3` | Perspective vertical field of view, in radians. |
| `height` | `12` | Orthographic vertical viewing extent. |
| `near` | `0.05` | Near clipping plane. |
| `far` | `500` | Far clipping plane. |

### Perspective camera

```ts
const camera = anariDevice.newCamera('perspective', {
  position: [5, 3, 8],
  direction: [-5, -2, -8],
  fovy: Math.PI / 4,
  near: 0.05,
  far: 200
});
```

### Orthographic camera

```ts
const camera = anariDevice.newCamera('orthographic', {
  position: [0, 6, 12],
  direction: [0, -4, -12],
  height: 10,
  near: 0.05,
  far: 100
});
```

The horizontal extent is `height * aspect`. Update camera position or direction with `setParameters(...).commitParameters()` before the next render.

## `ANARIRenderer`

```ts
new ANARIRenderer(
  device: ANARIDevice,
  subtype: ANARIRendererSubtype,
  parameters?: ANARIRendererParameters
);

newRenderer(
  subtype?: ANARIRendererSubtype,
  parameters?: ANARIRendererParameters
): ANARIRenderer;
```

Omitting the subtype selects `default`.

### Renderer feature comparison

This table describes the built-in `@luma.gl/scene` runtimes. **Fallback** means that
`deferred` renders the whole scene through the shared forward renderer when it cannot
represent the scene in its G-buffer. It does not mean that the deferred lighting pass
implements that feature. Registered custom renderers define their own support.

| Feature | `default` | `deferred` | `raytrace` | `debugNormals` / `debugDepth` |
| --- | --- | --- | --- | --- |
| Backend | WebGPU, WebGL 2 | WebGPU | WebGPU compute; no hardware ray tracing | WebGPU, WebGL 2 |
| Perspective and orthographic cameras | Yes | Yes | Yes | Yes |
| Retained meshes and instancing | Yes | Yes | Triangle meshes; analytic spheres | Yes |
| Matte and scalar metallic-roughness materials | Yes | Yes | Yes; diffuse or opaque GGX transport | Diagnostic output |
| Material image maps | Canonical PBR maps and UV transforms | Base color, normal, metallic-roughness, emissive, occlusion; advanced materials use fallback | No | Shared raster surface inputs; diagnostic output |
| Alpha masking | Scalar and texture alpha | Scalar and texture alpha | Scalar alpha only, including shadows and queries | Shared raster mask behavior |
| Alpha blending | Yes; sorted forward draws | Fallback | No | Shared raster blend behavior |
| Transmission and advanced PBR extensions | Yes; supported extensions and captured opaque-scene transmission | Fallback | No | Diagnostic output, not physical transport |
| Skeletal skinning and morph targets | Yes | Yes through shared raster geometry | No | Yes through shared raster geometry |
| Ambient, directional and point lights | Yes | Yes; one directional and up to 64 point lights, otherwise fallback | Yes | No lighting; normals or depth |
| Spot lights | Yes | Fallback | Yes | No lighting |
| Caller-provided image-based lighting | Yes | Fallback | No; background is not an environment light | No lighting |
| Emissive surface appearance | Yes | Yes | Yes | Diagnostic output |
| Emissive geometry illuminates other surfaces | No | No | Opt-in `emitterSampling`; also secondary emission gathering | No |
| Ray-traced direct-light shadows | No | No | Yes | No |
| Indirect diffuse and specular transport | No | No | Opt-in diffuse or opaque PBR bounces, up to 8; no MIS | No |
| Progressive sampling and adaptive ray resolution | No | No | Yes | No |
| Temporal antialiasing / history | Raster temporal AA on WebGPU | Raster temporal AA | Progressive history and primary-hit reprojection; indirect/PBR changes can reset history | No temporal AA |
| Guided spatial denoising | No | No | Yes, optional | No |
| Fog | Yes | Yes | Per-hit approximation | Diagnostic output |
| Bloom | Yes, optional | Yes through shared scene runtime | No | Disabled |
| HDR output | Compatible floating-point targets | Compatible floating-point targets | Compatible floating-point targets | Compatible targets; diagnostic values |
| `frame.pick()` and `captureChannels()` | No | No, including fallback | Yes; output-resolution identity, distance, normals and projected depth | No |

Backend availability does not guarantee every device, texture format, imported asset, or
material extension is supported. The ray runtime exposes
`getRayTracingSceneCapabilities(device)` from `@luma.gl/experimental` for implementation
support; it does not report per-scene capacity or allocations. Frame query support belongs
to the runtime that last rendered the frame.

Progressive accumulation does not automatically stop rendering at the history sample limit.
Applications control scheduling. The Chart Lighting playground demonstrates bounded idle
refinement and stopping at the limit; it retains half resolution rather than automatically
switching to full resolution when idle.

### Renderer parameters

```ts
type ANARIRendererParameters = {
  background?: ANARIVector4;
  ambientRadiance?: number;
  exposure?: number;
  toneMapMode?: 0 | 1 | 2 | 3;
  outputColorSpace?: 'linear' | 'srgb';
  samplesPerPixel?: number;
  maxBounces?: number;
  emitterSampling?: boolean;
  emitterSelection?: 'uniform' | 'power';
  progressive?: boolean;
  shadows?: boolean;
  resolutionScale?: number;
  minimumResolutionScale?: number;
  adaptiveResolution?: boolean;
  targetFrameTimeMilliseconds?: number;
  temporalReprojection?: boolean;
  shadowSamplesPerFrame?: number;
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  fogColor?: ANARIVector3;
  fogDensity?: number;
};
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `background` | `[0.015, 0.018, 0.038, 1]` | RGBA clear color. |
| `ambientRadiance` | `0.12` | Base white ambient light added before explicit world/group lights. |
| `exposure` | `1.35` | Final lighting exposure. |
| `toneMapMode` | Target-dependent | `0` disables tone mapping, `1` selects Reinhard, `2` selects Khronos PBR Neutral, and `3` selects ACES. Floating-point targets default to `0`; normalized targets default to `2`. |
| `outputColorSpace` | Target-dependent | Explicitly selects `'linear'` or `'srgb'` output. Floating-point and hardware-sRGB targets default to linear output; other normalized targets default to software sRGB encoding. |
| `samplesPerPixel` | `1` | Primary-ray samples per frame in the `raytrace` renderer. |
| `maxBounces` | `0` | Secondary diffuse bounce budget, clamped to 0–8. Zero preserves direct lighting. Changing it resets accumulation. |
| `emitterSampling` | `false` | Sample emissive geometry with direct shadow-tested connections. |
| `emitterSelection` | `'uniform'` | Select emitters uniformly or by `'power'` (area × luminance), with PDF compensation. |
| `progressive` | `true` | Accumulate ray-traced samples across unchanged frames. |
| `shadows` | `true` | Trace hard shadow rays toward direct lights in the `raytrace` renderer. |
| `resolutionScale` | `0.5` | Initial ray-tracing width and height as a fraction of the display resolution. |
| `minimumResolutionScale` | `0.25` | Lowest internal resolution scale available to adaptive ray tracing. |
| `adaptiveResolution` | `true` | Adjust internal resolution and sampled-pixel coverage toward the target frame budget. |
| `targetFrameTimeMilliseconds` | `33.3` | Target animation-frame interval used by adaptive ray-tracing quality. |
| `temporalReprojection` | `true` | Reuse compatible retained history while the camera or stable scene instances move. |
| `shadowSamplesPerFrame` | `1` | Maximum rotating direct-light shadow samples evaluated per pixel in one frame; `0` evaluates all direct lights. |
| `bloomIntensity` | `0` | Bloom amount; positive values allocate and run the bloom postprocessing path. |
| `bloomThreshold` | `0.62` | Brightness threshold for bloom extraction. |
| `bloomRadius` | `7` | Bloom blur radius. |
| `fogColor` | `[0.025, 0.035, 0.075]` | RGB atmospheric fog color. |
| `fogDensity` | `0` | Distance-based fog density. |

### Default renderer

```ts
const renderer = anariDevice.newRenderer('default', {
  background: [0.012, 0.016, 0.04, 1],
  ambientRadiance: 0.16,
  exposure: 1.5,
  bloomIntensity: 0.7,
  bloomThreshold: 0.65,
  bloomRadius: 8,
  fogColor: [0.03, 0.04, 0.09],
  fogDensity: 0.0004
});
```

Bloom renders into a temporary frame-sized texture before composing the result to the canvas. The intermediate texture uses the underlying device's preferred presentation format, preserving HDR values when the canvas uses `rgba16float`.

### Deferred renderer

```ts
const renderer = anariDevice.newRenderer('deferred', {
  ambientRadiance: 0.08,
  background: [0.006, 0.008, 0.018, 1]
});
```

`deferred` is a WebGPU-only alternate renderer that writes committed ANARI surfaces into a shared `GBuffer`, then resolves opaque PBR lighting with the experimental `deferredLighting` shader pass. It currently supports base color, normal, metallic-roughness, emissive, and occlusion maps, plus ambient, directional, point, and spot lights. Scenes containing spot lights use the shared forward fallback so their cone attenuation is preserved.

Its compact G-buffer uses four color attachments: HDR scene color (`rgba16float`), normal and
roughness (`rgba8unorm`), base color and metallic (`rgba8unorm`), and HDR emissive color with
occlusion (`rgba16float`). WebGPU charges eight render-target bytes for each format, totaling the
default CORE limit of 32 bytes per sample. No elevated device limits or `featureLevel: 'max'` are
required. The omitted velocity target previously contained only zeroes; HDR, physically based
material channels, direct lighting, and emissive output remain intact.

The deferred path is intended as an architecture baseline for richer ANARI renderers. It does not yet include the full Deferred Illumination Lab chain such as clustered light bins, GTAO, SSGI, SSR, velocity history, or bloom.

### Ray-tracing renderer

```ts
const renderer = anariDevice.newRenderer('raytrace', {
  background: [0.012, 0.016, 0.04, 1],
  samplesPerPixel: 1,
  maxBounces: 1,
  progressive: true,
  shadows: true,
  resolutionScale: 0.5,
  minimumResolutionScale: 0.25,
  adaptiveResolution: true,
  targetFrameTimeMilliseconds: 33.3,
  temporalReprojection: true,
  shadowSamplesPerFrame: 1
});

frame.setParameter('renderer', renderer).commitParameters();
```

`raytrace` requires WebGPU. The ANARI adapter translates committed scene objects into descriptors
for the shared `RayTracingSceneRenderer` in `@luma.gl/experimental`. Its GPU compute graph derives
world-space object bounds, Morton-sorts active object/instance leaves into an explicit retained
permutation, builds and refits a graph-owned complete-binary TLAS, and traverses that hierarchy for
nearest-hit rays and early-exit hard shadows. Transform-only animation gathers updated bounds
through the retained permutation and refits without sorting; topology changes and periodic spatial
refreshes rebuild the Morton order. A topology-only graph Morton-sorts each mesh's triangles into
GPU-built BLASes, which transform-only updates reuse. It traces transformed analytic spheres and
triangle meshes, including tessellated quads, cylinders, and cones; evaluates ambient, directional,
point, and spot lights; and presents the result through a fullscreen pass. An `rgba16float` canvas
or caller-owned framebuffer preserves HDR radiance; ordinary targets use the same configurable
tone-mapping and exact sRGB transfer as forward rendering. Scalar metallic-roughness materials use
GGX distribution, Smith visibility, Schlick Fresnel, and energy-balanced diffuse lighting. The
trace pass uses exactly eight storage buffers, and every TLAS or BLAS construction pass remains
within the default WebGPU CORE limit of eight storage buffers.

The default half-resolution internal target traces one quarter as many pixels as the output canvas.
When adaptive quality is enabled, the renderer can reduce scale to `0.25`, spread interleaved pixel
coverage across frames, and rotate one shadowed direct light per frame. It approaches the configured
frame budget using smoothed animation-frame intervals; no GPU timestamp feature is required. The
fullscreen presentation pass upsamples the internal HDR result.

Progressive history is reprojected through previous camera matrices and stable ANARI instance/group/
surface identities. Depth and normal validation plus bounded neighborhood color clamping reject
incompatible history; camera cuts, changed topology/materials, changed light counts, and target
resizing invalidate it. GPU acceleration updates are encoded only for changed geometry or transforms,
while camera-only and lighting-only frames reuse the retained TLAS. Transform-only frames use the
retained-permutation gather/refit graph; topology changes and periodic refreshes use the full Morton
build graph.

The Morton-sorted TLAS accelerates object and instance selection, while intersected meshes traverse
GPU-built Morton-sorted triangle BLASes. Hardware ray tracing and SAH/Karras hierarchy topology are
not implemented. Skeletal skinning, morph-target displacement, material textures, alpha blending/
transmission, and advanced PBR material extensions require raster rendering; deferred uses its forward fallback for unsupported materials.
Diffuse secondary transport is opt-in through `maxBounces` (0–8). Each bounce samples a
cosine-weighted hemisphere and gathers emission and existing direct lighting at the next hit,
so matte surfaces receive color bleeding and emissive illumination. The scalar diffuse
throughput in `transportMode: 'diffuse'` is base color × 0.96 × (1 − metallic).
`transportMode: 'pbr'` additionally samples opaque GGX reflection; transmission is not sampled. Misses contribute no indirect radiance: `background` is a display color, not an
environment light. Ambient lights and fog retain the existing per-hit approximations.

`samplingSeed` controls primary and diffuse paths. Pixel, frame, sample, and bounce indices
separate samples; unchanged progressive frames converge through the existing bounded history.
Seed and bounce-budget changes invalidate accumulation. With diffuse bounces enabled,
geometry, placement, material and light changes reset history even when temporal reprojection
is enabled: primary-hit metadata cannot validate indirect illumination. Camera movement resets
history when temporal reprojection is disabled; otherwise it uses the existing primary-hit
reprojection and camera-cut rejection.
Use a stationary scene, full resolution, disabled adaptive resolution and temporal reprojection,
and multiple progressive frames for comparison. Small emitters can converge slowly under the default BSDF-only emission gathering.
Opt-in explicit emitter sampling, opaque GGX transport and spatial denoising are available;
MIS, transmissive transport, advanced temporal denoising and volumes remain planned.

For the rationale behind the TLAS/BLAS split, Morton ordering, refit policy, megakernel execution,
and temporal reconstruction policy, see
[ray-tracing technique background and tradeoffs](/docs/api-guide/engine/anari-architecture#ray-tracing-technique-background-and-tradeoffs).

Applications can also
[register custom renderer runtimes](/docs/api-reference/scene/anari-device#registering-renderer-runtimes).

### Debug normals

```ts
const normals = anariDevice.newRenderer('debugNormals');
frame.setParameter('renderer', normals).commitParameters();
```

`debugNormals` visualizes world-space surface normals as RGB values. Bloom is disabled automatically in this renderer mode.

### Debug depth

```ts
const depth = anariDevice.newRenderer('debugDepth');
frame.setParameter('renderer', depth).commitParameters();
```

`debugDepth` visualizes scene depth. Bloom is disabled automatically in this renderer mode.

### Updating renderer settings

```ts
renderer
  .setParameters({exposure: 1.8, bloomIntensity: 0.9, fogDensity: 0.001})
  .commitParameters();
```

Committed renderer settings apply on the next frame. Set `bloomIntensity` to `0` to bypass the bloom pass.

## `ANARIFrame`

```ts
new ANARIFrame(device: ANARIDevice, parameters: ANARIFrameParameters);
newFrame(parameters: ANARIFrameParameters): ANARIFrame;

type ANARIFrameParameters = {
  world: ANARIWorld;
  camera: ANARICamera;
  renderer: ANARIRenderer;
  size?: readonly [number, number];
};
```

| Parameter | Required | Meaning |
| --- | --- | --- |
| `world` | Yes | Committed scene hierarchy. |
| `camera` | Yes | Committed perspective or orthographic camera. |
| `renderer` | Yes | Committed renderer and presentation controls. |
| `size` | No | Explicit width and height in drawing-buffer pixels. Defaults to the device canvas drawing-buffer size. |

```ts
const frame = anariDevice.newFrame({
  world,
  camera,
  renderer,
  size: [1280, 720]
});
```

### `render()`

```ts
render(): ANARIFrameStatistics;
```

Compiles committed scene objects as necessary, updates transforms and material/light uniforms, draws the world, optionally runs bloom, and returns render statistics:

```ts
const statistics = frame.render();
graphicsDevice.submit();
```

If required world, camera, or renderer parameters are absent from committed frame state, the implementation returns zero-valued statistics without rendering.

### `pick(x, y)`

```ts
frame.render();
graphicsDevice.submit();
const hit = await frame.pick(x, y);
if (hit) {
  console.log(hit.surface, hit.instance, hit.position, hit.normal);
}
```

The built-in WebGPU `raytrace` renderer traces one centered camera ray at the requested
output pixel. Coordinates use the frame's drawing-buffer size, with the origin at the
top left; convert CSS pointer coordinates before calling. Picking uses full output
resolution even when rendering uses reduced resolution or sparse temporal sampling.
Submit the rendered frame before picking. The query submits its own command buffer and
reads back only 32 bytes; it does not flush pending application commands.

```ts
type ANARIPickResult = {
  surface: ANARISurface;
  instance?: ANARIInstance;
  placementId: string;
  position: ANARIVector3;
  normal: ANARIVector3;
  distance: number;
};
```

`surface` and optional `instance` are the original retained objects. `placementId`
identifies their placement and stays stable when the world is reordered. Position and
normal are in world space; distance is measured from the camera ray origin, which is
on the near plane for orthographic cameras. Queries capture identity mappings before
asynchronous readback, so later scene edits cannot reassign a pending result.

Picking uses the runtime that last rendered the frame, even if a different renderer
has since been committed. Background, out-of-bounds or non-finite coordinates,
unrendered/destroyed frames, and frames last rendered by a built-in raster renderer
return `null`. Intersections use the ray renderer's opaque
geometry semantics. Scalar alpha masks exclude below-cutoff surfaces; alpha blending and transmission remain unsupported.
The experimental `SelectionOutline` overlay draws visible selected placement boundaries.
Projected-depth transfer for raster overlays is available through `DepthTextureCopy`.

### `captureChannels()`

```ts
frame.render();
graphicsDevice.submit();
const channels = frame.captureChannels();
if (channels) {
  // Bind the textures to a GPU effect or use Texture.readBuffer() for explicit readback.
  // Identifier texel value n > 0 resolves to channels.identifiers[n - 1].
  // Release the snapshot after submitting its final GPU use.
  graphicsDevice.submit();
  channels.destroy();
}
```

The built-in WebGPU `raytrace` runtime traces one centered primary ray for every output
pixel and returns a caller-owned GPU snapshot. Its size matches the drawing-buffer frame
size, independently of resolution scaling, jitter, progressive accumulation, or sparse
sampling. Texture coordinates use a top-left origin, matching `pick()`. The capture
submits its own command buffer, performs no CPU readback, and does not flush application
commands. Render and submit the scene before capturing it.

| Property | Format / meaning |
| --- | --- |
| `identifierTexture` | `r32uint`: exact integer placement identifier; zero denotes background. |
| `distanceTexture` | `r32float`: distance from the camera ray origin in world units; zero denotes background. Orthographic origins lie on the near plane. This is not projected device depth. |
| `normalTexture` | `rgba32float`: world-space normal in xyz, hit validity in alpha. Background is all zero. |
| `projectedDepthTexture` | `r32float`: projected WebGPU depth in zero-to-one range, from the last rendered camera; background is one. |
| `identifiers` | Array mapping nonzero texel value `n` to index `n - 1`, containing the original `surface`, optional `instance`, and stable `placementId`. |
| `destroy()` | Releases all four snapshot textures. |

Identifiers are local to each snapshot: retain its identity table with its textures.
Placement IDs remain stable when scene extraction reorders packed primitives. Snapshots
are independent of subsequent renders, resizing, and frame destruction; the application
must submit commands using the textures before releasing them, while the graphics device
is still alive. Each capture allocates
28 bytes per output pixel and performs an additional full-frame traversal, so capture
only when needed. Float textures require unfilterable texture bindings; identifiers
require unsigned integer bindings. All four support texture sampling and explicit
texture-to-buffer copies.

Like picking, capture uses the runtime that last rendered the frame. Unrendered or
destroyed frames and frames last rendered by the built-in raster runtime return `null`.
Channels use scalar alpha-mask intersection semantics. Texture alpha, blending and transmission remain separate work.
Use [`DepthTextureCopy`](/docs/api-reference/experimental/depth-texture-copy) to transfer
`projectedDepthTexture` into a color-preserving render pass with a depth attachment before
drawing raster overlays with matching camera and viewport conventions.

### Selection outlines

Use [`SelectionOutline`](/docs/api-reference/experimental/selection-outline) to draw an
inward border over a selected visible placement. Resolve a `pick()` placement ID against
the current snapshot identity table, rather than reusing an integer ID from an older
snapshot. The JSON playground performs this lookup each frame while a mark is selected.

### `statistics`

```ts
frame.statistics: ANARIFrameStatistics;

type ANARIFrameStatistics = {
  surfaceCount: number;
  instanceCount: number;
  drawCount: number;
  triangleCount: number;
  rayTracing?: {
    internalWidth: number;
    internalHeight: number;
    resolutionScale: number;
    sampledPixelCoverage: number;
    frameTimeMilliseconds: number;
    accumulatedSamples: number;
    graph?: {
      nodeCount: number;
      computePassCount: number;
      coalescedComputeNodeCount: number;
      cpuEncodeTimeMilliseconds: number;
      topology?: ANARIRayTracingGraphStageStatistics;
      acceleration?: ANARIRayTracingGraphStageStatistics;
      refit?: ANARIRayTracingGraphStageStatistics;
      trace: ANARIRayTracingGraphStageStatistics;
    };
  };
};
```

| Statistic | Meaning |
| --- | --- |
| `surfaceCount` | Number of distinct retained surface identities visible in the world. |
| `instanceCount` | Number of direct and instanced surface placements. |
| `drawCount` | Number of successful model draws, normally one per distinct raster surface or one ray-tracing presentation draw. |
| `triangleCount` | Sum of mesh triangles across all placements; analytic ray-traced spheres contribute zero. |
| `rayTracing` | Optional internal resolution, effective scale, sampled-pixel coverage, smoothed frame time, accumulated samples, and synchronous graph-stage diagnostics; present only for the `raytrace` renderer. |
| `rayTracing.graph` | Logical node counts, physical compute-pass counts, coalesced compute-node counts, and CPU encoding time for the stages actually recorded during this frame. |

`frame.statistics` is initialized with zeroes and updated by each `frame.render()` call.

The `trace` graph stage is always present. `topology` appears only when mesh hierarchies are
rebuilt, and `acceleration` and `refit` are mutually exclusive full-build and transform-only TLAS
stages. These counters describe synchronous encoding only: collecting them does not submit the
application's encoder, wait for the GPU, or read a buffer back to the CPU.

### Resizing

```ts
frame.setParameter('size', [canvas.width, canvas.height]).commitParameters();
```

Omit `size` to follow the canvas drawing-buffer size. Changing an explicit frame size resizes bloom's temporary framebuffer on the next render.

### Replacing world, camera, or renderer

```ts
frame.setParameters({
  world: nextWorld,
  camera: nextCamera,
  renderer: nextRenderer
}).commitParameters();
```

Each replacement must be committed on the frame. Scene objects referenced by the previous world can still be reused elsewhere.

### `destroy()`

```ts
destroy(): void;
```

Releases the frame's cached models, instance buffers, intermediate textures/framebuffers, and bloom renderer. Call it before disposing of the parent ANARI or graphics device.

## Shared exported types

```ts
type ANARIVector3 = readonly [number, number, number];
type ANARIVector4 = readonly [number, number, number, number];
type ANARIMatrix4 = readonly number[];

type ANARIGeometrySubtype = 'triangle' | 'sphere' | 'cylinder' | 'cone' | 'quad' | 'hexPrism' | 'torus' | 'ring';
type ANARIMaterialSubtype = 'matte' | 'physicallyBased';
type ANARILightSubtype = 'ambient' | 'directional' | 'point' | 'spot';
type ANARICameraSubtype = 'perspective' | 'orthographic';
type ANARIRendererSubtype =
  | 'default'
  | 'deferred'
  | 'debugNormals'
  | 'debugDepth'
  | 'raytrace'
  | (string & Record<never, never>);
```

All parameter interfaces, object classes, subtype aliases, object metadata, and frame statistics are exported from `@luma.gl/scene`.


### Sampling and quality

`raytrace` accepts `samplingSeed` (uint32, default zero) for deterministic primary and diffuse
sample rotations. A changed seed resets accumulation; centered picking and hit channels
are unaffected. Use the same seed and frame count on the same backend for comparisons.
[`getRayTracingQualityPreset`](/docs/api-reference/experimental/ray-tracing-quality-presets)
returns explicit interactive/still renderer settings without modifying exposure or seed.

### Emissive lighting and scalar alpha masks

`emitterSampling: true` enables explicit emissive-geometry connections with
both diffuse and PBR transport, including at zero material bounces. It defaults
to false. Scalar `alphaMode: 'mask'` compares committed opacity against
`alphaCutoff` for color, secondary/shadow rays, picking and channels. Masked
emitters are excluded from the sampling table. See the
[ray quality reference](/docs/api-reference/experimental/ray-tracing-quality-presets#explicit-emissive-lighting-and-scalar-masks)
for sampling semantics and current limitations. `emitterSelection: 'power'` enables
area/luminance-weighted emitter selection; uniform selection remains the default.
