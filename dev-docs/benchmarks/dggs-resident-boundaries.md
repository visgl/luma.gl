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

| Capture | Cells | Resident GPU boundary median | CPU boundary plus upload median |
| --- | ---: | ---: | ---: |
| Initial | 16,384 | 58.3 ms | 39.4 ms |
| Initial | 131,072 | 331.6 ms | 320.6 ms |
| Repeat | 16,384 | 93.2 ms | 40.6 ms |
| Repeat | 131,072 | 639.1 ms | 274.0 ms |

The current helper was slower in both captures, with near parity in the initial
131K run. The repeat showed substantial variation on a shared development machine.
These results establish that the resident path works for the sample. A dedicated run
is needed for a stable throughput comparison. The capture covers boundary creation.
Draws, picking, and other vendors remain unmeasured.

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true yarn exec vitest run --project headless --reporter=verbose h3-boundary-resident-benchmark
```

## H3 decode once per cell

The extraction kernel now decodes and validates a single-face H3 boundary once per
cell, projects six corners and copies the first projected point to close the path.
The same Apple WebGPU adapter and benchmark provided a fresh baseline and two
optimized runs. Each entry is a median in milliseconds.

| Cells | Original GPU | Optimized GPU | Optimized repeat | CPU plus upload, optimized runs |
| ---: | ---: | ---: | ---: | ---: |
| 16,384 | 51.2 | 13.2 | 12.9 | 29.6 / 29.4 |
| 131,072 | 325.3 | 22.5 | 21.5 | 228.3 / 238.7 |

This is a 3.9–4.0× improvement for 16K cells and a 14.5–15.1× improvement
for 131K cells. The CPU baseline also varied across runs. This capture measures
the existing supported single-face, resolution-9 batch and ends at a queue fence.
The boundary parity suite checks regular and unsupported inputs in both output
layouts, including a Class III cell.

## Follow-up

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
