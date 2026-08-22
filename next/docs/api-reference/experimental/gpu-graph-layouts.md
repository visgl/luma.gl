# GPU Graph layouts

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-graph.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-operations.md)[Topology](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-topology.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-traversal.md)[Connectivity](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-connectivity.md)[Metrics](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-metrics.md)[Layouts](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-layouts.md)

## Reveal relationships with GPUGraphForceLayout[​](#reveal-relationships-with-gpugraphforcelayout "Direct link to Reveal relationships with GPUGraphForceLayout")

**Question: How can I position connected entities so the structure of their relationships becomes visible?**

`GPUGraphForceLayout` progressively assigns two-dimensional positions to graph vertices. Imagine every vertex pushing away from every other vertex while each edge acts like a spring pulling its two endpoints together. Over successive frames, tightly connected entities move closer together, unrelated vertices spread apart, and a gentle pull toward the origin keeps the network in view.

Use it to arrange a social graph so overlapping circles of friends become easier to inspect, map service dependencies around their most connected systems, expose connected counterparties in a transaction investigation, or turn a citation list into a navigable document network. Unlike degree, connected components, and PageRank, which answer numerical questions about a vertex, force layout answers where an application can draw that vertex. Your application still owns its renderer, colors, labels, and interaction design.

```
import {GPUGraphForceLayout} from '@luma.gl/gpgpu/gpu-graph';



const layout = new GPUGraphForceLayout({

  topology,

  positions: nodePositions,

  velocities: nodeVelocities,

  pinned: pinnedVertices,

  reset: resetRequested,

  seed: 42,

  iterationsPerFrame: 4,

  repulsion: 1,

  attraction: 0.1,

  gravity: 0.01,

  damping: 0.9,

  maxVelocity: 1,

  timeStep: 1

});
```

`positions` and `velocities` are distinct, caller-owned, packed `GPUVector<'float32x2'>` values with one row per vertex. The physical position buffer must have both `Buffer.STORAGE` and `Buffer.VERTEX` usage: compute updates the exact same allocation that an application can bind as a render vertex attribute. Velocity storage requires `Buffer.STORAGE`. There is no intermediate position copy, CPU coordinate readback, or graph-owned layout scratch buffer.

Every exact iteration evaluates repulsion against all other vertices, equal-strength attraction over every incident edge, gravity toward the origin, velocity damping, and a configurable maximum speed. The force pass finishes for every vertex before a separate integration pass writes the next positions. This globally ordered separation keeps the old position field stable during force evaluation without requiring floating-point atomics.

Edges pull both endpoints together even when the source graph is directed, so directed layout requires both forward and reverse adjacency. Undirected layout reuses symmetric forward adjacency. Existing edge weights are preserved by topology but intentionally ignored by this unweighted spring model; a duplicate edge contributes another spring and a self-loop adds no displacement.

Set a vertex's optional `uint32` `pinned` row to any nonzero value to preserve its current position and clear its velocity. This supports dragging a node into place, holding a selected account steady, or anchoring known reference vertices while their neighbors continue to settle.

Writing a nonzero value to the optional one-row `uint32` `reset` vector requests deterministic initialization from `seed` and clears existing velocities. Pinned coordinates remain unchanged, and the GPU consumes the reset request by clearing it. Subsequent encodings warm-start from the current positions and velocities instead of restarting the simulation on every frame.

The defaults are `seed: 0`, `iterationsPerFrame: 4`, `repulsion: 1`, `attraction: 0.1`, `gravity: 0.01`, `damping: 0.9`, `maxVelocity: 1`, and `timeStep: 1`. Increase the per-frame step count when visual responsiveness matters more than frame cost; lower it when other GPU work needs the same frame budget. If required forward or reverse adjacency overflows, the layout preserves every existing position and clears all velocities rather than drawing a misleading partial graph.

Each force step performs exact `O(V² + E)` work: doubling the vertex count roughly quadruples the all-pairs repulsion. Choose this layout for graph sizes where exact pairwise interactions fit the available frame budget, especially when the result is consumed directly by GPU rendering. Avoid it for very large networks, already meaningful geographic coordinates, or applications requiring weighted springs. This implementation does not approximate pairwise interactions and does not claim to implement ForceAtlas2 or Barnes–Hut.

## Approximate distant forces with GPUGraphSpatialForceLayout[​](#approximate-distant-forces-with-gpugraphspatialforcelayout "Direct link to Approximate distant forces with GPUGraphSpatialForceLayout")

