# Declarative Rendering with ANARI

<p className="badges">
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Experimental" />
  <img src="https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square" alt="Private workspace" />
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
</p>

`@luma.gl/anari` is an experimental, private retained-mode rendering layer inspired by ANARI. Instead of building pipelines, binding buffers, and issuing individual draw calls, an application describes a world containing geometry, materials, lights, and cameras. A renderer compiles that description into luma.gl models and renders it through either WebGPU or WebGL 2.

This guide explains the complete application workflow, object lifecycle, animation, HDR configuration, batching strategy, and current proof-of-concept limitations. For exact signatures and parameter defaults, see the [`@luma.gl/anari` API reference](/docs/api-reference/anari).

For a function-by-function comparison with the Khronos ANARI 1.1 C API and a conceptual THREE.js migration table, see [ANARI C API and THREE.js Mapping](/docs/api-reference/anari/anari-api-mapping).

:::caution
This package is ANARI-inspired, not a JavaScript binding for the ANARI C API. It implements a useful subset of ANARI concepts but does not claim Khronos conformance.
:::

## Why use a retained rendering API?

A conventional luma.gl application typically creates geometries, shader modules, models, render pipelines, and render passes directly. That is ideal when an application needs detailed control over the GPU.

An ANARI-style application instead declares scene intent:

```text
geometry + material → surface
surface + light → group
group + transform → instance
instances + lights → world
world + camera + renderer → frame
```

The renderer chooses model creation, shader selection, instance batching, light uniform updates, render passes, bloom, and compatible backend implementations. The application can update retained objects without manually rewriting GPU binding logic.

This is particularly useful when an application should expose a stable scene contract to multiple visualization tools, scene importers, or potential rendering backends.

## Use the private workspace

`@luma.gl/anari` is a private luma.gl workspace and is not published to npm. Install repository
dependencies from a luma.gl checkout:

```bash
yarn install
```

Other in-repository workspaces can depend on the private package through:

```json
{
  "dependencies": {
    "@luma.gl/anari": "workspace:*"
  }
}
```

At least one luma.gl backend is required. Use `@luma.gl/webgpu` for modern browsers and optional HDR presentation, and add `@luma.gl/webgl` when a WebGL 2 fallback is important.

## Create a graphics device

Start with an ordinary luma.gl `Device` and wrap it in `ANARIDevice`:

```ts
import {ANARIDevice} from '@luma.gl/anari';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';

const canvas = document.querySelector('canvas');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('The application requires a canvas element');
}

const graphicsDevice = await luma.createDevice({
  adapters: [webgpuAdapter, webgl2Adapter],
  createCanvasContext: {canvas}
});

const anariDevice = new ANARIDevice(graphicsDevice);
```

Adapter order determines preference: this example uses WebGPU when available and falls back to WebGL 2.

`ANARIDevice` wraps the graphics device but does not own it. Your application remains responsible for graphics-device setup, canvas presentation, command submission, and final destruction.

## Build your first scene

The following complete scene adds a metallic sphere, floor, directional light, animated point light, camera, renderer, and animation loop. It assumes a page containing `<canvas></canvas>`.

```ts
import {ANARIDevice} from '@luma.gl/anari';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';
import {Matrix4} from '@math.gl/core';

const canvas = document.querySelector('canvas');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Add a canvas element before starting the renderer');
}

const graphicsDevice = await luma.createDevice({
  adapters: [webgpuAdapter, webgl2Adapter],
  createCanvasContext: {canvas}
});

const anariDevice = new ANARIDevice(graphicsDevice);

const sphereGeometry = anariDevice.newGeometry('sphere', {
  radius: 0.9,
  segments: 32
});

const sphereMaterial = anariDevice.newMaterial('physicallyBased', {
  baseColor: [0.18, 0.52, 0.96],
  metallic: 0.85,
  roughness: 0.18,
  clearcoat: 0.25
});

const sphereSurface = anariDevice.newSurface({
  geometry: sphereGeometry,
  material: sphereMaterial
});

const floorSurface = anariDevice.newSurface({
  geometry: anariDevice.newGeometry('quad', {width: 12, height: 12}),
  material: anariDevice.newMaterial('matte', {
    color: [0.16, 0.18, 0.24]
  })
});

const sphereGroup = anariDevice.newGroup({surface: [sphereSurface]});
const sphereInstance = anariDevice.newInstance({
  group: sphereGroup,
  transform: new Matrix4().translate([0, 1, 0])
});

const sunlight = anariDevice.newLight('directional', {
  direction: [-0.6, -1, -0.4],
  color: [1, 0.9, 0.76],
  irradiance: 2.5
});

const orbitingLight = anariDevice.newLight('point', {
  position: [3, 2, 0],
  color: [1, 0.32, 0.12],
  intensity: 28
});

const world = anariDevice.newWorld({
  surface: [floorSurface],
  instance: [sphereInstance],
  light: [sunlight, orbitingLight]
});

const camera = anariDevice.newCamera('perspective', {
  position: [0, 3, 8],
  direction: [0, -2, -8],
  fovy: Math.PI / 4
});

const renderer = anariDevice.newRenderer('default', {
  background: [0.012, 0.016, 0.04, 1],
  ambientRadiance: 0.12,
  exposure: 1.5,
  bloomIntensity: 0.45
});

const frame = anariDevice.newFrame({world, camera, renderer});

function render(milliseconds: number): void {
  const seconds = milliseconds / 1000;

  orbitingLight
    .setParameter('position', [Math.cos(seconds) * 3, 2, Math.sin(seconds) * 3])
    .commitParameters();

  frame.render();
  graphicsDevice.submit();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
```

The floor is attached directly to the world, so it uses the identity transform. The sphere is attached through a reusable group and transform instance.

## Try the deferred renderer

Use `newRenderer('deferred')` when you want the ANARI scene rendered through the experimental WebGPU G-buffer and deferred lighting path:

```ts
const renderer = anariDevice.newRenderer('deferred', {
  ambientRadiance: 0.08,
  background: [0.006, 0.008, 0.018, 1]
});
```

The deferred renderer shares ANARI scene traversal, generated geometry, instance transforms, and PBR material textures with the default renderer, then resolves lighting through `@luma.gl/experimental` `GBuffer` and `deferredLighting`. This first path is intentionally limited to opaque material channels and direct lights; clustered lighting and screen-space effects remain separate follow-up work.

The compact G-buffer runs within the default WebGPU CORE limit of 32 color-attachment bytes per
sample. Its four targets retain HDR scene color (`rgba16float`), normal and roughness (`rgba8unorm`),
base color and metallic (`rgba8unorm`), and HDR emissive color with occlusion (`rgba16float`). Each
format costs eight render-target bytes under WebGPU accounting, for exactly 32 bytes total. ANARI's
previous velocity target contained only zeroes and was never consumed, so omitting it preserves
physically based direct lighting, HDR, and emissive response without requesting elevated device
limits. Temporal motion-vector effects remain future work.

## Try the graph-based ray tracer

On WebGPU, switch the same retained scene to the software ray-tracing renderer:

