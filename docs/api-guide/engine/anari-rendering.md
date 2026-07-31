# Declarative Rendering with ANARI

<p className="badges">
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Experimental" />
  <img src="https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square" alt="Private workspace" />
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

For an explicit triangle mesh, provide packed positions and optionally normals and indices:

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
  'primitive.index': new Uint16Array([0, 1, 2])
});
```

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

`physicallyBased` exposes metallic/roughness shading plus emission, clearcoat, and an iridescence approximation:

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
```

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
```

Switch renderers by committing the frame:

```ts
frame.setParameter('renderer', normals).commitParameters();
```

Debug renderers automatically skip bloom. Switch back to the `default` renderer to restore physically based shading and postprocessing.

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
  renderedTriangles: statistics.triangleCount
});
```

Use these numbers to verify batching behavior. If `instanceCount` is high but `drawCount` is similarly high, check whether each placement accidentally creates its own surface instead of reusing a retained surface.

The renderer also supports capability discovery:

```ts
anariDevice.getObjectSubtypes('geometry');
anariDevice.getObjectSubtypes('renderer');
anariDevice.getObjectInfo('material');
anariDevice.extensions;
```

## Understand the renderer architecture

Each `frame.render()` performs the following work:

1. Resolve the frame's committed world, camera, and renderer.
2. Collect directly attached world surfaces and surfaces reached through world instances.
3. Group placements by retained surface object identity.
4. Reuse or rebuild one luma.gl `Model` per distinct surface.
5. Upload four per-instance matrix-column vertex buffers.
6. Translate ANARI materials into luma.gl material uniforms.
7. Translate world and group lights into the shared luma.gl lighting shader module.
8. Configure camera, exposure, fog, debug mode, and HDR uniforms.
9. Issue one instanced draw per distinct surface.
10. Optionally run bloom into an intermediate texture and composite the result to the canvas.
11. Return surface, instance, draw-call, and triangle statistics.

WebGPU uses WGSL shaders; WebGL 2 uses equivalent GLSL shaders. Both consume the same retained object graph and the same public API.

### Cache invalidation

The runtime rebuilds a compiled model when:

- The committed geometry version changes.
- The number of placements for a retained surface changes.
- A previously removed surface becomes visible again.

Transforms and material uniform values are updated without reconstructing geometry. Removing a surface from the world destroys its cached model and associated instance buffers.

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
Observatory. The playground provides a live JSON editor, animated example scenes, WebGPU/WebGL
selection, automatic HDR presentation when available, orbit controls, validation feedback, and
live instance, draw-call, and triangle statistics.

:::caution Experimental playground format
The JSON format is an experimental playground convention. It is not part of the ANARI C
specification, is not an exported package API, and can change with the private
`@luma.gl/anari` workspace.
:::

### Describe a scene with JSON

Use `@@type` to select ANARI object subtypes, registry keys to name shared resources, and `@@id`
to name individual lights and instances:

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
  "renderer": {
    "@@type": "default",
    "background": [0.015, 0.02, 0.04, 1],
    "exposure": 1.5,
    "bloomIntensity": 0.5
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
| `renderer` | Renderer `@@type` and normal ANARI exposure, bloom, background, and fog parameters. |
| `geometries` | Named geometry declarations; triangle meshes accept number arrays or compact `torus`, `crystal`, and beveled `prism` generators. |
| `materials` | Named `matte` or `physicallyBased` material declarations. |
| `surfaces` | Named surface declarations referencing geometry and material identifiers. |
| `groups` | Optional named groups referencing `surfaces` and optional `lights`. |
| `instances` | Array of objects with `@@id`, a `group` or `surface` reference, transforms, and optional animation. |
| `distributions` | Optional compact procedural instance distributions, including seeded `starfield` populations. |
| `lights` | Array of lights with `@@id`, ANARI subtype/parameters, and optional animation. |
| `world` | Optional selected `surfaces`, `instances`, and `lights`; all instances and lights are included by default. |

An instance can describe its transform with `position`, `rotation`, and `scale` three-component
vectors, or supply a complete 16-element `matrix`. Rotations use radians and are applied in X, Y,
Z order. Instances referencing a `surface` directly share an automatically generated group; use an
explicit named `group` when multiple surfaces or group-attached lights are required.

Object subtypes match the private package: `triangle`, `sphere`, `cylinder`, `cone`, and `quad`
geometry; `matte` and `physicallyBased` materials; `ambient`, `directional`, `point`, and `spot`
lights; `perspective` and `orthographic` cameras; and `default`, `debugNormals`, and `debugDepth`
renderers.

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

Animations update existing objects through `setParameter(...).commitParameters()`; they do not
rebuild the world each frame.

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

## Run the showcase

From the repository root:

```bash
yarn workspace luma.gl-examples-showcase-anari start
```

The showcase provides three scenes:

- **Chromatic Atlas**: repeated metallic and iridescent surfaces with animated lighting.
- **Crystal Cathedral**: architectural geometry, emissive accents, and atmospheric lighting.
- **Celestial Engine**: heavily instanced structures and animated orbiting emitters.

Interactive controls switch scenes, select beauty/normals/depth renderers, toggle bloom, orbit the camera, and show retained instance and draw-call counts. Select **JSON LAB** to open the live JSON scene playground. Add `?backend=webgl` to either page to force the WebGL 2 path.

The showcase implementation lives in `examples/showcase/anari/app.ts`; the playground lives in
`examples/showcase/anari/playground.ts`, `playground-scene.ts`, and `playground-presets.ts`.
Package-level tests demonstrate staged parameters, animated lights, shared-surface batching,
zero-copy arrays, and rendering on available graphics backends.

## Current limitations

The current package is a focused proof of concept, not a complete ANARI implementation:

- No ANARI C API binding, binary protocol, conformance claim, or general renderer plug-in mechanism.
- Geometry subtypes are limited to triangle meshes, spheres, cylinders, cones, and quads.
- Only one-dimensional data/reference arrays are implemented; array metadata is not interpreted or validated.
- `'vertex.attribute0'`, material `alphaMode`, and light `falloffAngle` are accepted but not consumed by the renderer.
- Automatically generated triangle normals assume non-indexed triangle-list positions.
- Changing an opaque compiled material to transparent does not rebuild its blending pipeline.
- Group-attached lights are not transformed by their owning instance.
- Visibility, picking, textures, sampled material parameters, volumes, clipping planes, shadows, and asynchronous frame mapping are not implemented.
- WebGL 2 preserves the same scene API but does not support the WebGPU HDR presentation path.
- The ANARI device releases its renderer resources but does not destroy the underlying shared luma.gl graphics device.

For exact supported parameters and defaults, continue to the [`@luma.gl/anari` API reference](/docs/api-reference/anari).
