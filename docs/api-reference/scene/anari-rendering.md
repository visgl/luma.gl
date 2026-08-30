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
| `maxBounces` | Not applied | Reserved ray-tracing bounce limit; the current implementation evaluates direct lighting only. |
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

`deferred` is a WebGPU-only alternate renderer that writes committed ANARI surfaces into a shared `GBuffer`, then resolves opaque PBR lighting with the experimental `deferredLighting` shader pass. It currently supports base color, normal, metallic-roughness, emissive, and occlusion maps, plus ambient, directional, point, and spot lights. Spot lights are mapped onto deferred point lights in this first implementation.

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
not implemented. Skeletal skinning, morph-target displacement, material textures, alpha/
transmission, and advanced PBR material extensions remain on the forward/deferred renderer paths.
Indirect multi-bounce path tracing, denoising, and volumes are also unsupported. `maxBounces` is
accepted for forward compatibility but does not enable indirect bounces.

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

type ANARIGeometrySubtype = 'triangle' | 'sphere' | 'cylinder' | 'cone' | 'quad';
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
