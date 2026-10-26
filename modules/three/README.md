# @luma.gl/three

**Status: Exploration**

Private experimental integrations tested with Three.js **0.185.1**. Existing Three
applications can add deck layers or luma compute while keeping their renderer.

## Deck layers in an existing Three app

### Shared depth on a Three WebGL canvas

`@luma.gl/three/interleaved` draws native deck layers into the existing Three
WebGL2 canvas. Both renderers use the same color and depth buffers: opaque Three
objects hide deck geometry behind them, and deck geometry writes depth for later
Three draws. Three keeps its renderer, camera, controls, canvas sizing and frame loop.

```ts
import {ThreeDeckInterleaved, getThreeDeckInterleavedSupport} from '@luma.gl/three/interleaved';

const support = getThreeDeckInterleavedSupport(renderer);
if (!support.supported) throw new Error(support.reason);
const deckScene = await ThreeDeckInterleaved.create({
  renderer, // Existing upstream THREE.WebGLRenderer.
  target: controls.target,
  layers // Native deck layers with COORDINATE_SYSTEM.CARTESIAN.
});

function render(time) {
  controls.update();
  renderer.render(scene, camera); // Opaque Three content establishes depth.
  deckScene.render(camera, time); // Preserve color/depth and add deck geometry.
}
// Update with deckScene.setProps({layers}); detach with deckScene.dispose().
```

- The support probe requires a depth-enabled native `WebGLRenderer`, standard depth
  mapping, the default canvas framebuffer, and one full-canvas viewport. It rejects
  logarithmic/reversed depth, render targets, scissor rendering and active XR.
  Native WebGPU hosts use the separate overlay below; stock deck layers currently
  need a WebGL2 context for this shared-depth path.
- The adapter borrows the context and its luma device wrapper. It never clears host
  color/depth, resizes the native canvas, disposes the host device, or schedules frames.
  Each call resets Three's GL cache before and after deck work. Deck receives explicit
  depth and blend parameters, rather than relying on initialization state. Layer-level
  parameters can still override them, for example to turn off depth writes for transparency.
- The host performs canvas resizing and camera updates before drawing. The adapter
  follows actual drawing-buffer dimensions, including pixel-ratio changes, without
  assigning canvas dimensions after Three has rendered. No CSS layout or keyboard/
  pointer handlers are claimed; existing OrbitControls continue to own input.
- Later Three draws can use deck depth if they preserve the buffers (`renderer.autoClear
  = false`). Restore the host's clear policy for the next frame. Transparent objects
  across the two libraries are not globally sorted, and shared postprocessing, render
  targets, automatic deck picking and context-loss recovery are outside this tranche.
- The camera/coordinate/timestamp contract below also applies. `dispose()` is idempotent
  and finalizes deck resources only. Recreate the integration to attach again.

The Three example defaults to **Shared depth** on WebGL and includes an **Always above**
comparison. Its route crosses the cube, making the difference visible while orbiting.

### Separate transparent canvas

`@luma.gl/three/overlay` adds a transparent deck canvas to a running Three application.
The application keeps its renderer, scene, camera, controls and frame loop. It works
with an already initialized upstream `WebGLRenderer` or `WebGPURenderer`; no shared
device, renderer replacement or Three backend hooks are needed. The overlay currently
uses its own WebGL2 device, even when the host uses WebGPU.

```ts
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {ThreeDeckOverlay, getThreeDeckOverlaySupport} from '@luma.gl/three/overlay';

// renderer and its controls already exist. Its canvas fills this positioned container.
const support = getThreeDeckOverlaySupport({renderer, container});
if (!support.supported) throw new Error(support.reason);
const overlay = await ThreeDeckOverlay.create({
  renderer,
  container,
  target: controls.target, // Borrowed; follows pan/zoom without changing the camera.
  layers: [new ScatterplotLayer({
    id: 'observations',
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: [[0, 1, 0]],
    getPosition: position => position,
    radiusUnits: 'pixels',
    getRadius: 8,
    getFillColor: [255, 190, 70]
  })]
});

// Add one call to the application's existing frame function.
function render(time) {
  controls.update();
  renderer.render(scene, camera);
  overlay.render(camera, time);
}
// The application continues to schedule render through its existing loop.
// Update layers with overlay.setProps({layers: nextLayers}).
// Detach without disposing the host renderer, scene or controls:
// overlay.dispose();
```

### Host contract

- **Attachment:** `container` is a positioned HTML div and the host canvas is its direct
  child. The host canvas must fill it, without margins, borders or an independent CSS
  transform. The overlay appends and owns a transparent canvas with `pointer-events: none`.
  It does not wrap, reparent or modify the host canvas. The support probe only checks
  DOM attachment prerequisites; device creation can still fail asynchronously.
- **Scheduling:** `create()` initializes deck and stops its animation scheduler before
  its first frame. Only `render(camera, time?)` advances and draws deck. Call it after
  the Three render on each host frame, including frames needed for asynchronous data
  or deck transitions. For an application that renders on demand, explicitly request a
  host frame after changing layers or loading their data. No second animation loop or
  replacement of `renderer.setAnimationLoop` is installed. A supplied timestamp is in
  milliseconds and drives deck's timeline relative to the first frame; repeating it
  holds transitions at the same time. Omit it to use `performance.now()` consistently.