```ts
const renderer = anariDevice.newRenderer('raytrace', {
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

The ANARI adapter passes committed scene descriptors to `RayTracingSceneRenderer` from
`@luma.gl/experimental`. Its WebGPU compute graph derives world-space bounds for transformed
analytic spheres and mesh instances, Morton-sorts active object/instance leaves into an explicit
retained permutation, builds and refits a graph-owned complete-binary TLAS, and traverses that
hierarchy for nearest-hit primary rays and early-exit shadow rays. Transform-only animation gathers
updated bounds through the retained permutation and refits the TLAS without sorting; topology
changes and periodic spatial refreshes rebuild the Morton order. A topology-only graph also
Morton-sorts each mesh's triangles into GPU-built BLASes, which transform-only animation reuses.
Small mesh permutations and hierarchies sharing packed scene storage are grouped into reusable
segmented sort and BVH dispatches instead of opening separate sorting and hierarchy dispatches for
every mesh.
The instance-bounds pass reads each mesh BLAS root directly, producing a tight transformed local
AABB instead of expanding elongated meshes to their enclosing sphere. Small sorts and hierarchy
builds execute inside one workgroup; larger sorts use stable four-bit radix passes, and consecutive
compute nodes share a command-encoder compute pass when per-node GPU timestamps are not requested.
The same `GPUCommandGraph` evaluates direct lights, progressively accumulates unchanged primary-ray
samples, and presents HDR when the canvas is configured for it. Generated quads, cylinders, and
cones use their existing triangle geometry.

Ray tracing starts at half the display width and height, reducing its initial pixel workload to one
quarter of full resolution. Adaptive quality can lower that scale to `0.25`, interleave sampled
pixels across animation frames, and rotate one shadowed direct light per frame to approach the
default `33.3` millisecond frame budget. The fullscreen resolve upsamples the retained HDR image.
Temporal reprojection follows camera and stable instance motion while rejecting incompatible depth,
normal, and color history; camera cuts, topology changes, light-count changes, and resolution
changes reset invalid history. Retained color and surface-metadata texture pairs exchange their
previous/current graph roles after each successful encoding, eliminating the former four full-image
history copies. Interleaved frames carry only their untouched pixels through a small coalesced
compute dispatch; full-coverage frames perform no history carry. Set `shadowSamplesPerFrame: 0` to
evaluate every direct light in one frame. Adaptive timing uses smoothed animation-frame intervals
and does not require GPU timestamp queries. Acceleration updates run only when retained transforms
or geometry change, so camera-only and lighting-only frames do not rebuild the TLAS. Transform-only
frames use the retained-permutation gather/refit path; topology changes and periodic refreshes run
the Morton sort path. The ANARI adapter caches normalized surfaces, materials, lights, and analytic
primitives by committed world identity. Categorized topology, transform, material, and light
revisions let camera-only frames reuse those descriptors without serializing the entire scene;
committed instance changes additionally expose their exact stable placement identities.

The Morton-sorted TLAS indexes objects and instances; surviving meshes traverse GPU-built,
Morton-sorted per-mesh triangle BLASes. The ray-tracing pass uses exactly eight storage buffers,
while every TLAS or BLAS construction pass stays within the default WebGPU CORE limit of eight
storage buffers without elevated device features. The hierarchy topology is not SAH-optimized or a
Karras-style LBVH. This is software ray tracing, not hardware ray tracing or full path tracing.
Skeletal skinning, morph-target deformation, material textures, alpha/transmission, advanced PBR
shading, indirect bounces, denoising, and volume objects remain unsupported by this renderer.
`maxBounces` is reserved for future multi-bounce transport.

## Understand staging and commits

Every retained object has **pending** and **committed** parameters. Initial constructor parameters are committed automatically, but later changes are invisible until committed:

```ts
const material = anariDevice.newMaterial('physicallyBased', {roughness: 0.6});

material.setParameter('roughness', 0.1);
material.getParameter('roughness'); // Still 0.6.

material.commitParameters();
material.getParameter('roughness'); // Now 0.1.
```

Batch related changes before committing:

```ts
material
  .setParameters({
    baseColor: [1, 0.68, 0.18],
    metallic: 0.95,
    roughness: 0.12
  })
  .commitParameters();
```

Removing a parameter also requires a commit:

```ts
material.unsetParameter('clearcoat').commitParameters();
```

Commit the object you actually changed. Updating a light requires committing the light; replacing a frame's renderer requires committing the frame:

```ts
orbitingLight.setParameter('intensity', 45).commitParameters();
frame.setParameter('renderer', debugRenderer).commitParameters();
```

Each commit increments the object's `version`. Geometry versions invalidate cached GPU geometry; material and light values are reread during rendering.

## Create geometry

Procedural geometry subtypes are `sphere`, `cylinder`, `cone`, and `quad`:

```ts
const sphere = anariDevice.newGeometry('sphere', {radius: 1, segments: 32});
const cylinder = anariDevice.newGeometry('cylinder', {radius: 0.4, height: 2});
const cone = anariDevice.newGeometry('cone', {radius: 0.7, height: 1.4});
const ground = anariDevice.newGeometry('quad', {width: 20, height: 20});
```

For an explicit triangle mesh, provide packed positions and optionally normals, two texture
coordinate sets, tangents, RGBA vertex colors, joint attributes, morph targets, and indices:

```ts
const triangleMesh = anariDevice.newGeometry('triangle', {
  'vertex.position': new Float32Array([
    -1, 0, 0,
     1, 0, 0,
     0, 1, 0
  ]),
  'vertex.normal': new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
  ]),
  'vertex.attribute1': new Float32Array([0, 0, 1, 0, 0.5, 1]),
  'vertex.attribute2': new Float32Array([0.25, 0, 0.75, 0, 0.5, 1]),
  'primitive.index': new Uint16Array([0, 1, 2])
});
```

`vertex.attribute1` and `vertex.attribute2` map to glTF `TEXCOORD_0` and `TEXCOORD_1`.
`vertex.attribute0` retains RGB or RGBA vertex colors; `vertex.tangent` preserves tangent
handedness. Joint indices and normalized floating-point weights use `vertex.joint` and
`vertex.weight`. Morph targets contain optional `POSITION`, `NORMAL`, and `TANGENT` deltas;
changing `morphWeights` updates the existing packed GPU vertex buffer without rebuilding the model.

`ANARIArray` can wrap typed arrays without copying:

```ts
const positions = new Float32Array([-1, 0, 0, 1, 0, 0, 0, 1, 0]);
const positionArray = anariDevice.newArray({
  data: positions,
  elementType: 'float32x3'
});

const geometry = anariDevice.newGeometry('triangle', {
  'vertex.position': positionArray
});
```

When changing array contents after the geometry has already rendered, commit the geometry to rebuild its cached GPU representation.

## Build reusable surfaces and instances

A surface pairs one geometry with one material:

```ts
const surface = anariDevice.newSurface({
  geometry: sphereGeometry,
  material: sphereMaterial
});
```

Place the same surface many times by sharing a group:

```ts
const group = anariDevice.newGroup({surface: [surface]});
const instances = [];

for (let index = 0; index < 100; index++) {
  const horizontal = (index % 10) * 2 - 9;
  const depth = Math.floor(index / 10) * 2 - 9;

  instances.push(
    anariDevice.newInstance({
      group,
      transform: new Matrix4().translate([horizontal, 1, depth])
    })
  );
}

