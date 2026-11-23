---
title: Three.js 🧪
---

import {ThreeIntegrationDocsExample} from '@site/src/examples';
import {ClientOnlyLiveExample} from '@site/src/components/docs/client-only-live-example';

# Three.js 🧪

:::caution[Experimental]

The compute buffer bridge has a version-pinned support contract for Three.js **0.187.0**. The custom renderer and deck integrations remain experimental; APIs and supported features may change.

:::

`@luma.gl/three` explores ways that Three.js applications can integrate with luma.gl:

- Use the luma.gl GPU Graph for GPU computation and share the results directly with Three.js.
- Mix luma.gl and Three.js rendering in a shared render pass.
- Use a luma.gl Device as the GPU backend for a Three.js renderer.
- Use deck.gl in Three.js applications.
- Add Three.js objects to a deck.gl application.

<ClientOnlyLiveExample height={360}>
  <ThreeIntegrationDocsExample integration="graph" />
</ClientOnlyLiveExample>

## Using with Graph

Keep Three.js as your renderer and use luma.gl Graph to compute its geometry data.
The Galactic Vortex updates star positions and colors in shared GPU buffers,
avoiding CPU readback and re-upload.

### How the integration works

Graph describes and schedules GPU operations; Three.js displays their results. The
bridge connects their buffers, so Graph does not need to own the Three.js scene or
replace its renderer.

1. Create a luma WebGPU Device and initialize Three.js's WebGPURenderer with the same native GPUDevice.
2. Allocate output buffers with storage and vertex usage for computed geometry attributes.
3. Build and compile a Graph computation that writes those buffers.
4. Attach the buffers to Three.js geometry using ThreeBufferBridge.
5. On each frame, encode and submit the Graph work before rendering the Three.js scene.

The Galactic Vortex follows this pattern for particle positions and colors. Three.js
still owns the camera, materials, and draw calls. The application controls when the
graph runs, allowing computation to update independently of scene construction.

