# Cartesian projection, rendering, and picking

P.8a.2b compares one coordinate update followed by one or four draws and one asynchronous pick.
Each path also measures a synchronized draw with unchanged coordinates. The benchmark uses a
768 × 768 offscreen Deck orthographic view and draws the same four-pixel discs from the same
physical batches. A deterministic longitude/latitude grid alternates between two positions every
update, with every eleventh row masked. All paths return the same retained CPU projection and
physical chunk provenance for picks.

- **CPU** evaluates the prepared reference provider in binary64, converts the results to local
  float32 coordinates, uploads them, and reuses the uploaded positions across draws and picking.
- **Materialized GPU** uploads raw binary64 input and runs the compiled render projection once per
  update via the command graph. The same local float32 positions and validity feed subsequent draws
  and picking, with no intermediate download.
- **Inline GPU** uploads the same raw binary64 input and draws through the production
  `GPUProjectedPointLayer`. Each draw, including picking, evaluates projection in the point vertex
  shader.

The local paths use the same point and picking WGSL as the inline layer. The materialized and inline
paths use the same compiled adaptive UTM Zone 10N program, local frame and platform fp64 policy.
Before timing each path, the benchmark compares both GPU output frames with CPU reference frames,
checks row IDs and CPU metadata on both coordinate updates, and verifies a masked pick misses.
Frame qualification permits at most 0.5% different red-channel pixels relative to lit pixels.
The fit tolerance is 0.0005 m. Raster and picking agreement are measured separately from that
planner tolerance.

## Run

From the repository root, on a hardware WebGPU adapter:

```sh
VITE_GPU_PROJECT_REVISION="$(git rev-parse --short HEAD)" \
VITE_GPU_PROJECT_RENDER_ROWS=1024,4096,16384 \
VITE_GPU_PROJECT_RENDER_BATCH_ROWS=1024,4096 \
LUMA_TEST_BROWSER_BENCHMARKS=true \
yarn exec vitest run --project headless --reporter=verbose --silent=false \
  gpu-projected-point-performance.spec.ts
```

Each successful case prints a `PROJECTION_RENDER_PERFORMANCE` JSON line with adapter information,
qualification results, allocation and upload byte counts, and all seven measured samples per
scenario after two warmups. Upload enqueue, CPU conversion, compute enqueue and draw enqueue
are host-side timings. Update plus renders and unchanged redraw use WebGPU queue completion.
Pick time includes the picking pass, readback and retained CPU metadata. Preparation is reported
separately. Measured frame samples exclude setup, compilation, browser presentation, and texture
readback used for qualification.

## Initial local capture

November 27, 2026. Apple WebGPU (metal-3 architecture, hardware),
headless Chromium 151.0.0.0, base revision `fe3b0cfe0` plus this benchmark.
Each cell lists CPU / materialized GPU / inline GPU median milliseconds.

| Rows | Max rows per batch | Update + 1 draw | Update + 4 draws | Unchanged draw¹ | Pick¹ |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1024 | 1024 | 2.30 / 2.70 / 10.60 | 3.70 / 5.50 / 41.40 | 1.90 / 1.00 / 12.50 | 3.50 / 1.20 / 11.90 |
| 1024 | 4096 | 1.30 / 1.30 / 10.50 | 2.30 / 2.20 / 43.50 | 0.70 / 0.80 / 11.30 | 0.80 / 0.90 / 13.20 |
| 4096 | 1024 | 2.90 / 3.50 / 38.60 | 3.80 / 5.00 / 164.30 | 1.00 / 1.70 / 38.30 | 1.20 / 1.80 / 39.10 |
| 4096 | 4096 | 3.90 / 3.10 / 43.40 | 6.10 / 6.90 / 170.90 | 1.50 / 1.50 / 44.50 | 1.50 / 2.00 / 39.10 |
| 16384 | 1024 | 8.70 / 13.80 / 162.70 | 14.90 / 14.20 / 610.50 | 2.50 / 1.90 / 165.00 | 2.30 / 2.60 / 169.80 |
| 16384 | 4096 | 8.30 / 9.00 / 154.10 | 9.40 / 9.40 / 649.80 | 1.60 / 1.70 / 150.70 | 1.40 / 1.80 / 155.70 |

¹ Taken from the one-draw scenario. Pick timing starts with the query pixel already known.

All six cases qualified. Maximum red-channel mismatch against CPU was 0 pixels per frame.
Probed picks matched the row, physical batch, local index and retained CPU coordinates after both
updates. The masked row missed on every path.

