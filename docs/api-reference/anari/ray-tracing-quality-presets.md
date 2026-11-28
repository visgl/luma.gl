# Ray tracing quality presets

`getRayTracingQualityPreset('interactive' | 'still')` returns a fresh set of renderer
parameters for the experimental ray tracer and ANARI's `raytrace` renderer.

```typescript
import {getRayTracingQualityPreset} from '@luma.gl/anari';

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
The spatial filter gives less weight to neighbors with fewer retained samples.
It tapers from full strength at eight samples to zero at 64 samples to preserve
detail as the unfiltered estimate converges. When the history limit is below 64,
some filtering remains after the history reaches its limit.
Changing the radius preserves unfiltered progressive history and picking channels.

Enable `varianceGuidance` with a nonzero radius to adapt the spatial filter to
the retained variance of log luminance. The renderer accumulates the first and
second moments of individual samples in two rotating RG32F textures. Low-variance
pixels retain more detail. The estimate uses total luminance and shares the
renderer’s existing reprojection acceptance tests. It adds 16 bytes per internal
pixel across both textures and leaves 13 material texture bindings within the
portable sampled-texture limit. Enabling or disabling moment tracking resets
accumulation.

With temporal reprojection, each bilinear tap and the history clipping neighborhood
must match the reprojected surface identity, normal, and camera distance. Valid taps
are normalized for color, while rejected taps reduce retained confidence so newly
exposed areas respond more quickly to current samples.

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
- `variance`: grayscale log-luminance standard deviation, compressed as `σ / (1 + σ)`.
  Selecting this view enables moment tracking.
- `history`: grayscale `log2(1 + samples) / log2(257)`, exposing retained confidence
  up to the maximum 256-sample budget, including background pixels.

Guidance views use nearest internal pixels, so reduced-resolution diagnostics do
not imply full-output-resolution channels. The playground's Ray view selector and
capture harness `--view` option expose these modes. Use `--variance-guidance --denoise 1`
to capture the guided color output.

## Implementation capabilities

`getRayTracingSceneCapabilities(device)` is exported by `@luma.gl/anari`
and `@luma.gl/anari/raytrace`. It reports WebGPU compute support without constructing
a renderer or allocating GPU resources. The report describes implementation support,
not per-scene capacity, resource-limit validation, or an active renderer's settings.
Check `supported` before interpreting the implementation features for a device.

Analytic spheres and triangle-list meshes, scalar metallic/roughness direct lighting,
bounded diffuse and opt-in opaque GGX reflective transport, guided spatial denoising, and debug views are supported.
Scalar and textured `MASK` visibility, base-color/emissive/metallic-roughness/transmission maps, triangle mesh normal maps,
smooth dielectric transport and opt-in explicit emitter sampling are supported.
Hardware ray tracing is unavailable. Other geometric shapes use shared tessellated triangle meshes.

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
not an environment light. PBR dielectric continuation can escape to the display background.
Material maps and smooth dielectric transmission with IOR and alpha blending are supported;
enable `roughDielectricTransmission` to sample rough dielectric continuation.
Explicit emitter sampling is an opt-in control described below. Small emitters and rough
reflections may require more samples.

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
once by the shared direct-light path. With diffuse and PBR transport, multiple importance sampling
combines explicit emitter connections and material-sampled bounce hits using the power
heuristic. The last vertex uses the full explicit estimate because it has no continuation.
PBR uses the combined GGX and diffuse direction density, including the probability of selecting
a continuous event. Smooth dielectric delta paths retain their full emission contribution.
PBR uses the explicit estimate for continuous events inside absorbing media or when shadows are disabled.
Primary camera-visible emission is retained in both modes.

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

Ray materials with `alphaMode: 'MASK'` multiply scalar base-color alpha by the base-color map alpha and compare with
`alphaCutoff` (default `0.5`). Below-cutoff geometry is invisible to primary,
secondary and shadow rays, picking and channel snapshots. Below-cutoff emitter samples
contribute no light. Equality to the cutoff is visible. `OPAQUE` remains
visible regardless of scalar or texture alpha. UV0/UV1 selection and transforms also apply
to alpha sampling. `BLEND` compositing remains unsupported by the ray renderer.

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

### Constant environment lighting

Set `environmentRadiance` to a constant linear RGB radiance, for example `[0.5, 0.6, 0.8]`.
The renderer samples directions at infinity and tests those rays against scene geometry.
With bounces enabled, it pairs these samples with BSDF paths that escape the scene using
multiple importance sampling. This works with both `diffuse` and `pbr` transport and defaults
to zero. `background` continues to control the camera backdrop. To add directional lighting, set `environmentMap` to `{width, height, data}`. Supply three
linear RGB values per texel in row-major latitude–longitude order. Row zero starts at the
+Y pole. Column zero starts at +X and longitude increases toward +Z. Dimensions are limited
to 2,048 per axis and 1,048,576 texels total. Replace the map object to update lighting and
reset progressive accumulation.

The renderer samples each texel with probability proportional to its luminance and solid
angle, with a 5% uniform-sphere component. Explicit directions and BSDF misses use the same
solid-angle density for MIS. A map adds to `environmentRadiance` and works independently of
`background`. The map represents piecewise-constant texel radiance.

### Filtered cutouts and thin-material shadows

Enable `filteredCutouts` to use a camera-ray footprint when sampling mipmapped
triangle alpha masks. Primary color, picking, and primary-hit channels use the
internal ray-tracing pixel spacing. Coverage comes from the authored mip chain and
the existing alpha cutoff. Secondary paths and shadow rays carry the same footprint
from each receiver, including explicit emitter and environment samples. Emitter
endpoints use that footprint for alpha testing and mip zero for paired emission
evaluation. Analytic sphere masks use mip zero.

With PBR transport, `transmissiveShadows` lets analytic lights pass attenuated RGB
through thin diffuse-transmission materials and unmasked analytic spheres with
IOR exactly 1. The renderer follows the straight connection and processes up to
eight surface crossings. An index-matched sphere applies the transmission factor
and base-color tint at each crossing, then Beer–Lambert attenuation over the
distance traveled inside. Point and spot light connections end at the light,
including when the receiver or light is inside the sphere. Opaque blockers, nested media, and
dielectrics that bend the ray still block the connection. Emitter and environment
visibility are unchanged. Both settings are off by default.

## Reconstruction benchmarks

Generate a high-sample display RGB reference with an independent seed, then run all
three presentation modes at identical frame checkpoints and sample seeds. Use the
same viewport and scene settings for the reference and the sweep.

```bash
node scripts/playwright/chart-baseline-capture.mjs --diffuse --frames 64 --seed 73 --output /tmp/reconstruction-reference
node scripts/playwright/chart-baseline-capture.mjs --diffuse --compare-reconstruction --denoise 1 --seed 17 --frame-sweep 1,4,8,16 --reference /tmp/reconstruction-reference/chart.png --output /tmp/reconstruction-comparison
```

The report includes display RGB error, samples, logical allocation estimates, and,
when timestamp queries are available, total GPU pass time and per-frame median and
p95. It interpolates comparison points only across the GPU costs observed for all
three modes. Linear HDR capture reads unfiltered history, so it cannot measure a
presentation filter’s image error.

For motion checks, run `--motion --temporal off` and
`--motion --temporal on` with the same `--frames`, seed and viewport. The captures
record the animation time at the final frame. Add `--linear-hdr` to summarize the
minimum, maximum, and mean per-pixel retained sample confidence and the number of
pixels with zero confidence. Reference images must show the same pose. A reference from the other temporal mode measures the modes’ difference and
does not establish the correct radiance at that pose.


### Adaptive batch size without resetting history

The live Playground and Observatory sample WebGPU timestamps when available.
The GPU Graph execution budget controller targets 16 ms of GPU pass time and
requests full, half, quarter, or eighth-frame ray batches. Each smaller batch
updates one interleaved pixel phase and retains the other pixels. A phase-count
change takes effect at a complete sweep boundary. Camera or scene motion uses
full coverage so carried pixels do not retain metadata from an older pose.

Batch size changes preserve the render resolution, history textures, and
sample sequence. Reported progress in this mode counts completed sweeps.
Devices without usable GPU timestamps keep the existing renderer policy.
Offline captures keep their configured batch size.

### Pose-matched motion and glossy reconstruction

Run the playground's Vite server from `examples/anari/scenes`, then run the
benchmark from the repository root.

```sh
node scripts/playwright/chart-baseline-capture.mjs --compare-motion \
  --pose-frame 16 --frame-sweep 1,4,8,16 --reference-frames 64 \
  --hardware "GPU and driver" --output /tmp/motion-reconstruction
