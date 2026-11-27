# Ambient Occlusion Visibility

`AmbientOcclusionPass` from `@luma.gl/engine/lighting` produces an ambient visibility mask
using the existing SSAO (Screen-Space Ambient Occlusion) or GTAO (Ground-Truth Ambient
Occlusion) evaluator and shared depth-aware blur. It uses `ShaderPassRenderer` for execution.
See the [lighting effects guide](../../../api-guide/engine/lighting-effects.md) for choosing
none/cheap/good and composing AO with environments, shadow maps and contact shadows.

## Construction

```typescript
const occlusion = new AmbientOcclusionPass(device, {
  mode: 'gtao',
  resolutionScale: 0.5
});
```

| Option | Default | Meaning |
| --- | --- | --- |
| `mode` | `'gtao'` | `'none'`, `'ssao'`, or `'gtao'`. Construct a new pass to change the algorithm. |
| `resolutionScale` | `0.5` | Positive scale no greater than one for evaluation and intermediate blur targets. Final output is full input resolution. |

SSAO and GTAO evaluation require WebGPU; explicitly choose `'none'` on unsupported backends.
None records no draws and returns an owned 1×1 white texture. The application can sample it
as unoccluded visibility at any viewport size. This fallback does not silently change a
requested evaluation algorithm.

Active evaluation uses `ShaderPassRenderer`, which currently requires a canvas context on
the device at construction even when rendering to offscreen textures. Mode `none` does not
construct that renderer.

## Render

```typescript
const visibility = occlusion.render({
  depthTexture: surfaces.depthTexture,
  normalTexture: surfaces.normalTexture,
  projectionMatrix,
  near: 0.1,
  far: 40
});
```

Inputs are same-device, single-sample textures with matching physical dimensions from
[PBRSurfacePass](./pbr-surface-pass.md), or equivalent camera targets. Hardware depth uses
WebGPU's [0,1] clip range and clears to one. View-space unit normals are encoded as
`normal * 0.5 + 0.5` in linear RGB. Use geometric normals for stable surface visibility.

| Control | SSAO | GTAO |
| --- | --- | --- |
| `projectionMatrix` | Same camera; perspective only | WebGPU perspective projection; inverse computed internally |
| `near`, `far` | Required camera depth-linearization bounds | Accepted for a uniform camera contract; evaluator uses projection instead |
| `radius` | Default 7 pixels | Default 2.2 scene units in view space |
| `bias` | Default 0.03 | Default 0.04 |
| `intensity` | Default 1.35 | Default 3.2 |

Evaluation runs at the configured scale, followed by horizontal and vertical depth-aware
blur. Visibility is stored in RGB of `rgba8unorm`, with alpha one; white is unoccluded.
Both evaluators currently assume a perspective camera; inverse reconstruction alone does not make GTAO sampling orthographic-safe.

These passes have no history, temporal accumulation, velocity input, or automatic submission.
GTAO uses a deterministic frame seed. Existing temporal GTAO composition remains available
through `@luma.gl/engine/effects` for workflows supplying motion vectors and history.

## PBR receiving

Construct `createPBRModel` with `receiveAmbientOcclusion: true`, then bind:

```typescript
model.shaderInputs.setProps({
  pbrAmbientOcclusion: {
    ambientOcclusionTexture: visibility,
    viewport: [0, 0, width, height],
    strength: 1,
    enabled: true
  }
});
```

The viewport is [origin X, origin Y, width, height] in physical pixels and native framebuffer
coordinates. It must match the receiver viewport. The default unit viewport is a placeholder.
`strength` mixes between no occlusion and the sampled visibility. `enabled: false` disables
receiving; a valid mask texture remains required while the shader module is included.

Receiving attenuates ambient light, environment contributions (including the supported
material lobes), and lightmaps. Direct directional/point/spot/area illumination, emission,
and alpha remain independent. Unlit base color is unchanged; an unlit lightmap contribution
still receives visibility. This screen-space visibility does not replace authored material
occlusion maps. Receiving works on WebGL2 and WebGPU, independently of the mask producer.

## Ownership and lifetime

Inputs are borrowed. `render` records commands and returns a borrowed pass-owned mask;
rebind the returned texture each frame. Input-size changes replace/destroy owned targets.
Submit before replacing or destroying referenced resources. `destroy()` is idempotent,
releasing execution resources and masks while preserving inputs and caller-owned models.
Rendering after destruction is invalid, including mode `'none'`.

The [PBR Shadows example](/examples/api/pbr-shadows) compares AO choices in the same scene
as shadow maps and contact shadows. Screen-space algorithms cannot see hidden or offscreen
surfaces; their approximation and denoising can soften thin creases or produce halos.

## Experimental CORTAO

`CORTAOPass` from `@luma.gl/engine/lighting` implements Circular Occluder Ray-Traced Ambient
Occlusion on WebGPU and WebGL 2. It reconstructs normals from hardware depth, builds a
packed depth pyramid, estimates visibility with an occluder lookup table and optionally
applies a bilateral filter. The pass returns a full-resolution `rgba8unorm` texture whose
red channel stores visibility from zero (occluded) to one (unoccluded).

```typescript
import {CORTAOPass} from '@luma.gl/engine/lighting';

const occlusion = new CORTAOPass(device, {sampleCount: 16, rayCount: 16, resolutionScale: 0.5});
const visibility = occlusion.render({
  depthTexture,
  camera: {projectionMatrix, nearPlane: 0.1, farPlane: 40},
  radius: 2.2
});
device.submit();
```

Supply single-sample depth from a perspective camera with the backend's native clip depth
range and a depth clear value of one. On WebGPU, the pass can sample the depth aspect of a
combined depth-stencil texture. Use the same view-space units for the camera planes and radius. The default radius is unlimited in view space, with a screen-space cap of
20% of the input height. The filter defaults to the symmetric 13-tap kernel. Construct
another pass to change the sample count, ray count, or filter specialization.

`resolutionScale` controls the resolution of AO evaluation and filtering per axis. Use `1`
(the default) for the original full-resolution path, `0.5` for half width and height, or
`0.25` for quarter width and height. Scaled evaluation samples full-resolution depth at
low-resolution texel centers. A final depth-aware reconstruction pass returns a full-size
mask, so downstream passes keep the same texture contract. Fine geometry can fall between
low-resolution samples and lose some occlusion.

The pass borrows depth and owns its output. Rebind the output after the input dimensions or
filter selection changes. On WebGPU, submit commands before rendering again with the same
instance, resizing or destroying it. Call `destroy()` when finished.

The opt-in benchmark compares full-resolution CORTAO and GTAO on the same WebGPU device
and pre-rendered depth at 360p, 720p and 1080p. At 1080p, it also measures half- and
quarter-resolution CORTAO, with a separate timestamp for the full-resolution reconstruction.
The totals include filtering and reconstruction and exclude scene capture and final
composition. A second 1080p fixture compares visibility around silhouettes and fine geometry.

```bash
yarn test-browser-benchmarks --reporter=default --silent=false modules/engine/test/lighting/ambient-occlusion-benchmark.spec.ts
```
