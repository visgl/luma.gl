# Ray tracing quality presets

`getRayTracingQualityPreset('interactive' | 'still')` returns a fresh set of renderer
parameters for the experimental ray tracer and ANARI's `raytrace` renderer.

```typescript
import {getRayTracingQualityPreset} from '@luma.gl/experimental';

renderer.setParameters(getRayTracingQualityPreset('interactive')).commitParameters();
// After interaction stops, opt into full-resolution accumulation:
renderer.setParameters(getRayTracingQualityPreset('still')).commitParameters();
```

| Setting | Interactive | Still |
| --- | --- | --- |
| Resolution / minimum | 0.5 / 0.25 | 1 / 1 |
| Adaptive resolution | Enabled | Disabled |
| Temporal reprojection | Enabled | Disabled |
| Primary samples per frame | 1 | 4 |
| Progressive accumulation | Enabled | Enabled |
| Rotating shadow samples | 1 | 0 (all direct lights) |
| CPU frame budget | 33.3 ms | 33.3 ms (adaptation disabled) |

The helper does not select modes automatically. Still mode requires a stationary scene
and camera for accumulation to converge. Changing the preset invalidates incompatible
radiance history. These settings do not add denoising or GPU timing measurements, and
neither preset changes exposure, materials, camera, or `samplingSeed`.

## Deterministic sampling

`samplingSeed` is an optional uint32 renderer parameter, defaulting to zero. It seeds
primary-ray sample rotations while retaining the existing low-discrepancy frame sequence.
Zero preserves the previous sampling pattern. Changing the seed invalidates accumulation.
IDs, normals, picking, and projected-depth snapshots still use centered primary rays and
are independent of the seed.

Use a fresh frame, the same seed, resolution, scene, camera, quality settings, and exact
render count for reproducible captures on the same backend/hardware. The seed does not
promise byte-identical output across GPUs, browsers, output encodings, or shader compilers.

## Guided presentation and history limits

Ray-traced scene renderers also accept `denoiseRadius: 0 | 1 | 2` (default `0`)
for an opt-in spatial filter in internal pixels. It smooths accumulated linear
radiance before tone mapping, guided by primitive identity, world normals and
relative depth. Background and ambiguous overflow identities remain unfiltered.
This is a local noise reduction filter, not a reconstruction or temporal denoiser;
it can soften detail within a surface and costs additional texture reads.
Changing the filter preserves unfiltered progressive history and picking channels.

`historySampleLimit` accepts integers from 1 to 256 (default `64`). It caps retained
per-pixel confidence; once saturated, subsequent samples still update the image.
Changing this limit resets history. A limit smaller than `samplesPerPixel` uses
only the current frame average rather than extrapolating the accumulated color.
Reported `accumulatedSamples` is the progressive confidence upper bound; sparse
phases and rejected reprojections can have fewer samples at individual pixels.

Frame statistics expose `rayTracing.memory` with `sceneBufferBytes`,
`historyTextureBytes`, `graphTransientBytes`, and `totalBytes`. These are logical
allocation sizes of the frame's scene buffers, four history textures, and physical
transients declared by its command graphs. Imported buffers are counted once.
They exclude caller-owned output targets, snapshots, pipeline/driver overhead,
geometry caches and node-private allocations; they are not measured VRAM usage or
peak memory. No GPU readback or synchronization is required.

The scene playground has Denoise and History samples controls plus owned allocation
telemetry. For a deterministic diffuse example, open
`playground.html?preset=chart-diffuse&renderer=raytrace&quality=still&denoise=1&history=64&seed=17`.

## Primary-hit debug views

`debugView` selects `color` (default), `normal`, `cameraDistance`, `identity`, or `history`.
Changing the view rebuilds presentation without resetting unfiltered accumulation.
Diagnostics bypass denoising, tone mapping and shader output transfer functions;
the attachment's own sRGB conversion, if any, still applies.

- `normal`: centered primary-hit world normals mapped from `[-1, 1]` into RGB `[0, 1]`.
- `cameraDistance`: grayscale world-space camera-eye distance compressed as
  `distance / (1 + distance)`. It comes from temporal guidance and can vary laterally
  across a constant-depth plane in orthographic views. It is neither projected device
  depth nor ray-origin distance; use the exact distance channel for the latter.
- `identity`: deterministic colors for primitive identifiers in retained internal guidance.
  Background is black; identifiers beyond the exact half-float range are magenta.
  Use full-resolution integer channel snapshots for exact IDs and picking.