```

Captures with `--gpu-timing` include `graphTimings` in each checkpoint's metadata.
The reports keep GPU Graph node IDs and separate topology, acceleration build,
acceleration refit, and trace graph costs. The trace graph contains history carry,
ray tracing, and presentation. Pass times are available on timestamp-capable
devices and exclude queue latency, startup, and readback.

For an equal-sample comparison of full and sparse updates, use a fixed scene
and resolution, with a full first frame followed by eight complete sweeps:

```sh
node scripts/playwright/chart-baseline-capture.mjs --gpu-timing --linear-hdr \
  --temporal off --resolution 1 --width 640 --height 480 \
  --batch-phases 1 --frames 9 --output /tmp/anari-full
node scripts/playwright/chart-baseline-capture.mjs --gpu-timing --linear-hdr \
  --temporal off --resolution 1 --width 640 --height 480 \
  --batch-phases 4 --frames 33 --output /tmp/anari-sparse
```

The capture checks that both runs complete the expected samples. Compare the
sum of `trace-rays` and `carry-ray-tracing-history` over the measured sweeps.
Report presentation separately because the sparse run submits more frames.
The schedules can use different random sequences despite equal sample counts.

Run the traversal capture separately to avoid measuring the instrumented shader:

```sh
node scripts/playwright/chart-baseline-capture.mjs --sample-traversal \
  --frames 4 --width 640 --height 480
