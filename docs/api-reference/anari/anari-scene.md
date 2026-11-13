import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# ANARI Scene Hierarchy

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
</DocumentationBadges>

The scene hierarchy combines geometry and materials into surfaces, groups related surfaces and lights, places groups through transform instances, and collects everything in a world.

```text
ANARIGeometry + ANARIMaterial → ANARISurface
ANARISurface + ANARILight → ANARIGroup
ANARIGroup + matrix → ANARIInstance
ANARISurface / ANARIInstance / ANARILight → ANARIWorld
```

## `ANARISurface`

```ts
new ANARISurface(device: ANARIDevice, parameters: ANARISurfaceParameters);
newSurface(parameters: ANARISurfaceParameters): ANARISurface;

type ANARISurfaceParameters = {
  geometry: ANARIGeometry;
  material: ANARIMaterial;
};
```

Both `geometry` and `material` are required:

```ts
const sphere = anariDevice.newGeometry('sphere', {radius: 0.9});
const gold = anariDevice.newMaterial('physicallyBased', {
  baseColor: [1, 0.72, 0.18],
  metallic: 1,
  roughness: 0.2
});
const surface = anariDevice.newSurface({geometry: sphere, material: gold});
```

A surface is the runtime's instancing and batching identity. Referencing the **same surface object** from many instances produces one compiled model and one instanced draw. Distinct surface objects are separate draw batches even if they reference the same geometry and material.

## `ANARIGroup`

```ts
new ANARIGroup(device: ANARIDevice, parameters?: ANARIGroupParameters);
newGroup(parameters?: ANARIGroupParameters): ANARIGroup;

type ANARIGroupParameters = {
  surface?: readonly ANARISurface[] | ANARIArray;
  surfaces?: readonly ANARISurface[];
  light?: readonly ANARILight[] | ANARIArray;
  lights?: readonly ANARILight[];
};
```

| Parameter | Meaning |
| --- | --- |
| `surface` | Canonical ANARI-style list or `ANARIArray` of surfaces. |
| `surfaces` | JavaScript-friendly array alias used when `surface` is absent. |
| `light` | Canonical ANARI-style list or `ANARIArray` of lights. |
| `lights` | JavaScript-friendly array alias used when `light` is absent. |

```ts
const group = anariDevice.newGroup({
  surface: [metalSurface, glassSurface],
  light: [interiorLight]
});
```

When both a canonical key and its friendly alias are provided, the canonical key takes precedence. An empty canonical array still takes precedence because arrays are truthy.

The group itself does not appear directly in the world; reference it through an `ANARIInstance`.

## `ANARIInstance`

```ts
new ANARIInstance(device: ANARIDevice, parameters: ANARIInstanceParameters);
newInstance(parameters: ANARIInstanceParameters): ANARIInstance;

type ANARIInstanceParameters = {
  group: ANARIGroup | readonly ANARIGroup[] | ANARIArray;
  transform?: ANARIMatrix4;
};

type ANARIMatrix4 = readonly number[];
```

```ts
import {Matrix4} from '@math.gl/core';

const left = anariDevice.newInstance({
  group,
  transform: new Matrix4().translate([-2, 0, 0])
});

const right = anariDevice.newInstance({
  group,
  transform: new Matrix4().translate([2, 0, 0])
});
```

`transform` is a 16-element, column-major affine matrix compatible with `@math.gl/core`'s `Matrix4`. If omitted, the identity matrix is used. A single instance can reference one group, an array of groups, or an `ANARIArray` containing groups.

All surfaces in the referenced groups receive the same instance transform. Group lights are collected, but their positions and directions are currently interpreted in world space rather than transformed by the instance.

### Updating transforms

```ts
left
  .setParameter('transform', new Matrix4().translate([-2, Math.sin(time), 0]))
  .commitParameters();
```

Instance transforms are uploaded every render, allowing animation without rebuilding the geometry. Changing how many placements reference a surface reallocates that surface's instance buffers.

## `ANARIWorld`

