import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# ANARIDevice and Object Lifecycle

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="neutral">Published package</DocumentationBadge>
  <DocumentationBadge tone="version">From v9.4</DocumentationBadge>
</DocumentationBadges>

`ANARIDevice` adapts an existing luma.gl `Device` into a retained, ANARI-inspired scene API. It creates scene objects, advertises supported subtypes and extensions, renders frames, and owns the renderer's cached GPU resources.

```ts
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {ANARIDevice} from '@luma.gl/scene';

const graphicsDevice = await luma.createDevice({
  adapters: [webgpuAdapter],
  createCanvasContext: true
});
const anariDevice = new ANARIDevice(graphicsDevice);
```

## Constructor

```ts
new ANARIDevice(device: Device)
```

`device` must be a configured luma.gl graphics device. Rendering requires its default canvas context. `ANARIDevice` does not create, configure, or own the underlying luma.gl device.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `device` | `Device` | Underlying WebGPU or WebGL 2 luma.gl device. |
| `extensions` | `readonly string[]` | Implemented ANARI-style extension identifiers. |

Currently advertised extensions are:

```text
KHR_CAMERA_PERSPECTIVE
KHR_CAMERA_ORTHOGRAPHIC
KHR_GEOMETRY_TRIANGLE
KHR_GEOMETRY_SPHERE
KHR_GEOMETRY_CYLINDER
KHR_GEOMETRY_CONE
KHR_GEOMETRY_QUAD
KHR_INSTANCE_TRANSFORM
KHR_LIGHT_DIRECTIONAL
KHR_LIGHT_POINT
KHR_LIGHT_SPOT
KHR_MATERIAL_MATTE
KHR_MATERIAL_PHYSICALLY_BASED
KHR_SAMPLER_IMAGE2D
```

The extension list describes this proof of concept's supported concepts; it is not a Khronos conformance claim.

## Object creation

```ts
newArray(parameters: ANARIArrayParameters): ANARIArray;

newGeometry(
  subtype: ANARIGeometrySubtype,
  parameters?: ANARIGeometryParameters
): ANARIGeometry;

newMaterial(
  subtype: ANARIMaterialSubtype,
  parameters?: ANARIMaterialParameters
): ANARIMaterial;

newSampler(
  subtype: 'image2D',
  parameters: ANARISamplerParameters
): ANARISampler;

newSurface(parameters: ANARISurfaceParameters): ANARISurface;
newGroup(parameters?: ANARIGroupParameters): ANARIGroup;
newInstance(parameters: ANARIInstanceParameters): ANARIInstance;
newWorld(parameters?: ANARIWorldParameters): ANARIWorld;

newLight(
  subtype: ANARILightSubtype,
  parameters?: ANARILightParameters
): ANARILight;

newCamera(
  subtype: ANARICameraSubtype,
  parameters?: ANARICameraParameters
): ANARICamera;

newRenderer(
  subtype?: ANARIRendererSubtype,
  parameters?: ANARIRendererParameters
): ANARIRenderer;

newFrame(parameters: ANARIFrameParameters): ANARIFrame;
```

`newRenderer()` defaults to subtype `default`. Newly created objects immediately commit their initial parameters, so their initial `version` is `1`.

See [arrays and geometry](/docs/api-reference/scene/anari-geometry), [materials and lighting](/docs/api-reference/scene/anari-materials-and-lights), [scene hierarchy](/docs/api-reference/scene/anari-scene), and [cameras, renderers, and frames](/docs/api-reference/scene/anari-rendering) for complete parameter details.

## Registering renderer runtimes

```ts
interface ANARIRendererRuntime {
  render(frame: ANARIFrame): ANARIFrameStatistics;
  destroyFrame(frame: ANARIFrame): void;
  destroy(): void;
}

type ANARIRendererRuntimeFactory = (device: Device) => ANARIRendererRuntime;

registerRenderer(
  subtype: ANARIRendererSubtype,
  runtimeFactory: ANARIRendererRuntimeFactory
): this;
```

Register an application-defined subtype before rendering a frame that selects it:

```ts
anariDevice.registerRenderer(
  'customRaymarch',
  graphicsDevice => new CustomRaymarchRuntime(graphicsDevice)
);

const renderer = anariDevice.newRenderer('customRaymarch');
frame.setParameter('renderer', renderer).commitParameters();
```

Runtime factories are invoked lazily when their first selected frame renders. Subtypes sharing the
same factory share its runtime; the ANARI device owns runtime and frame-resource destruction.
Registered names appear in `getObjectSubtypes('renderer')`. Built-in `raytrace` is advertised on
both backend types, but rendering it requires a WebGPU device.

## Capability discovery

### `getObjectSubtypes(type)`

```ts
getObjectSubtypes(type: ANARIObjectType): readonly string[];
```

Returns supported subtypes for an object category:

```ts
anariDevice.getObjectSubtypes('geometry');
// ['triangle', 'sphere', 'cylinder', 'cone', 'quad']

anariDevice.getObjectSubtypes('renderer');
// ['default', 'deferred', 'debugNormals', 'debugDepth', 'raytrace']
```

The `ANARIObjectType` union is:

```ts
type ANARIObjectType =
  | 'array'
  | 'camera'
  | 'frame'
  | 'geometry'
  | 'group'
  | 'instance'
  | 'light'
  | 'material'
  | 'renderer'
  | 'sampler'
  | 'surface'
  | 'world';
```

### `getObjectInfo(type)`

```ts
getObjectInfo(type: ANARIObjectType): ANARIObjectInfo;

type ANARIObjectInfo = {
  type: ANARIObjectType;
  subtypes: readonly string[];
  extensions: readonly string[];
};
```