- **Camera:** perspective and orthographic cameras use a snapshot of the host's current
  view/projection matrices, including camera parents, zoom and view offsets. The host
  updates camera matrices; the overlay never writes the camera pose or projection.
  Pixel-sized symbols are calibrated at `target` (the world origin by default), with
  perspective scaling away from that depth. Pass the borrowed `controls.target` vector
  to keep that reference aligned with orbit/pan controls. A target behind the camera
  uses a reference depth of one world unit.
  WebGPU and reversed clip depth are converted to deck's convention. Projection's
  homogeneous scale is normalized for deck's pixel units without changing screen
  positions or clipping. This is one full
  canvas camera, not XR, stereo, scissor views or geographic projection.
- **Coordinates:** use `COORDINATE_SYSTEM.CARTESIAN`. Layer positions use the same XYZ axes
  and units as the Three world. The helper `makeDeckViewportFromThreeCamera(camera,
  width, height, target?)` exposes the same immutable matrix snapshot for applications needing
  projection/unprojection; dimensions are CSS pixels.
- **Size:** every host frame reads the host canvas's CSS size and renderer pixel ratio.
  The application remains responsible for resizing Three and updating its camera's
  projection. A zero-sized host hides the overlay until a later visible frame.
- **Ownership:** the overlay owns its deck instance, separate device, GPU resources,
  canvas and listeners. `dispose()` is idempotent; subsequent `render`/`setProps` calls
  do nothing. Recreate an overlay to attach again. Host resources remain application-owned.
- **Composition:** browser alpha compositing places deck above the Three image. There
  is no shared depth, lighting, postprocessing, GPU resource sharing, or combined picking.
  Pointer events remain with Three controls; automatic deck hover/click handlers are
  not routed through the host canvas in this tranche.

Open **Add deck layers to an existing Three.js app** from the Three example. It uses
an ordinary Three cube, lights, grid and OrbitControls, with native deck paths and
scatterplots. Compare shared depth with the separate overlay, and switch perspective/orthographic cameras, pixel ratio, layer
visibility, host WebGL/WebGPU rendering, and recreate the overlay while Three keeps
running. The example's frame function shows the integration boundary directly.

## Rendering Three scenes through luma

The optional renderer backend retains Three.js objects,
renderer orchestration and the upstream TSL compiler, while creating buffers,
textures, shaders, pipelines and passes through a borrowed luma.gl WebGPU or WebGL2 device.

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

The supplied device must have a WebGPU or WebGL2 canvas context. Device creation and final
device destruction belong to the caller. `renderer.dispose()` releases adapter
resources and allows creating another renderer on the same device.

The module also includes an object adapter for caller-owned luma render passes
and a thin GPU-buffer bridge into upstream Three rendering. The bridge is the
compute interoperability path; it does not require replacing Three's backend.

## Choose an integration

All paths are experimental and tested against Three **0.185.1**; the deck
and overlay entry points additionally require this workspace's patched deck **9.4.0** and luma **10**.
These are tested combinations, not a broad version range.

| Application needs | Entry point | Rendering and ownership contract |
| --- | --- | --- |
| Deck layers added to an existing Three app | `@luma.gl/three/overlay` | Three owns the frame loop and camera; a separate transparent WebGL2 canvas draws above the host. |
| luma compute feeding an existing Three scene | `@luma.gl/three/interop` | Upstream `WebGPURenderer` renders; caller owns the shared WebGPU device and buffers. |
| Three materials/TSL rendered through luma resources | `@luma.gl/three/backend` | `LumaRenderer` manages and submits its passes; caller owns the device. WebGPU and WebGL2 graphics; WebGPU compute only. |
| Simple meshes mixed into a luma pass | `@luma.gl/three/objects` → `ThreeMeshAdapter` | Caller owns the pass and submission; WebGPU, untextured basic materials. |
| Prepared PBR scene mixed into a luma pass | `@luma.gl/three/objects` → `ThreeSceneAdapter` | Prepare before the pass; draw borrows the pass; caller owns the adapter and source scene. |
| Three objects mixed with deck layers | `@luma.gl/three/deck` | WebGPU, single-sample deck pass; simple Cartesian meshes or prepared scenes in Cartesian/local Mercator coordinates. |

For every path, choose one owner for camera state, animation time and redraws.
Sharing a device does not combine render loops or automatically schedule work.
Keep source objects and borrowed buffers alive until their consumers are disposed.
The compute bridge does not provide deck picking or make CPU raycasting see GPU data.

## Run the prototype

From the repository root:

```sh
yarn install
yarn workspace luma.gl-examples-three start
```

