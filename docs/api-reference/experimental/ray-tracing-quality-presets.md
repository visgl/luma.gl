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
bounded diffuse transport, guided spatial denoising, and debug views are supported.
Material textures, non-opaque alpha modes, specular/transmissive secondary transport,
explicit emitter sampling, hardware ray tracing, and GPU-stage timestamps are not
implemented. Other geometric shapes use shared tessellated triangle meshes.

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
