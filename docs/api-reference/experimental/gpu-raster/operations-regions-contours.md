# GPURaster regions and contours

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-raster.md)[Concepts](https://luma.gl/docs/api-reference/experimental/gpu-raster/concepts.md)[Operations](https://luma.gl/docs/api-reference/experimental/gpu-raster/operations.md)

## Connected-component labeling[​](#connected-component-labeling "Direct link to Connected-component labeling")

A connected component is one maximal group of foreground pixels reachable through a selected pixel-neighbor relationship. Use `GPURasterConnectedComponents` after thresholding or binary morphology when you need to identify which selected observations form the same contiguous field, cloud, water body, microscopy object, or other classified region.

The input is a packed `GPURasterBufferBand<'uint32'>`. Every nonzero valid value is foreground; zero with valid observation status is background. A separate zero validity flag or exact raw `noDataValue` is missing data, not background, and cannot connect foreground pixels across a nodata barrier. Classification has identity calibration only: `scale` must be absent or `1`, and `offset` must be absent or `0`.

```
const classifiedForeground: GPURasterBufferBand<'uint32'> = {

  id: 'classified-vegetation',

  format: 'uint32',

  storage: {kind: 'buffer', values: thresholdMask},

  validity: analyzedObservationValidity

};



new GPURasterConnectedComponents({

  id: 'vegetation-components',

  width,

  height,

  input: classifiedForeground,

  connectivity: 8,

  maximumIterations: 24,

  output: representativeLabels,

  outputValidity: componentValidity,

  converged: componentConvergence,

  iterationCount: completedComponentIterations

}).addToGraph(graph);
```

`output` and `outputValidity` are separate caller-owned `GraphDataView<'uint32'>` buffers containing one element per input pixel. `converged` is a required caller-owned, one-element `uint32` result. Optional `iterationCount` is another one-element caller-owned `uint32` output. All source and output views must belong to the same graph and must not alias incompatible resources. The contributor declares work only; decoding, graph encoding, submission, leases, fences, rendering, and any optional result inspection remain application-owned.

### Four-connected versus eight-connected regions[​](#four-connected-versus-eight-connected-regions "Direct link to Four-connected versus eight-connected regions")

With `connectivity: 4`, pixels connect only through their north, south, east, and west neighbors. With `connectivity: 8`, diagonal neighbors also connect. Four-connectivity is the default.

```
Foreground classification:     Four-connected labels:       Eight-connected labels:



1 0 1                          1 0 3                        1 0 1

0 1 0                          0 5 0                        0 1 0

1 0 1                          7 0 9                        1 0 1
```

All five foreground pixels remain distinct under four-connectivity. Under eight-connectivity, the central pixel connects them into one component. If that center is instead invalid, it cannot bridge diagonal neighbors under either policy; valid zero-valued background remains separately valid but never joins a component.

Every converged foreground label is the smallest row-major pixel index in its component plus one. The `+1` reserves label `0` for background while preserving a deterministic representative independent of workgroup execution order. Component identifiers are deliberately **sparse**: labels `1`, `3`, `5`, `7`, and `9` do not mean nine components. Compose the separate `GPURasterDenseComponents` contributor when contiguous IDs or an actual component count are required. Compose `GPURasterRegionMeasurements` after dense relabeling for bounded per-region geometry and intensity; cross-tile component merging remains a separate contract.

### Convergence is required, not assumed[​](#convergence-is-required-not-assumed "Direct link to Convergence is required, not assumed")

Connected components compose initialization, minimum-root hooking, pointer compression, GPU-resident convergence detection, and final publication in one bounded command graph. `maximumIterations` fixes the largest number of declared rounds; it is not a promise that a long thin region has already converged. GPU-controlled indirect dispatch can skip remaining rounds after a fixed point is reached without reading or polling convergence on the CPU.

Explicit iteration budgets must be integers from `1` through `64`. Omitting the option selects `max(1, ceil(log2(width * height)) + 2)`. This default is a bounded practical estimate, not a proof that every foreground geometry converges. An application requiring stronger certainty must inspect the published GPU convergence state or gate its dependent graph work on that state.

When convergence is established, `converged[0]` is `1`; foreground labels hold exact sparse representatives, valid background is label `0` with output validity `1`, and missing observations are label `0` with output validity `0`. If the round budget is insufficient, `converged[0]` remains `0` and **every output label and every output-validity element is cleared**. This fail-closed contract prevents a downstream renderer, count, region measurement, or another GPU stage from mistaking partial labels for finished segmentation.

Optional `iterationCount` reports the number of rounds that actually performed GPU work, including the final unchanged round that proves convergence. Empty-foreground and all-background inputs converge without turning valid background into missing data. Increase a visibly insufficient iteration budget only by explicitly rebuilding or selecting a graph with the new bounded specialization.

One initialization pass, three passes for each declared round, and one final gated publication produce exactly `3 * maximumIterations + 2` graph stages. Each stage uses at most eight storage bindings. Graph-owned scratch contains `4 * width * height` parent bytes, one four-byte change flag, and one twelve-byte indirect dispatch record before allocation alignment; caller-owned values, output validity, convergence, and optional iteration counters are additional. Pointer compression and GPU-controlled zero-workgroup dispatch reduce active execution after convergence but do not remove already declared graph stages. Source masks, labels, output validity, and published status remain caller-owned. This sparse contributor does not itself partition a full image, remap dense labels, resolve cross-tile equivalences, or synchronize with the CPU.

## Dense component labels and bounded counts[​](#dense-component-labels-and-bounded-counts "Direct link to Dense component labels and bounded counts")

Use `GPURasterDenseComponents` after a converged `GPURasterConnectedComponents` result when component IDs must index a compact output or the application needs the actual number of regions. Sparse representative `9` means “the region rooted at pixel index 8,” not “nine regions.” Dense relabeling instead orders genuine roots by their row-major source pixel and assigns contiguous IDs starting at `1`; zero remains reserved for valid background.

```
new GPURasterDenseComponents({

  id: 'bounded-vegetation-regions',

  width,

  height,

  input: representativeLabels,

  inputValidity: componentValidity,

  converged: componentConvergence,

  output: denseRegionLabels,

  outputValidity: denseRegionValidity,

  componentCount: publishedRegionCount,

  overflow: regionCapacityOverflow,

  requiredComponentCount: exactRequiredRegionCount,

  capacity: 3

}).addToGraph(graph);
```

Every input and output is a caller-owned `GraphDataView<'uint32'>` from the same command graph. `input`, `inputValidity`, `output`, and `outputValidity` each contain `width * height` elements; `converged`, `componentCount`, `overflow`, and optional `requiredComponentCount` each contain one. Capacity is an integer from `0` through `width * height`; omitting it admits the entire raster. The contributor marks canonical representative roots, composes the shared unsigned exclusive `GPUScan`, and scatters dense IDs entirely on the GPU. Root markers, prefix ranks, and scan scratch remain graph-owned; no label or count is polled or downloaded by the contributor.

### Sparse roots, dense ranks, and capacity[​](#sparse-roots-dense-ranks-and-capacity "Direct link to Sparse roots, dense ranks, and capacity")

For five disconnected foreground roots:

```
Sparse representative labels:   Root flags:       Dense labels:



1 0 3                          1 0 1             1 0 2

0 5 0                          0 1 0             0 3 0

7 0 9                          1 0 1             4 0 5
```

The exact required count is `5`, not the largest sparse representative `9`. With `capacity: 3`, only dense labels `1`, `2`, and `3` are published. The result becomes:

```
Bounded dense labels:     Output validity:     Meaning:



1 0 2                     1 1 1                two retained regions and real background

0 3 0                     1 1 1                one retained region and real background

0 0 0                     0 1 0                two dropped regions and real background



requiredComponentCount = 5

componentCount         = 3

overflow               = 1
```

A dropped foreground pixel is `label = 0, validity = 0`; a genuine background pixel is `label = 0, validity = 1`. Missing input remains invalid. The zero labels in the last row therefore have two different meanings: the outer pixels exceeded capacity, while the center is a real valid background observation. Consumers must inspect validity and overflow instead of treating all zero labels as interchangeable.

`componentCount` is always the capacity-clamped published population: `min(requiredComponentCount, capacity)`. `overflow` is `1` exactly when the converged required population exceeds capacity; it is reset on each graph encoding rather than remaining sticky. `requiredComponentCount` is optional, but when supplied it receives the exact unclamped count. With zero capacity, every foreground output is invalid; an empty/background-only input still has count `0`, overflow `0`, and valid background masks.

### Convergence gates every dense output[​](#convergence-gates-every-dense-output "Direct link to Convergence gates every dense output")

Dense relabeling consumes the exact GPU `converged` scalar published by its sparse upstream contributor. If that scalar is zero, every dense label, output-validity flag, bounded count, optional required count, and overflow value is cleared. Thus `overflow = 0` alone does not prove a usable result: consumers must also require `converged = 1`. Out-of-range or malformed sparse representatives are rejected at the affected pixels without out-of-bounds root access.

Capacity is a bound on published component IDs, not a count of foreground pixels and not a global multi-tile region limit. Ordering is deterministic within the current raster/core. `GPURasterRegionMeasurements` can consume those converged dense IDs directly; cross-tile region identity reconciliation remains a separate future contributor. Source decoding, graph submission, fences, and any optional compact readback remain application-owned.

## Per-region intensity and spatial measurements[​](#per-region-intensity-and-spatial-measurements "Direct link to Per-region intensity and spatial measurements")

Use `GPURasterRegionMeasurements` when contiguous classified regions need actual measurements: the number of region pixels, the population and distribution of a scientific intensity band, their raster-local centroid, or affine region area. The contributor consumes converged, nonoverflowing dense region IDs and writes 11 independently allocated caller-owned GPU columns.

```
new GPURasterRegionMeasurements({

  id: 'vegetation-region-measurements',

  metadata: rasterMetadata,

  labels: denseRegionLabels,

  labelValidity: denseRegionValidity,

  converged: componentConvergence,

  componentCount: publishedRegionCount,

  overflow: regionCapacityOverflow,

  intensity: vegetationIndexBand,

  capacity: 256,

  output: {

    pixelCounts: regionPixelCounts,

    intensityCounts: regionIntensityCounts,

    intensitySums: regionIntensitySums,

    intensityMinimums: regionIntensityMinimums,

    intensityMaximums: regionIntensityMaximums,

    intensityMeans: regionIntensityMeans,

    columnSums: regionColumnSums,

    rowSums: regionRowSums,

    centroidColumns: regionCentroidColumns,

    centroidRows: regionCentroidRows,

    areas: regionAreas

  }

}).addToGraph(graph);
```

The first two result columns are exact `GraphDataView<'uint32'>`; the remaining nine are `GraphDataView<'float32'>`. Every column has the same caller-allocated length; row zero describes dense region ID `1`. `capacity` defaults to that length and may be explicitly reduced to any integer from zero through the allocated length. Zero-length columns are valid and add no grouped passes. Nonempty columns with `capacity: 0` are cleared into their empty-row state. Every input/output belongs to the same graph, and all 11 output buffers must remain distinct.

### Region geometry and measured intensity are different populations[​](#region-geometry-and-measured-intensity-are-different-populations "Direct link to Region geometry and measured intensity are different populations")

The region mask and intensity mask answer different questions. Consider a valid three-pixel region whose intensity sensor missed its middle sample:

```
Dense region IDs:       [  1,   1,   1]

Region validity:        [  1,   1,   1]

Intensity values:       [ 10, 999,  20]

Intensity validity:     [  1,   0,   1]



pixelCounts[0]       = 3

intensityCounts[0]   = 2

intensitySums[0]     = 30

intensityMeans[0]    = 15

intensityMinimums[0] = 10

intensityMaximums[0] = 20
```

The region still has three geometric pixels; its centroid and area include all three. Only the two valid, finite, non-nodata intensity observations contribute to intensity count, sum, minimum, maximum, or mean. Dividing `30` by the geometric count `3` would incorrectly report `10`; the correct mean is `30 / intensityCounts[0] = 15`.

Intensity accepts `GPURasterBufferBand<'float32'>` only. Raw-domain validity and exact nodata are checked before applying `raw * scale + offset` exactly once; nonfinite raw or calibrated values are rejected. Integer source intensities require an explicit caller-controlled float conversion with its precision tradeoff; `uint32` values above `2^24` are not all exactly representable as `float32`. Floating atomic accumulation order can vary, so sums, means, and centroid moments should be compared with an appropriate numerical tolerance.

### Pixel centroids, affine translation, and coordinate units[​](#pixel-centroids-affine-translation-and-coordinate-units "Direct link to Pixel centroids, affine translation, and coordinate units")

`columnSums` and `rowSums` are mergeable moments of every valid geometric region pixel. Area-interpreted pixels contribute their centers `(column + 0.5, row + 0.5)`; point-interpreted pixels contribute `(column, row)`. The local centroid is:

```
centroidColumns[region] = columnSums[region] / pixelCounts[region]

centroidRows[region]    = rowSums[region] / pixelCounts[region]
```

Keeping these GPU outputs in local pixel coordinates avoids adding a large projected world origin in `float32`. Once an application explicitly inspects a selected centroid, use the retained JavaScript-double affine metadata:

```
const worldCentroid = getRasterRegionWorldCentroid(

  rasterMetadata,

  selectedCentroidColumn,

  selectedCentroidRow

);
```

For `affine = [a, b, c, d, e, f]`:

```
worldX = a * centroidColumn + b * centroidRow + c

worldY = d * centroidColumn + e * centroidRow + f

pixelArea = abs(a * e - b * d)

regionArea = pixelCounts[region] * pixelArea
```

The centroid already includes the appropriate area/point center offset; do not add another half-pixel. Source/tile affine metadata also already contains its origin; do not add `levelZeroOrigin` again. Rotation, shear, negative scale, and non-square pixels are included in the affine determinant. Area is always expressed in **squared CRS coordinate units**: a projected meter-based CRS yields square meters, while a geographic degree-based CRS yields square degrees. GPURaster does not perform geodesic area conversion or reproject coordinates.

### Empty rows, capacity failure, and execution ownership[​](#empty-rows-capacity-failure-and-execution-ownership "Direct link to Empty rows, capacity failure, and execution ownership")

Valid topology with no accepted intensity observations publishes a real nonzero `pixelCounts` entry, zero `intensityCounts` and sum, and `NaN` intensity minimum/maximum/mean; geometric centroid and area remain valid. Completely unused rows publish zero counts, sums, moments, and area, with `NaN` intensity extrema/mean and `NaN` centroid coordinates.

If the upstream dense stage did not converge, its overflow flag is nonzero, its published count exceeds region capacity, or a dense label is invalid/out of range, region grouping refuses the unsafe rows. Global convergence/overflow/count failures reset **every** output row to the empty contract on each encoding; partially valid-looking tables never survive a failed execution. Group keys are zero-based scratch derived from bounded 1-based labels, never unbounded sparse representatives. Existing `GPUGroupAggregation` contributors perform the typed grouped work; intermediate keys, masks, calibrated values, and moments are graph-owned transient resources.

All result columns, metadata, source samples, submission, completion fences, optional inspection, and coordinate policy remain application-owned. No full label array, region table, source imagery, or CPU result is read by the contributor. Cross-tile region identity reconciliation, global region merges, polygon-zonal metrics, and exact integer intensity aggregation remain separate future integrations.

## Marching-squares contour classification[​](#marching-squares-contour-classification "Direct link to Marching-squares contour classification")

Use `GPURasterContourClassifier` when another GPU algorithm needs to know where a scalar surface crosses a value, but should own geometry emission or downstream topology itself. For example, classify vegetation-index boundaries before creating custom polygon overlays, or mark temperature isotherms without copying the source raster to the CPU.

```
new GPURasterContourClassifier({

  id: 'vegetation-boundary-cells',

  width,

  height,

  input: ndviBand,

  level: 0.35,

  cases: contourCases,

  segmentCounts: contourSegmentCounts

}).addToGraph(graph);
```

The caller allocates one `uint32` case and count for each of `(width - 1) * (height - 1)` cells. Corners are classified with `value >= level`; the low four case bits represent top-left, top-right, bottom-right, and bottom-left. Ambiguous diagonal cases 5 and 10 use a deterministic bilinear/asymptotic decider, recorded in the `0x10` flag. A cell touching masked, nodata, or non-finite corners produces no segments. Each valid case emits zero, one, or two segments. A one-row GPU `float32` view can replace a literal level when another graph pass computes the threshold.

Classification is useful when callers need compact topology, custom styling, or a later segmentation step. It is not a replacement for a screen-space shader when the only goal is a temporary visual highlight.

## GPU contour geometry and indirect overlays[​](#gpu-contour-geometry-and-indirect-overlays "Direct link to GPU contour geometry and indirect overlays")

Use `GPURasterContours` when an analytical boundary should become reusable line geometry: vegetation isolines, elevation contours, concentration thresholds, or map overlays. The contributor composes case classification, a GPU prefix scan, bounded segment scattering, and an optional GPU-written indirect draw count without reading the raster or segment count.

```
const contourCommands = new DrawCommandBuffer(device, {

  id: 'vegetation-contour-draw',

  type: 'draw',

  commands: [{vertexCount: 2, instanceCount: 0, firstVertex: 0, firstInstance: 0}]

});



new GPURasterContours({

  id: 'vegetation-contours',

  width,

  height,

  input: ndviBand,

  level: 0.35,

  vertices: contourVertices,

  segmentCount: visibleSegmentCount,

  overflow: contourOverflow,

  requiredSegmentCount: totalSegmentCount,

  draw: contourCommands.importToGraph(graph),

  metadata: rasterMetadata

}).addToGraph(graph);



// Bind a line-list model whose vertex shader reads contourVertices, then:

contourCommands.draw(renderPass, 0);
```

`vertices` is a caller-owned packed `float32x2` view containing two vertices per segment. Its length must therefore be even. `segmentCount` is clamped to vertex capacity, `overflow` signals truncated output, and optional `requiredSegmentCount` reports the original unclamped requirement. Cases are emitted in deterministic row-major order. The draw record describes a non-indexed, two-vertex instanced line. Every encoding publishes the complete four-word indirect command: `vertexCount: 2`, the capacity-clamped `instanceCount`, `firstVertex: 0`, and `firstInstance: 0`. This remains valid when the selected indirect-command slot was zero-initialized or reused for a different draw.

Coordinates remain raster-local `float32` pixel positions. Pixel-area rasters use pixel centers; point-sampled rasters use integer sample coordinates. Preserve the supplied affine transform, tile origin, and CRS on the CPU when projecting positions into a geographic overlay; silently converting large world coordinates to `float32` would lose precision. Multi-tile seam ownership and deck.gl-specific adapters remain separate future work.

### Analytical contours versus presentation effects[​](#analytical-contours-versus-presentation-effects "Direct link to Analytical contours versus presentation effects")

Existing luma.gl image effects primarily shade or filter a rendered framebuffer. They are appropriate when the output only needs to look different on screen. GPURaster contours process the original scalar samples and nodata mask, produce reusable numerical vector geometry, and keep classification, scan, scatter, and indirect rendering in one GPU-owned workflow.

Classification and bounded scattering scale linearly with raster-cell count, while emitted geometry scales with crossing-segment count. Prefix scanning introduces explicit additional passes and scratch storage. GPU-written indirect counts also let an application draw without waiting for a CPU count, although this particular dashboard separately reads compact scalar summaries for its controls. These structural advantages matter for repeated analysis or downstream vector consumers, but they are not a universal speed guarantee: source resolution, memory bandwidth, segment density, adapter limits, and application benchmarks determine actual cost.

## Adapter limits and ownership[​](#adapter-limits-and-ownership "Direct link to Adapter limits and ownership")

`getRasterDeviceLimits(device)` reports effective dispatch, allocation, and storage-binding ceilings. `planRasterDispatchStripes(device, {width, height})` returns caller-managed, whole-row stripes that respect those limits; it does not automatically rewrite large inputs.

Pointwise and neighborhood contributors use bounded two-dimensional dispatch. Histogram and extent primitives still use bounded 256-invocation one-dimensional passes. On adapters allowing 65,535 workgroups per dimension, a `4096 × 4096` single-view histogram needs 65,536 workgroups and is rejected; the application must process smaller tiles or explicitly managed stripes. Replayable global histogram merges combine those explicit bounded tiles; transparent automatic large-raster partitioning remains unimplemented. Halo planning, neighbor assembly, and core extraction are explicit caller-composed operations; they do not automatically partition an oversized source or bypass adapter limits.

Compiled graph destruction releases graph-owned transient allocations and computations but not caller-owned imported buffers or textures. The application controls graph encoding, submission, resource lifetimes, coordinate reprojection, and any synchronization or readback.

## Current scope and clean-room implementation[​](#current-scope-and-clean-room-implementation "Direct link to Current scope and clean-room implementation")

Percentile-driven contrast application, built-in GeoTIFF/COG decoding, cross-tile region identity, tiled contour stitching, automatic whole-image result placement, and FFT-backed raster convolution are not part of the current implementation. Application-owned tile ingress, source-provided overviews/windows, independently budgeted multi-tile CPU/GPU residency, fence-safe eviction, compatible compiled-graph reuse, explicit cumulative neighborhood halo planning and native-format GPU assembly, half-open core extraction, nodata-aware calibrated floating-point overview means and weighted pyramids, exact integer categorical nearest/mode overviews, generated affine/CRS metadata, Sobel, Scharr, Laplacian, gradient magnitude, bounded spatial smoothing, binary/grayscale dilation, erosion, opening, closing, deterministic four/eight-connected sparse representative labels with fail-closed GPU convergence, deterministic dense root ranks, exact/bounded component counts and per-execution capacity overflow, grouped geometric and valid-intensity populations, float-only intensity sum/min/max/mean, mergeable local centroid moments and affine area, replayable global tiled extent/population/sum/histogram merges, explicit sticky/saturating overflow diagnostics, bounded histogram-based percentiles, global Otsu input, and single-raster contour extraction are implemented.

The design is informed by public [cuCIM documentation](https://docs.rapids.ai/api/cucim/stable/), but all TypeScript and WGSL are independently implemented for browser WebGPU. GPURaster does not copy cuCIM kernels or bundle CUDA, OpenSlide, NVIDIA codecs, or image decoders. Review the [cuCIM third-party license notices](https://github.com/rapidsai/cucim/blob/main/LICENSE-3rdparty.md) when selecting separately licensed application-side decoders.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPURaster overview](https://luma.gl/docs/api-reference/experimental/gpu-raster.md)
* [GPURaster concepts](https://luma.gl/docs/api-reference/experimental/gpu-raster/concepts.md)
* [GPURaster operations index](https://luma.gl/docs/api-reference/experimental/gpu-raster/operations.md)