The example defaults to the Lantern glTF PBR scene and displays luma.gl and upstream
Three.js side by side on separate canvases and devices. Orbit, pan and zoom in either
pane update both cameras. A shared animation clock keeps the TSL scene synchronized.
The page and controls use a system sans-serif font. Controls disable directional lighting, shadows and the environment
independently. The original TSL cube and compute check remain available in the scene selector.
The example also provides resize and recreation controls.
The website lists it under **Experimental**, at `/examples/experimental/three`.
The package is public with experimental APIs.
The backend selector recreates both renderers on either WebGPU or WebGL2. The
upstream comparison uses `forceWebGL` when WebGL2 is selected. The mixed-object
scene is disabled on WebGL2 because that separate adapter still uses WGSL only.
The selector includes Animated Morph Cube, Robot Expressive's Walking clip, and
64 animated colored instances. Both views evaluate animation at the same absolute
time using upstream `AnimationMixer` or per-instance matrix updates.
It also includes a physical-material gallery (clearcoat, sheen, iridescence and
anisotropy) and two transmitting spheres in front of a colored opaque backdrop.
The glass scene exercises roughness, IOR, thickness, attenuation and dispersion.
Recreating the comparison disposes both renderers, controls and scenes, destroys
the example-owned luma device, and creates fresh canvases.

## Verified behavior

The browser acceptance test compares an indexed, textured mesh against upstream
Three.js at a fixed phase with a maximum per-channel difference of two bytes.
It exercises TSL vertex displacement and uniform updates, depth occlusion,
offscreen targets, canvas resize, compute storage-buffer writes, byte-range
readback and disposal/recreation. It also spies on luma GPU entry points. Headless parity fixtures use offscreen
render targets: the CI SwiftShader runner cannot allocate onscreen swap-chain
surfaces. Live example smoke checks exercise canvas presentation, resize and recreation.

The glTF acceptance test loads the existing Khronos Lantern asset with its original
`MeshStandardMaterial`, base-color, metallic/roughness, normal and emissive textures.
It adds a directional light and a deterministic procedural HDR studio environment,
prefiltered independently by Three's `PMREMGenerator` on each renderer. Maximum
per-channel difference is bounded to two bytes and mean absolute difference to
0.25 bytes. A ground plane receives directional PCF shadows from the Lantern meshes.
Tests verify ground darkening, updated shadows after moving the light, the shadow
intensity toggle, and independent light and environment contributions.
The asset remains in its existing directory with its original CC0 attribution;
the example and tests share it without duplicating the binary.

Animation acceptance tests compare the morph cube, skinned robot and instanced
scene at two fixed times, with the same two-byte maximum and 0.25-byte mean
tolerances. They confirm actual morph targets, skinned meshes and 64 colored
instances are present, and that advancing time changes the rendered image.
Morph targets use upstream TSL's floating-point data-array texture, allocated,
uploaded and bound as a luma `2d-array` texture. Robot skinning and instance
matrix/color attributes reuse the existing buffer path. This does not establish
crowd-animation performance, arbitrary rigs, or independently skinned instances.

Physical-material tests compare the gallery and transmission scene against upstream
with the same two-byte maximum and 0.25-byte mean tolerances. Disabling the physical
features must visibly change the output. Transmission captures the opaque framebuffer
through luma's command encoder, then builds mipmaps and resumes the scene pass while
preserving its color/depth attachments. A test spies on the luma texture-copy operation.
These procedural fixtures verify selected material settings rather than general glTF
material-extension fidelity. Depth framebuffer copies remain unsupported.

Initialize the renderer before preparing the environment:

```ts
const generator = new THREE.PMREMGenerator(renderer);
const environmentTarget = generator.fromEquirectangular(environmentTexture);
scene.environment = environmentTarget.texture;
generator.dispose();
// Keep environmentTarget alive while the scene uses its texture, then dispose it.
```

This milestone explicitly prepares PMREM before rendering. Lazy environment
prefiltering inside an active scene pass and cube-map inputs are not yet supported.

Supported prototype operations include triangle meshes, perspective cameras,
ordinary and interleaved attributes in supported WebGPU vertex formats, indexed
and non-indexed draws, normal alpha blending, single-sample render targets,
2D R/RG/RGBA byte and floating-point textures, data-array textures for morph targets,
ordinary skinning, instanced matrix/color attributes, generated mipmaps and mipmap samplers,
depth-free PMREM passes, directional PCF shadows, packed uniform buffers, and TSL compute storage buffers.
Interleaved attributes share one source GPU buffer. Attribute readback returns the
packed source array (or requested byte range), and geometry disposal releases that
buffer once. WebGL binds each attribute location from the shared buffer; WebGPU
binds the buffer slot containing all of its attributes.

Nested shadow renders suspend the parent pass, submit the shadow map, and resume
the parent with its attachments and viewport preserved. Shadow depth textures use
less-equal comparison samplers. The example's shadow toggle sets shadow intensity
to zero; shadow-map generation remains enabled.

This is not a general Three.js replacement. WebGL1, point-light cube shadows, VSM, reversed-depth shadows, broad PBR parity,
postprocessing, XR, bundles, array cameras, compressed/cube/storage textures,
indirect commands, advanced blend/depth/stencil state and reusable
`ReadbackBuffer` targets are outside the prototype. Unsupported backend hooks
throw; material/node features beyond the tested subset have no compatibility
promise. Texture readback currently returns raw bytes, including for float formats.

## WebGL2 backend

`LumaRenderer` selects upstream `WGSLNodeBuilder` or `GLSLNodeBuilder` from the
supplied device type. It never constructs Three's native GPU backend. WebGL2 uses
the GLSL binding/block names while preserving Three's packed std140 uniform bytes.
Texture filtering/wrapping/comparison parameters are applied through luma texture
samplers, mipmaps through the luma WebGL texture API, and viewport/scissor coordinates
are converted to WebGL's origin. Indexed offsets are translated to bytes and
instanced draws explicitly select luma's WebGL instanced path.

