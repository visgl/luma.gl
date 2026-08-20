import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUSegmentedBVH

<GPUCoreDocsTabs active="segmented-bvh" />

## Overview

`GPUSegmentedBVH` builds or refits many independent small complete-binary bounding-volume
hierarchies that already reside in eight caller-owned packed GPU buffers. Equal leaf capacities
share one compute dispatch while every source domain, root, child index, stable leaf identity,
count, and overflow flag remains independent.

For example, 100 four-leaf mesh hierarchies require one graph node and one dispatch instead of 100
individually encoded BVH operations. The primitive uses exactly eight storage-buffer bindings, the
standard WebGPU CORE limit, and does not require subgroups, descriptor buffers, physical
allocations, command submission, or readback.

<GPUOperationContract operation="gpu-segmented-bvh" />

## When to use segmented hierarchies

Use [`GPUBVH`](/docs/api-reference/experimental/gpu-core/gpu-bvh) for one hierarchy, larger
trees, or explicit source identities. Use `GPUSegmentedBVH` when many independent trees have at
most 128 reserved leaves and their source bounds, output nodes, output leaves, and metadata
already occupy explicitly packed parent views.

Typical workloads include mesh-local ray-tracing BLAS builds, spatial bins, independent simulation
tiles, and small per-partition acceleration structures. Segmented construction never packs
streaming chunks implicitly and never moves bounds or identities between segment domains.

## Example

```ts
import {GPUCommandGraph, GPUSegmentedBVH} from '@luma.gl/gpgpu/gpu-core';

const graph = new GPUCommandGraph(device, {id: 'packed-mesh-hierarchies'});

const hierarchy = new GPUSegmentedBVH({
  id: 'mesh-hierarchies',
  minima: sortedTriangleMinima,
  maxima: sortedTriangleMaxima,
  nodeMinima: packedNodeMinima,
  nodeMaxima: packedNodeMaxima,
  nodeChildren: packedNodeChildren,
  leafIds: packedLeafIds,
  counts: meshTriangleCounts,
  overflows: meshCapacityOverflows,
  segments: [
    {
      sourceOffset: 0,
      sourceCount: 3,
      nodeOffset: 0,
      leafOffset: 0,
      metadataOffset: 0,
      leafCapacity: 4
    },
    {
      sourceOffset: 5,
      sourceCount: 4,
      nodeOffset: 8,
      leafOffset: 6,
      metadataOffset: 2,
      leafCapacity: 4
    }
  ]
});

hierarchy.addToGraph(graph);

const compiled = graph.compile();
const commandEncoder = device.createCommandEncoder({id: 'packed-mesh-hierarchies'});
compiled.encode(commandEncoder, {parameters: undefined});
device.submit(commandEncoder.finish());
```

Both hierarchies occupy the `mesh-hierarchies-fused-refit-4` graph node. Their workgroups publish
independent seven-node trees. The unused source, node, leaf, and metadata rows between the two
segments remain untouched.

## Constructor

### `new GPUSegmentedBVH(props)`

```ts
type GPUBVHBoundsView = GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;

type GPUBVHSegment = {
  sourceOffset: number;
  sourceCount: number;
  nodeOffset: number;
  leafOffset: number;
  metadataOffset: number;
  leafCapacity: number;
};

type GPUSegmentedBVHProps = {
  id?: string;
  minima: GPUBVHBoundsView;
  maxima: GPUBVHBoundsView;
  nodeMinima: GPUBVHBoundsView;
  nodeMaxima: GPUBVHBoundsView;
  nodeChildren: GraphDataView<'uint32x2'>;
  leafIds: GraphDataView<'uint32'>;
  counts: GraphDataView<'uint32'>;
  overflows: GraphDataView<'uint32'>;
  segments: readonly GPUBVHSegment[];
};
```

Source minima and maxima must have identical packed formats and lengths. Node minima, maxima, and
children must have identical row capacities, and node bounds must use the source format. Count
and overflow views must have identical row capacities. Every output buffer must be separate from
the source buffers and every other output buffer.

Offsets are logical rows relative to their corresponding parent views:

- `sourceOffset` addresses both source-bound views.
- `sourceCount` specifies the original number of rows in that segment.
- `nodeOffset` addresses all three node views and reserves `2 * leafCapacity - 1` rows.
- `leafOffset` addresses the identity view and reserves `leafCapacity` rows.
- `metadataOffset` addresses one row in both count and overflow views.

Every required range must fit its parent view. Source ranges may overlap because they are
read-only, but distinct hierarchy node, leaf, and metadata output ranges must not overlap.

`leafCapacity` must be a power of two from 1 through 128 that fits the device's compute-invocation,
workgroup-size, and shared-memory limits. A zero-row source still publishes an empty one-node
hierarchy when its capacity is one. If `sourceCount` exceeds capacity, only the stable source
prefix is stored; the full source count is published and the corresponding overflow flag becomes
`1`.

The constructor snapshots segment descriptors. Updating only the contents of caller-owned source
buffers does not require recompilation. Changing capacities, segment domains, or offsets requires
recording a new operation.

## `addToGraph(graph)`

Adds one compute graph node for each occupied capacity bucket. Possible capacities are 1, 2, 4, 8,
16, 32, 64, and 128, so any number of supported hierarchies requires at most eight graph nodes.
Each hierarchy runs in one workgroup with exactly `leafCapacity` invocations. Dispatches expand
across all three WebGPU workgroup dimensions where needed; surplus workgroups exit before reading
descriptors or touching destination rows.

Generated graph-node identifiers follow `${id}-fused-refit-${leafCapacity}`. Segment descriptors
are embedded as compile-time shader constants. Each compute shader binds exactly eight packed
storage buffers and uses at most 8 KiB of workgroup memory, requiring no optional adapter feature.

Within each segment, node `0` is the local root; internal node `i` points to local children
`2 * i + 1` and `2 * i + 2`. Padded leaves store `0xffffffff` and empty bounds. Invalid, non-finite,
or inverted source bounds produce empty leaf bounds but retain their local source identity. These
rules match the corresponding single-hierarchy `GPUBVH` contract exactly.

The operation only records graph work. Compilation, encoding, submission, and optional result
readback remain application-owned.

## Limitations

Segments with more than 128 reserved leaves are rejected; construct an individual `GPUBVH` for
those trees. Explicit source identity remapping is not part of the initial segmented contract:
local IDs preserve the full eight-binding WebGPU CORE budget. A separate shared remapping graph
pass can translate those local IDs when a workload requires external identities.
