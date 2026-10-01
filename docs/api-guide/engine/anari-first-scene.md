# Build an ANARI scene

[Overview](https://luma.gl/docs/api-guide/engine/anari-rendering.md)[First scene](https://luma.gl/docs/api-guide/engine/anari-first-scene.md)[Architecture](https://luma.gl/docs/api-guide/engine/anari-architecture.md)[JSON scenes](https://luma.gl/docs/api-guide/engine/anari-json-scenes.md)

## Why use a retained rendering API?[​](#why-use-a-retained-rendering-api "Direct link to Why use a retained rendering API?")

A conventional luma.gl application typically creates geometries, shader modules, models, render pipelines, and render passes directly. That is ideal when an application needs detailed control over the GPU.

An ANARI-style application instead declares scene intent:

```
geometry + material → surface

surface + light → group

group + transform → instance

instances + lights → world

world + camera + renderer → frame
```

The renderer chooses model creation, shader selection, instance batching, light uniform updates, render passes, bloom, and compatible backend implementations. The application can update retained objects without manually rewriting GPU binding logic.

This is particularly useful when an application should expose a stable scene contract to multiple visualization tools, scene importers, or potential rendering backends.

## Use the private workspace[​](#use-the-private-workspace "Direct link to Use the private workspace")

`@luma.gl/scene` is a private luma.gl workspace and is not published to npm. Install repository dependencies from a luma.gl checkout:

```
yarn install
```

Other in-repository workspaces can depend on the private package through:

```
{

  "dependencies": {

    "@luma.gl/scene": "workspace:*"

  }

}
```

At least one luma.gl backend is required. Use `@luma.gl/webgpu` for modern browsers and optional HDR presentation, and add `@luma.gl/webgl` when a WebGL 2 fallback is important.

## Create a graphics device[​](#create-a-graphics-device "Direct link to Create a graphics device")

Start with an ordinary luma.gl `Device` and wrap it in `ANARIDevice`:

```
import {ANARIDevice} from '@luma.gl/scene';

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

## Build your first scene[​](#build-your-first-scene "Direct link to Build your first scene")

The following complete scene adds a metallic sphere, floor, directional light, animated point light, camera, renderer, and animation loop. It assumes a page containing `<canvas></canvas>`.

```
import {ANARIDevice} from '@luma.gl/scene';

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

## Try the deferred renderer[​](#try-the-deferred-renderer "Direct link to Try the deferred renderer")

Use `newRenderer('deferred')` when you want the ANARI scene rendered through the experimental WebGPU G-buffer and deferred lighting path:

```
const renderer = anariDevice.newRenderer('deferred', {

  ambientRadiance: 0.08,

  background: [0.006, 0.008, 0.018, 1]

});
```

The deferred renderer shares ANARI scene traversal, generated geometry, instance transforms, and PBR material textures with the default renderer, then resolves lighting through `@luma.gl/experimental` `GBuffer` and `deferredLighting`. This first path is intentionally limited to opaque material channels and direct lights; clustered lighting and screen-space effects remain separate follow-up work.

The compact G-buffer runs within the default WebGPU CORE limit of 32 color-attachment bytes per sample. Its four targets retain HDR scene color (`rgba16float`), normal and roughness (`rgba8unorm`), base color and metallic (`rgba8unorm`), and HDR emissive color with occlusion (`rgba16float`). Each format costs eight render-target bytes under WebGPU accounting, for exactly 32 bytes total. ANARI's previous velocity target contained only zeroes and was never consumed, so omitting it preserves physically based direct lighting, HDR, and emissive response without requesting elevated device limits. Temporal motion-vector effects remain future work.

## Try the graph-based ray tracer[​](#try-the-graph-based-ray-tracer "Direct link to Try the graph-based ray tracer")

On WebGPU, switch the same retained scene to the software ray-tracing renderer:

```
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

The ANARI adapter passes committed scene descriptors to `RayTracingSceneRenderer` from `@luma.gl/experimental`. Its WebGPU compute graph derives world-space bounds for transformed analytic spheres and mesh instances, Morton-sorts active object/instance leaves into an explicit retained permutation, builds and refits a graph-owned complete-binary TLAS, and traverses that hierarchy for nearest-hit primary rays and early-exit shadow rays. Transform-only animation gathers updated bounds through the retained permutation and refits the TLAS without sorting; topology changes and periodic spatial refreshes rebuild the Morton order. A topology-only graph also Morton-sorts each mesh's triangles into GPU-built BLASes, which transform-only animation reuses. Small mesh permutations and hierarchies sharing packed scene storage are grouped into reusable segmented sort and BVH dispatches instead of opening separate sorting and hierarchy dispatches for every mesh. The instance-bounds pass reads each mesh BLAS root directly, producing a tight transformed local AABB instead of expanding elongated meshes to their enclosing sphere. Small sorts and hierarchy builds execute inside one workgroup; larger sorts use stable four-bit radix passes, and consecutive compute nodes share a command-encoder compute pass when per-node GPU timestamps are not requested. The same `GPUCommandGraph` evaluates direct lights with scalar metallic/roughness GGX shading, progressively accumulates unchanged primary-ray samples, and presents into either the canvas or a caller-owned offscreen framebuffer. The fullscreen presentation matches the actual target format, selected tone-mapping mode, and linear/sRGB output encoding, preserving HDR for floating-point targets. Generated quads, cylinders, and cones use their existing triangle geometry.

Ray tracing starts at half the display width and height, reducing its initial pixel workload to one quarter of full resolution. Adaptive quality can lower that scale to `0.25`, interleave sampled pixels across animation frames, and rotate one shadowed direct light per frame to approach the default `33.3` millisecond frame budget. The fullscreen resolve upsamples the retained HDR image. Temporal reprojection follows camera and stable instance motion while rejecting incompatible depth, normal, and color history; camera cuts, topology changes, light-count changes, and resolution changes reset invalid history. Retained color and surface-metadata texture pairs exchange their previous/current graph roles after each successful encoding, eliminating the former four full-image history copies. Interleaved frames carry only their untouched pixels through a small coalesced compute dispatch; full-coverage frames perform no history carry. Set `shadowSamplesPerFrame: 0` to evaluate every direct light in one frame. Adaptive timing uses smoothed animation-frame intervals and does not require GPU timestamp queries. Acceleration updates run only when retained transforms or geometry change, so camera-only and lighting-only frames do not rebuild the TLAS. Transform-only frames use the retained-permutation gather/refit path; topology changes and periodic refreshes run the Morton sort path. The ANARI adapter caches normalized surfaces, materials, lights, and analytic primitives by committed world identity. Categorized topology, transform, material, and light revisions let camera-only frames reuse those descriptors without serializing the entire scene; committed instance changes additionally expose their exact stable placement identities.

The Morton-sorted TLAS indexes objects and instances; surviving meshes traverse GPU-built, Morton-sorted per-mesh triangle BLASes. The ray-tracing pass uses exactly eight storage buffers, while every TLAS or BLAS construction pass stays within the default WebGPU CORE limit of eight storage buffers without elevated device features. The hierarchy topology is not SAH-optimized or a Karras-style LBVH. This is software ray tracing, not hardware ray tracing or full path tracing. Skeletal skinning, morph-target deformation, material textures, alpha/transmission, more advanced PBR material extensions, indirect bounces, denoising, and volume objects remain unsupported by this renderer. `maxBounces` is reserved for future multi-bounce transport.

## Understand staging and commits[​](#understand-staging-and-commits "Direct link to Understand staging and commits")

Every retained object has **pending** and **committed** parameters. Initial constructor parameters are committed automatically, but later changes are invisible until committed:

```
const material = anariDevice.newMaterial('physicallyBased', {roughness: 0.6});



material.setParameter('roughness', 0.1);

material.getParameter('roughness'); // Still 0.6.



material.commitParameters();

material.getParameter('roughness'); // Now 0.1.
```

Batch related changes before committing:

```
material

  .setParameters({

    baseColor: [1, 0.68, 0.18],

    metallic: 0.95,

    roughness: 0.12

  })

  .commitParameters();
```

Removing a parameter also requires a commit:

```
material.unsetParameter('clearcoat').commitParameters();
```

Commit the object you actually changed. Updating a light requires committing the light; replacing a frame's renderer requires committing the frame:

```
orbitingLight.setParameter('intensity', 45).commitParameters();

frame.setParameter('renderer', debugRenderer).commitParameters();
```

Each commit increments the object's `version`. Geometry versions invalidate cached GPU geometry; material and light values are reread during rendering.

## Create geometry[​](#create-geometry "Direct link to Create geometry")

Procedural geometry subtypes are `sphere`, `cylinder`, `cone`, and `quad`:

```
const sphere = anariDevice.newGeometry('sphere', {radius: 1, segments: 32});

const cylinder = anariDevice.newGeometry('cylinder', {radius: 0.4, height: 2});

const cone = anariDevice.newGeometry('cone', {radius: 0.7, height: 1.4});

const ground = anariDevice.newGeometry('quad', {width: 20, height: 20});
```

For an explicit triangle mesh, provide packed positions and optionally normals, two texture coordinate sets, tangents, RGBA vertex colors, joint attributes, morph targets, and indices:

```
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

`vertex.attribute1` and `vertex.attribute2` map to glTF `TEXCOORD_0` and `TEXCOORD_1`. `vertex.attribute0` retains RGB or RGBA vertex colors; `vertex.tangent` preserves tangent handedness. Joint indices and normalized floating-point weights use `vertex.joint` and `vertex.weight`. Morph targets contain optional `POSITION`, `NORMAL`, and `TANGENT` deltas; changing `morphWeights` updates the existing packed GPU vertex buffer without rebuilding the model.

`ANARIArray` can wrap typed arrays without copying:

```
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

## Build reusable surfaces and instances[​](#build-reusable-surfaces-and-instances "Direct link to Build reusable surfaces and instances")

A surface pairs one geometry with one material:

```
const surface = anariDevice.newSurface({

  geometry: sphereGeometry,

  material: sphereMaterial

});
```

Place the same surface many times by sharing a group:

```
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

```
const transform = new Matrix4()

  .translate([4, 2, -3])

  .rotateY(Math.PI / 4)

  .scale([1, 2, 1]);
```

## Use physically based materials[​](#use-physically-based-materials "Direct link to Use physically based materials")

`physicallyBased` exposes metallic/roughness shading, emission, clearcoat, sheen, specular, transmission/volume parameters, iridescence, anisotropy, and explicit alpha controls:

```
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

All 21 supported glTF PBR texture slots map to retained image samplers. Base-color, emissive, specular-color, and sheen-color maps use sRGB inputs; normal, metallic/roughness, occlusion, and other data maps remain linear. Samplers preserve authored wrapping, filtering, mipmap selection, UV set, and texture transforms.

Transmissive physical materials retain their authored `opaque` alpha mode. When a surface has a nonzero transmission factor, the shared forward renderer automatically captures the opaque background and refracts that scene color using its index of refraction, thickness, roughness, Fresnel response, and volume attenuation:

```
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

The capture includes opaque, non-transmissive scene surfaces; layered glass is not recursively resolved. Renderer parameters can also receive the caller-owned [prepared PBR lighting environment](https://luma.gl/docs/api-reference/experimental/pbr-environment.md) for roughness-aware diffuse/specular image-based lighting.

An emissive surface glows but does not illuminate neighboring surfaces by itself. Add a point or spot light when it should act as a visible light source.

## Add and animate lights[​](#add-and-animate-lights "Direct link to Add and animate lights")

World lights use world-space positions and directions:

```
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

```
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

## Select cameras and renderers[​](#select-cameras-and-renderers "Direct link to Select cameras and renderers")

Perspective and orthographic cameras share position, direction, near, far, and aspect settings:

```
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

```
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

```
frame.setParameter('renderer', normals).commitParameters();
```

Debug renderers automatically skip bloom. Switch to `deferred` for the WebGPU G-buffer path, `raytrace` for WebGPU software ray tracing, or `default` for the portable forward renderer with bloom.

Renderer presentation controls are ordinary committed ANARI parameters and are also accepted in JSON renderer descriptions:

```
beauty

  .setParameters({toneMapMode: 2, outputColorSpace: 'srgb'})

  .commitParameters();
```

`toneMapMode` selects no tone mapping (`0`), Reinhard (`1`), Khronos PBR Neutral (`2`), or ACES (`3`). `outputColorSpace` selects `'linear'` or `'srgb'`. Omit either setting to retain automatic, target-aware defaults: floating-point targets default to no tone mapping and linear output, integer targets default to Khronos PBR Neutral, and hardware-sRGB attachments avoid an additional software sRGB transfer.

## Handle resizing[​](#handle-resizing "Direct link to Handle resizing")

If `frame.size` is omitted, the renderer derives its size from the graphics device's current drawing buffer:

```
const frame = anariDevice.newFrame({world, camera, renderer});
```

When an integration provides drawing-buffer dimensions explicitly, update the frame during resize:

```
function resize(width: number, height: number): void {

  frame.setParameter('size', [width, height]).commitParameters();

}
```

Bloom framebuffers are recreated when the requested frame size changes. Camera aspect defaults to `width / height` unless an explicit camera `aspect` is supplied.

## HDR and backend selection[​](#hdr-and-backend-selection "Direct link to HDR and backend selection")

HDR requires all three pieces:

1. An HDR-capable browser/display combination.
2. A WebGPU canvas configured with a floating-point format, Display P3, and extended tone mapping.
3. A rendering path that preserves values above SDR white.

```
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

note

The user-visible HDR effect depends on the monitor, browser, operating-system display settings, surrounding page brightness, and whether scene lighting actually exceeds SDR white.

## Integrate with `AnimationLoop`[​](#integrate-with-animationloop "Direct link to integrate-with-animationloop")

The repository showcase uses `AnimationLoopTemplate` to coordinate drawing, resizing, and cleanup:

```
import {ANARIDevice} from '@luma.gl/scene';

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

## Inspect rendering statistics[​](#inspect-rendering-statistics "Direct link to Inspect rendering statistics")

```
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

Ray-traced frames additionally report their internal resolution and effective scale, sampled-pixel coverage, smoothed frame time, and accumulated sample count. Other renderer subtypes omit `statistics.rayTracing`.

When present, `statistics.rayTracing.graph` exposes the actual logical node count, physical compute pass count, coalesced compute-node count, and synchronous CPU encoding time. Its `trace` stage is present on every ray-traced frame; `topology`, `acceleration`, and `refit` appear only when the corresponding work runs. `acceleration` and `refit` are mutually exclusive. These counters do not request GPU timestamp queries, read resources back, or submit an additional command buffer.

The renderer also supports capability discovery:

```
anariDevice.getObjectSubtypes('geometry');

anariDevice.getObjectSubtypes('renderer');

anariDevice.getObjectInfo('material');

anariDevice.extensions;
```

## Related pages[​](#related-pages "Direct link to Related pages")

* [Declarative ANARI rendering](https://luma.gl/docs/api-guide/engine/anari-rendering.md)
* [ANARI API reference](https://luma.gl/docs/api-reference/scene.md)
* [Engine programming](https://luma.gl/docs/api-guide/engine.md)
