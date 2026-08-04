# ANARIDevice and Object Lifecycle

![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)![Private workspace](https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square)![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)

`ANARIDevice` adapts an existing luma.gl `Device` into a retained, ANARI-inspired scene API. It creates scene objects, advertises supported subtypes and extensions, renders frames, and owns the renderer's cached GPU resources.

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/webgpu';

import {ANARIDevice} from '@luma.gl/anari';



const graphicsDevice = await luma.createDevice({

  adapters: [webgpuAdapter],

  createCanvasContext: true

});

const anariDevice = new ANARIDevice(graphicsDevice);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
new ANARIDevice(device: Device)
```

`device` must be a configured luma.gl graphics device. Rendering requires its default canvas context. `ANARIDevice` does not create, configure, or own the underlying luma.gl device.

## Properties[​](#properties "Direct link to Properties")

| Property     | Type                | Description                                    |
| ------------ | ------------------- | ---------------------------------------------- |
| `device`     | `Device`            | Underlying WebGPU or WebGL 2 luma.gl device.   |
| `extensions` | `readonly string[]` | Implemented ANARI-style extension identifiers. |

Currently advertised extensions are:

```
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

## Object creation[​](#object-creation "Direct link to Object creation")

```
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

See [arrays and geometry](https://luma.gl/next/docs/api-reference/anari/anari-geometry.md), [materials and lighting](https://luma.gl/next/docs/api-reference/anari/anari-materials-and-lights.md), [scene hierarchy](https://luma.gl/next/docs/api-reference/anari/anari-scene.md), and [cameras, renderers, and frames](https://luma.gl/next/docs/api-reference/anari/anari-rendering.md) for complete parameter details.

## Capability discovery[​](#capability-discovery "Direct link to Capability discovery")

### `getObjectSubtypes(type)`[​](#getobjectsubtypestype "Direct link to getobjectsubtypestype")

```
getObjectSubtypes(type: ANARIObjectType): readonly string[];
```

Returns supported subtypes for an object category:

```
anariDevice.getObjectSubtypes('geometry');

// ['triangle', 'sphere', 'cylinder', 'cone', 'quad']



anariDevice.getObjectSubtypes('renderer');

// ['default', 'deferred', 'debugNormals', 'debugDepth']
```

The `ANARIObjectType` union is:

```
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

### `getObjectInfo(type)`[​](#getobjectinfotype "Direct link to getobjectinfotype")

```
getObjectInfo(type: ANARIObjectType): ANARIObjectInfo;



type ANARIObjectInfo = {

  type: ANARIObjectType;

  subtypes: readonly string[];

  extensions: readonly string[];

};
```

Returns the requested object category, its supported subtypes, and the device-wide extension list.

## Frame rendering[​](#frame-rendering "Direct link to Frame rendering")

### `renderFrame(frame)`[​](#renderframeframe "Direct link to renderframeframe")

```
renderFrame(frame: ANARIFrame): ANARIFrameStatistics;
```

Renders a committed frame and returns statistics. The rendering runtime is created lazily on the first render. Applications normally call the equivalent convenience method `frame.render()`.

Depending on the surrounding animation loop, explicitly submit the underlying luma.gl device after rendering:

```
const statistics = frame.render();

graphicsDevice.submit();
```

`AnimationLoop` handles its own normal submission lifecycle; avoid adding redundant submission calls when the enclosing integration already owns submission.

### `destroyFrame(frame)`[​](#destroyframeframe "Direct link to destroyframeframe")

```
destroyFrame(frame: ANARIFrame): void;
```

Destroys cached models, instance buffers, optional bloom resources, and offscreen framebuffers associated with the frame. `frame.destroy()` forwards to this method. Destroying a frame that has no allocated resources is safe.

### `destroy()`[​](#destroy "Direct link to destroy")

```
destroy(): void;
```

Destroys resources for every rendered frame and releases the internal runtime. This does not destroy the underlying luma.gl `Device` and does not individually invalidate retained scene objects.

## `ANARIObject<Parameters>`[​](#anariobjectparameters "Direct link to anariobjectparameters")

All ANARI scene objects extend the exported base class:

```
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

```
new ANARIObject<Parameters>(

  device: ANARIDevice,

  type: ANARIObjectType,

  subtype: string,

  parameters?: Partial<Parameters>

);
```

Prefer `ANARIDevice` factory methods for renderable scene objects. Constructing an arbitrary base object does not make it a supported geometry, material, light, or other runtime-recognized class.

### Object metadata[​](#object-metadata "Direct link to Object metadata")

| Property  | Meaning                                                               |
| --------- | --------------------------------------------------------------------- |
| `device`  | Owning ANARI device.                                                  |
| `type`    | Object category such as `geometry`, `material`, or `world`.           |
| `subtype` | Implementation subtype such as `sphere` or `physicallyBased`.         |
| `id`      | Automatically assigned process-local identifier such as `material-4`. |
| `version` | Committed parameter revision, starting at `1`.                        |

### Staged versus committed parameters[​](#staged-versus-committed-parameters "Direct link to Staged versus committed parameters")

`setParameter()`, `setParameters()`, and `unsetParameter()` modify pending state. `getParameter()`, `getParameters()`, and rendering observe only the last committed state.

```
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

important

Changing a child object, such as a light or material, requires committing that object. Replacing a reference in a parent, such as `frame.setParameter('world', nextWorld)`, also requires committing the parent. Objects are retained independently; committing one object does not recursively commit others.