const world = anariDevice.newWorld({instance: instances, light: [sunlight]});
```

The runtime groups placements by **surface object identity**. One shared surface in 100 instances normally produces one luma.gl `Model`, one instanced draw, and 100 instance placements.

Avoid constructing a new `ANARISurface` for every placement when geometry and material can be shared. Distinct surface identities produce distinct compiled models and draw calls.

Transforms are 16-element column-major matrices. `@math.gl/core`'s `Matrix4` can compose translation, rotation, and scale:

```ts
const transform = new Matrix4()
  .translate([4, 2, -3])
  .rotateY(Math.PI / 4)
  .scale([1, 2, 1]);
```

## Use physically based materials

`physicallyBased` exposes metallic/roughness shading, emission, clearcoat, sheen, specular,
transmission/volume parameters, iridescence, anisotropy, and explicit alpha controls:

```ts
const polishedMetal = anariDevice.newMaterial('physicallyBased', {
  baseColor: [0.92, 0.72, 0.24],
  metallic: 1,
  roughness: 0.1,
  clearcoat: 0.3
});

const emissivePanel = anariDevice.newMaterial('physicallyBased', {
  baseColor: [0.08, 0.1, 0.2],
  emissive: [0.25, 0.7, 1],
  emissiveStrength: 6,
  roughness: 0.32
});

const matteWall = anariDevice.newMaterial('matte', {
  color: [0.28, 0.3, 0.35]
});

const maskedLeaves = anariDevice.newMaterial('physicallyBased', {
  alphaMode: 'mask',
  alphaCutoff: 0.4,
  doubleSided: true
});
```

All 17 supported glTF PBR texture slots map to retained image samplers. Base-color, emissive,
specular-color, and sheen-color maps use sRGB inputs; normal, metallic/roughness, occlusion, and
other data maps remain linear. Samplers preserve authored wrapping, filtering, mipmap selection,
UV set, and texture transforms.

Transmissive physical materials retain their authored `opaque` alpha mode. When a surface has a
nonzero transmission factor, the shared forward renderer automatically captures the opaque
background and refracts that scene color using its index of refraction, thickness, roughness,
Fresnel response, and volume attenuation:

```ts
const glass = anariDevice.newMaterial('physicallyBased', {
  alphaMode: 'opaque',
  transmission: 1,
  roughness: 0.08,
  thickness: 0.4,
  attenuationDistance: 2,
  attenuationColor: [0.85, 0.96, 1],
  indexOfRefraction: 1.5
});
```

The capture includes opaque, non-transmissive scene surfaces; layered glass is not recursively
resolved. Renderer parameters can also receive the caller-owned
[prepared PBR lighting environment](/docs/api-reference/experimental/pbr-environment) for
roughness-aware diffuse/specular image-based lighting.

An emissive surface glows but does not illuminate neighboring surfaces by itself. Add a point or spot light when it should act as a visible light source.

## Add and animate lights

World lights use world-space positions and directions:

```ts
const ambient = anariDevice.newLight('ambient', {radiance: 0.16});

const directional = anariDevice.newLight('directional', {
  direction: [-1, -1, -0.4],
  irradiance: 1.8
});

const point = anariDevice.newLight('point', {
  position: [3, 2, 0],
  color: [1, 0.25, 0.1],
  intensity: 40
});

const spot = anariDevice.newLight('spot', {
  position: [0, 6, 2],
  direction: [0, -1, -0.25],
  openingAngle: Math.PI / 6,
  falloffAngle: Math.PI / 9,
  intensity: 30
});

world.setParameter('light', [ambient, directional, point, spot]).commitParameters();
```

Animate the same retained light instead of replacing the world every frame:

```ts
function animate(seconds: number): void {
  point
    .setParameters({
      position: [Math.cos(seconds) * 4, 2, Math.sin(seconds) * 4],
      intensity: 30 + Math.sin(seconds * 2) * 8
    })
    .commitParameters();
}
```

The showcase pairs animated point lights with small emissive spheres so viewers can see where each light originates. Emissive geometry and light illumination are separate retained objects.

## Select cameras and renderers

Perspective and orthographic cameras share position, direction, near, far, and aspect settings:

```ts
const perspective = anariDevice.newCamera('perspective', {
  position: [0, 3, 10],
  direction: [0, -2, -10],
  fovy: Math.PI / 3
});

const orthographic = anariDevice.newCamera('orthographic', {
  position: [0, 8, 12],
  direction: [0, -7, -12],
  height: 12
});
```

The renderer controls scene presentation:

```ts
const beauty = anariDevice.newRenderer('default', {
  exposure: 1.5,
  bloomIntensity: 0.75,
  bloomThreshold: 0.65,
  bloomRadius: 8,
  fogColor: [0.02, 0.03, 0.07],
  fogDensity: 0.00035
});

const normals = anariDevice.newRenderer('debugNormals');
const depth = anariDevice.newRenderer('debugDepth');
const deferred = anariDevice.newRenderer('deferred');
const raytrace = anariDevice.newRenderer('raytrace', {shadows: true});
```

Switch renderers by committing the frame:

```ts
frame.setParameter('renderer', normals).commitParameters();
```

Debug renderers automatically skip bloom. Switch to `deferred` for the WebGPU G-buffer path,
`raytrace` for WebGPU software ray tracing, or `default` for the portable forward renderer with
bloom.

## Handle resizing

If `frame.size` is omitted, the renderer derives its size from the graphics device's current drawing buffer:

```ts
const frame = anariDevice.newFrame({world, camera, renderer});
```

When an integration provides drawing-buffer dimensions explicitly, update the frame during resize:

```ts
function resize(width: number, height: number): void {
  frame.setParameter('size', [width, height]).commitParameters();
}
```

Bloom framebuffers are recreated when the requested frame size changes. Camera aspect defaults to `width / height` unless an explicit camera `aspect` is supplied.

## HDR and backend selection

HDR requires all three pieces:

1. An HDR-capable browser/display combination.
2. A WebGPU canvas configured with a floating-point format, Display P3, and extended tone mapping.
3. A rendering path that preserves values above SDR white.

```ts
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';

const supportsHighDynamicRange = window.matchMedia('(dynamic-range: high)').matches;

const graphicsDevice = await luma.createDevice({
  adapters: supportsHighDynamicRange
    ? [webgpuAdapter]
    : [webgpuAdapter, webgl2Adapter],
  createCanvasContext: supportsHighDynamicRange
    ? {
        canvas,
        colorFormat: 'rgba16float',
        colorSpace: 'display-p3',
        toneMapping: 'extended'
      }
    : {canvas}
});
```

The ANARI renderer detects `graphicsDevice.preferredColorFormat === 'rgba16float'` and retains radiance above SDR white instead of applying only the standard SDR compression curve. Bloom intermediates also use the preferred device color format.

`(dynamic-range: high)` indicates display support, not a guarantee that every browser accepts every HDR canvas option. Production applications may need capability checks, error handling, or a retry with an SDR canvas configuration.

WebGL 2 uses the portable SDR rendering path. The showcase accepts `?backend=webgl` to force that fallback for comparison.

:::note
The user-visible HDR effect depends on the monitor, browser, operating-system display settings, surrounding page brightness, and whether scene lighting actually exceeds SDR white.
:::

## Integrate with `AnimationLoop`

The repository showcase uses `AnimationLoopTemplate` to coordinate drawing, resizing, and cleanup:

```ts
import {ANARIDevice} from '@luma.gl/anari';
import {
  AnimationLoopTemplate,
  makeAnimationLoop,
  type AnimationProps
} from '@luma.gl/engine';