CPU, materialized and inline coordinate buffers use 12, 32 and 20 bytes per row respectively,
including validity. After initial mask upload, a coordinate update uploads 8, 16 and 16 bytes
per row. These counts exclude fixed shader parameters, draw uniforms and framebuffers.

On this adapter, inline rendering was slower than the other paths across the sweep. The
six-vertex disc evaluates projection at each vertex in both render and picking passes.
The other paths reuse already-projected positions for both passes. These measurements apply
to this point geometry, input size range and Apple fp64 backend. The run does not qualify
cross-vendor behavior or choose a default projection path.

## GPU-resident follow-up

Set `VITE_GPU_PROJECT_RENDER_RESIDENT_ONLY=true` in the command above to run the CPU,
CPU round-trip, uploaded materialized GPU, and GPU-resident materialized GPU paths. Both
resident paths preload two coordinate states and alternate between them. The GPU path runs
the same projection and writes into the same output buffers on every update. The CPU
round-trip path copies all coordinate chunks into one reusable staging buffer, maps it once,
projects on the CPU, and uploads the local float32 coordinates. Its static validity mask is
already available on the CPU. Both rendered views use the same CPU mirror when enriching picks.

These timings come from separate update-only runs, with no render work enqueued between each
update and its queue completion. Upload-only samples write the same raw coordinate buffers
and wait for completion without projecting. Readback-only and CPU projection timings are
captured within the CPU round-trip samples. Setup and preloads are excluded. These are host
wall-clock measurements including submission and synchronization. Differences between
independent medians do not estimate exact transfer or kernel times.

Same Apple WebGPU adapter and Chromium as the initial capture. Median milliseconds:

| Rows | Max rows per batch | CPU update | CPU round trip | GPU upload only | GPU upload + compute | GPU resident compute |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1024 | 1024 | 0.40 | 0.90 | 0.10 | 2.30 | 2.40 |
| 1024 | 4096 | 0.50 | 0.80 | 0.10 | 0.90 | 0.90 |
| 4096 | 1024 | 1.70 | 2.30 | 0.40 | 4.70 | 4.00 |
| 4096 | 4096 | 1.50 | 2.10 | 0.10 | 3.70 | 1.80 |
| 16384 | 1024 | 6.10 | 6.80 | 0.50 | 12.00 | 11.80 |
| 16384 | 4096 | 5.90 | 6.60 | 0.20 | 5.60 | 5.10 |

All six cases again matched CPU raster and pick results. At 16,384 rows in 4,096-row
batches, resident compute was 5.10 ms and CPU projection plus local conversion was
5.50 ms. The CPU round trip moved 256 KiB to the CPU and 128 KiB back to the GPU on
each update, with a 6.60 ms median for the update. Resident materialization moved no
coordinate bytes across that boundary. CPU round trip and resident GPU medians for
update plus four draws were 10.80 and 8.20 ms respectively. Single-draw frame medians
varied more between captures. At 1,024-row batches the resident compute path was
slower than the CPU round trip at 4,096 and 16,384 rows. Chunk size matters for this
workload.

Defer further Cartesian inline projection work. Materialization remains useful when the
coordinates start and stay on the GPU, even where projection throughput is similar to CPU.

## P.8a.2d batch-size attribution

Hold the prepared UTM fit, 16,384 source rows, validity, total resident coordinate bytes, GPU arithmetic,
and output accuracy fixed. Each tested batch size is a multiple of 256, so each update dispatches
the same 64 workgroups. Only their grouping into dispatches changes. Each case qualifies against
the same CPU frames and picking oracle. The timing experiment then uses the qualified resident
projection graph without drawing or transferring coordinates. It rotates schedule order, alternates
the two preloaded states, and measures 21 submissions per schedule after two warmups.

Use the same benchmark command with the following overrides:

```sh
VITE_GPU_PROJECT_RENDER_ATTRIBUTION=true VITE_GPU_PROJECT_RENDER_ROWS=16384 VITE_GPU_PROJECT_RENDER_BATCH_ROWS=256,512,1024,2048,4096,8192,16384 LUMA_TEST_BROWSER_BENCHMARKS=true yarn exec vitest run --project headless --reporter=verbose --silent=false   gpu-projected-point-performance.spec.ts
```

