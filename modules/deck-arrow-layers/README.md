# @deck.gl-community/arrow-layers

## Overview

Private deck.gl layers backed by the Arrow adapters and `GPUVector` objects from
`@luma.gl/arrow`.

The layers intentionally do not use deck.gl `AttributeManager` for Arrow columns.
Arrow data is converted once into `GPUVector`/`GPUTable` inputs and bound directly
to luma.gl models.

## GPU-compiled Arrow accessors (POC)

On WebGPU, `ArrowPathLayer` can consume a derived `float32` width vector and the canonical
`uint32` selection mask from a compiled `GPUDataFrame` query. Re-encoding the query with new
parameters rewrites the same GPU output allocations: Arrow source columns remain resident, path
geometry is not expanded again, and no JavaScript accessor loop or CPU readback is required.

```ts
import {ArrowPathLayer} from '@deck.gl-community/arrow-layers';
import {makeGPUDataFrameFromArrowTable} from '@luma.gl/arrow';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  column,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';

const frame = makeGPUDataFrameFromArrowTable(device, arrowTable, {columns: ['width']});
const accessors = frame
  .withColumn('renderWidth', column('width').multiply(parameter('widthScale', 1)), {
    format: 'float32'
  })
  .filter(column('renderWidth').greaterThan(parameter('minimumWidth', 0)))
  .select(['renderWidth'])
  .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));

frame.destroy(); // The compiled query retains its source lease.

const commandEncoder = device.createCommandEncoder();
accessors.encode(commandEncoder, {widthScale: 2, minimumWidth: 0.5});
device.submit(commandEncoder.finish());

const layer = new ArrowPathLayer({
  id: 'gpu-accessor-paths',
  data: arrowTable,
  paths: 'path',
  model: 'storage',
  width: accessors.table.gpuVectors.renderWidth,
  visibility: accessors.selectionMask
});
```

The layer borrows the query outputs. Destroy `accessors` only after the layer stops using them.
`visibility` is intentionally a WebGPU storage-model input; zero hides the row while retaining its
stable source index for picking and optional deferred CPU row resolution.

## When to use graph layers

Use the graph adapters when a deck.gl application already owns GPU-resident relationship data and
needs to visualize social networks, service dependencies, transaction communities, or citation
graphs without turning each vertex and edge into a JavaScript object.

Choose another path when a small one-off graph starts and stays on the CPU or the application
needs a graph database, automatic CPU fallback, or converged clustering guarantees. This package
adapts existing GPU results to real deck.gl layers; it does not replace the underlying graph API.

## Graph effects and layers

`GPUGraphDeckEffect` composes topology, vertex degree, PageRank, weak components, deterministic
communities, neighborhood search, and progressive force layout inside deck.gl's existing frame.
Deck owns queue submission; the effect retains original source and target edge partitions,
including empty batches, without staging or reading graph data back to the CPU.

```ts
import {
  GPUGraphDeckEffect,
  GPUGraphEdgeLayer,
  GPUGraphNodeLayer,
  type GPUGraphDeckDataset
} from '@deck.gl-community/arrow-layers';

const dataset: GPUGraphDeckDataset = {
  vertexCount,
  sourceChunks,
  targetChunks,
  positions,
  velocities
};
const effect = new GPUGraphDeckEffect(device, dataset);
```

`GPUGraphNodeLayer` consumes the exact progressive position allocation alongside resident community,
component, degree, PageRank, distance, and selection outputs. Create one `GPUGraphEdgeLayer` per
nonempty original edge partition to render caller-owned source and target buffers directly. Large
graphs can retain every real vertex while limiting only the number of displayed original edges.

Choose exact layout for small networks, the explicit uniform-grid approximation for medium-sized
networks, or inject an application-owned sampled-layout contributor for larger graphs. The sampled
contributor receives the existing command graph and force-layout objects; it is not bundled into
this private package, which never imports application or example source. The bundled showcase
keeps all 1,048,576 source vertices and 2,097,343 directed edges resident while drawing every
vertex and bounding visible edges to 65,536.

```ts
const sampledEffect = new GPUGraphDeckEffect(device, dataset, {
  layoutMode: 'sampled',
  addSampledLayoutToGraph: addApplicationOwnedSampledLayout
});
```

`addApplicationOwnedSampledLayout(commandGraph, layout)` declares application-owned GPU work on
the supplied graph and existing layout; it does not transfer ownership or add an example
dependency to this package. Omitting the optional configuration retains the regular exact-layout
constructor shown above.

The graph algorithms remain in `@luma.gl/gpgpu/gpu-graph`; only this existing private adapter
package depends on deck.gl. Its diagnostics report actual resident populations, visible edge
detail, CPU encoding, and frame cadence without inventing GPU timings or claiming convergence for
a fixed iteration budget.
