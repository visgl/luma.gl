# GPUVirtualGeometrySelection

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUVirtualGeometrySelection` chooses a deterministic render frontier from a caller-owned cluster hierarchy. It combines conservative bounding-sphere frustum culling with a screen-space error metric, activates children only when their parent must refine, and publishes stable cluster IDs plus an indirect-ready retained count without CPU readback.

The primitive is renderer-independent. Cluster IDs can address meshlets, point-cloud nodes, impostors, terrain patches, or application-defined geometry records. Vertex and index storage, materials, render pipelines, and submission remain caller-owned.

```
import {

  DrawCommandBuffer,

  GPUCommandGraph,

  GPUVirtualGeometrySelection

} from '@luma.gl/experimental';



const drawCommands = new DrawCommandBuffer(device, {

  type: 'draw-indexed',

  commands: [{indexCount: meshletIndexCount, instanceCount: 0}]

});

const graph = new GPUCommandGraph(device);

const count = graph.importGPUData('visible-count', drawCommands.getInstanceCountData(0));



new GPUVirtualGeometrySelection({

  hierarchy: {

    sphereBounds,

    geometricErrors,

    children,

    clusterIds,

    levelOffsets: [0, 4, 20, 84]

  },

  view: {

    frustumPlanes,

    cameraPosition,

    pixelProjectionScale,

    maximumScreenSpaceError

  },

  output: visibleClusterIds,

  count,

  totalCount,

  overflow

}).addToGraph(graph);
```

`graph.compile()` produces initialization, one traversal pass per breadth level, stable visibility compaction, and bounded publication. The compiled graph records into an application-supplied command encoder; it does not submit or read results.

## Hierarchy contract[​](#hierarchy-contract "Direct link to Hierarchy contract")

Nodes are stored in breadth-level order. `levelOffsets` is CPU metadata beginning with zero, strictly increasing once per nonempty level, and ending at the shared node count. The first range contains every root, so forests do not need a synthetic root.

Each node has four source-aligned rows:

* `sphereBounds`: packed `float32x4` world-space center XYZ and nonnegative radius.
* `geometricErrors`: packed `float32` world-space error, transformed with the same scale as the world-space bounding sphere.
* `children`: packed `uint32x2` first-child index and child count.
* `clusterIds`: packed `uint32` render identity.

A zero child count marks a leaf. A nonempty range must lie wholly inside the immediately following breadth level. CPU-visible lengths and level offsets are validated when the selection is created. GPU child ranges are checked conservatively during traversal; an invalid range retains its coarse parent instead of creating a geometry hole.

The active state is node-aligned. Multiple roots and convergent activation write the same node state, so a node can appear at most once. If one parent remains coarse while another requests the same children, the coarse parent blocks those children. A selected parent and its children therefore never appear together even when child ranges converge.

## View and error metric[​](#view-and-error-metric "Direct link to View and error metric")

`frustumPlanes` contains six inward-facing normalized planes. A sphere is visible when every plane satisfies:

```
dot(plane.normal, sphere.center) + plane.distance >= -sphere.radius
```

`cameraPosition` is one packed `float32x3` world-space position. `pixelProjectionScale` is one `float32` value measured in pixels at unit distance. The selector packs these explicit inputs into its private view storage before traversal. For a perspective camera the scale is normally:

```
viewportHeightPixels / (2 * tan(verticalFieldOfViewRadians / 2))
```

The projected error is:

```
geometricError * projectionScalePixels /

max(distance(camera, sphere.center) - sphere.radius, 1e-6)
```

`geometricError`, the sphere, and the camera must use the same world-space units. If source geometry is scaled during placement, multiply its object-space error by the appropriate world scale before uploading the error column.

A node refines when that value exceeds `maximumScreenSpaceError`, expressed in pixels. A camera inside or within `1e-6` world units of a sphere refines conservatively when valid children exist. Non-finite view or error inputs also prefer refinement, while non-finite frustum planes do not cull geometry.

All four view buffers may change between encodings without recompiling the graph.

## Stable output and indirect drawing[​](#stable-output-and-indirect-drawing "Direct link to Stable output and indirect drawing")

Traversal writes a node-aligned mask and delegates ordered ID publication to `GPUVisibilityWorkflow`, which uses scan-based stable compaction. Selected IDs therefore follow source node order rather than workgroup scheduling.

`output.length` is the retained capacity. Every encoding publishes:

```
count = min(totalCount, output.length)

overflow = totalCount > output.length ? 1 : 0
```

The optional `totalCount` preserves the full selected count. `count`, `totalCount`, and `overflow` are reset on every encoding. Point `count` at `DrawCommandBuffer.getInstanceCountData()` to feed a later indirect draw directly; `DrawCommandBuffer` continues to own the indirect record layout and render-pass replay.

Only the prefix `output[0..count)` is valid. Values beyond that prefix are unspecified.

## Ownership[​](#ownership "Direct link to Ownership")

Hierarchy, view, output, status, and indirect-command buffers are imported and remain borrowed. `destroy()` never destroys those resources, including a `DrawCommandBuffer` instance-count view.

The selector owns its active mask, selected mask, full-capacity compacted IDs, packed view, and internal unclamped count. Call `destroy()` after destroying the compiled graph to release those buffers. Destruction is idempotent. Scan scratch remains graph-owned and is released with the compiled graph.