**Question: How can I make a larger relationship map easier to explore when exact repulsion spends too much time comparing every individual vertex?**

`GPUGraphSpatialForceLayout` adds an explicitly approximate, opt-in execution path around an existing `GPUGraphForceLayout`. Imagine looking across a city: nearby pedestrians need individual attention, but a distant crowd can often be treated as one group at its average position. The spatial layout divides the current drawing area into a regular grid, calculates nearby forces exactly, and represents sufficiently distant occupied cells by their population and center of mass.

Use it when an interactive dependency map, social network, transaction investigation, or citation visualization already owns GPU-resident graph data and can trade a bounded amount of visual accuracy for fewer individual far-field calculations. Keep the exact layout when every pairwise force must be reproducible, the network is small enough that index construction costs more than it saves, vertices are too concentrated to benefit from grouping, or meaningful fixed coordinates should not be replaced by a force-directed arrangement.

```
import {

  GPUGraphForceLayout,

  GPUGraphSpatialForceLayout

} from '@luma.gl/gpgpu/gpu-graph';



const layout = new GPUGraphForceLayout({

  topology,

  positions: nodePositions,

  velocities: nodeVelocities,

  pinned: pinnedVertices,

  reset: resetRequested,

  iterationsPerFrame: 4

});



const spatialLayout = new GPUGraphSpatialForceLayout({

  layout,

  gridSize: [32, 32],

  bounds: [-4, -4, 4, 4],

  theta: 0.6,

  nearCellRadius: 1,

  cellOffsets: spatialCellOffsets,

  vertexIds: spatialVertexIds,

  cellCenters: spatialCellCenters,

  count: indexedVertexCount,

  overflow: spatialIndexOverflow

});



spatialLayout.addToGraph(workflow);
```

Add either `layout` or `spatialLayout` to a workflow, not both: the spatial contributor advances the same base positions and velocities itself. Existing directed and undirected spring behavior, deterministic resets, pinned vertices, velocity limits, progressive warm starts, and directly renderable position buffers remain intact. Directed attraction still requires reverse adjacency; existing edge-weight columns remain intentionally unused by the unweighted spring model.

### Accuracy and spatial controls[​](#accuracy-and-spatial-controls "Direct link to Accuracy and spatial controls")

The source vertex's own cell and every cell within `nearCellRadius` use exact, individual vertex interactions. This neighborhood is a square measured in grid cells: the default radius `1` covers the source cell and up to eight surrounding cells. Other occupied cells are approximated only when `cellDiagonal / distanceToCellCenter < theta`; cells that fail that test still contribute all of their individual interactions. No distant vertex is silently dropped.

The default `theta: 0.6` controls the speed-versus-accuracy tradeoff. Larger values accept more distant cell approximations and can increase layout error; smaller values require a cell to be farther away before its population-weighted center of mass can represent its contents. Set `theta: 0` to disable every approximation and recover exact all-pairs repulsion while retaining the explicit grid rebuild and cell-scan overhead. Increasing `nearCellRadius` expands the exact neighborhood and can also prevent approximation across the entire grid.

This implementation is a **flat uniform-grid monopole approximation**, not hierarchical Barnes–Hut, ForceAtlas2, an adaptive tree, or a claim of million-vertex throughput. It computes cell centers from grouped vertex identifiers without floating-point atomics.

### Bounds, buffers, and failure behavior[​](#bounds-buffers-and-failure-behavior "Direct link to Bounds, buffers, and failure behavior")

`gridSize: [columns, rows]` creates `G = columns × rows` equally sized cells inside the explicit, inclusive `bounds: [minimumX, minimumY, maximumX, maximumY]`. The application supplies five packed, single-chunk GPU vectors with physically distinct buffer allocations:

* `cellOffsets`: `GPUVector<'uint32'>` with exactly `G + 1` rows.
* `vertexIds`: `GPUVector<'uint32'>` with caller-selected indexing capacity; allow at least `V` rows to accept every vertex without overflow.
* `cellCenters`: `GPUVector<'float32x2'>` with exactly `G` rows.
* `count`: a one-row `GPUVector<'uint32'>` reporting accepted in-domain vertices.
* `overflow`: a one-row `GPUVector<'uint32'>` signaling insufficient `vertexIds` capacity.