See the [Graph overview](/docs/api-reference/graph) for graph APIs and the
[galaxy source](https://github.com/visgl/luma.gl/blob/master/examples/experimental/three/gpu-graph-galaxy.ts)
for the complete computation and rendering loop.

### Share buffers with Three.js

### Streamed dataset example

Run `yarn workspace luma.gl-examples-three start` and open `/streamed.html`.
Deterministic synthetic batches arrive every second; Append adds a batch immediately.
Each batch of x/value pairs is uploaded once. A luma compute shader
produces a logarithmic scatterplot layout, and upstream Three renders those same
GPU buffers. The latest 12 batches are retained independently; older batches are explicitly removed. Reset disposes all
geometry and borrowed bindings before releasing buffers and recreating the bridge.
Canvas resizing changes the render target without reallocating the data.

The source is [streamed-layout.ts](https://github.com/visgl/luma.gl/blob/master/examples/experimental/three/streamed-layout.ts).
Applications can feed `append()` from an async stream; source uploads are expected,
but computed positions are never read back or re-uploaded. The example performs
layout, not compaction, and preserves one draw per batch.

### Supported compute-to-render contract

The buffer bridge supports Three.js r187 (`three@0.187.0`) on WebGPU with the
standard drawing pipeline. It is a version-pinned integration: upgrade Three and
this adapter together. The custom luma renderer backend remains experimental.

Submit completed luma compute commands before calling `renderer.render()`. Both
use the same device queue, so queue ordering makes the writes visible without a
CPU readback or an `onSubmittedWorkDone()` wait on every frame. End all compute
passes before submitting. The application owns buffer allocation and lifetime.

Meshlet and visibility-buffer drawing pipelines are outside this contract: their
geometry preprocessing cannot infer positions or topology from the bridge's
metadata-only CPU arrays. Use the standard pipeline for GPU-generated geometry.

`ThreeBufferBridge` from `@luma.gl/three/interop` connects luma buffers to an
initialized upstream `WebGPURenderer` using the same `GPUDevice`. Call
`getThreeBufferBridgeSupport(device, renderer)` before attaching. Submit luma
computations before Three.js renders; both use the device's ordered queue.

The bridge supports packed Float32 vertex and instanced attributes and uint16/uint32
indices. Interleaved attributes, storage-node attributes, and textures are unsupported.
CPU bounds, raycasting, and wireframe topology do not automatically reflect GPU updates.
Dispose consuming geometries before the bridge, and keep borrowed buffers alive until
consumers and queued work have finished. Recreate the bridge after device loss or replacement.

## Choose an integration

| Goal | Entry point | GPU support |
| --- | --- | --- |
| Feed luma GPU computations into an existing Three.js renderer | `@luma.gl/three/interop` | WebGPU |
| Draw basic Three.js meshes alongside luma models | `@luma.gl/three/objects` → `ThreeMeshAdapter` | WebGPU |
| Draw a prepared Three.js scene in an application-owned pass | `@luma.gl/three/objects` → `ThreeSceneAdapter` | WebGPU |
| Render Three.js scenes using luma GPU resources and passes | `@luma.gl/three/backend` → `LumaRenderer` | WebGPU and WebGL2 graphics; WebGPU compute |
| Add deck.gl layers to an existing Three.js canvas with shared depth | `@luma.gl/three/interleaved` | Native Three.js WebGL2 renderer |
| Add deck.gl layers above an existing Three.js canvas | `@luma.gl/three/overlay` | Three.js WebGL/WebGPU host; separate WebGL2 overlay |
| Add Three.js objects to a deck.gl layer list | `@luma.gl/three/deck` | WebGPU |

The deck.gl integrations require the workspace's patched deck.gl **9.4.0** and luma.gl
**10** stack. These are tested versions, rather than a general compatibility range.

## Other luma.gl integrations

### Using with Engine

Draw Three.js meshes alongside native luma.gl models in a pass owned by your application.
The example combines an adapted Three.js cube and a luma Model triangle with shared depth.

<ClientOnlyLiveExample height={360} activationLabel="Load mixed objects example">
  <ThreeIntegrationDocsExample integration="engine" />
</ClientOnlyLiveExample>

Choose the adapter according to the scene you need:

| Adapter | Capabilities | Preparation and ownership |
| --- | --- | --- |
| `ThreeMeshAdapter` | Untextured basic materials, positions, indices, groups, draw ranges, transforms, visibility, and attribute updates. | Synchronize before recording draws. The application owns the pass and submission. |
| `ThreeSceneAdapter` | Prepared scenes using the backend's supported materials, textures, and directional shadows. | Initialize, prepare environments, then call `prepare(scene, camera)` before opening the destination pass. The application disposes the adapter. |

Both adapters borrow source objects and the device, and own their adapter resources.
The basic mesh path does not support textures, TSL, PBR, or deformation. Submit draws
before reusing their uniforms for another camera.

Prepared scene draws preserve the caller's attachments and never clear, end, or submit
the borrowed pass. This path requires single-sample rendering and display-encoded sRGB
output without tone mapping. Transmission, lazy environment preparation, postprocessing,
and nested passes during the borrowed draw are unsupported.

### Using with Core

`LumaRenderer` retains Three.js scene traversal and the upstream Three.js Shading
Language (TSL) compiler while creating GPU resources and passes through luma.gl.
The physical-material gallery demonstrates clearcoat, sheen, iridescence, and anisotropy
under directional and environment lighting. Drag to inspect how the materials respond
from different angles.

<ClientOnlyLiveExample height={360} activationLabel="Load Three.js renderer example">
  <ThreeIntegrationDocsExample integration="core" />
</ClientOnlyLiveExample>

#### Create a renderer

Supply a WebGPU or WebGL2 Device with a canvas context:

```ts
import {LumaRenderer} from '@luma.gl/three/backend';
import * as THREE from 'three/webgpu';
import {color, uniform} from 'three/tsl';

const renderer = new LumaRenderer({device});
await renderer.init();

const intensity = uniform(0.8);
const material = new THREE.MeshBasicNodeMaterial();
material.colorNode = color('royalblue').mul(intensity);

const scene = new THREE.Scene();
scene.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.z = 4;
renderer.render(scene, camera);
```

The renderer manages its passes and submissions. The application owns device creation,
canvas sizing, camera updates, and frame scheduling. `renderer.dispose()` releases
adapter resources; the application destroys the borrowed device separately.

#### Materials and rendering support

Tested scenes cover textured meshes, TSL uniforms and vertex displacement, morph targets,
skinning, instancing, directional PCF shadows, and selected physical material features:
clearcoat, sheen, iridescence, anisotropy, and transmission. These fixtures establish
coverage for specific scenes rather than general Three.js or glTF compatibility.

Prepare environment maps with `PMREMGenerator` after initializing the renderer and
before rendering the scene. Keep the generated target alive while its texture is in use.
Lazy prefiltering inside an active pass and cube-map inputs are unsupported.

WebGL2 supports graphics through Three.js's GLSL node builder. Compute requires WebGPU;
WebGL2 transform-feedback compute is not implemented. Floating-point environments also
require the relevant WebGL2 rendering and filtering extensions.

WebGL1, point-light cube shadows, VSM, reversed-depth shadows, postprocessing, XR,
and advanced GPU features remain outside the tested subset.

## Resource ownership

Choose one owner for camera state, animation time, and redraws. Sharing a device does
not automatically synchronize render loops. Prepare scenes before visible or picking
draws, and request a redraw after scene or animation changes.

Keep borrowed scenes, geometries, materials, buffers, and devices alive while adapters
use them. Dispose adapter-owned resources before destroying their dependencies.

## Examples and further reference

Run the full comparison harness from the repository root:

```sh
yarn workspace luma.gl-examples-three start
```

It provides synchronized luma.gl and upstream Three.js views, scene selection, backend
switching, and resize/disposal checks. The inline examples above hide this comparison UI.

See the [module README](https://github.com/visgl/luma.gl/blob/master/modules/three/README.md)
for detailed APIs, support probes, low-level picking methods, implementation constraints,
and acceptance-test coverage.

## Using with deck.gl

Add visualization layers to an existing Three.js application, or place Three.js models
inside a deck.gl application. Choose the direction that preserves your application’s
current scene and frame-loop owner.

### Add deck.gl layers to a Three.js application


Keep your existing renderer, camera, controls, and frame loop:

- `ThreeDeckInterleaved` from `@luma.gl/three/interleaved` draws into a native Three.js
  WebGL2 canvas with shared color and depth buffers. Render opaque Three.js content first,
  then call the adapter to add deck.gl geometry. Transparent objects across the libraries
  are not globally sorted.
- `ThreeDeckOverlay` from `@luma.gl/three/overlay` draws a separate transparent WebGL2
  canvas above a WebGL or WebGPU Three.js canvas. Camera alignment is shared; depth is not.

Both paths use Cartesian coordinates and an application-owned frame loop. Call their
support probes before attachment. The overlay leaves pointer input with Three.js controls;
automatic deck.gl hover and click handling are not routed through the host canvas.

### Add Three.js objects to a deck.gl application

<ClientOnlyLiveExample height={360} activationLabel="Load Lantern courtyard">
  <ThreeIntegrationDocsExample integration="deck" />
</ClientOnlyLiveExample>

The Lantern courtyard combines a textured Three.js model, lighting, and shadows
with native deck.gl polygons, markers, and animated columns sharing the same depth buffer.

`ThreeMeshLayer` draws basic meshes in deck.gl's single-sample Cartesian WebGPU pass.
Its basic-material path has no picking, textures, PBR, or geographic projection.

`ThreeSceneLayer` uses a caller-owned `ThreeSceneAdapter` for prepared scenes. Call
`adapter.prepare(scene, camera)` in deck.gl's `onBeforeRender`, before the pass opens.
The layer shares deck.gl's device, attachments, and viewport; removing it leaves the
adapter and source objects alive.

Prepared scenes support Cartesian coordinates and bounded local-meter Mercator scenes.
For meter offsets, use `COORDINATE_SYSTEM.METER_OFFSETS`, a three-component
`coordinateOrigin`, and the same origin in `synchronizeThreeCamera` before preparation.
This local tangent-frame approximation is intended for neighborhood-scale scenes.
Native deck.gl objects do not cast or receive the Three.js shadow map.

### Picking and highlighting

Prepared ThreeSceneLayer scenes support deck.gl GPU picking and highlighting. Supply
unique selectable roots in pickingObjects, enable pickable, and use autoHighlight
or highlightedObjectIndex for selection feedback. Three.js roots and native deck.gl layers
share picking depth, subject to deck.gl's picking filter.

Use deck.pickObjectAsync with unproject3D for surface coordinates. Individual instance
IDs, custom fragmentNode materials, and transmission are unsupported in this path.
See the [module README](https://github.com/visgl/luma.gl/blob/master/modules/three/README.md)
for picking examples, geographic placement, and ownership details.

The r187 buffer bridge supports `StandardDrawingPipeline`. Meshlet and visibility-buffer
drawing pipelines perform additional geometry processing and are unsupported; the support
probe rejects them. Do not change the drawing pipeline while a bridge is attached.