class SceneLoop extends AnimationLoopTemplate {
  readonly anariDevice: ANARIDevice;
  readonly frame;
  readonly orbitingLight;

  constructor({device}: AnimationProps) {
    super();
    this.anariDevice = new ANARIDevice(device);

    const geometry = this.anariDevice.newGeometry('sphere');
    const material = this.anariDevice.newMaterial('physicallyBased', {
      baseColor: [0.22, 0.5, 0.9],
      metallic: 0.8,
      roughness: 0.2
    });
    const surface = this.anariDevice.newSurface({geometry, material});
    this.orbitingLight = this.anariDevice.newLight('point', {
      position: [3, 2, 0],
      intensity: 35
    });

    const world = this.anariDevice.newWorld({
      surface: [surface],
      light: [this.orbitingLight]
    });
    const camera = this.anariDevice.newCamera('perspective', {
      position: [0, 1.5, 6],
      direction: [0, -0.5, -6]
    });
    const renderer = this.anariDevice.newRenderer('default', {
      bloomIntensity: 0.5
    });

    this.frame = this.anariDevice.newFrame({world, camera, renderer});
  }

  override onRender({width, height, time}: AnimationProps): void {
    const seconds = time / 1000;

    this.orbitingLight
      .setParameter('position', [Math.cos(seconds) * 3, 2, Math.sin(seconds) * 3])
      .commitParameters();

    this.frame.setParameter('size', [width, height]).commitParameters();
    this.frame.render();
  }

  override onFinalize(): void {
    this.frame.destroy();
    this.anariDevice.destroy();
  }
}

makeAnimationLoop(SceneLoop, {device: graphicsDevice}).start();
```

Avoid committing frame size every frame in a performance-sensitive application; compare the previous dimensions first, as the showcase does.

## Inspect rendering statistics

```ts
const statistics = frame.render();

console.log({
  distinctSurfaces: statistics.surfaceCount,
  visiblePlacements: statistics.instanceCount,
  drawCalls: statistics.drawCount,
  renderedTriangles: statistics.triangleCount,
  rayTracing: statistics.rayTracing
});
```

Use these numbers to verify batching behavior. If `instanceCount` is high but `drawCount` is similarly high, check whether each placement accidentally creates its own surface instead of reusing a retained surface.

Ray-traced frames additionally report their internal resolution and effective scale, sampled-pixel
coverage, smoothed frame time, and accumulated sample count. Other renderer subtypes omit
`statistics.rayTracing`.

The renderer also supports capability discovery:

```ts
anariDevice.getObjectSubtypes('geometry');
anariDevice.getObjectSubtypes('renderer');
anariDevice.getObjectInfo('material');
anariDevice.extensions;
```

## Understand the renderer architecture

Each raster `frame.render()` performs the following work:

1. Resolve the frame's committed world, camera, and renderer.
2. Collect directly attached world surfaces and surfaces reached through world instances.
3. Group placements by retained surface object identity.
4. Select the registered forward or deferred renderer runtime from the committed renderer subtype.
5. Reuse or rebuild one luma.gl `Model` per distinct surface.
6. Upload four per-instance matrix-column vertex buffers.
7. Translate ANARI materials into luma.gl material uniforms and texture bindings.
8. Translate world and group lights into the renderer's lighting representation.
9. Configure camera, exposure, fog, debug mode, and HDR uniforms.
10. Issue one instanced draw per distinct surface.
11. Optionally run renderer-owned composition such as bloom or deferred lighting.
12. Return surface, instance, draw-call, and triangle statistics.

The ANARI adapter does not own a second shader or material pipeline. It translates retained
objects into the format-independent
[`SceneRenderer`](/docs/api-reference/experimental/scene-renderer),
[`DeferredSceneRenderer`](/docs/api-reference/experimental/deferred-scene-renderer), or
`RayTracingSceneRenderer` descriptors from `@luma.gl/experimental`. The shared forward runtime uses
WGSL shaders on WebGPU and equivalent GLSL shaders on WebGL 2. The WebGPU deferred path resolves
compatible opaque scenes through the same retained object graph and falls back to forward rendering
for unsupported scene features. The WebGPU ray-tracing path instead uses command-graph compute,
progressive HDR history, and a fullscreen presentation pass.

Applications can add another renderer without changing retained scene objects:

```ts
anariDevice.registerRenderer(
  'customRaymarch',
  graphicsDevice => new CustomRaymarchRuntime(graphicsDevice)
);