The same glTF, animation, instancing and physical-material tests run against each
matching upstream backend with the existing image tolerances. A WebGL2 TSL test
verifies sampled textures, animated uniforms/displacement, resize, device borrowing
and renderer recreation. Floating-point PMREM requires the appropriate WebGL2
texture/renderbuffer/filter extensions on the device; tested hardware provides them.

WebGL2 compute throws explicitly. Upstream GLSL compute uses transform feedback;
support would require translating its varying/attribute metadata and alternating
input/output buffers through luma's existing transform-feedback APIs. No missing
luma core API has been identified for that work. The selector's TSL scene therefore
checks graphics only on WebGL2 and reports compute as unsupported. General storage
operations, multidimensional dispatch and atomic/workgroup semantics are not promised.

## Architecture assessment

The approach is feasible for the tested rendering and compute subset. No luma core
API extension was needed: existing shader layouts represent explicit bind groups,
binding indices, visibility and resource kinds, and core passes execute the work.

Three's `Renderer`, `Backend`, `WGSLNodeBuilder` and `StandardNodeLibrary` exports
avoid deep runtime imports, but their contracts are still version-sensitive.
`@types/three` omits most backend hooks, so upstream internal values are confined
to the backend implementation. Updating the pinned version requires rerunning
render and compute parity tests. Sampled textures inherit the sampler flag;
translation must test the texture flag first.

The adapter reuses Three's already-packed uniform bytes. It bypasses luma Model,
ShaderInputs and ANARI rather than translating arbitrary TSL into another material
system. Pipeline and render-object caches are retained until renderer disposal;
long-lived scene churn and shared-device scheduling need further work before
production use. Each completed render/compute call submits the device encoder,
so callers must coordinate other work on the borrowed device.

## Complementary integration boundaries

`@luma.gl/three/backend` is the renderer-backend entry point. The root export remains
available for existing prototype callers. This path retains upstream scene traversal,
material compilation, animation, sorting, shadows and transmission orchestration.
It submits its own passes on the borrowed device; it cannot draw inside a caller's
already-open luma render pass.

The second path is now available as `ThreeMeshAdapter` from
`@luma.gl/three/objects`. It borrows a Three mesh and camera, uploads geometry into
luma buffers, and records draws in the caller's render pass. It never creates a
Three renderer, opens/ends a pass, submits work, or destroys the source objects/device.

```ts
import {ThreeMeshAdapter} from '@luma.gl/three/objects';

const adapter = new ThreeMeshAdapter({device, mesh});
adapter.synchronize(camera); // before opening the pass
const pass = device.beginRenderPass({framebuffer, clearDepth: 1});
adapter.draw(pass);
nativeLumaModel.draw(pass);
pass.end();
device.submit();
adapter.dispose(); // releases only this adapter's GPU resources
```

This first version supports ordinary float32x3 positions, uint16/uint32 indices,
non-indexed meshes, geometry groups/draw ranges, world/camera transforms, visibility,
and untextured `MeshBasicMaterial` colors/opacity with normal alpha blending. Pipeline
state follows material side, depth, alpha and negative-scale orientation. Call
`synchronize(camera)` after changes; attribute versions trigger uploads, replaced or
grown attributes recreate buffers, and changed material pipeline state recreates its
pipeline. Buffers belong to each adapter; shared-geometry deduplication is future work.
Attribute update ranges on the source are left intact. Submit recorded work before
synchronizing the same adapter again with a different camera or frame.

Match the caller's color/depth formats through constructor options. Output is linear
by default; `outputColorSpace: 'srgb'` encodes for a non-sRGB canvas attachment.
The mixed example uses direct canvas output on luma and a half-float intermediate on
Three, avoiding extra 8-bit linear quantization before Three's canvas output.
Its browser test uses matching linear unsigned-byte offscreen targets.

Choose **Mixed Three / luma objects** in the example. The left view draws an adapted
Three cube and a native luma `Model` triangle in one pass; the right view renders both
as Three meshes. A test verifies red/green center-pixel occlusion as the triangle moves
through the cube, two-byte upstream parity, attribute/transform updates, one pass per
frame, and source/device ownership. Node tests cover groups/ranges, invalid materials,
version updates, pipeline invalidation, replaced buffers and idempotent disposal.

Textures, vertex colors, interleaved attributes, node materials/TSL, instancing,
skinning/morphing, fog and lighting are outside this object's current mapping. The
application owns traversal, sorting and scene services such as PBR, shadows and
postprocessing. Unsupported mesh/material inputs throw. Arbitrary TSL graphs cannot
be treated as luma material descriptions: upstream WGSL compilation is coupled to
Three's renderer bindings and node lifecycle. Those scenes continue to use the backend.

## Shared compute buffers with upstream Three

`@luma.gl/three/interop` provides a thin `ThreeBufferBridge` for upstream
`WebGPURenderer`, independently of `LumaRenderer`. Create a luma WebGPU device,
pass `device.handle` as the upstream renderer's `device` option, and initialize it
before constructing the bridge. Both engines then use the same native device and queue.