```ts
new ANARIWorld(device: ANARIDevice, parameters?: ANARIWorldParameters);
newWorld(parameters?: ANARIWorldParameters): ANARIWorld;

type ANARIWorldParameters = {
  surface?: readonly ANARISurface[] | ANARIArray;
  surfaces?: readonly ANARISurface[];
  instance?: readonly ANARIInstance[] | ANARIArray;
  instances?: readonly ANARIInstance[];
  light?: readonly ANARILight[] | ANARIArray;
  lights?: readonly ANARILight[];
};
```

| Parameter | Meaning |
| --- | --- |
| `surface` / `surfaces` | Directly placed surfaces, rendered with an identity transform. |
| `instance` / `instances` | Transform instances that reference groups. |
| `light` / `lights` | World-space lights. |

Canonical singular names accept either normal JavaScript arrays or `ANARIArray` object collections. Friendly plural aliases accept normal JavaScript arrays. When both forms are provided, the singular canonical form wins.

```ts
const world = anariDevice.newWorld({
  surface: [floorSurface],
  instance: [left, right],
  light: [sunlight, pointLight]
});
```

### Replacing scene contents

```ts
world.setParameters({
  instance: [left, right, center],
  light: [sunlight, animatedPoint]
}).commitParameters();
```

The next render recollects committed world contents. Cached models for surfaces that disappear from the world are destroyed; surviving surfaces continue to share their compiled resources.

### Instancing statistics

```ts
const frame = anariDevice.newFrame({world, camera, renderer});
const statistics = frame.render();

statistics.surfaceCount;  // Distinct ANARISurface object identities.
statistics.instanceCount; // Total direct and instanced surface placements.
statistics.drawCount;     // Successful instanced draw calls.
```

For one reused surface in 100 instances, the normal result is `surfaceCount: 1`, `instanceCount: 100`, and `drawCount: 1`.

## Scene ownership and lifecycle

Scene objects retain JavaScript references to one another but do not expose individual GPU-resource destruction. GPU resources belong to the frame/runtime and are released through `frame.destroy()` or `anariDevice.destroy()`.

The underlying luma.gl `Device` is separately owned by your application:

```ts
frame.destroy();
anariDevice.destroy();
graphicsDevice.destroy();
```

Destroying a graphics device is appropriate only when no other application subsystem still uses it.

## Scenegraph snapshots

`makeANARIWorldFromScenegraph(device, scene, lights = [])` converts an engine
`GroupNode` containing `SceneMeshNode` leaves into a committed `ANARIWorld`.
`makeScenegraphFromANARIWorld(world)` returns `{scene, lights}` for use with the
engine renderers. Both functions are exported by `@luma.gl/anari`.

```typescript
import {makeANARIWorldFromScenegraph, makeScenegraphFromANARIWorld} from '@luma.gl/anari';

const world = makeANARIWorldFromScenegraph(anariDevice, engineScene, lights);
const snapshot = makeScenegraphFromANARIWorld(world);
const anotherWorld = makeANARIWorldFromScenegraph(anariDevice, snapshot.scene, snapshot.lights);
```

These are snapshots, not live bindings. Hierarchy is flattened to world-space
placements; shared geometry and material identity is retained within each
snapshot. CPU geometry, material values, and light vectors are copied. GPU
textures are borrowed: the caller must keep them alive until every consumer is
finished, and destroying the ANARI device does not transfer texture ownership.
Changing a source array after conversion does not update the snapshot.

Forward conversion supports packed float32 triangle attributes `POSITION`,
`NORMAL`, `TANGENT`, `COLOR_0`, `TEXCOORD_0`, and `TEXCOORD_1`, with optional uint16
or uint32 indices. ANARI attribute slots zero, one, and two carry colors, the
first UV set, and the second UV set, respectively. The selected vertex count is
preserved. Reverse conversion tessellates analytic geometry; it does not recover
the original analytic primitive or authored node hierarchy.

PBR material factors and supported image samplers are preserved, including UV
transforms and UV-set selection. Ambient, directional, point, and spot lights
are supported; point and spot attenuation is retained by the ANARI extension
`attenuation`. Area lights must be represented as emissive geometry. Unsupported
shader defines, geometry attributes, GPU transforms/connections, local probes,
and non-mesh leaves fail explicitly. Bake or snapshot these inputs before
conversion. Cameras and renderer-specific environment settings remain separate
from the world and must be supplied to the renderer.