The GPU rebuilds these caller-owned buffers on every spatial force iteration because vertices can cross cell boundaries as the layout moves. Choose bounds that include every current coordinate, deterministic reset positions in `[-1, 1]`, and sufficient room for future movement. Bounds do not expand automatically; a vertex outside the domain makes `count` smaller than `vertexCount` even when indexing capacity is sufficient.

If any vertex is outside the bounds, the index overflows, or required forward/reverse adjacency overflows, the spatial step fails closed: it preserves every existing position and clears all velocities. Counts and overflow flags remain explicit GPU-resident outputs until an application deliberately reads them back. Caller-owned layout and grid allocations are never destroyed or silently replaced.

### Cost and when acceleration helps[​](#cost-and-when-acceleration-helps "Direct link to Cost and when acceleration helps")

Every vertex still scans every grid cell, even empty cells. With `V` vertices, `G` cells, `P` individual near-field or rejected-far-field interactions, and `E` edges, each iteration performs `Θ(V × G + P + E)` work plus one grid rebuild and uses `Θ(V + G)` caller-owned grid storage. A sensible grid can reduce the number of individual interactions when vertices are distributed across well-separated regions, but an oversized grid wastes scans and a crowded grid cell restores pairwise work. The worst case can return to `Θ(V² + E)`; a grid with more cells than vertices can be even more expensive. Measure the application's actual graph distribution, index-rebuild cost, accuracy, and frame budget before choosing this path.

## Compose one GPU-resident workflow[​](#compose-one-gpu-resident-workflow "Direct link to Compose one GPU-resident workflow")

All graph contributors add work to the same caller-owned `GPUCommandGraph`. The following example assumes that the source columns, packed result vectors, spatial index buffers, and one-row status vectors already exist on the same WebGPU device:

```
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

import {

  GPUGraph,

  GPUGraphBreadthFirstSearch,

  GPUGraphConnectedComponents,

  GPUGraphCoreNumber,

  GPUGraphDegree,

  GPUGraphForceLayout,

  GPUGraphLabelPropagation,

  GPUGraphLocalClusteringCoefficient,

  GPUGraphModularity,

  GPUGraphModularityOptimization,

  GPUGraphPageRank,

  GPUGraphSingleSourceShortestPath,

  GPUGraphSpatialForceLayout,

  GPUGraphTopology

} from '@luma.gl/gpgpu/gpu-graph';



const graph = new GPUGraph({

  vertexCount,

  sourceVertices,

  targetVertices,

  edgeWeights,

  directed: true

});



const topology = new GPUGraphTopology({

  graph,

  forward: {

    offsets: outgoingOffsets,

    neighbors: outgoingNeighbors,

    edgeIds: outgoingEdgeIds,

    edgeWeights: outgoingEdgeWeights,

    count: outgoingCount,

    overflow: outgoingOverflow

  },

  reverse: {

    offsets: incomingOffsets,

    neighbors: incomingNeighbors,

    edgeIds: incomingEdgeIds,

    edgeWeights: incomingEdgeWeights,

    count: incomingCount,

    overflow: incomingOverflow

  },

  invalidEdgeCount

});



const workflow = new GPUCommandGraph(device);



topology.addToGraph(workflow);

new GPUGraphDegree({topology, output: outgoingDegrees}).addToGraph(workflow);

new GPUGraphCoreNumber({

  topology,

  output: coreNumbers,

  iterations: 32,

  converged: coresConverged,

  degeneracy: maximumCoreNumber

}).addToGraph(workflow);

new GPUGraphLocalClusteringCoefficient({

  topology,

  output: clusteringCoefficients,

  triangles: incidentTriangleCounts

}).addToGraph(workflow);

new GPUGraphBreadthFirstSearch({

  topology,

  seeds: selectedVertexIds,

  distances: hopDistances,

  predecessors: pathParents,

  mask: neighborhoodMask,

  direction: 'both',

  maxDepth: 6

}).addToGraph(workflow);

new GPUGraphSingleSourceShortestPath({

  topology,

  sourceVertex: selectedVertex,

  distances: routeCosts,

  predecessors: routeParents,

  maxIterations: 64,

  converged: shortestPathsConverged,

  invalidWeightCount

}).addToGraph(workflow);

new GPUGraphConnectedComponents({

  topology,

  output: componentIds,

  iterations: 32,

  converged: componentsConverged

}).addToGraph(workflow);

new GPUGraphLabelPropagation({

  topology,

  output: communityIds,

  iterations: 32,

  converged: communitiesConverged

}).addToGraph(workflow);

new GPUGraphModularityOptimization({

  topology,

  output: improvedCommunityIds,

  modularity: optimizedModularity,

  initialCommunities: communityIds,

  resolution: 1,

  iterations: 32,

  minimumGain: 0,

  converged: optimizationConverged,

  valid: optimizationValid

}).addToGraph(workflow);

new GPUGraphModularity({

  graph,

  communities: improvedCommunityIds,

  output: modularityScore,

  resolution: 1,

  communityContributions,

  valid: modularityValid

}).addToGraph(workflow);

new GPUGraphPageRank({

  topology,

  output: importanceScores,

  damping: 0.85,

  iterations: 40,

  residual: finalRankChange

}).addToGraph(workflow);

const layout = new GPUGraphForceLayout({

  topology,

  positions: nodePositions,

  velocities: nodeVelocities,

  pinned: pinnedVertices,

  reset: resetRequested,

  iterationsPerFrame: 4

});

new GPUGraphSpatialForceLayout({

  layout,

  gridSize: [32, 32],

  bounds: [-4, -4, 4, 4],

  theta: 0.6,

  nearCellRadius: 1,

  cellOffsets: spatialCellOffsets,

  vertexIds: spatialVertexIds,

  cellCenters: spatialCellCenters,

  count: indexedVertexCount,

  overflow: spatialIndexOverflow

}).addToGraph(workflow);



const compiled = workflow.compile();

const encoder = device.createCommandEncoder({id: 'analyze-network'});

compiled.encode(encoder, {parameters: undefined});

device.submit(encoder.finish());
```