```ts
import {Buffer} from '@luma.gl/core';
import {getThreeBufferBridgeSupport, ThreeBufferBridge} from '@luma.gl/three/interop';
import {WebGPURenderer} from 'three/webgpu';

const renderer = new WebGPURenderer({canvas, device: device.handle});
await renderer.init();
const support = getThreeBufferBridgeSupport(device, renderer);
if (!support.supported) throw new Error(support.reason);
const bridge = new ThreeBufferBridge(device, renderer);
const positions = device.createBuffer({
  byteLength: vertexCount * 12,
  usage: Buffer.STORAGE | Buffer.VERTEX
});
geometry.setAttribute('position', bridge.createAttribute(positions, 3, vertexCount));
// Dispatch luma compute into positions, end the pass, and call device.submit().
// Three's subsequent render reads the same GPUBuffer directly.
renderer.render(scene, camera);

geometry.dispose(); // Forgets Three's cache without destroying the borrowed buffer.
bridge.dispose();
renderer.dispose(); // Leaves the externally supplied GPUDevice alive.
positions.destroy();
device.destroy();
```

Select **Shared buffer / luma compute** in the split-screen example. The left
pane computes 4,225 wave vertices, 24,576 triangle indices and offsets for three
instances through luma. Upstream Three renders the borrowed buffers directly;
the right pane uses equivalent CPU topology/offsets and upstream TSL displacement.
Only a phase uniform is written each frame. Geometry buffers have STORAGE plus
VERTEX or INDEX usage, without COPY_SRC, COPY_DST or mapping flags. Browser tests
compare three phases, verify buffer identity and absence of geometry uploads, and
exercise resize, disposal and recreation. Separate GPU tests cover both index widths.

`getThreeBufferBridgeSupport(device, renderer)` checks revision, device identity,
initialization, backend hooks and an existing bridge without mutating either engine.
It returns `{supported: true}` or `{supported: false, reason}`. The constructor uses
the same check before installing any hooks. A successful probe is an attachment
check for this pinned integration, not general material or renderer conformance.

| Method | GPU layout | Required usage |
| --- | --- | --- |
| `createAttribute(buffer, itemSize, count)` | Packed Float32, 1–4 components per vertex | VERTEX |
| `createInstancedAttribute(buffer, itemSize, count)` | Packed Float32, 1–4 components per instance, one element per instance | VERTEX |
| `createIndexAttribute(buffer, count)` | Packed indices from `buffer.indexType` (`uint16` or `uint32`); count is number of indices | INDEX |

Add STORAGE when compute writes a buffer. Supply `indexType: 'uint16'` or
`indexType: 'uint32'` when creating an empty luma index buffer. These methods borrow the whole buffer
from byte offset zero; they do not convert, upload or pad its elements. In particular,
uint16 indices stay uint16, bypassing Three's ordinary CPU upload conversion.

```ts
geometry.setIndex(bridge.createIndexAttribute(indices, indexCount));
geometry.setAttribute('instanceOffset', bridge.createInstancedAttribute(offsets, 3, instanceCount));
// Use InstancedBufferGeometry and set geometry.instanceCount explicitly.
// The material must consume instanceOffset, e.g. through a TSL attribute node.
```

The bridge is pinned to Three 0.185.1's private backend attribute methods/cache.
Interleaved and storage-node attributes, textures, automatic bounds, CPU raycasting
and deck integration remain unsupported. The CPU arrays are metadata only: do not
set `needsUpdate`, mutate their layout/usage, or compute bounds/normals from them.
Wireframe and other CPU topology processing cannot use borrowed index metadata.
Supply conservative bounds independently, or disable frustum culling as the example does.

Submit luma compute before Three renders. To replace or resize a borrowed buffer,
dispose its consuming geometries, create new attributes/geometries, then release the
old buffer after all queued work completes. Never destroy a buffer while a consumer
can still use it. Dispose geometries before the bridge; the bridge restores backend
hooks and never destroys caller buffers. Dispose the renderer before destroying the
shared device. Device loss requires recreating the device, renderers, bridge and data;
there is no automatic recovery. A public upstream borrowed-buffer API would remove
the private hooks; no new luma core API was needed for this subset.

## Three meshes in a deck.gl scene

`@luma.gl/three/deck` exports `ThreeMeshLayer` and `synchronizeThreeCamera`.
The optional deck entry point uses this workspace's patched deck.gl 9.4.0 and
luma 10 stack. It is independent of the renderer backend and compute bridge.

```ts
import {Deck, OrbitView} from '@deck.gl/core';
import {ThreeMeshLayer} from '@luma.gl/three/deck';

const deck = new Deck({
  device, // The layer borrows deck's existing luma WebGPU device.
  views: new OrbitView({orbitAxis: 'Y'}),
  initialViewState: {target: [0, 0, 0], zoom: 7},
  controller: true,
  layers: [new ThreeMeshLayer({id: 'three-meshes', meshes: [mesh]})]
});
// Include normal deck layers in the same layers list.
// deck.finalize() releases adapter resources, but not meshes or the supplied device.
```

