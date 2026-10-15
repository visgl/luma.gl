---
title: Three.js adapter prototype
---

# Three.js adapter prototype

**Status: Exploration**

:::caution[Exploratory and unconfirmed]

This module is still exploratory and unconfirmed. Its APIs, supported features,
and integration approach may change. The examples and tests demonstrate selected
scenarios; they do not establish general compatibility or production readiness.

:::

`@luma.gl/three` is a private experimental workspace package pinned to Three.js
0.185.1. It accepts actual Three.js scenes and upstream TSL materials, and executes
GPU work through luma.gl. The package is not published and does not promise general
Three.js compatibility.

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

Supply a WebGPU or WebGL2 `Device` with a canvas context. The renderer borrows that device;
`renderer.dispose()` releases its resources, while the caller destroys the device.
The renderer inherits initialization, rendering, sizing, animation and compute
methods from Three's common renderer. Import TSL functions from `three/tsl`.

The prototype verifies indexed textured meshes, animated TSL uniforms and vertex
displacement, depth, offscreen rendering, compute buffer readback, resize and
renderer recreation. Shader bindings retain upstream indices and packed uniform
bytes. GPU resources and passes use luma core directly.

Run the comparison example with `yarn workspace luma.gl-examples-three start`.
It displays the same scene on luma.gl and upstream Three.js side by side, using two
canvases and devices. Orbit, pan and zoom controls on either canvas update both
cameras; animation uses one shared clock. The comparison uses a system sans-serif font.
The example is listed in the website's Experimental section. Its backend selector
recreates both sides with WebGPU or WebGL2, using upstream `forceWebGL` for the latter.
The backend uses upstream `WGSLNodeBuilder` or `GLSLNodeBuilder` and luma resources
for the selected device. The package remains private.

The default scene loads the repository's Khronos Lantern glTF asset using upstream
`GLTFLoader`. It retains the model's `MeshStandardMaterial` and base-color,
metallic/roughness, normal and emissive textures. A directional light and a procedural
HDR studio environment illuminate it. Each renderer prepares its own environment
through upstream `PMREMGenerator` before rendering. The browser test compares output
with a maximum channel difference of two bytes and a mean difference below 0.25 bytes,
and checks that both lighting sources affect the result independently.

Lantern meshes cast directional PCF shadows onto a ground plane. Both panes share
a shadow toggle (implemented through shadow intensity). The adapter uses depth
comparison samplers and suspends/resumes parent render passes for Three's nested
shadow rendering. Tests verify visible ground darkening and moving-light shadow
updates against upstream with the same two-byte channel tolerance.

The selector also includes Animated Morph Cube, Robot Expressive's Walking clip,
and 64 animated colored boxes in one `InstancedMesh`. Both devices evaluate the
same absolute animation time. Morph targets use upstream TSL and luma data-array
textures; skinning and instance matrices/colors retain Three's buffer attributes.
Browser tests verify the scene features, image changes between two animation times,
and upstream parity within two byte values per channel. These fixtures follow the
animation, deformation and instancing priorities in the rendering roadmap; they
do not establish general glTF animation or crowd-performance compatibility.

Two further comparisons cover physical materials. The gallery uses clearcoat, sheen,
iridescence and anisotropy; the glass scene uses transmission, roughness, thickness,
IOR, attenuation and dispersion in front of an opaque colored backdrop. Tests compare
upstream output with the same image tolerances and check that disabling those features
changes pixels. The backend captures scene color through a luma framebuffer-to-texture
copy, generates mipmaps, and resumes rendering with preserved attachments. This is
tested procedural material coverage, not general glTF extension conformance.

This milestone adds generated texture mipmaps, mipmap samplers, R/RG lookup textures,
and PMREM passes without depth attachments. Mipmap uploads between scene draws suspend
the active pass and resume with preserved color and depth attachments.

WebGL1, point-light cube shadows, VSM, reversed-depth shadows, general PBR,
postprocessing, XR and advanced GPU features are deferred.
Prepare PMREM before rendering; lazy prefiltering within an active scene pass and
cube-map inputs are still unsupported.
The package README lists supported operations, limitations and maintenance costs.

The glTF, morph/skin/instance animation and physical-material tests compare against
upstream on both matching backends with the same image tolerances. WebGL2 also
verifies animated TSL graphics, resize and borrowed-device recreation. Compute is
explicitly unsupported on WebGL2; its transform-feedback mapping is deferred.

The backend entry point retains Three's renderer orchestration. The complementary
`@luma.gl/three/objects` entry exports `ThreeMeshAdapter` for drawing a Three mesh in
an application-owned luma pass alongside native luma models. Its initial mapping
supports untextured basic materials, ordinary positions, indices, groups/draw ranges,
transforms, visibility and attribute-version updates. It borrows source objects and
the device, and owns its GPU resources. Synchronize before recording draws; submit before reusing uniforms for another camera. Pass
lifecycle, ordering and submission remain application-owned.