const raymarch = anariDevice.newRenderer('customRaymarch');
frame.setParameter('renderer', raymarch).commitParameters();
```

Runtime factories are lazy and device-owned. See
[registering renderer runtimes](/docs/api-reference/anari/anari-device#registering-renderer-runtimes)
for the runtime contract and ownership details.

### Ray-tracing implementation roadmap

| Tranche | Scope | Status |
| --- | --- | --- |
| T0: renderer and graph foundation | Lazy subtype registration, retained-scene adapters, the shared experimental `RayTracingSceneRenderer`, explicit WebGPU command-graph resources, and application-owned submission. | Implemented. |
| T1: direct rays and shadows | Transformed analytic spheres, mesh triangles, tessellated analytic shapes, perspective/orthographic cameras, direct lights, hard shadow rays, progressive primary-ray sampling, and HDR presentation. | Implemented with WebGPU compute rather than hardware ray tracing. |
| T2a: GPU object acceleration | World-space instance bounds, graph-owned complete-binary TLAS construction and refitting, nearest-hit object traversal, early-exit shadow rays, and default-CORE storage limits. | Implemented. |
| T2b: interactive frame budgeting | Half-resolution defaults, bounded adaptive quality, interleaved pixel coverage, retained-identity temporal reprojection, rotating shadow samples, and dirty-only object acceleration. | Implemented; frame pacing uses CPU animation intervals. |
| T2c: large-scene acceleration | GPU Morton-sorted object/instance TLAS leaves with retained-permutation transform refits, per-mesh triangle BLASes, and explicit traversal/build diagnostics. | Morton TLAS, transform refits, and Morton mesh BLASes implemented; SAH/Karras topology and diagnostics remain planned. |
| T2d: dynamic scene extraction | Skeletal/morph geometry extraction, bounded deforming-mesh updates, and shared animated instance acceleration. | Planned. |
| T3: indirect transport and denoising | Advanced PBR texture, alpha, and transmission parity; multi-bounce material transport/path tracing, convergence controls, and denoising; primary-ray progressive accumulation already exists in T1. | Planned. |
| T4: ray marching and volumes | Signed-distance-field ray marching, retained spatial fields, 3D textures, transfer functions, and ANARI volume objects. | Planned. |
| T5: hybrid composition and diagnostics | Raster/ray composition, reusable graph timings, renderer capability reporting, and debug visualization channels. | Planned. |

### Ray-tracing technique background and tradeoffs

#### Software WebGPU, not hardware ray tracing

The `raytrace` subtype is deliberately a software ray tracer. It uses ordinary WebGPU compute
passes, storage buffers, textures, and a fullscreen presentation draw; it does not request a
hardware ray-tracing pipeline or browser-specific adapter feature. That keeps the implementation
portable to default CORE WebGPU, but it also means the renderer owns acceleration-structure
construction, traversal stacks, ray scheduling, and reconstruction itself.

The default WebGPU profile exposes only eight storage-buffer bindings per shader stage; see the
[WebGPU supported-limits table](https://gpuweb.github.io/gpuweb/#limits). The trace shader uses
exactly those eight slots for scene records, TLAS data, and BLAS data. Construction is therefore
split into command-graph passes that each stay at or below the same limit, and data that would be
separate descriptors in a hardware RT API is packed into shared buffers. This constraint is not
just bookkeeping: adding another traversal feature may require packing data, reusing a binding, or
moving work into another graph pass rather than adding one more storage buffer.

#### TLAS and BLAS

**Implemented.** The renderer separates the hierarchy by update frequency. The top-level
acceleration structure (TLAS) stores world-space bounds for analytic objects and mesh instances.
Each mesh has a bottom-level acceleration structure (BLAS) over its local-space triangles. A ray
first traverses the TLAS; after selecting a mesh instance, it transforms into local space and
traverses that mesh's BLAS. Analytic spheres keep their direct intersection path and do not need
triangle BLAS leaves.

That split avoids duplicating triangle hierarchy data for every instance and makes transform
animation cheaper: a moving instance changes TLAS bounds but not the mesh's local triangle BLAS.
The cost is two nested traversals, extra packed hierarchy memory, and a topology-build phase when
mesh geometry changes. It is still a useful separation even without hardware RT because it gives
the software tracer the same coarse/fine reuse boundary that hardware APIs expose.

#### Morton ordering, LBVH, and SAH

**Implemented, with an important limit.** The GPU build path computes bounds, quantizes centroids,
encodes Morton keys, sorts keys and explicit leaf identifiers, gathers sorted bounds, and refits a
complete-binary hierarchy. Morton order is cheap and parallel because nearby centroids tend to
become nearby leaves. It is an LBVH-style spatial ordering strategy, used for both object/instance
TLAS leaves and per-mesh triangle BLAS leaves. The reusable graph-native sorter resolves inputs of
up to 256 elements with a single-workgroup stable bitonic dispatch and larger inputs with a stable
four-bit radix histogram, prefix scan, and scatter pipeline. `GPUSegmentedSort` additionally groups
many small, independent packed mesh permutations by workgroup width, so arbitrary mesh counts need
at most eight local sorting dispatches. `GPUBVH` similarly fuses hierarchies of up to 128 leaves
into a single workgroup while retaining its level-by-level fallback for larger trees.
`GPUSegmentedBVH` extends that contract across packed independent mesh hierarchies, grouping all
trees of the same leaf capacity into one dispatch and using at most eight capacity buckets. These
are general graph contributors, not ANARI-specific acceleration implementations.

Morton sorting is not the same as a full high-quality BVH builder. In particular, the current code
does not implement the binary-radix-tree topology from
[Karras, “Maximizing Parallelism in the Construction of BVHs, Octrees, and k-d Trees”](https://research.nvidia.com/publication/2012-06_maximizing-parallelism-construction-bvhs-octrees-and-k-d-trees),
and it does not choose splits with the surface-area heuristic (SAH), as described by
[Wald, “On fast Construction of SAH-based Bounding Volume Hierarchies”](https://www.sci.utah.edu/~wald/Publications/2007/ParallelBVHBuild/fastbuild.pdf).
The implemented sorted complete-binary tree is cheaper to build and easy to express in the existing
`GPUBVH` graph, but its traversal quality can be worse for clustered or highly overlapping
geometry. Exact transformed BLAS-root bounds avoid the unnecessary enclosing-sphere overlap of
elongated instances, but Karras-style topology, SAH refinement, wider nodes, and measured traversal
diagnostics remain planned rather than implied by the word “Morton.”

#### Refit versus rebuild

**Implemented.** A topology change builds mesh BLASes and rebuilds the Morton TLAS permutation.
Transform-only animation retains that permutation, gathers updated world-space bounds in the same
leaf order, and refits TLAS parents without rerunning the scene-bounds reduction or sort. Camera,
light, and material-only frames do not encode acceleration work. After a bounded run of refits, the
renderer periodically rebuilds Morton order so large object motion cannot degrade the hierarchy
forever.

Adapters that provide categorized scene revisions avoid materializing transform signatures on every
frame. Other callers materialize transform revisions once and reuse them for primitive changes.
Updated instance records are written directly into their final packed `Float32Array`, avoiding the
previous intermediate JavaScript number arrays and duplicate copied transform matrices. When a
retained adapter reports a small set of stable dirty placements, only their current/inverse
matrices and previous-motion matrices are uploaded; the following frame commits only the remaining
previous-motion slots. Larger updates and replaced descriptors safely use the full packed path.

Nearest-hit and shadow traversal compute guarded inverse ray directions once per world-space ray
and mesh-local ray. Pending TLAS and BLAS stack entries retain their already-computed box entry
distances, avoiding the former second slab test when a queued child is popped. Mesh traversal
starts from its exact BLAS root, analytic spheres evaluate their quadratic intersection only once,
and the CPU publishes the direct-light count so shading does not rescan every light per sample.

Refit is much cheaper than rebuild, but it preserves old leaf neighborhoods even when objects have
moved apart. Rebuild restores spatial quality but pays for bounds reduction, key generation, sort,
gather, and hierarchy propagation. The current policy is intentionally simple and deterministic; a
future policy could use measured overlap, visited-node counts, or build/traversal timing instead of
only a bounded periodic refresh.

#### Megakernel versus wavefront execution

**Implemented now:** one trace megakernel handles primary intersection, direct-light evaluation,
hard shadow rays, temporal history validation, and output writes. For the current direct-light
renderer this avoids queue storage, compaction passes, and extra synchronization, and it keeps
command-graph submission straightforward.

**Planned:** wavefront ray queues and compaction. A megakernel becomes less attractive as materials,
multiple bounces, alpha/transmission, and heterogeneous ray types increase divergence and register
pressure. The wavefront formulation described by
[Laine, Karras, and Aila, “Megakernels Considered Harmful: Wavefront Path Tracing on GPUs”](https://research.nvidia.com/index.php/publication/2013-07_megakernels-considered-harmful-wavefront-path-tracing-gpus)
separates ray generation, intersection, shading, and continuation into queues so each pass does more
coherent work. In WebGPU that also means more graph nodes, queue buffers, scans/compaction, and
indirect dispatch bookkeeping, so it should follow measured pressure from multi-bounce or complex
materials rather than replace the direct-light megakernel preemptively.

#### Frame budget, sparse sampling, and temporal reconstruction

**Implemented.** The default internal target is half the display width and height, which traces
roughly one quarter of the primary pixels before temporal reuse. Adaptive resolution moves among
bounded scales using smoothed animation-frame intervals and hysteresis. At minimum scale, rotating
interleaved pixel phases spread work across frames; a manual HDR reconstruction pass upscales the
retained result. Direct-light shadow sampling is also bounded and rotated across frames.

Those controls trade instantaneous detail for latency and stability. Lower resolution softens small
features; interleaving leaves some pixels dependent on history; rotating light samples add variance
until accumulation converges. They reduce work without claiming that every frame is a complete,
independent full-resolution render.

**Implemented baseline.** Temporal reprojection uses previous camera matrices and stable retained
instance transforms to find compatible history. Depth, normal, primitive identity, and neighborhood
color checks reject disocclusions and incompatible samples, then valid history increases the
effective sample count. This is temporal sample reuse, not a general frame-interpolation system and
not a full denoiser.

Color and metadata each use a reusable `GPUTextureHistory` pair. The command graph binds one texture
as the previous frame and the other as the current output, then exchanges their logical roles only
after encoding succeeds. This removes all full-frame history copies without increasing the four
physical history/output allocations. Sparse phases preserve untouched pixels with a densely packed
carry dispatch that is coalesced with ray tracing; full-coverage phases skip that dispatch.

**Planned.** Stronger reconstruction should add variance-guided spatial filtering, adaptive
per-pixel sampling, reactive/disocclusion handling, and a better edge-aware upscaler. The relevant
reference point for low-sample denoising is
[SVGF](https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/), which combines
temporal accumulation, variance estimates, and hierarchical image-space filtering. For many-light
direct illumination, [ReSTIR](https://research.nvidia.com/publication/2020-07_spatiotemporal-reservoir-resampling-real-time-ray-tracing-dynamic-direct)
is a separate future direction: it reuses light-sampling reservoirs spatially and temporally rather
than merely rotating a fixed subset of lights. Neither SVGF nor ReSTIR is implemented by the
current renderer.

| Area | Implemented now | Planned or absent |
| --- | --- | --- |
| Acceleration | Morton-sorted TLAS, retained transform refits, topology-only Morton per-mesh BLASes | Karras/SAH topology, wide/compressed nodes, traversal-driven rebuild policy |
| Execution | Direct-light megakernel with hard shadow rays | Wavefront queues, compaction, multi-bounce transport |
| Sampling | Half-resolution default, adaptive scales, interleaved phases, rotating shadow-light samples | Variance-driven adaptive sampling and reservoir-based many-light reuse |
| Reconstruction | Motion-aware temporal reprojection, rejection, neighborhood clamp, manual HDR upscale | SVGF-class denoising, stronger edge-aware upscaling, reactive masks |
| Shading | Analytic spheres, mesh triangles, direct lights | Full PBR texture parity, alpha/transmission, deformation, indirect bounces |

### Cache invalidation

The runtime rebuilds a compiled model when:

- A structural geometry attribute or its committed layout changes.
- The number of placements for a retained surface changes.
- Alpha mode, sidedness, texture bindings, or another structural material feature changes.
- A previously removed surface becomes visible again.

Transforms, nonstructural material uniforms, joint palettes, and animated morph weights update
without reconstructing geometry. Removing a surface from the world destroys its cached model and
associated instance buffers.

### Practical performance rules

- Reuse surface and group identities for repeated objects.
- Animate committed instance transforms and light parameters instead of recreating entire worlds.
- Avoid retessellating geometry every frame.
- Keep frame size stable unless the drawing buffer actually changes.
- Enable bloom only when the scene benefits from its extra framebuffer and postprocessing passes.
- Check `drawCount` and `instanceCount` to verify that scene reuse translates into actual batching.

## Explore the JSON scene playground

The private ANARI showcase includes a deck.gl-style JSON playground for describing complete scenes
without writing rendering code. Start the showcase from the repository root:

```bash
yarn workspace luma.gl-examples-showcase-anari start
```

Open `/playground.html` on the reported development-server URL, or select **JSON LAB** in the
Observatory. The playground provides a Monaco JSON editor with syntax highlighting,
schema-aware completions, property documentation, red error indicators, animated example scenes,
WebGPU/WebGL selection, a renderer selector for frame presentation, automatic HDR presentation when
available, orbit controls, validation feedback, and live instance, draw-call, and triangle
statistics.

Use **GLTF ↓** or **USD ↓** to download the currently valid retained scene. Export bakes procedural
geometry, starfield distributions, and retained instances into a static snapshot; transfers mesh
positions, normals, UVs, vertex colors, materials, texture images, camera, and supported lights;
and emits standalone JSON glTF with embedded buffers/images or ASCII `.usda`. ANARI animation
declarations, optional renderer presets, bloom, fog, and renderer-only HDR controls remain
ANARI-specific and are not exported.

:::caution[Experimental playground format]
The JSON format and its optional schema exports are experimental. They are not part of the ANARI C
specification and can change with the private `@luma.gl/anari` workspace.
:::

### Validate scenes with Zod and JSON Schema

The optional `@luma.gl/anari/schemas` entry point exports separate Zod schemas for geometry,
materials, lights, cameras, renderers, surfaces, groups, instances, animations, and complete
scenes. Importing ordinary rendering objects from `@luma.gl/anari` does not load Zod:

```ts
import {
  ANARIGeometrySchema,
  ANARISceneSchema,
  ANARI_SCENE_JSON_SCHEMA
} from '@luma.gl/anari/schemas';

