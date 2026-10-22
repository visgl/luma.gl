# GPU time series

`@luma.gl/gpu-graph/gpu-timeseries` provides WebGPU chart reduction over uniformly sampled,
GPU-resident scalar values. It preserves source chunks and produces exact spike envelopes with
stable sample identities. See [Signal Room](/examples/experimental/gpu-timeseries) for linked
telemetry charts with more than three million real resident samples.

## GPUTimeSeries

```ts
import {GPUTimeSeries, GPUTimeSeriesEnvelope} from '@luma.gl/gpu-graph/gpu-timeseries';

const series = new GPUTimeSeries({values, validity, origin: 0, interval: 0.1});
```

`values` is a borrowed, packed `GPUVector<'float32'>`. Optional packed `GPUVector<'uint32'>`
`validity` must retain the same ordered chunk lengths, including empty chunks. Nonzero accepts a
sample; NaN and infinities are always missing. Stable sample IDs are zero-based source row indices
across chunks. `origin` and positive `interval` are CPU time metadata: sample `index` occurs at
`origin + index * interval`. They do not pass large epoch timestamps through Float32 shaders.
Defaults are zero and one. Irregular timestamps, resampling and streaming append are not supported.

Construction allocates nothing, preserves source references and does not transfer ownership.

## GPUTimeSeriesEnvelope

```ts
new GPUTimeSeriesEnvelope({
  id: 'visible-history',
  series,
  range,     // one uint32x2 row: [start, end), source sample indices
  output,    // float32x4 per bin: [minimum, maximum, first, last]
  sourceIds, // uint32x4 per bin: source IDs in the same order
  counts     // uint32x2 per bin: [valid, missing]
}).addToGraph(workflow);

// The caller compiles, encodes, submits and explicitly chooses any readback.
const compiled = workflow.compile();
```

All outputs and `range` must be packed single-chunk vectors. Their buffers are caller-owned;
writable outputs require distinct physical allocations from inputs and each other. `output.length`
sets the fixed bin count (1–16,384); `sourceIds` and `counts` must have the same length.

The range is read on every encoding, clamped to the series length and interpreted as half-open.
A reversed or out-of-range interval becomes empty. For `B` bins, bin `b` covers
`[start + floor(span * b / B), start + floor(span * (b + 1) / B))`.
Integer arithmetic partitions every selected sample exactly once, even when bins outnumber samples.
Minimum/maximum ties choose the earliest source ID. First/last refer to valid samples in source
order, not extrema order. Empty bins contain zero values, sentinel IDs `0xffffffff`, and zero valid
count. Missing counts distinguish absent observations from bins with no assigned source rows.

Re-encoding clears every output before reducing current source chunks. There is no capacity
overflow: fixed bins summarize the entire selected range, with bounded counts for at most
`0xfffffffe` source samples. Output reduction is exact, not stochastic sampling; it does not imply
continuity between observations. A renderer should display missing bins as gaps and mark mixed
bins when missingness matters. Connecting min/max values as an ordered polyline would be misleading.

One 64-thread workgroup reduces each bin per source chunk, then merges in source order. Work is
`O(visible samples + chunks × bins)` and output storage is 40 bytes per bin. Workgroup scratch is
bounded; there is no source-sized scratch, automatic packing or hidden readback. Each chunk must fit
a device storage binding. This implementation rescans visible samples after a range change; it does
not build a multiresolution time index or guarantee a frame rate. The caller can reuse outputs while
the range is unchanged and bind them directly to rendering.

The module does not import Arrow or depend on GPU tables. Use Arrow adapters outside it, and keep
renderer-specific pixel sizing, axes, picking policy and interpolation above the compute API.
