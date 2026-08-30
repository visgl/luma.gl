# @deck.gl-community/arrow-layers

## Overview

Private deck.gl layers backed by the Arrow adapters and `GPUVector` objects from
`@luma.gl/arrow`.

The layers intentionally do not use deck.gl `AttributeManager` for Arrow columns.
Arrow data is converted once into `GPUVector`/`GPUTable` inputs and bound directly
to luma.gl models.

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
