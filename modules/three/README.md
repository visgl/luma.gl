# @luma.gl/three

**Status: Exploration**

Private experimental adapter for Three.js **0.185.1**. It retains Three.js objects,
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

All paths are experimental and tested against Three **0.185.1**; the deck entry
point additionally requires this workspace's patched deck **9.4.0** and luma **10**.
The package is private. These are tested combinations, not a broad version range.

| Application needs | Entry point | Rendering and ownership contract |
| --- | --- | --- |
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
The package remains private and is not published to npm.
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

This first version returns root-level IDs. Individual instance IDs, automatic
highlighting (`autoHighlight`), `unproject3D`, custom `fragmentNode` materials,
transmission and nested rendering remain unsupported. Use callbacks to implement
highlighting. `ThreeMeshLayer` still has its separate non-pickable basic-material
contract. The compute buffer bridge into upstream `WebGPURenderer` is independent
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