Constructors validate existing metadata; they do not upload graph data, submit commands, or read results. `addToGraph()` declares GPU work, `compile()` resolves the workflow, and the application explicitly encodes and submits it. Re-encoding rebuilds topology and recomputes the declared results from the current source and control buffers while progressively advancing the existing layout positions and velocities. Replace the spatial contributor with `layout.addToGraph(workflow)` when exact all-pairs repulsion is the better fit.

## Ownership, capacity, and failure boundaries[​](#ownership-capacity-and-failure-boundaries "Direct link to Ownership, capacity, and failure boundaries")

* All original source vectors and output vectors are caller-owned. Contributors neither destroy them nor silently repack their existing chunks.
* Writable outputs require physically distinct GPU buffer allocations, including when a `DynamicBuffer` wrapper exposes the same underlying allocation through different views.
* Adjacency capacities and overflow statuses are explicit. Breadth-first search fails closed to unreachable distances, weighted routing publishes `+Infinity` and `0xffffffff` predecessors, weak components, community detection, modularity optimization, and core numbers publish `0xffffffff`, local clustering publishes zero coefficients and optional `0xffffffff` triangle statuses, and PageRank publishes zero scores when a required neighbor list overflowed. Force layout preserves its existing positions and clears velocities on required adjacency overflow.
* Invalid negative or nonfinite edge weights also fail weighted routing closed; optional `invalidWeightCount` reports invalid original source edges without double-counting reverse CSR.
* Partition modularity reads original source edges independently of adjacency overflow; invalid labels, invalid accepted edge weights, or zero total weight publish zero score and validity.
* Modularity optimization additionally requires complete selected adjacency; invalid initial labels, accepted weights, or selected neighbor overflow publish invalid-label sentinels and clear its score, validity, and convergence.
* Spatial layout also preserves positions and clears velocities when its accepted count excludes any out-of-domain vertex or its explicit vertex-ID capacity overflows.
* Degree remains exact under neighbor overflow because its input is the complete CSR offset range.
* Renderable layout positions require both `Buffer.STORAGE` and `Buffer.VERTEX` usage on their original caller-owned allocation; position readback or repacking is never implicit.
* Fixed weighted-routing, component, community, modularity-optimization, core-number, and PageRank iteration budgets do not imply convergence. Their optional status, degeneracy, and final-change outputs remain GPU-resident until an application explicitly requests readback.
* Work uses bounded WebGPU dispatch and portable storage bindings on one device. Original chunk preservation does not imply distributed or multi-GPU execution.
* The optional graph subpath does not supply automatic Arrow import, rendering, graph persistence, negative-weight or all-pairs shortest paths, or a CPU execution fallback.

See [GPU Primitives and Command Graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md) for the underlying scheduling, typed GPU vectors, resource ownership, and explicit submission model.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPU Graph overview](https://luma.gl/next/docs/api-reference/experimental/gpu-graph.md)
* [GPU Graph operations index](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-operations.md)
* [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)