Select **Three meshes inside deck.gl** in the example. A Three cube and a native
`ScatterplotLayer` disk share deck's device, active render pass and depth buffer.
The disk animates from behind the cube to in front. **Reverse deck layer order**
proves that occlusion follows depth rather than layer order. The right pane renders
matching Three objects through upstream Three. Orbit, pan and zoom in either pane
update one shared view state; reference camera matrices come from deck's viewport.
Pause, resize and disposal/recreation controls remain available.

Three normalizes camera scale during updates. `synchronizeThreeCamera` therefore
extracts a rigid camera pose and folds deck's common-space transform into the
projection matrix, preserving the complete view-projection product. It also
handles WebGPU's zero-to-one clip-depth convention. Perspective and orthographic
matrix tests cover nonzero targets, rotation and zoom. The reference camera's
automatic matrix updates are disabled while deck owns its pose and projection.

The layer currently accepts ordinary Cartesian triangle meshes with untextured
`MeshBasicMaterial`, following the object adapter's restrictions. It derives
pipeline color/depth formats from the actual deck pass and supports single-sample
attachments. Device, pass lifecycle, submission and source objects remain borrowed.
Mesh and material mutations are synchronized when deck redraws; applications must
request redraws when changing source objects (the example continuously animates).

Geospatial viewports, deck model/origin transforms, picking, extensions, layer parameters and layer
opacity are explicitly unsupported. Three material opacity and object transforms
remain available. Picking behind these non-pickable meshes does not account for
their occlusion. PBR, texture translation, instancing, skinning and automatic
transparent-object sorting are deferred. This is not a general Three scene loader
or a guarantee of compatibility with unpatched published deck/luma versions.

Browser verification compares the real deck/Three composition against upstream
at three camera/animation states, checks a non-default depth format, reverses layer
order, and verifies borrowed source/device ownership. Native deck circles are
analytic while the reference uses a 1024-sided polygon: mean RGB error is bounded
to one byte and fewer than 0.5% of pixels may differ by more than two bytes.

## Prepared Three scenes inside deck.gl

`ThreeSceneAdapter` from `@luma.gl/three/objects` reuses the backend and upstream
TSL compiler to render a prepared scene in a caller-owned WebGPU pass.
`ThreeSceneLayer` from `@luma.gl/three/deck` synchronizes its camera and records
those draws in deck's pass, sharing its device, color and depth attachments.

Select **Lantern courtyard inside deck.gl / PBR** to compare the Lantern's original
`MeshStandardMaterial`, sampled textures, directional PCF shadows and PMREM
environment against upstream Three.js. Native deck polygon tiles, survey rings,
animated data columns and markers surround the model. Both panes share orbit, pan,
zoom, lighting and environment controls; layer order can be reversed to inspect depth.

Initialize the adapter first. Use `adapter.renderer` to prepare PMREM before drawing.
Call `adapter.prepare(scene, camera)` in deck's `onBeforeRender`, before its pass
opens, then provide the adapter, scene and camera to `ThreeSceneLayer`. Preparation
renders a small offscreen target to upload resources and update shadow maps.
The final draw never clears, ends or submits the borrowed pass. Layer removal does
not dispose the adapter: the application owns its lifetime and calls `dispose()`
when finished. Source objects and the device remain borrowed.

This path targets single-sample Cartesian or bounded local-meter Mercator views
and display-encoded sRGB output with no tone mapping. It uses pinned Three r185 context/output hooks to apply
color conversion inline, avoiding a second main-color output pass. Preparation adds
work each frame; this is a compatibility exploration, not a performance guarantee.
Transmission, lazy PMREM, postprocessing and nested passes during
the borrowed draw are unsupported. Native deck objects neither cast nor receive the
Three shadow map. The basic `ThreeMeshLayer` remains a separate, smaller integration.

### Sharing one adapter across scene layers

Multiple `ThreeSceneLayer` instances can share a `ThreeSceneAdapter` and device.
Give each scene its own camera and prepare **every scene** in `onBeforeRender`,
before deck opens its pass. Synchronize each camera with its layer's viewport,
coordinate origin and `modelMatrix` before preparation. Preparing a later scene
preserves readiness of earlier scenes; each draw and pick synchronizes its own camera.

```ts
// onBeforeRender, with scenes already loaded and adapter initialized:
for (const {scene, camera} of scenes) {
  synchronizeThreeCamera(camera, viewport, WebGPUCoordinateSystem);
  adapter.prepare(scene, camera);
}
const layers = scenes.map(({id, scene, camera, pickingObjects}) =>
  new ThreeSceneLayer({id, adapter, scene, camera, pickable: true, pickingObjects})
);
```

Layers share the caller's color/depth attachments while retaining independent picking
registries and highlight state. The adapter owns and reuses uniform snapshots for each
draw slot before submission, so later scene/camera updates cannot overwrite uniforms
used by earlier draws, including across queued passes. This path uses the device's
default command encoder; custom command encoders are outside this integration.
Snapshots retain peak queued draw-slot capacity until disposal. Removing one layer does not dispose its scene or the
shared adapter. Readiness does not keep removed scenes alive; the application still
owns source resources and must dispose them when appropriate. Dispose the adapter
only after all its layers have been removed. Calls are sequential, not reentrant.