- `history`: grayscale `log2(1 + samples) / log2(257)`, exposing retained confidence
  up to the maximum 256-sample budget, including background pixels.

Guidance views use nearest internal pixels, so reduced-resolution diagnostics do
not imply full-output-resolution channels. The playground's Ray view selector and
capture harness `--view` option expose these modes.

## Implementation capabilities

`getRayTracingSceneCapabilities(device)` is exported by `@luma.gl/experimental`
and `@luma.gl/scene/raytrace`. It reports WebGPU compute support without constructing
a renderer or allocating GPU resources. The report describes implementation support,
not per-scene capacity, resource-limit validation, or an active renderer's settings.
Check `supported` before interpreting the implementation features for a device.

Analytic spheres and triangle-list meshes, scalar metallic/roughness direct lighting,
bounded diffuse and opt-in opaque GGX reflective transport, guided spatial denoising, and debug views are supported.
Scalar `MASK` visibility and opt-in explicit emitter sampling are supported.
Material textures, alpha blending, transmissive secondary transport, hardware
ray tracing and GPU-stage timestamps are not implemented. Other geometric shapes use shared tessellated triangle meshes.

## Reference-image error measurements

The deterministic capture harness accepts `--reference /absolute/path/chart.png`.
It writes normalized display-RGB mean absolute error, RMSE, maximum channel error,
and PSNR into `metadata.json`. Exact equality uses `null` for infinite PSNR.
Alpha is ignored because chart captures are opaque. Dimensions must match.

```bash
node scripts/playwright/chart-baseline-capture.mjs --diffuse --frames 64 --seed 17 --output /tmp/chart-reference
node scripts/playwright/chart-baseline-capture.mjs --diffuse --frames 8 --seed 17 --reference /tmp/chart-reference/chart.png --maximum-rmse 0.05 --output /tmp/chart-candidate
```

`--maximum-rmse` is optional and fails the command when the measured RMSE exceeds
that normalized threshold, after saving the candidate image and metadata. The caller
must choose a reference with the same scene, camera, viewport, color management,
backend and hardware. Matching dimensions alone does not establish scene equivalence.
These are errors in the displayed image, not linear-radiance errors or a guarantee
that a high-frame capture is converged. Elapsed capture time includes startup and
screenshot overhead; named-hardware convergence measurements remain a separate gate.


## Opaque reflective transport

`transportMode: 'diffuse' | 'pbr'` defaults to `diffuse`, preserving the earlier
Lambertian secondary paths. `pbr` enables opaque metallic/roughness secondary
reflections when `maxBounces` is nonzero. Both modes use the same bounded 0–8
secondary bounce budget, primary sampling seed, retained identities, and history.
Changing modes resets accumulation; secondary material, light and transform changes
also reset it, including when primary-hit temporal reprojection is enabled. Camera
changes reset active PBR accumulation too: primary-hit reprojection alone cannot
validate view-dependent reflection. Unchanged cameras continue accumulating normally.

