# GPU data and compute capabilities

This matrix groups the GPU-resident data and analytical capabilities that compose across luma.gl. Return to the [capabilities overview](https://luma.gl/docs/capabilities.md) for rendering and visualization features.

## GPU-native data, compute, and visualization[​](#gpu-native-data-compute-and-visualization "Direct link to GPU-native data, compute, and visualization")

### GPU-resident tables and columnar memory[​](#gpu-resident-tables-and-columnar-memory "Direct link to GPU-resident tables and columnar memory")

| Feature                      | Status       | Backend         | Package                            | Details                                                                             |
| ---------------------------- | ------------ | --------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| Owned or borrowed GPU chunks | Experimental | WebGPU + WebGL2 | `@luma.gl/gpgpu/gpu-data`          | Each `GPUData` object owns or borrows exactly one GPU buffer.                       |
| Typed GPU vectors            | Experimental | WebGPU + WebGL2 | `@luma.gl/gpgpu/gpu-data`          | `GPUVector` preserves an ordered list of independent data chunks.                   |
| Strided and child views      | Experimental | WebGPU + WebGL2 | `@luma.gl/gpgpu/gpu-data`          | `GPUDataView` describes views and struct children without duplicating GPU storage.  |
| GPU record batches           | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | `GPURecordBatch` groups aligned named columns without erasing batch identity.       |
| Chunk-preserving tables      | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | `GPUTable` keeps streamed record batches instead of implicitly repacking them.      |
| Constant values              | Experimental | WebGPU + WebGL2 | `@luma.gl/gpgpu/gpu-data`          | `GPUConstant` represents scalar or row-level constant inputs.                       |
| Explicit vector formats      | Experimental | WebGPU + WebGL2 | `@luma.gl/gpgpu/gpu-data`          | `GPUVectorFormat` describes stored bytes independently of shader value types.       |
| GPU schemas                  | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | `GPUSchema` and input schemas describe column names, formats, and bindings.         |
| Shader binding synthesis     | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | Table-aware helpers connect compatible columns to vertex attributes or storage.     |
| Buffer budget planning       | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | `GPUTableBufferPlanner` bounds bindings and respects available device limits.       |
| Explicit packing             | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | Packing is an explicit operation, never a hidden side effect of streaming.          |
| Ownership-aware destruction  | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | Aggregate destruction does not release buffers borrowed from their original owners. |
| Table-backed rendering       | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/gpu-tables` | `GPUTableModel` and table geometry connect columnar data directly to drawing.       |
| Table transform feedback     | Experimental | WebGL2          | `@luma.gl/experimental/gpu-tables` | Apply supported table transforms through WebGL transform feedback.                  |
| Table compute dispatch       | Experimental | WebGPU          | `@luma.gl/experimental/gpu-tables` | Compose typed GPU table inputs and outputs through WebGPU compute.                  |

See [GPU table structure and lifecycle](https://luma.gl/docs/api-reference/experimental/gpu-tables.md).

### Apache Arrow, geometry, and text[​](#apache-arrow-geometry-and-text "Direct link to Apache Arrow, geometry, and text")

| Feature                                | Status       | Backend         | Package                        | Details                                                                                                                           |
| -------------------------------------- | ------------ | --------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Apache Arrow uploads                   | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Convert supported Arrow tables, batches, vectors, and numeric columns into GPU data.                                              |
| Original batch boundaries              | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Preserve source chunks and batch ownership instead of flattening streamed input.                                                  |
| Renderer-independent Arrow analytics   | Experimental | WebGPU          | `@luma.gl/arrow`               | Use `makeGPUAnalyticsTableFromArrowTable()` to create storage-backed analytical tables without renderer-specific shader metadata. |
| Arrow analytics validity masks         | Experimental | WebGPU          | `@luma.gl/arrow`               | Preserve compatible Arrow nullability as explicit GPU-resident validity data and independent source batches.                      |
| Dictionary-backed analytics categories | Experimental | WebGPU          | `@luma.gl/arrow`               | Preserve CPU-owned UTF-8 dictionary labels and ordering metadata with signed or unsigned 32-bit GPU category indices.             |
| Fixed-size vector columns              | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Adapt supported fixed-size lists into typed GPU vectors and shader bindings.                                                      |
| Variable-length paths                  | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Preserve offsets for row-oriented path data.                                                                                      |
| Normalized and HDR colors              | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Adapt normalized colors and supported floating-point color inputs without promising universal zero-copy uploads.                  |
| Temporal and matrix metadata           | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Carry supported timestamps, time origins, and matrix-oriented source metadata.                                                    |
| Arrow path rendering                   | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Draw Arrow-backed paths with portable attributes or WebGPU storage strategies.                                                    |
| Arrow text rendering                   | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Render supported string and dictionary-encoded label columns.                                                                     |
| Source-row picking                     | Experimental | WebGPU + WebGL2 | `@luma.gl/arrow`               | Map visible geometry and labels back to their original Arrow rows.                                                                |
| Text and glyph atlases                 | Experimental | WebGPU + WebGL2 | `@luma.gl/text`                | Render bitmap, SDF, or MSDF glyphs with supported Unicode layout, kerning, and clipping.                                          |
| Dictionary-compressed labels           | Experimental | WebGPU          | `@luma.gl/text`                | Reuse repeated label values through WebGPU storage-based text strategies.                                                         |
| Animated path visualization            | Experimental | WebGPU          | `@luma.gl/experimental/models` | Render GPU-resident trips and variable-length paths through storage-backed models.                                                |

See [supported Arrow types and representations](https://luma.gl/docs/api-reference/arrow.md).

### Portable data operations[​](#portable-data-operations "Direct link to Portable data operations")

| Feature                      | Status    | Backend               | Package          | Details                                                                                        |
| ---------------------------- | --------- | --------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| Portable data evaluation     | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Evaluate supported expressions against the most appropriate available execution backend.       |
| Lazy vector evaluation       | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Build deferred vector expressions and resolve them when values are needed.                     |
| Arithmetic operations        | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Apply addition, subtraction, multiplication, division, powers, and other supported operations. |
| Elementary math              | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Evaluate supported sine, cosine, tangent, exponential, logarithm, and square-root functions.   |
| Extent and vector reductions | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Calculate supported extents, dot products, lengths, and equality checks.                       |
| Gather and selection         | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Gather indexed values, select elements, and generate index sequences.                          |
| Segmented operations         | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Apply supported segmented mappings without losing source-vector structure.                     |
| Swizzle and interleave       | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Reorder vector components and combine compatible streams.                                      |
| Result caching               | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Reuse evaluated values and clean up evaluator-owned temporary resources.                       |
| Dynamic backend loading      | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Select compatible implementations without requiring every execution adapter up front.          |
| Custom operation handlers    | Available | CPU + WebGPU + WebGL2 | `@luma.gl/gpgpu` | Extend evaluator behavior through explicit backend-specific operation handlers.                |

See [GPU operations and custom evaluation](https://luma.gl/docs/api-reference/gpgpu.md).

### GPU dataframe analytics[​](#gpu-dataframe-analytics "Direct link to GPU dataframe analytics")

| Feature                                | Status       | Backend | Package                               | Details                                                                                                                             |
| -------------------------------------- | ------------ | ------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| GPU-resident dataframes                | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | `GPUDataFrame` wraps typed GPU tables without taking implicit ownership of borrowed source buffers.                                 |
| Immutable query plans                  | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Build reusable filter, projection, aggregation, histogram, and ordering plans without eagerly dispatching GPU work.                 |
| Chunk-preserving source tables         | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Retain source record-batch boundaries, row identities, ownership, and compatible dictionary metadata.                               |
| Typed column expressions               | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Compose supported numeric, comparison, boolean, literal, and parameter expressions over named columns.                              |
| Reusable query parameters              | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Re-encode compatible parameterized filters and derived computations without rebuilding the source dataframe.                        |
| Null-aware filtering                   | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Apply `filter()` predicates with explicit validity masks and supported null checks.                                                 |
| Column projection                      | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `select()` to project ordered source columns without silently copying or repacking their GPU buffers.                           |
| Nullable derived columns               | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `withColumn()` to evaluate compatible GPU-resident arithmetic while propagating source validity.                                |
| Dense grouped aggregation              | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `groupBy()` with dense unsigned categories and dictionary or explicit cardinality; aggregate compatible floating-point values.  |
| Global dataframe reductions            | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `aggregate()` for non-nullable row counts and validity-aware sums, extrema, and means.                                          |
| Null-aware dataframe histograms        | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `histogram()` with compatible numeric columns, explicit domains, irregular edges, and source validity.                          |
| Batch-preserving dataframe inner joins | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `innerJoin()` with unique-right unsigned keys, stable source-row identifiers, preserved batches, and explicit bounded overflow. |
| Source-aligned dataframe lookups       | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `lookup()` to publish compatible right-row identifiers and match masks without compacting or repacking left rows.               |
| Stable dataframe sorting               | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `sortBy()` independently within each source batch with explicit numeric ordering and null/NaN placement.                        |
| Per-batch top-K selection              | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Use `topK()` to retain a bounded number of stably ordered rows per source batch without flattening independent inputs.              |
| Reusable query execution               | Experimental | WebGPU  | `@luma.gl/experimental/gpu-dataframe` | Compile compatible dataframe plans into reusable GPU work while preserving explicit command submission.                             |

The `@luma.gl/experimental/gpu-dataframe` entry point is experimental; its GPU-native operations are implemented, but non-unique, outer, or multi-key joins, temporal windows, and cross-batch global ordering remain opportunities. See the reusable higher-level APIs.

### GPU raster and satellite analysis[​](#gpu-raster-and-satellite-analysis "Direct link to GPU raster and satellite analysis")

| Feature                                   | Status       | Backend | Package                            | Details                                                                                                                                            |
| ----------------------------------------- | ------------ | ------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GPU-resident raster bands                 | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | `GPURaster` describes compatible raster dimensions, bands, metadata, coordinate systems, and ownership.                                            |
| Application-owned raster tile sources     | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Validate caller-owned raster source, transport, decoding, and submission contracts before optional framework-managed upload and caching.           |
| Source-provided raster overviews          | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Select compatible source windows, source-provided overview levels, coordinate metadata, and cancellable tile requests.                             |
| Bounded raster tile residency             | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | `GPURasterTileCache` controls independently bounded decoded CPU tiles, uploaded GPU buffers, and compatible compiled graphs.                       |
| Deterministic raster tile eviction        | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Reuse cache hits and evict eligible unpinned raster tiles and graphs within explicit byte and entry-count budgets.                                 |
| Cancellation-safe raster tile requests    | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Deduplicate compatible in-flight source requests without canceling other waiting callers.                                                          |
| Fence-protected raster tile leases        | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Pin raster tiles and reusable graphs until an application-owned post-submission completion fence resolves.                                         |
| Compiled raster graph reuse               | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Reuse shape-compatible compiled analysis graphs while rebinding the current tile's borrowed GPU buffers.                                           |
| Seam-safe cross-tile raster halos         | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Assemble real neighboring samples on the GPU, preserve cumulative receptive fields, and publish each half-open tile core exactly once.             |
| Nodata-aware analytical overviews         | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Generate calibrated, valid-sample-weighted floating means with explicit sums, counts, masks, and odd-edge coverage.                                |
| Exact categorical raster overviews        | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Preserve native signed and unsigned class identifiers with deterministic nearest or valid-label mode policies.                                     |
| Dataset-wide tiled raster statistics      | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Merge valid tile counts, calibrated sums, and extrema into explicitly initialized GPU-resident global accumulators.                                |
| Stable-domain global histogram replay     | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Replay every owned tile core against the finalized dataset-wide value domain before merging compatible bins.                                       |
| GPU global percentiles and thresholds     | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Derive histogram-estimated global percentiles and consistent Otsu thresholds without downloading raster samples.                                   |
| Overflow-aware global raster reductions   | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Saturate global counts and bins, expose sticky overflow flags, and invalidate unsafe percentile results.                                           |
| Buffer and texture conversion             | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Convert supported raster bands between GPU buffers and textures without downloading source pixels.                                                 |
| Calibrated raster band math               | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Combine supported numeric bands while applying explicit scale, offset, validity, and nodata contracts.                                             |
| GPU vegetation index                      | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Compute normalized-difference vegetation index (NDVI) from compatible red and near-infrared bands.                                                 |
| Nodata-aware raster statistics            | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Calculate supported valid-pixel counts, sums, means, extrema, and scalar summaries.                                                                |
| Raster histograms                         | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Derive valid-pixel distributions with supported explicit or GPU-inferred histogram domains.                                                        |
| Automatic Otsu thresholds                 | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Select supported image thresholds from GPU-resident histogram distributions.                                                                       |
| Raster threshold classification           | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Classify compatible pixel values against explicit thresholds without CPU-side source traversal.                                                    |
| Raster contrast adjustment                | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Apply supported contrast remapping while preserving raster validity and domain semantics.                                                          |
| Neighborhood convolution                  | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Evaluate bounded kernels with supported raster borders and nodata-aware neighborhood policies.                                                     |
| Gaussian and box smoothing                | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Smooth compatible raster bands without implicitly filling invalid neighboring pixels.                                                              |
| Sobel and Scharr gradients                | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Evaluate supported directional derivatives and edge responses from GPU-resident raster neighborhoods.                                              |
| Gradient magnitude and Laplacian          | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Derive gradient magnitude and compatible second-order edge information from valid raster pixels.                                                   |
| Binary and grayscale morphology           | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Process supported binary masks or grayscale raster bands with explicit structuring elements, borders, and nodata policies.                         |
| Raster dilation and erosion               | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Expand or contract compatible raster features through bounded square or Manhattan-diamond neighborhoods.                                           |
| Raster opening and closing                | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Compose supported erosion/dilation sequences to remove small features or close compatible raster gaps.                                             |
| Deterministic raster connected components | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Assign sparse minimum-root foreground labels with explicit four/eight-neighbor connectivity while preserving valid background and nodata barriers. |
| Convergence-gated raster component labels | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Publish GPU convergence and optional actual iteration counts; clear all labels and validity when a bounded graph cannot prove convergence.         |
| Dense raster component identifiers        | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Compact converged sparse representatives into deterministic contiguous row-major region IDs without losing valid background.                       |
| Bounded raster region counts and overflow | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Publish exact required and capacity-clamped component populations, invalidate truncated foreground, and expose per-execution overflow.             |
| Masked per-region intensity statistics    | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Publish separate exact geometric and valid-intensity populations with calibrated floating sums, minima, maxima, and means.                         |
| Region centroids and affine areas         | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Retain mergeable local pixel moments, preserve double-precision world translation, and report area in square CRS coordinate units.                 |
| Marching-squares contours                 | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Classify bounded raster cells and generate supported vector contour segments directly on the GPU.                                                  |
| Indirect contour overlays                 | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Draw GPU-generated contour geometry without downloading or rebuilding every segment on the CPU.                                                    |
| Device-aware raster dispatch              | Experimental | WebGPU  | `@luma.gl/experimental/gpu-raster` | Plan bounded dispatch stripes against the selected device's actual compute limits.                                                                 |

Start with the [GPURaster concepts and execution guide](https://luma.gl/docs/api-reference/experimental/gpu-raster/concepts.md), read the [GPURaster API reference](https://luma.gl/docs/api-reference/experimental/gpu-raster.md), or experiment with the [Satellite Raster Lab](https://luma.gl/examples/showcase/raster-lab).

### Applied visualization, geospatial, and interaction[​](#applied-visualization-geospatial-and-interaction "Direct link to Applied visualization, geospatial, and interaction")

| Feature                          | Status       | Backend         | Package                                 | Details                                                                                   |
| -------------------------------- | ------------ | --------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Linked crossfiltering            | Experimental | WebGPU          | `@luma.gl/experimental/gpu-crossfilter` | Maintain linked scalar ranges and two-dimensional brushes over GPU-resident data.         |
| Self-excluding histograms        | Experimental | WebGPU          | `@luma.gl/experimental/gpu-crossfilter` | Recalculate brush histograms without counting the active dimension against itself.        |
| Stable selected row IDs          | Experimental | WebGPU          | `@luma.gl/experimental/gpu-crossfilter` | Preserve row identity for linked charts and renderable selection masks.                   |
| High-precision projection        | Experimental | WebGPU          | `@luma.gl/experimental/gpu-project`     | Build local error-bounded projection patches from compatible CPU projection providers.    |
| Binary64 coordinate transport    | Experimental | WebGPU          | `@luma.gl/experimental/gpu-project`     | Transport 64-bit source coordinates as integer words and subtract a local origin.         |
| Web Mercator support             | Experimental | WebGPU          | `@luma.gl/experimental/gpu-project`     | Project supported geospatial coordinates while retaining local precision.                 |
| Geographic distance              | Experimental | WebGPU          | `@luma.gl/experimental/geospatial`      | Evaluate supported Haversine, point, segment, and linestring distances.                   |
| Polygon containment              | Experimental | WebGPU          | `@luma.gl/experimental/geospatial`      | Test supported polygon boundary and containment relationships.                            |
| Hierarchical trace views         | Experimental | WebGPU          | `@luma.gl/experimental/gpu-trace`       | Filter, project, and render supported process, thread, and dependency hierarchies.        |
| GPU-driven timeline picking      | Experimental | WebGPU          | `@luma.gl/experimental/gpu-trace`       | Link trace visibility, indirect timeline draws, and GPU-aware picking.                    |
| Chunk-aware trace dependencies   | Experimental | WebGPU          | `@luma.gl/experimental/gpu-trace`       | Route visible dependency endpoints across supported independent source-span batches.      |
| Bounded dataset residency        | Experimental | WebGPU          | Application-owned example               | Stream large source corpora with an application-managed bounded GPU-resident working set. |
| Portable path and polygon models | Experimental | WebGPU + WebGL2 | `@luma.gl/experimental/models`          | Render table-backed paths and polygons using compatible attribute-driven strategies.      |
| Storage-backed path models       | Experimental | WebGPU          | `@luma.gl/experimental/models`          | Process compatible path, polygon, and trip columns directly through storage buffers.      |

Try [Million-Row Crossfilter](https://luma.gl/examples/showcase/million-row-crossfilter), [Billion-Point Spatial Atlas](https://luma.gl/examples/showcase/billion-point-spatial-atlas), [GPU data analysis](https://luma.gl/examples/experimental/gpu-data-analysis), and [GPU sorting](https://luma.gl/examples/experimental/gpu-sort). Billion-scale figures describe source corpora; the GPU-resident working set remains bounded.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPGPU programming](https://luma.gl/docs/api-guide/gpu/gpgpu.md)
* [API reference](https://luma.gl/docs/api-reference.md)