If preparation throws, the adapter rejects all later preparation and drawing,
including scenes prepared successfully earlier. Three does not unwind its private
render stack after every backend exception. The adapter closes/submits its owned
preparation work and restores the previous render target, but its renderer must not
be reused. Remove its layers, dispose the adapter and create a new adapter using the
same borrowed source scenes and device. Never-prepared scenes are also rejected.
Readiness is not automatic change tracking: prepare again after changing animation,
textures, lights or shadow state, and request a deck redraw.

### Layer placement with `modelMatrix`

`ThreeSceneLayer.modelMatrix` places the whole scene without editing its roots,
geometry, materials or lights. Supply a column-major, orientation-preserving affine
matrix: translation, rotation, positive scale, nonuniform scale and shear are supported.
Reflections, singular matrices and projective transforms are rejected. Lighting and
shadow maps continue to use the scene's original coordinate frame. This is scene
placement, not a change to the scene's internal lighting or physical units.

For Cartesian layers the matrix maps scene coordinates into deck coordinates. With
`METER_OFFSETS`, it maps scene coordinates into local east/north/up meters **before**
`coordinateOrigin` is projected into Mercator common space. The same placement applies
to visible rendering, highlighting, ID picking and `unproject3D` surface coordinates.
Those picked coordinates remain in deck's world/geographic frame, rather than the
source scene frame. Native layers keep their own placement and share depth normally.

Pass the same matrix to camera synchronization before preparation, especially for
camera-dependent TSL nodes and shadow preparation:

```ts
const modelMatrix = new Matrix4()
  .makeTranslation(12, -7, 3)
  .multiply(new Matrix4().makeRotationZ(Math.PI / 6))
  .elements;
// In onBeforeRender, before deck opens its render pass:
synchronizeThreeCamera(camera, viewport, WebGPUCoordinateSystem, origin, modelMatrix);
adapter.prepare(scene, camera);
// Supply the same origin and placement to the layer:
const layer = new ThreeSceneLayer({
  id: 'placed-models', adapter, scene, camera, modelMatrix,
  coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
  coordinateOrigin: origin
});
```

Create a new matrix value when placement changes so deck requests a redraw. Removing
`modelMatrix` restores the original placement. The basic `ThreeMeshLayer` still uses
its separate source-transform contract.

## Unified GPU picking for prepared scenes

Set `ThreeSceneLayer.pickable` and provide `pickingObjects`, an immutable array of
`{id: string | number, object: Object3D}` records. Each object is a selectable root;
rendered descendants resolve to the nearest listed ancestor. Roots and IDs must
be unique. `info.object` is the original record, so `info.object.id` is the application
identity and `info.object.object` is its Three root. `info.index` is the current array
index; preserve application IDs when reordering entries or replacing loaded roots.
Create a new array when membership changes. Unlisted scene geometry writes depth
with a zero picking color, so it still occludes objects behind it.

```ts
const layer = new ThreeSceneLayer({
  id: 'models', adapter, scene, camera,
  pickable: true,
  pickingObjects: [{id: 'vehicle-17', object: vehicleRoot}],
  onHover: info => showTooltip(info.object?.id),
  onClick: info => selectObject(info.object?.id)
});
const hit = await deck.pickObjectAsync({x, y});
const visibleObjects = await deck.pickObjectsAsync({x, y, width, height});
```

Both queries and deck's hover/click callbacks use the same GPU picking pass as native
deck layers. ID output bypasses tone mapping and color encoding. It uses the original
material's alpha-test coverage and vertex processing, including supported skinning,
morphs and TSL position nodes. Fully transparent fragments are discarded; partially
transparent surfaces are treated as selectable coverage and write picking depth.
Native deck geometry and Three geometry occlude each other through the shared pick
depth attachment, independent of layer order when their normal depth tests apply.
Only layers included by deck's picking filter participate; non-pickable native layers
still follow deck's usual exclusion rules. Keep this scene layer pickable if its
unlisted geometry should act as a picking occluder.

Prepare the scene before picking, just as before its visible draw. Changing scene
objects or animation requires requesting a deck redraw so preparation runs again.
Picking uses the active viewport's synchronized camera, including local Mercator
origins. It never opens, clears, ends or submits deck's pass, or takes ownership of
source materials, geometries, scene roots or the device.

This version returns root-level IDs. Individual instance IDs, custom
`fragmentNode` materials, transmission and nested rendering remain unsupported.
`ThreeMeshLayer` still has its separate non-pickable basic-material contract. The compute buffer bridge into upstream `WebGPURenderer` is independent
of this prepared-scene path.

Low-level callers may use `adapter.drawPicking(scene, camera, pass, getColor,
parameters?)`. The accessor returns normalized RGBA or `null` to omit an object;
zero RGBA draws an unselectable occluder. Use a linear `rgba8unorm` attachment for
byte IDs. Optional pipeline parameters let the caller supply its own layer encoding;
`ThreeSceneLayer` uses deck's alpha blend constant. Normal and picking draws restore
renderer hooks, shadow-update flags and pass-local pipeline state after errors.

Browser acceptance tests mix Three roots and native polygons, reverse layer order,
check alpha holes and TSL-deformed vertices, replace/reorder roots while preserving
IDs, and query visible objects in a rectangle. Normal PBR/geographic comparison
tests continue to check color parity and caller ownership.


### Surface coordinates with depth picking

