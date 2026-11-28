# GPU-resident DGGS boundaries

The existing Arrow helper, `convertDggsCellKeysToGPUPaths`, expands packed resident
keys on WebGPU. It emits a closed path in each input row and preserves physical
chunks. The center operations in `gpu-h3` and `gpu-a5` are separate graph
contributors. They emit longitude/latitude pairs or unit vectors.

| Cell family | Existing boundary output | Scope |
| --- | --- | --- |
| H3 | Six corners plus closure | Single-face hexagons supported by the current shader. Pentagon-base cells and cells requiring face-edge handling are excluded. Unsupported cells currently emit zero paths. |
| A5 | Five corners plus closure | Uses the A5 polygon decoder, with reflected cell fixtures in the shader tests. |
| S2 | Four corners plus closure | Cell corners on the sphere. Map seam clipping and edge tessellation are consumer work. |
| Quadkey | Four corners plus closure | Web Mercator tile bounds expressed as longitude and latitude. |
| Geohash | Four corners plus closure | Longitude and latitude box. |

The [Arrow boundary parity test](../../modules/graph/test/arrow/dggs-gpu-polygons.spec.ts)
covers all five families. Its fixtures verify supported cells and explicit H3 exclusions.

## H3 capture

Chromium WebGPU on Apple hardware, using a disk around San Francisco at H3 resolution
9. The workload cycles through the same local cells to reach the requested batch size.
Both paths emit closed Float32 paths. Timings are wall time through a queue fence,
with allocation and submission included. The resident input is prepared ahead of the
timed GPU path. The CPU path generates polygons from ready cell IDs and uploads the
Float32 coordinates. Six measured iterations follow one warm-up for each size.
A readback before timing checked for unsupported rows and verified the location.

| Cells | Resident GPU boundary median | CPU boundary plus upload median |
| ---: | ---: | ---: |
| 16,384 | 58.3 ms | 39.4 ms |
| 131,072 | 331.6 ms | 320.6 ms |

The current helper was about 1.48 times as slow at 16K cells and within 4% at 131K.
These timings cover boundary creation on one device and include no draw, picking,
or cross-vendor qualification.

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true yarn exec vitest run --project headless --reporter=verbose h3-boundary-resident-benchmark
```

## Follow-up

Start with the existing H3 shader. The extraction loop calls the boundary point
function for each corner and closure. That function checks all six corners and
reconstructs cell coordinates again. Hoist cell decoding, substrate setup and
boundary classification to one invocation per cell. Write the first corner
again for closure. Re-run the resident benchmark before adding a compaction pass.

A shared resident boundary contributor in `gpu-dggs` could borrow packed keys,
emit vertices and a count or mask, and preserve source chunks. The family
subpaths can expose typed H3 and A5 entry points. S2, quadkey, and geohash can
reuse the same output contract and their existing regular boundary kernels.
Keep the Arrow adapter responsible for converting Arrow inputs and outputs.

Full H3 parity also needs pentagons and icosahedron face-edge intersections.
Upstream H3 caps a boundary at ten vertices before closure. A fixed-capacity
slot with a per-row count is an initial option, with 84 bytes per cell for ten
Float32 XY vertices and a uint32 count. Compare that bandwidth with a six-vertex
fast path and measure mixed-resolution, face-edge and pentagon workloads before
choosing a layout. Seam handling and high-resolution precision require separate
qualification. [H3 boundary algorithm](https://h3geo.org/docs/core-library/cellToBoundaryDesc/)
· [Upstream vertex limit](https://github.com/uber/h3/blob/master/src/h3lib/include/h3api.h.in)