const geometry = ANARIGeometrySchema.safeParse({
  '@@type': 'sphere',
  radius: 1,
  segments: 32
});

const result = ANARISceneSchema.safeParse(scene);

if (!result.success) {
  for (const issue of result.error.issues) {
    console.error(issue.path.join('.'), issue.message);
  }
}
```

`ANARI_SCENE_JSON_SCHEMA` is generated directly from the Zod scene schema as draft-07 JSON Schema.
Associate it with a Monaco JSON model to provide subtype-aware autocomplete, property hovers,
numeric bounds, syntax highlighting, and ordinary schema diagnostics. Runtime Zod validation adds
semantic checks for missing retained resources, duplicate instance identifiers, missing group
references, and animated lights following nonexistent instances; the playground maps those issue
paths back to precise Monaco error indicators.

### Describe a scene with JSON

Use `@@type` to select ANARI object subtypes, registry keys to name shared resources, and `@@id`
to name individual lights and instances. Renderer data is optional in the playground JSON: the
ANARI world remains renderer-independent, while the active renderer subtype is selected by the
playground UI and attached only when constructing the frame.

```json
{
  "version": 1,
  "name": "MY FIRST ANARI SCENE",
  "camera": {
    "@@type": "perspective",
    "position": [6, 4, 9],
    "target": [0, 1, 0],
    "fovy": 0.75,
    "orbit": {"speed": 0.08}
  },
  "geometries": {
    "orb": {"@@type": "sphere", "radius": 0.8, "segments": 28},
    "floor": {"@@type": "quad", "width": 14, "height": 14}
  },
  "materials": {
    "metal": {
      "@@type": "physicallyBased",
      "baseColor": [0.28, 0.45, 0.95],
      "metallic": 0.85,
      "roughness": 0.15
    },
    "floor": {"@@type": "matte", "color": [0.12, 0.13, 0.2]}
  },
  "surfaces": {
    "orb": {"geometry": "orb", "material": "metal"},
    "floor": {"geometry": "floor", "material": "floor"}
  },
  "instances": [
    {
      "@@id": "left-orb",
      "surface": "orb",
      "position": [-1.3, 1, 0],
      "animation": {"@@type": "bob", "amplitude": 0.25, "speed": 1.1}
    },
    {
      "@@id": "right-orb",
      "surface": "orb",
      "position": [1.3, 1, 0]
    }
  ],
  "lights": [
    {
      "@@id": "sun",
      "@@type": "directional",
      "direction": [-1, -1, -0.4],
      "irradiance": 2
    },
    {
      "@@id": "emitter",
      "@@type": "point",
      "position": [3, 2, 0],
      "color": [1, 0.35, 0.12],
      "intensity": 22,
      "animation": {
        "@@type": "orbit",
        "center": [0, 2, 0],
        "radius": 3,
        "speed": 0.7
      }
    }
  ],
  "world": {"surfaces": ["floor"]}
}
```

Both orb instances reference the same named surface. The playground retains that surface identity
and caches its implicit group, allowing the runtime to issue one instanced draw instead of one draw
for each orb.

### Scene properties and object references

| Property | Meaning |
| --- | --- |
| `version` | JSON schema version; currently `1`. |
| `name`, `description` | Human-readable preview title and optional scene description. |
| `camera` | Camera `@@type`, normal ANARI camera parameters, optional `target`, and optional orbit speed. |
| `renderer` | Optional renderer preset parameters for exposure, bloom, background, and fog. The playground's renderer selector chooses the active renderer subtype independently of the scene. |
| `geometries` | Named geometry declarations; triangle meshes accept number arrays or compact `torus`, `crystal`, and beveled `prism` generators. |
| `materials` | Named `matte` or `physicallyBased` material declarations. |
| `surfaces` | Named surface declarations referencing geometry and material identifiers. |
| `groups` | Optional named groups referencing `surfaces` and optional `lights`. |
| `instances` | Array of objects with `@@id`, a `group` or `surface` reference, transforms, and optional animation. |
| `nodes` | Optional imported animation hierarchy with transforms, retained instance references, and owned morph geometries. |
| `clips`, `playback` | Optional keyframe animation clips plus selected clip, playback speed, playing state, and loop behavior. |
| `distributions` | Optional compact procedural instance distributions, including seeded `starfield` populations. |
| `lights` | Array of lights with `@@id`, ANARI subtype/parameters, and optional animation. |
| `world` | Optional selected `surfaces`, `instances`, and `lights`; all instances and lights are included by default. |

An instance can describe its transform with `position`, `rotation`, and `scale` three-component
vectors, or supply a complete 16-element `matrix`. Rotations use radians and are applied in X, Y,
Z order. Instances referencing a `surface` directly share an automatically generated group; use an
explicit named `group` when multiple surfaces or group-attached lights are required.

Object subtypes match the private package: `triangle`, `sphere`, `cylinder`, `cone`, and `quad`
geometry; `matte` and `physicallyBased` materials; `ambient`, `directional`, `point`, and `spot`
lights; `perspective` and `orthographic` cameras; and optional renderer presets for `default`,
`deferred`, `raytrace`, `debugNormals`, and `debugDepth`. Ray-tracing presets additionally accept
`samplesPerPixel`, `maxBounces`, `progressive`, `shadows`, `resolutionScale`,
`minimumResolutionScale`, `adaptiveResolution`, `targetFrameTimeMilliseconds`,
`temporalReprojection`, and `shadowSamplesPerFrame`.

### Generate compact triangle meshes and starfields

Triangle geometry can provide literal `vertex.position`, `vertex.normal`, and `primitive.index`
number arrays. For commonly repeated showcase shapes, it can instead declare a procedural mesh
generator while remaining entirely JSON:

```json
{
  "orbit-ring": {
    "@@type": "triangle",
    "generator": {
      "@@type": "torus",
      "majorRadius": 1,
      "minorRadius": 0.025,
      "majorSegments": 110,
      "minorSegments": 10
    }
  },
  "gemstone": {
    "@@type": "triangle",
    "generator": {
      "@@type": "crystal",
      "radius": 0.47,
      "height": 2.6,
      "sides": 6
    }
  },
  "opal-column": {
    "@@type": "triangle",
    "generator": {
      "@@type": "prism",
      "radius": 0.52,
      "height": 1,
      "sides": 12,
      "bevel": 0.1
    }
  }
}
```

The `torus` generator creates indexed vertices and normals. The `crystal` generator creates
pointed, flat-shaded gemstone facets, while the `prism` generator creates finely faceted,
beveled shafts suitable for polished architectural crystals.

Similarly, `distributions` expands a concise declaration into deterministic retained instances
that all share the same surface:

```json
{
  "distributions": [
    {
      "@@id": "background-stars",
      "@@type": "starfield",
      "surface": "star",
      "count": 260,
      "radius": 45,
      "seed": 7
    }
  ]
}
```

This represents hundreds of individually transformed stars without filling the editable JSON
with hundreds of nearly identical instance objects.

### Animate retained scene objects

Procedural animations update existing objects through `setParameter(...).commitParameters()`;
authored glTF clips use the shared engine animation mixer. Neither path rebuilds the world each
frame, and authored channels take precedence when both paths target the same retained object.

| Animation `@@type` | Applies to | Properties |
| --- | --- | --- |
| `orbit` | Instances and lights | Optional `center`, `radius`, `speed`, `phase`, inclined orbit, oscillating `height`, and `verticalFrequency`. |
| `bob` | Instances | Optional vertical `amplitude`, `speed`, and `phase`. |
| `spin` | Instances | Optional `axis`, angular `speed`, and `phase`. |
| `wobble` | Instances | Optional `axis`, angular `amplitude`, `speed`, and `phase`. |
| `pulse` | Lights | Optional intensity `amplitude`, `speed`, and `phase`. |
| `follow` | Lights | Named instance `target` and optional positional `offset`. |

Use `animation` for one behavior or `animations` to compose several behaviors on a single
instance:

```json
{
  "@@id": "orbit-ring-3",
  "surface": "violet-ring",
  "position": [0, 7, 0],
  "rotation": [0.2, 0, 0.6],
  "animations": [
    {"@@type": "wobble", "axis": "x", "amplitude": 0.07, "speed": 0.28},
    {"@@type": "spin", "axis": "z", "speed": -0.055}
  ]
}
```

An illuminated satellite and its actual point light can be linked without duplicating their
orbital formulas:

```json
{
  "@@id": "satellite-light",
  "@@type": "point",
  "position": [4.2, 7, 0],
  "color": [0.24, 0.54, 1],
  "intensity": 42,
  "animation": {"@@type": "follow", "target": "satellite-3"}
}
```

The playground includes the complete **Chromatic Atlas**, **Crystal Cathedral**, and
**Celestial Engine** Observatory scenes as editable JSON presets. They preserve shared retained
surfaces, generated halo and orbital meshes, hundreds of background stars, composable object
motion, physically based materials, fog, bloom, HDR presentation, and real lights tracking the
orbiting satellites. Crystal Cathedral additionally demonstrates faceted translucent crystal
geometry, fine beveled prisms, smooth 32-segment spires, and glossy opalescent materials.

The editor applies valid changes automatically after a short debounce. Toggle **LIVE** to switch to
manual changes, use **APPLY** or `⌘ Enter` / `Ctrl Enter` to commit, and select **FORMAT**,
**RESET**, or **COPY** for common editing actions. Invalid JSON, unknown object references, duplicate
identifiers, unsupported subtypes, and incompatible animations are reported inline while preserving
the last successfully rendered scene.

### Import OpenUSD and glTF scenes

Both the Observatory and the JSON playground expose an experimental 3D scene selector supporting
OpenUSD and glTF. Production-quality glTF samples include an Antique Camera, Brass Lantern, and
Vintage Toy Car from Khronos Group's CC0 glTF Sample Assets. OpenUSD samples include a detailed
Utah/Fancy teapot atelier, a cinematic Open Chess Set knight triptych, a composed vehicle gallery,
a formula racer, a crimson sedan, a reusable wheel assembly, and a material laboratory. The teapot
and vehicle models are selected from public-domain CC0 USD Working Group assets. The knight is
attributed to the Academy Software Foundation's Open Chess Set under CC BY 4.0; complete credits
accompany the bundled assets.

The glTF adapter uses the existing loaders.gl GLTF loader, preserves indexed triangle meshes,
reuses retained surfaces for repeated nodes, translates physically based materials, and retains all
17 canonical PBR texture slots as fragment-sampled ANARI image samplers. Source wrapping, filter and
mipmap settings, color spaces, both UV sets, `KHR_texture_transform`, alpha masking, sidedness, and
authored punctual lights are preserved. Joint attributes are imported, while animated joint
deformation additionally requires an application-provided retained `surface.skin.jointMatrices`
palette. POSITION, NORMAL, and TANGENT morph targets and animated morph weights play through the
retained scene automatically.

The optional `@luma.gl/anari/gltf` entry point translates parsed glTF clips and binds their node,
material, sampler, and morph channels to existing retained objects:

```ts
import {makeANARIAnimationScene} from '@luma.gl/anari/gltf';