November 27, 2026, Apple WebGPU (metal-3), headless Chromium 151.0.0.0.
Median milliseconds per update. Each normal graph uses one compute pass and one submission.
The split control keeps one submission and puts each dispatch in its own pass. The all-masked
control keeps the normal dispatches and bindings while bypassing the projection arithmetic.

| Rows per batch | Dispatches | Workgroups per dispatch | Normal total | Encode + finish | Queue wait | Split-pass total | All-masked total |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 256 | 64 | 1 | 43.90 | 0.60 | 43.30 | 44.60 | 1.00 |
| 512 | 32 | 2 | 22.50 | 0.40 | 22.10 | 22.80 | 0.70 |
| 1,024 | 16 | 4 | 11.90 | 0.20 | 11.70 | 11.70 | 0.50 |
| 2,048 | 8 | 8 | 6.00 | 0.10 | 6.00 | 6.20 | 0.50 |
| 4,096 | 4 | 16 | 3.80 | 0.10 | 3.70 | 3.70 | 0.40 |
| 8,192 | 2 | 32 | 4.10 | 0.00 | 4.00 | 4.20 | 0.30 |
| 16,384 | 1 | 64 | 3.50 | 0.00 | 3.40 | 3.20 | 0.20 |

On this adapter, reducing batches from 4,096 to 1,024 rows raised normal update time from
3.80 to 11.90 ms. The queue wait rose from
3.70 to 11.70 ms, while host encoding and the all-masked control stayed much lower.
Extra compute passes were absent in the normal graph, and forcing them had a small effect
relative to the active-workload penalty. Together these controls point to the GPU cost of
running the full projection in many small dispatches. Each 1,024-row dispatch has only four
workgroups, versus sixteen at 4,096 rows. Lower utilization or less overlap is consistent
with the result. This experiment does not measure occupancy or separate it from other
GPU-side scheduling effects.

WebGPU timestamps are available for the split schedule. Its per-pass durations are retained in
the JSON as a diagnostic. Their sum can exceed the queue wall-clock duration on this adapter,
so it cannot be used as a decomposition of the coalesced production path. Host timings
include browser queue synchronization and are medians of separate measurements.

Repeat on a non-Apple WebGPU adapter before generalizing. For P.8d, a controlled prototype
would reduce dispatch count without repacking source chunks and test whether the same benefit
appears in the real GPU producer-to-render path from P.9a.6.

## P.8d grouped dispatch

The tested pairing binds two source position buffers, two source validity buffers, and their
corresponding output buffers directly in one dispatch. Whole workgroups select a physical
chunk, and every lane evaluates the same projection program. The input and output chunks
retain their byte layout and identity. No coordinate copying or repacking is involved; the
benchmark preloads coordinates once and measures updates to the existing output buffers.
The paired kernel needs nine storage bindings, and the tested Apple WebGPU adapter reports ten.
The timing fixture uses zero-offset chunks and includes a shorter final chunk in its
correctness sweep. The production API also supports the graph views’ binding offsets.

Run the production opt-in path against the default one-dispatch-per-chunk path:

```sh
VITE_GPU_PROJECT_GROUPED_CHUNKS=2 \
VITE_GPU_PROJECT_RENDER_ROWS=16384 \
VITE_GPU_PROJECT_RENDER_BATCH_ROWS=256,512,1024,2048,4096 \
LUMA_TEST_BROWSER_BENCHMARKS=true \
yarn exec vitest run --project headless --reporter=verbose --silent=false \
  gpu-projected-point-performance.spec.ts
```

November 27, 2026. Apple WebGPU, headless Chromium 151.0.0.0. Captured with the production opt-in path.
Synchronized medians in milliseconds. Both versions use one compute pass and one submission.

| Rows per chunk | Dispatches before → after | Baseline update | Paired update | Baseline update + draw | Paired update + draw |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 256 | 64 → 32 | 46.40 | 24.00 | 46.70 | 25.40 |
| 512 | 32 → 16 | 22.80 | 12.00 | 24.00 | 19.70 |
| 1,024 | 16 → 8 | 12.30 | 6.80 | 15.70 | 11.20 |
| 2,048 | 8 → 4 | 6.90 | 4.40 | 10.90 | 11.80 |
| 4,096 | 4 → 2 | 6.50 | 5.80 | 10.90 | 10.20 |

The coordinate and validity words matched the production GPU path bit-for-bit after both
updates. The offscreen raster matched CPU, probed picks preserved row and chunk identity, and
masked rows missed. A separate 16,383-row case exercised a partial final chunk.