Use `deck.pickObjectAsync({x, y, unproject3D: true})` to obtain a Three hit's
`info.coordinate` on its rendered surface instead of the viewport's default plane:

```ts
const hit = await deck.pickObjectAsync({x, y, unproject3D: true});
if (hit?.layer?.id === 'models' && hit.coordinate) {
  placeMarker(hit.coordinate);
}
```

Cartesian viewports return world XYZ in their coordinate units; Mercator viewports return longitude,
latitude and absolute altitude in meters, including a local-meter layer's coordinate
origin. These are world coordinates in the viewport's projection, rather than mesh-local positions.
Depth comes from the same compiled vertex path as picking, including supported TSL
deformation, skinning and morphs. Alpha-test holes and zero-alpha fragments retain
their picking coverage. ID selection still uses the shared Three/native depth pass;
a second pass reconstructs the selected Three layer's surface.

Depth is stored in a floating-point target without blending, tone mapping or color
conversion. It is sampled at a device pixel, so returned coordinates have pixel
quantization and float32 depth precision; a nonzero picking radius can sample a
nearby pixel. Do not treat the result as an exact CPU triangle intersection. deck
owns float-target capability checks and fallback behavior. Native layers retain their
own depth-picking support; this implementation adds the Three path.

Low-level callers may use `adapter.drawPickingDepth(scene, camera, pass, getColor)`
with an `rgba32float` color target and shared depth attachment. The accessor follows
`drawPicking`: `null` skips a disabled object; unlisted geometry still writes depth.
The output is `[clipDepth, 0, 0, 1]`, with clip depth in deck's `[-1, 1]` convention.
Preparation, pass lifecycle and source ownership remain caller-controlled.

The geographic example queries Three surface depth on clicks in either pane and
shows longitude, latitude and altitude. Native building clicks keep ordinary ID
selection. Delayed coordinate results are invalidated by newer selections, model
removal and disposal, using the same selection coordinator as ordinary picking.

### Hover and controlled highlighting

`ThreeSceneLayer` supports deck's `autoHighlight`, `highlightColor` and
`highlightedObjectIndex` props for the same roots listed in `pickingObjects`:

```ts
new ThreeSceneLayer({
  id: 'models', adapter, scene, camera,
  pickable: true,
  pickingObjects,
  autoHighlight: true,
  highlightColor: info => info.object?.id === 'vehicle-17'
    ? [255, 190, 70, 128] : [80, 180, 255, 128]
});
// Controlled selection: use the current array index; -1 suppresses hover highlighting.
const selected = layer.clone({highlightedObjectIndex: selectedIndex});
```

Mouse leave clears automatic highlighting. An integer `highlightedObjectIndex`
overrides hover; use `null` to return control to hover. Controlled indices are
positional, so recompute them from your application ID after replacing/reordering
`pickingObjects`. A constant RGB color defaults to alpha 255; RGBA alpha controls
source-over tint strength. A color accessor is evaluated by deck on hover, as for
native layers; use a constant color for controlled selection.

The tint is composited over the final display color, after Three's color conversion.
Premultiplied-alpha materials are converted to straight RGB for the tint and back
to premultiplied RGB for their existing blend pipeline.
All rendered descendants of the selected root share it; a nested listed root has
its own identity. Shared materials and source colors/emissive values remain unchanged.
Alpha-test holes and fully transparent fragments retain their coverage, normal depth
and blending still apply, and picking always writes the original IDs. Unselected
roots and unlisted geometry receive no tint. No additional render pass is opened.
The separate highlighting shader context preserves normal PBR output when disabled.
Custom `fragmentNode` materials are unsupported while highlighting is active.

At the lower-level adapter boundary, `drawHighlighted(scene, camera, pass, getColor)`
accepts normalized display-space RGBA per rendered object; return `null` for no tint.
It borrows the pass and source scene with the same preparation and ownership rules
as `draw`. The geographic example enables hover tinting for Lantern roots and native
buildings in the deck pane; click selection remains synchronized across both panes.

## Geographic deck exploration

The **Geographic Lanterns + picking** scene uses a local east/north/up meter frame
anchored at longitude/latitude/altitude. `ThreeSceneLayer` accepts
`COORDINATE_SYSTEM.METER_OFFSETS` and `coordinateOrigin`; pass the same origin to
`synchronizeThreeCamera(camera, viewport, coordinateSystem, coordinateOrigin)`
before preparation. This bounded Mercator tangent frame supports object altitude,
scale and heading; large extents and globe projection remain unsupported.

The demo uses deck GPU picking for Lantern roots and native buildings. Hovering the
deck pane shows object IDs; clicking either pane queries the same deck scene and
synchronizes selection highlights. The reference pane still renders Three building
and ground equivalents for visual parity, but picking does not require CPU occluder
copies. Async reference clicks ignore results superseded by a newer selection,
model toggle or disposal. Layer removal/reinsertion preserves borrowed source data.

`pickThreeObject` remains an independent CPU triangle-ray helper. It can find the
nearest supplied visible triangle within camera clipping planes, but does not model
material alpha coverage or arbitrary native deck occlusion. Use GPU picking for the
composed scene.

Lantern bases are normalized from geometry bounds before applying instance scale,
so placement altitude describes the model base.