The PBR path samples a cosine diffuse/GGX normal-distribution mixture and evaluates
both lobes against the combined directional probability density. Metallic surfaces
have colored specular reflection; dielectric surfaces retain a diffuse lobe and
4% normal-incidence specular reflectance. Schlick Fresnel and Smith masking use the
existing scalar direct-light material model. Roughness is clamped to `[0.04, 1]`;
zero roughness uses the lower bound rather than an ideal delta mirror. The model
uses single-scattering GGX without multiscattering compensation. See the
[glTF BRDF model](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#appendix-b-brdf-implementation)
for the material terms.

Secondary rays gather emission and explicit directional/point/spot lighting at
hits. A miss contributes zero: the background remains a primary display color,
not an environment light. There is no texture sampling, alpha blending/transmission,
IOR/attenuation or environment-map transport. Explicit emitter sampling is an opt-in control described below. Small
emitters and rough reflections may require more samples; this is bounded opaque
transport, not a complete path tracer or a glass renderer.

Choose **Chart Materials** in the playground for matte bars, emissive points,
a metallic floor and a six-column roughness sweep using the same data/camera and
instance IDs as Chart Baseline. Transport and Bounces controls update retained
renderer settings. For reproducible captures:

```bash
node scripts/playwright/chart-baseline-capture.mjs --materials --transport pbr --bounces 3 --frames 32 --seed 17 --output /tmp/chart-materials
node scripts/playwright/chart-baseline-capture.mjs --materials --transport diffuse --bounces 3 --frames 32 --seed 17 --output /tmp/chart-materials-diffuse
```

## Explicit emissive lighting and scalar masks

Set `emitterSampling: true` on a ray renderer to sample one emissive primitive
and one point on its surface at each material hit. Triangles use uniform
triangle selection and barycentric area sampling; analytic spheres use local
area sampling with the affine surface-area Jacobian. The area-to-direction
weight includes emitter selection, triangle selection, projected emitter area,
and squared distance, following the
[area-light sampling formulation](https://www.pbr-book.org/3ed-2018/Light_Transport_I_Surface_Reflection/Sampling_Light_Sources).
Emission is treated as two-sided, matching existing ray emission gathering.

This is off by default and works with both `diffuse` and `pbr` transport.
Connections are shadow rays, so direct emissive lighting also works with
`maxBounces: 0`. Analytic point/directional/spot lighting is unchanged. Emitter contributions
follow the same per-hit distance-fog attenuation, with the fog background mixed
once by the shared direct-light path. Explicit
connections replace secondary emission gathering to avoid counting the same
light twice; primary camera-visible emission is retained. The model has no
delta mirrors (roughness has a `0.04` lower bound). MIS is not implemented; nearly mirror-like materials can still converge
slowly. More primary samples/frames improve sampling of small emitters.

`emitterSelection: 'uniform'` is the default. Opt-in `'power'` weights each emitter
placement by world-space area times emitted luminance. Mesh area is summed from transformed
triangles; affine sphere area uses a six-direction quadrature proxy. This proxy only
chooses the emitter: the shader still evaluates the exact conditional area density,
including the affine sphere Jacobian, and divides by the uploaded selection probability.
A small uniform mixture keeps dim emitters selectable; the mixture grows for large
emitter lists to protect float32 CDF intervals. CDF probabilities match their uploaded
float32 intervals, and the last interval ends at one. Degenerate zero-power lists use
uniform selection. Triangles within a selected mesh remain uniformly selected.

Power selection can reduce variance for uneven emitter powers, but does not account for
receiver distance or visibility and is not MIS. It does not guarantee faster convergence
for every scene. Selection changes reset history. Changed emitter transforms/materials
rebuild the distribution without adding storage buffers. Unchanged emitter areas are cached,
so moving non-emissive objects does not repeat mesh-area traversal.

Emitter records share the existing light buffer, preserving the CORE eight
storage-buffer traversal contract. Material, emitter visibility, emitter
transform and emitter geometry changes reset radiance history, including at
zero material bounces. PBR camera changes reset explicit-light accumulation.
The sampling seed and global tiled-export coordinates remain authoritative.

Ray materials with `alphaMode: 'MASK'` use scalar base-color alpha and
`alphaCutoff` (default `0.5`). Below-cutoff geometry is invisible to primary,
secondary and shadow rays, picking and channel snapshots, and is excluded from
explicit emitter sampling. Equality to the cutoff is visible. `OPAQUE` remains
visible regardless of scalar alpha. Texture alpha and `BLEND` compositing are
unsupported by the ray renderer.

Choose **Chart Lighting**, or open
`playground.html?preset=chart-lighting&renderer=raytrace`. The **Emissive lighting**
checkbox toggles sampling on the retained renderer. The scene combines closed
annular marks, emissive points/panel and a masked fixture. Captures accept
`--lighting --emitters on|off`; comparisons must preserve the same camera,
seed, frames and color settings. Raster rendering shares geometry/masks but
does not compute illumination from emissive surfaces.

### Preview comparison controls

The JSON playground exposes **Renderer** in the preview toolbar, including when the
editor is hidden. Choose Forward, Deferred, Ray tracing, Normals or Depth. Deferred
and ray tracing require WebGPU. Ray-only controls are disabled for raster renderers;
ray settings are restored when returning to Ray tracing.

**Resolution** selects 25%, 50%, 75% or 100% of each drawing-buffer dimension.
The choice disables adaptive resolution and sets its minimum to the same value,
so stationary refinement keeps a stable pixel grid. **Ray quality** can replace
this explicit choice with the interactive or still preset. **Emitter selection**
compares uniform and power sampling. The live Chart Lighting preset uses power
selection; explicit frame captures retain the authored uniform default.

Validated URL overrides accept `renderer=deferred`, `resolution=0.25` and
`emitterSelection=power`. The capture harness accepts `--emitter-selection uniform|power`
and `--resolution 0.25|0.5|0.75|1`; an explicit resolution overrides the still preset.
Preserve seed, sample count, transport and exposure when comparing distributions.
