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
