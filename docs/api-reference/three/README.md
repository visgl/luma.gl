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

## Compute interoperability with upstream Three

`ThreeBufferBridge`, exported from `@luma.gl/three/interop`, borrows ordinary
Float32 luma vertex buffers into an initialized upstream `WebGPURenderer` using the
same `GPUDevice`. This path does not use `LumaRenderer` or translate materials.
Submit luma compute before rendering; both engines use the device's ordered queue.

The split-screen **Shared buffer / luma compute** scene compares 4,225 procedural
vertices generated by luma compute with upstream TSL displacement. The compute
buffer uses STORAGE and VERTEX usage only: no vertex readback or re-upload occurs.

The bridge relies on Three 0.185.1's private attribute cache and create/update/destroy
hooks. It prevents Three from uploading CPU metadata over borrowed buffers or
releasing them. It currently supports ordinary Float32 attributes only. CPU bounds
and raycasting do not reflect compute output. Dispose geometries before disposing
the bridge, and keep buffers/device alive until consumers are disposed. See the
[module README](https://github.com/visgl/luma.gl/blob/master/modules/three/README.md)
for construction and ownership details.

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

This path currently targets single-sample Cartesian views and display-encoded sRGB
output with no tone mapping. It uses pinned Three r185 context/output hooks to apply
color conversion inline, avoiding a second main-color output pass. Preparation adds
work each frame; this is a compatibility exploration, not a performance guarantee.
Transmission, lazy PMREM, postprocessing, picking occlusion and nested passes during
the borrowed draw are unsupported. Native deck objects neither cast nor receive the
Three shadow map. The basic `ThreeMeshLayer` remains a separate, smaller integration.