The **Mixed Three / luma objects** comparison verifies one pass with an adapted cube
and a native luma Model triangle, shared-depth occlusion, updates and disposal against
upstream Three. Textures, TSL, PBR and deformation in this object path remain deferred.
This separate object adapter currently requires WebGPU; its scene is disabled when
WebGL2 is selected.
The package README documents the API, output settings and synchronization boundaries.
The root `LumaRenderer` export remains available for existing prototype callers.

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

## Compute interoperability with upstream Three

`ThreeBufferBridge`, exported from `@luma.gl/three/interop`, borrows packed
Float32 vertex and instanced attributes and uint16/uint32 index buffers into an
initialized upstream `WebGPURenderer` on the same `GPUDevice`. Submit luma compute
before rendering; both engines use the device's ordered queue.

Call `getThreeBufferBridgeSupport(device, renderer)` before attaching to get a
non-mutating `{supported: true}` or `{supported: false, reason}` result. It checks
the pinned Three revision, initialization, device identity and required private hooks.

The split-screen **Shared buffer / luma compute** scene compares three wave instances
using luma-generated positions, triangle indices and instance offsets against upstream
TSL displacement. Shared geometry buffers use STORAGE plus VERTEX or INDEX only;
there is no geometry readback or re-upload. GPU tests cover both index widths.

The bridge prevents CPU metadata uploads and destruction of borrowed buffers.
CPU bounds, raycasting and wireframe topology do not reflect GPU output. Interleaved
attributes, storage-node attributes and textures remain unsupported. Dispose consuming
geometries before the bridge; keep buffers and the shared device alive until their
consumers and queued work finish. Replacement and device loss require explicit
recreation. See the
[module README](https://github.com/visgl/luma.gl/blob/master/modules/three/README.md)
for method signatures, construction and ownership details.

## Three meshes inside deck.gl

`@luma.gl/three/deck` exports `ThreeMeshLayer` for caller-owned Three meshes in a
deck layer list. It uses deck's WebGPU device, active render pass, color/depth
attachments and viewport, without constructing another renderer. The example
mixes a Three cube with a native `ScatterplotLayer` disk, compares against upstream
Three, and synchronizes controls across both panes. Reversing layer order preserves
the same depth occlusion.

`synchronizeThreeCamera(camera, viewport, coordinateSystem)` preserves deck's
full view-projection product, including OrbitView's scale and target offset. It
folds scale into projection because Three strips camera scale during updates.
Automatic camera matrix updates are disabled while deck owns the camera.

This optional entry uses the workspace's patched deck 9.4.0/luma 10 stack. The
current layer is limited to single-sample Cartesian viewports and ordinary,
untextured `MeshBasicMaterial` meshes. Geospatial projection, picking, extensions,
layer opacity/parameters and deck origin/model transforms are rejected. Picking occlusion,
PBR, textures and transparent-object sorting are deferred. Layer finalization
releases adapter GPU resources and leaves caller meshes, materials and device alive.

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

This version returns root-level IDs. Individual instance IDs, `unproject3D`, custom
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

## Geographic placement and selection exploration

Select **Geographic Lanterns + picking** to render three Lantern instances around
a San Francisco longitude/latitude anchor. Their east/north/up offsets, altitudes,
scales and headings are expressed in meters. Native deck buildings and ground
share the WebGPU device and depth attachment. The upstream pane renders matching
geometry using the same geographic camera transform. Drag or zoom either map
to control both views; Shift-drag changes bearing/pitch, and two-finger gestures
zoom or rotate. Click either pane to select and highlight a stable object ID.
A public `MapController` and `mjolnir.js` event manager on the reference canvas
share the same controlled `MapViewState` as deck, without another deck device.
Each Lantern carries a canvas-textured THREE.js nameplate in both render paths.
The nameplates use standard materials; the Lantern asset keeps its original PBR
textures, so the material comparison remains meaningful. Nameplate hits select
their parent Lantern, and the label texture is released with the fixture.

For bounded local scenes, set `ThreeSceneLayer` to
`COORDINATE_SYSTEM.METER_OFFSETS` with a three-component `coordinateOrigin`.
Pass that same origin as the fourth argument to `synchronizeThreeCamera` before
`adapter.prepare`. The camera maps the local meter frame into Mercator common
space using distance scales at the anchor. Source geometry stays near the origin,
preserving GPU precision. This is a tangent-frame approximation for neighborhood
scenes, not globe support or a replacement for deck's nonlinear projection of
large geographical extents.

The demo uses deck's GPU picking callbacks and async queries for both Lantern roots
and native buildings. Hovering the deck pane shows the ID; clicking either pane
selects and highlights the same composed scene. Three building equivalents in the
reference pane provide visual parity rather than a CPU picking approximation.

`pickThreeObject(camera, [normalizedX, normalizedY], roots)` remains a separate CPU
ray helper for applications that supply their own occluders. It does not account for
alpha-test holes, arbitrary GPU deformation or native deck geometry.

**Toggle Lantern models** removes and reinserts the prepared layer, preserving
the caller's adapter, source geometry and device. Reverse layer order checks shared
depth. Resolution and recreation controls resize or release the owned resources.
The geographic fixture keeps lighting and environment settings fixed.

Lanterns and native buildings receive selection IDs and matching highlights. Lantern
bases are normalized from geometry bounds before applying instance scale, so
placement altitude describes the model base.