An earlier prototype used a generated single-chunk shader as a control. Its parameter-buffer
strategy matched the paired version. Synchronized update medians:

| Rows per chunk | Production shader | Generated shader with one chunk per dispatch |
| ---: | ---: | ---: |
| 256 | 44.60 | 44.60 |
| 512 | 22.60 | 22.70 |
| 1024 | 11.30 | 11.50 |
| 2048 | 7.80 | 7.90 |
| 4096 | 5.30 | 4.10 |

Pairing helped most for chunks with few workgroups. These results support reducing dispatch
count for small resident chunks on this adapter. Production qualification still needs the
real producer-to-render path, non-Apple devices, and a fallback for binding limits. The
prototype leaves the production graph and inline policy unchanged.

## P.9a.6 GPU H3 producer to Cartesian render consumer

The existing `GPUH3CellProjection` node consumes resident H3 cell IDs and produces float32
longitude/latitude centers and validity. A `GPUProjectionProgram` reads those same graph views
and writes the materialized local UTM vertices and mask. The graph orders the producer and
consumer from their shared resources, and the renderer borrows the output chunks. There is one
compute submission per update. No coordinate upload, readback, or repacking occurs during
measured GPU updates. The two ID states are uploaded before timing.

The picking pass reads back its normal pick result. Pick metadata decodes just the selected H3
ID with h3-js and maps its CPU reference center to UTM; it does not read back GPU coordinates.
The CPU image oracle projects predecoded h3-js centers rounded to float32. The CPU baseline
therefore excludes cell-center decoding from update timings and is not an end-to-end CPU producer
comparison. Qualification reads back image pixels outside the timing scope. Both GPU variants
produce identical frames, track both input changes, return the expected row and chunk for
probed picks, and miss the invalid H3 row.

```sh
VITE_GPU_PROJECT_RENDER_H3_PRODUCER=true \
VITE_GPU_PROJECT_GROUPED_CHUNKS=2 \
VITE_GPU_PROJECT_RENDER_ROWS=1024,4096,16384 \
VITE_GPU_PROJECT_RENDER_BATCH_ROWS=1024,4096 \
LUMA_TEST_BROWSER_BENCHMARKS=true \
yarn exec vitest run --project headless --reporter=verbose --silent=false \
  gpu-projected-point-performance.spec.ts
```

Omit `VITE_GPU_PROJECT_GROUPED_CHUNKS` to run without paired dispatch.

November 27, 2026, Apple WebGPU and headless Chromium 151. Timings are medians in milliseconds.
Each timing cell lists **single / paired** projection dispatch. Total compute dispatch counts
include one H3 producer dispatch per chunk, which pairing does not change. The four-draw
scenario includes one producer update, four draws reusing its projected output, and one pick.
Combined medians are calculated on whole samples.

| Rows | Max rows per chunk | Compute dispatches single → paired | Update + first draw | Pick after first draw | Update + first draw + pick | Update + four draws + pick |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,024 | 1,024 | 2 → 2 | 2.20 / 2.60 | 2.10 / 3.00 | 4.70 / 5.60 | 5.50 / 4.80 |
| 1,024 | 4,096 | 2 → 2 | 7.50 / 5.00 | 4.80 / 3.10 | 12.60 / 8.10 | 12.60 / 12.20 |
| 4,096 | 1,024 | 8 → 6 | 6.60 / 4.00 | 4.70 / 2.10 | 12.00 / 9.40 | 14.30 / 11.50 |
| 4,096 | 4,096 | 2 → 2 | 3.90 / 4.10 | 2.60 / 1.70 | 6.20 / 5.80 | 8.90 / 8.60 |
| 16,384 | 1,024 | 32 → 24 | 16.80 / 10.10 | 5.30 / 6.30 | 23.00 / 15.20 | 26.30 / 18.80 |
| 16,384 | 4,096 | 8 → 6 | 8.30 / 7.30 | 3.80 / 3.30 | 13.10 / 12.10 | 13.40 / 16.80 |

All six cases passed. The maximum red-channel pixel difference from the CPU reference was
2.15% of lit pixels on either GPU path. This qualification measures the complete
producer-to-render pipeline, including the precision of the H3 producer. The frame timings
include queue synchronization and are specific to this adapter and workload. Pairing leaves the
H3 producer and the render/picking passes unchanged. Further Cartesian inline work stays deferred.