```

The capture reports raw counts from the final encoded frame. Each 8×8 dispatch
tile samples its top-left lane when that lane maps to a valid pixel. The report
includes sampled pixels, primary and guide rays, shadow queries, continuation
rays, TLAS and BLAS nodes visited by the nearest-hit and any-hit walkers, and
triangle intersection tests. Counts describe the selected lanes and active
interleave phase. Spatial correlation can bias them, so use matched scenes,
resolutions, and phase settings when comparing results.

Applications can enable `sampleTraversal` on the ray-tracing renderer and call
`statistics.rayTracing?.readTraversalCounters?.()` after submitting the frame
and before encoding the next one. The diagnostic is disabled by default.
When an application wraps frame encoding in an encoder timestamp-query scope,
`statistics.rayTracing?.readGraphTimings?.()` reads the per-stage reports after
submission.


The benchmark runs Chart Motion and a glossy variant that animates emissive
marks above the reflective Chart Materials floor. For each scene it starts a
fresh reference directly at the target pose, disables reprojection and spatial
filtering, and accumulates 256 samples per pixel by default using an independent
seed. Each candidate replays the same 60 Hz motion prefix, then holds the exact
target pose with reprojection on or off. Each checkpoint starts in a fresh page.

`motion-reconstruction.json` records linear RGB HDR error, including RMSE,
against the matching reference for every checkpoint. Plot RMSE against
`samplesAtPose` or `gpuTimeAtPoseMilliseconds` to compare recovery at equal
target-pose work. `gpuTimeMilliseconds` includes the motion prefix.
`historyConfidence` reports retained per-pixel confidence separately from the
number of new samples. GPU time is null when the relevant timestamps are
unavailable. The HDR capture measures temporal reconstruction before the spatial
presentation filter. Each checkpoint also writes a display PNG, the raw HDR
attachment, and metadata.

For the glossy scene, the final checkpoint includes a comparison of temporal
reprojection with the control at the same new sample count. Pass
`--maximum-glossy-rmse-ratio 1.1` to make the run fail if temporal HDR RMSE
exceeds 110% of the control. The report is written before the error so both
captures remain available for diagnosis.

PBR bounce history accumulates directly at stationary poses to avoid clipping
bright, noisy reflections around the latest sample. During movement, glossy
metal, clearcoat and transmission guides discard history whose secondary hits
cannot be checked by the primary visibility buffer.

Each scene also reports `matchedGpuCost` for both target-pose recovery and
the complete capture including the motion prefix. It interpolates HDR RMSE
only within GPU budgets measured by both modes. If either mode lacks two valid
timings or the ranges do not overlap, that comparison is marked unavailable.

The HDR comparisons report the 95th and 99th percentiles of per-pixel RGB RMSE,
plus RMSE across the worst 1% of pixels. Use the worst-pixel statistic alongside
whole-frame RMSE to catch localized silhouettes or highlights. None of these
RGB metrics incorporates the history confidence stored in alpha.
