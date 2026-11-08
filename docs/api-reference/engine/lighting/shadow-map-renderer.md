# ShadowMapRenderer

`ShadowMapRenderer` from `@luma.gl/engine/lighting` owns shadow-map resources and records
caller-supplied depth draws for directional, spot, and point lights. It works with WebGPU
and WebGL2. The `shadow` shader module from `@luma.gl/shaders` provides receiver sampling.

```typescript
import {ShadowMapRenderer} from '@luma.gl/engine/lighting';
import {shadow} from '@luma.gl/shaders';

const shadows = new ShadowMapRenderer(device, {
  quality: 'balanced',
  directionalLightCapacity: 0,
  spotLightCapacity: 1,
  pointLightCapacity: 0,
  spotMapSize: 1024
});

const shadowProps = shadows.render({
  camera: {viewMatrix, projectionMatrix, near: 0.1, far: 100},
  spotLights: [{position: [0, 8, 0], direction: [0, -1, 0], range: 20, outerConeAngle: 0.4}],
  prepareShadowCasters(view) {
    // Create/upload caller-owned per-view caster uniforms before the pass begins.
    prepareCasterDraws(view);
  },
  drawShadowCasters(view) {
    // Use view.viewProjectionMatrix and view.rasterParameters with a depth-only pipeline.
    drawCasterModels(view);
  }
});

// receiverModel must include the shadow module and explicitly sample its factors.
receiverModel.shaderInputs.setProps({shadow: shadowProps});
// Record receiver draws after the shadow passes, then submit the device normally.
```

## Lights and cameras

`ShadowMapRendererProps` configures light capacities, map sizes, and the `low`, `balanced`,
or `cinematic` quality preset. Defaults reserve one light of each type; spot and point capacities can increase to four. The renderer supports one directional light with up to four cascades. Each spot
light has one view; each point light has six cube-face views. Active light counts must
fit the configured capacities. `SHADOW_QUALITY_SETTINGS` exposes the frozen preset budgets.

`ShadowCamera` includes view/projection matrices and near/far distances. Its optional
`clipDepth` is `negative-one-to-one` by default, matching math.gl projections; supply
`zero-to-one` for a WebGPU projection. Computed light cameras and returned receiver matrices
use [0, 1] depth on both backends. A WebGL caster must convert clip Z to [-1, 1] before
writing `gl_Position`. Directional light `direction` points from the surface toward the
light; spot light `direction` points along the light cone. Angles are in radians.

`getPracticalCascadeSplits`, `getDirectionalCascadeViews`, `getSpotShadowView`, and
`getPointShadowViews` expose the same camera calculations for custom orchestration.
The spot and point camera helpers accept fully resolved light descriptors.

## Draw callbacks and ownership

The application selects casters, creates compatible depth-only pipelines, and supplies
vertex transforms, skinning, instancing, culling, and alpha-cutout policy. Each
`ShadowRenderView` provides the framebuffer, pass, light index, cascade or cube-face
identifier, matrices, resolution, and raster parameters. `prepareShadowCasters` runs
before opening that view's pass; `drawShadowCasters` runs inside it. The renderer ends
the pass even if the draw callback throws.

Use separate uniform storage for views recorded into the same command buffer. Repeatedly
writing one shared uniform buffer does not snapshot earlier draws. The renderer does not
submit commands or destroy caller models, geometry, or materials.

`render` returns borrowed texture and sampler references for receiver bindings. Record
receiver draws after caster passes and submit normally. `setProps` reuses resources when
their shape is unchanged and rebuilds them when capacities, map sizes, or cascade counts
change. Replaced resources are destroyed: obtain fresh props and rebind receivers after
reconfiguration. Finish submitting work that uses old resources before reconfiguring or
destroying the renderer. `destroy()` releases owned textures, views, framebuffers, and
samplers and is idempotent.

## Receiver sampling

Include `shadow` in the receiver model's modules and pass the returned props to
`shaderInputs.setProps({shadow: shadowProps})`. The module exposes these functions in GLSL
and WGSL:

- `shadow_getDirectionalFactor(worldPosition, worldNormal, viewDepth)`
- `shadow_getSpotFactor(lightIndex, worldPosition, worldNormal)`
- `shadow_getPointFactor(lightIndex, worldPosition, worldNormal)`

Supply positive camera-space distance as `viewDepth` for directional cascade selection.
Apply each factor to the corresponding direct-light contribution. Environment lighting
and emission should retain their own contributions. The module uses bind group 2 on
WebGPU, depth texture arrays and comparison sampling, with cube arrays for point lights.
WebGL2 uses depth arrays, manual comparisons, and six array layers per point light.

Use [PBR shadows](./pbr-shadows.md) for a shared depth-only caster and standalone PBR
receiver integration. Contact shadows,
scene traversal, and automatic caster selection are outside this API.