const animation = makeANARIAnimationScene(description, retainedObjects);

animation.play();
animation.update(timeSeconds);
animation.seek(1.5);
```

`update()` receives an absolute monotonic time in seconds. The handle shares the engine animation
mixer and commits each changed retained object at most once per frame. See
[ANARI glTF and keyframe animation](/docs/api-reference/anari/anari-animation) and
[glTF animation and deformation](/docs/api-reference/gltf/gltf-animation) for complete bindings,
interpolation modes, ownership, and playback examples. Local file selection supports standalone
`.gltf` and `.glb` assets as well as supported OpenUSD files.

The example-local `USDLoader` follows the loaders.gl loader contract and is structured for future
extraction into an `@loaders.gl/usd` module:

```ts
import {load} from '@loaders.gl/core';
import {USDLoader} from './usd-loader/usd-loader';
import {makeANARIJSONSceneFromUSD} from './usd-to-anari';

const stage = await load('/usd/vehicle-gallery.usda', USDLoader, {
  usd: {variantSelections: {wheels: 'wheelNormal'}}
});

const scene = makeANARIJSONSceneFromUSD(stage, 'VEHICLE GALLERY');
```

The loader preserves stage metadata, prim hierarchies, typed attributes, material bindings,
references, payloads, selected variants, and local overrides. The ANARI adapter converts supported
meshes, analytic primitives, transform instances, `UsdPreviewSurface` materials, connected
`UsdUVTexture` images, directional lights, and point lights into the same editable JSON format as
the built-in playground presets.
Imported scenes are normalized into a consistent studio-scale coordinate system and automatically
receive glossy staging, animated cyan/amber HDR emitters, real following point lights, and bloom.

Supported input is ASCII `.usda` / `.usd` plus uncompressed `.usdz` archives whose root layer is
ASCII. Binary USDC crates, complete USD composition semantics, and arbitrary MaterialX/MDL networks
remain unsupported. Local uploads must be standalone ASCII stages or
self-contained ASCII-root USDZ archives; a loose stage with external references needs a resolvable
URL.

## Run the showcase

From the repository root:

```bash
yarn workspace luma.gl-examples-showcase-anari start
```

The showcase provides three scenes:

- **Chromatic Atlas**: repeated metallic and iridescent surfaces with animated lighting.
- **Crystal Cathedral**: architectural geometry, emissive accents, and atmospheric lighting.
- **Celestial Engine**: heavily instanced structures and animated orbiting emitters.

Interactive controls switch scenes, select forward/deferred/ray-tracing/debug renderers, toggle
bloom, orbit the camera, and show retained instance and draw-call counts. Select **JSON LAB** to
open the live JSON scene playground. Add `?backend=webgl` to either page to force the WebGL 2 path;
the deferred and ray-tracing controls are disabled when WebGPU is unavailable.

The showcase implementation lives in `examples/showcase/anari/app.ts`; the playground lives in
`examples/showcase/anari/playground.ts`, `playground-scene.ts`, and `playground-presets.ts`.
Package-level tests demonstrate staged parameters, animated lights, shared-surface batching,
zero-copy arrays, and rendering on available graphics backends.

## Current limitations

The current package is a focused proof of concept, not a complete ANARI implementation:

- No ANARI C API binding, binary protocol, conformance claim, or dynamic native renderer-library loading; custom runtimes use the local renderer registry.
- Geometry subtypes are limited to triangle meshes, spheres, cylinders, cones, and quads.
- Only one-dimensional data/reference arrays are implemented; array metadata is not interpreted or validated.
- Automatically generated triangle normals assume non-indexed triangle-list positions.
- Group-attached lights are not transformed by their owning instance.
- The `deferred` renderer is WebGPU-only and does not yet include clustered lighting, screen-space effects, bloom, or temporal velocity history.
- The WebGPU-only `raytrace` renderer builds Morton-sorted object/instance TLAS and per-mesh triangle BLAS hierarchies on the GPU; hardware ray tracing, SAH/Karras hierarchy topology, skeletal/morph deformation, material textures, alpha/transmission, advanced PBR parity, indirect bounces, and denoising are unsupported.
- Visibility, picking, volumes, clipping planes, raster shadow maps, and asynchronous frame mapping are not implemented; direct shadow rays are available only in the `raytrace` renderer.
- Experimental OpenUSD import does not support binary USDC crates or complete USD composition semantics.
- Imported glTF skin attributes require an application-supplied retained joint palette; automatic
  skin-palette binding in the showcase importer and animated glTF export are not yet implemented.
- Scene-color transmission samples an opaque-background capture and does not recursively refract
  multiple overlapping transmissive surfaces.
- WebGL 2 preserves the same scene API but does not support the WebGPU HDR presentation path.
- The ANARI device releases its renderer resources but does not destroy the underlying shared luma.gl graphics device.

For exact supported parameters and defaults, continue to the [`@luma.gl/anari` API reference](/docs/api-reference/anari).