Returns the requested object category, its supported subtypes, and the device-wide extension list.

## Frame rendering

### `renderFrame(frame)`

```ts
renderFrame(frame: ANARIFrame): ANARIFrameStatistics;
```

Renders a committed frame and returns statistics. The rendering runtime is created lazily on the first render. Applications normally call the equivalent convenience method `frame.render()`.

Depending on the surrounding animation loop, explicitly submit the underlying luma.gl device after rendering:

```ts
const statistics = frame.render();
graphicsDevice.submit();
```

`AnimationLoop` handles its own normal submission lifecycle; avoid adding redundant submission calls when the enclosing integration already owns submission.

### `destroyFrame(frame)`

```ts
destroyFrame(frame: ANARIFrame): void;
```

Destroys cached models, instance buffers, optional bloom resources, and offscreen framebuffers associated with the frame. `frame.destroy()` forwards to this method. Destroying a frame that has no allocated resources is safe.

### `destroy()`

```ts
destroy(): void;
```

Destroys resources for every rendered frame and releases the internal runtime. This does not destroy the underlying luma.gl `Device` and does not individually invalidate retained scene objects.

## `ANARIObject<Parameters>`

All ANARI scene objects extend the exported base class:

```ts
class ANARIObject<Parameters extends object> {
  readonly device: ANARIDevice;
  readonly type: ANARIObjectType;
  readonly subtype: string;
  readonly id: string;
  version: number;

  setParameter<ParameterName extends keyof Parameters>(
    name: ParameterName,
    value: Parameters[ParameterName]
  ): this;

  setParameters(parameters: Partial<Parameters>): this;
  unsetParameter(name: keyof Parameters): this;
  getParameter<ParameterName extends keyof Parameters>(
    name: ParameterName
  ): Parameters[ParameterName] | undefined;
  getParameters(): Readonly<Partial<Parameters>>;
  commitParameters(): this;
}
```

The exported base class also exposes a public constructor:

```ts
new ANARIObject<Parameters>(
  device: ANARIDevice,
  type: ANARIObjectType,
  subtype: string,
  parameters?: Partial<Parameters>
);
```

Prefer `ANARIDevice` factory methods for renderable scene objects. Constructing an arbitrary base
object does not make it a supported geometry, material, light, or other runtime-recognized class.

### Object metadata

| Property | Meaning |
| --- | --- |
| `device` | Owning ANARI device. |
| `type` | Object category such as `geometry`, `material`, or `world`. |
| `subtype` | Implementation subtype such as `sphere` or `physicallyBased`. |
| `id` | Automatically assigned process-local identifier such as `material-4`. |
| `version` | Committed parameter revision, starting at `1`. |

### Staged versus committed parameters

`setParameter()`, `setParameters()`, and `unsetParameter()` modify pending state. `getParameter()`, `getParameters()`, and rendering observe only the last committed state.

```ts
const material = anariDevice.newMaterial('physicallyBased', {roughness: 0.6});

material.setParameter('roughness', 0.12);
material.getParameter('roughness'); // 0.6
material.version; // 1

material.commitParameters();
material.getParameter('roughness'); // 0.12
material.version; // 2

material.unsetParameter('roughness').commitParameters();
material.getParameter('roughness'); // undefined
```

Methods return `this` for chaining. Every `commitParameters()` increments `version`, even if no value changed. Initial constructor parameters are committed automatically.

:::important
Changing a child object, such as a light or material, requires committing that object. Replacing a reference in a parent, such as `frame.setParameter('world', nextWorld)`, also requires committing the parent. Objects are retained independently; committing one object does not recursively commit others.
:::

### Retained scene extraction and committed revisions

The rendering adapter retains normalized scene surfaces, placement matrices, materials, lights, and
analytic-sphere descriptors per committed world. An unchanged render or camera-only update reuses
the same surface and light arrays instead of traversing the world hierarchy, rebuilding material
uniforms, or rediscovering analytic primitives. Pending object edits remain invisible until their
own `commitParameters()` call.

Committed changes are classified by the work they actually affect:

| Committed change | Reused data | Invalidated data |
| --- | --- | --- |
| Camera, frame size, or ordinary renderer settings | Surfaces, placements, materials, and lights. | Camera or frame state only. |
| Instance transform | Surface grouping, geometry, materials, and lights. | Only the affected stable placement matrices. |
| Material or shared image sampler | Surface grouping, placements, and lights. | Materials that depend on the committed object. |
| Light or renderer ambient radiance | Surface grouping, placements, and materials. | The normalized light array. |
| World/group membership, object arrays, surface identity, or geometry | Unaffected cached geometry/material allocations when compatible. | World topology, placement identities, analytic descriptors, and dependent lights. |

The shared renderer receives optional grouped scene revisions containing world identity, topology,
transforms, materials, lights, and the stable IDs of changed placements. World replacement always
changes its identity. One ANARI instance contributing to several surfaces publishes every affected
placement identity, including the distinct suffixes used for duplicate placements.

Revision tracking is device-local and bounded. If a world is not rendered before older commit
records expire, its adapter safely rebuilds the retained scene rather than guessing which objects
changed. This remains CPU-side scene bookkeeping: command graphs still borrow application-owned
resources, and GPU command submission remains under application control.

Committed morph weights and skin-joint palettes currently invalidate retained topology
conservatively. The forward raster renderer applies their updated deformation data, but the
deferred renderer does not yet apply skin-joint palettes, and the software ray tracer does not yet
deform mesh vertices or refit deformation-aware BLASes. Efficient animated mesh deformation remains
future work.
