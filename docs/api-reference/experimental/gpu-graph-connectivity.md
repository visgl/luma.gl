---
title: GPU Graph connectivity and communities
description: Connected components, label propagation, modularity optimization, and community scoring.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU Graph connectivity and communities

<ExperimentalDocsTabs active="gpu-graph-connectivity" />

## Find disconnected groups with GPUGraphConnectedComponents

**Question: Which vertices belong to the same connected island if edge direction is ignored?**

`GPUGraphConnectedComponents` identifies vertices connected by any path when edge direction is
ignored. Use it to separate disconnected social networks, collect related transaction accounts,
find infrastructure islands, or detect independent dependency groups.

For example, two transfers `Ana -> Bo` and `Bo -> Cy` put all three accounts in the same group,
even though Cy has no outgoing transfer. An unrelated transfer `Dee -> Eli` forms a different
group. Choose weak components when group membership matters, not the distance from a selected
account or the direction in which influence flows.

```ts
import {GPUGraphConnectedComponents} from '@luma.gl/gpgpu/gpu-graph';

const components = new GPUGraphConnectedComponents({
  topology,
  output: componentIds,
  iterations: 32,
  converged: componentsConverged
});
```

Once propagation converges, every vertex in a weakly connected component receives that group's
lowest stable vertex identifier; an isolated vertex labels itself. Directed edges connect both
endpoints, so reverse adjacency is unnecessary.

The caller chooses a bounded iteration budget. The optional one-row `uint32` `converged` result is
one only when the final iteration reaches a fixed point; zero means convergence was not established
or the required adjacency overflowed. A connected component answers whether entities connect at
all; it does not claim to discover densely connected communities within one connected network.

## Discover densely connected communities with GPUGraphLabelPropagation

**Question: Which vertices form closely connected communities inside a network that is otherwise
connected?**

`GPUGraphLabelPropagation` groups vertices by the labels most common in their immediate
neighborhood. Use it to reveal circles of friends within a social network, identify related
transaction accounts within a larger fraud investigation, separate service ownership groups inside
a connected dependency graph, or color locally cohesive regions of a citation network.

A connected component answers whether any path links two vertices. Community detection asks a
different question: are these vertices more strongly connected to one another than to the rest of
the same network? Imagine two teams whose members interact frequently within their own team but
share only one relationship across teams. That single bridge makes the whole network one weakly
connected component, while label propagation can still give each team a different community label.
Use weak components to find disconnected islands; use community labels to inspect local structure
within an island.

```ts
import {GPUGraphLabelPropagation} from '@luma.gl/gpgpu/gpu-graph';

const communities = new GPUGraphLabelPropagation({
  topology,
  output: communityIds,
  iterations: 32,
  converged: communitiesConverged
});
```

Every vertex begins with its stable vertex identifier as its label. Each synchronous round reads
the preceding round's complete label snapshot and selects the most frequent label among one self
vote and all incoming or outgoing neighbor occurrences. Equal vote counts choose the numerically
lowest label, so the result does not depend on unspecified adjacency ordering. Self-loops add no
extra self votes; duplicate edges and reciprocal directed edges vote independently. Existing edge
weights are preserved by topology but ignored by this unweighted majority vote.

Directed graphs require both forward and reverse adjacency to include every weak neighbor.
Undirected graphs reuse symmetric forward adjacency without reverse CSR. `output` is a
caller-owned, packed `GPUVector<'uint32'>` containing exactly one community label per vertex;
the optional `converged` output is a separate, caller-owned one-row `GPUVector<'uint32'>`.
Neither allocation may physically alias graph inputs, adjacency storage, or another writable
output.

The default is `32` synchronous rounds; applications can explicitly choose an integer from `1`
through `1024`. Every declared round is encoded without CPU synchronization, automatic readback,
or early termination. `converged` becomes one only when the final round changes no labels; zero
means that the chosen budget did not establish a fixed point. Some graphs can oscillate between
label assignments, so a bounded round count never guarantees convergence. An empty graph reports
convergence, and an isolated vertex retains its own identifier.

If required forward or reverse adjacency overflows, all output labels become `0xffffffff` and
`converged` becomes zero rather than publishing partial communities. The worst-case work is
`O(sum(degree²))` per round because counting support for each candidate can rescan a vertex's
neighborhood; a high-degree hub can therefore be disproportionately expensive. This deterministic
label-propagation heuristic is not Louvain or Leiden, does not optimize modularity, and does not
guarantee objectively correct communities or a particular clustering quality.

## Improve weighted community partitions with GPUGraphModularityOptimization

**Question: Which actual community reassignment improves a network's measurable partition quality,
rather than merely winning a neighborhood vote?**

`GPUGraphModularityOptimization` improves an existing or automatically initialized community
partition by accepting the best strictly beneficial single-vertex move in each bounded round.
Use it when a social grouping should reflect actual interaction strength, a proposed fraud ring
should concentrate transaction weight, ownership boundaries should better match weighted service
dependencies, or a knowledge-graph partition needs an objective comparison before and after
refinement.

Three community questions are related but distinct. `GPUGraphLabelPropagation` cheaply proposes
groups from unweighted neighborhood votes without optimizing their quality;
`GPUGraphModularity` scores any caller-provided partition without changing it; and
`GPUGraphModularityOptimization` actually changes group assignments when the same weighted
modularity objective improves. Start from separate communities when discovering structure, or
provide `initialCommunities` to refine labels supplied by a heuristic, application, or prior
analysis. The caller receives both the improved labels and the score of that exact final
partition.

```ts
import {GPUGraphModularityOptimization} from '@luma.gl/gpgpu/gpu-graph';

const optimizedCommunities = new GPUGraphModularityOptimization({
  topology,
  output: improvedCommunityIds,
  modularity: optimizedModularity,
  initialCommunities: proposedCommunityIds,
  resolution: 1,
  iterations: 32,
  minimumGain: 0,
  converged: optimizationConverged,
  valid: optimizationValid
});

optimizedCommunities.addToGraph(workflow);
```

`output` is a caller-owned, packed `GPUVector<'uint32'>` with exactly one community identifier per
vertex. The optional `initialCommunities` is a separate caller-owned, packed `uint32` vector with
the same number of rows; without it, every vertex initially belongs to its own stable-identifier
community. `modularity` is a separate caller-owned one-row `GPUVector<'float32'>` containing the
real final weighted partition score. The optional `converged` and `valid` results are physically
distinct caller-owned one-row `GPUVector<'uint32'>` status vectors.

The objective is the same Newman modularity used by `GPUGraphModularity`. Directed graphs use
`Q = Σc [Lc / W - γ × Kout,c × Kin,c / W²]`; undirected graphs use
`Q = Σc [Lc / W - γ × (Kc / (2W))²]`. For every eligible vertex, the contributor considers
neighboring communities and the lowest genuinely unused stable community identifier. Occupancy
counts every vertex, including zero-degree isolates, so an occupied zero-volume community is never
mistaken for an empty one. This singleton candidate lets an over-merged warm start split even when
its only relationships are self-loops: two equally weighted self-loops with initial labels
`[0, 0]` can become `[1, 0]`, improving modularity from zero to `0.5`.

For each candidate, the contributor evaluates
`ΔQ = Q(partition after moving the vertex) - Q(current partition)`. It accepts exactly **one**
globally best move per round, and only when `ΔQ` is strictly positive and strictly greater than
`minimumGain`. Tied gains choose the lowest stable vertex identifier, followed by the lowest
candidate community identifier. Evaluating an immutable prior partition and applying only one move
avoids simultaneous conflicting moves and never intentionally accepts a modularity regression.

This tie-breaking policy is deterministic for a fixed snapshot of computed `float32` gains.
However, weighted degrees and community volumes use unordered atomic additions, and floating-point
addition is not associative. Low-order rounding can therefore differ across GPU execution orders or
adapters. Near-tied gains, strict `minimumGain` decisions, selected community labels, and final
modularity scores may consequently vary across runs or devices; weighted partitions are not
guaranteed to be identical.

`iterations` defaults to `32` and may be any integer from `0` through `1024`.
`minimumGain` defaults to zero and must be a finite, nonnegative value representable as `float32`.
`resolution` defaults to one and follows the same finite, nonnegative `float32` contract as the
standalone modularity scorer. Zero rounds preserve the caller's initial partition or the identity
assignment, publish its real modularity, and report convergence zero for a valid nonempty graph.
If a completed round finds no admissible positive-gain move, `converged` becomes one. If the
iteration budget ends immediately after an improving move, convergence remains zero: a bounded
improvement is not evidence that a local optimum has been reached.
A local fixed point is not necessarily the globally best partition.

Directed graphs require both forward and reverse CSR; undirected graphs reuse symmetric forward
CSR. Original nonnegative `float32` edge weights are preserved, and missing weights mean one.
Parallel source edges, reciprocal directed edges, and self-loops retain exactly the same weighted
multiplicity and degree-volume conventions as `GPUGraphModularity`. Out-of-domain source endpoints
are ignored together with their weights; an invalid warm-start label, negative or nonfinite
accepted edge weight, zero valid total edge weight, floating-point accumulation overflow, or
overflow in required adjacency fails closed. Every output label then becomes `0xffffffff`, the
modularity score becomes zero, and optional validity and convergence become zero. An empty graph
has no label rows, score zero, validity zero, and convergence one if adjacency did not overflow.

The contributor encodes all bounded candidate evaluation, stable tie-broken winner selection, label
updates, and final `GPUGraphModularity` scoring into the caller-owned GPU command graph. It does
not submit work, read results back, or synchronize with the CPU. Worst-case work for `K` rounds is
`O(K × (V + E + sum(degree²)))`, with separate `O(V + E)` initialization and final scoring and
`O(V + E)` graph-owned packed scratch; linear per-round community occupancy and vacancy checks are
included in that bound. High-degree hubs and large round budgets require explicit measurement.
This is **single-level Louvain-style local moving**, not the complete multilevel
Louvain algorithm, Leiden refinement, community coarsening, hierarchical aggregation, a global
optimality guarantee, or a seventh Graphalytics workload.

## Evaluate community quality with GPUGraphModularity

**Question: Does an existing community grouping keep more relationship weight inside its groups
than a degree-matched random network would predict?**

`GPUGraphModularity` scores a partition that the application already owns; it does not create or
improve that partition. Use it to compare rival social-network groupings, check whether a detected
fraud ring concentrates transaction weight, evaluate whether service ownership labels follow real
dependency structure, or monitor whether an evolving document grouping is more meaningful than
chance. Feed it labels from `GPUGraphLabelPropagation`, `GPUGraphModularityOptimization`, an
external clustering method, or any other caller-owned assignment.

A high positive score means the specified partition keeps more relationship weight within its
groups than the corresponding degree-preserving random baseline predicts; a score near zero
suggests little advantage over that baseline. A negative score means the partition keeps less
internal weight than expected. Scores depend on the graph and resolution parameter: they are not
universal quality percentages or proof that one partition is objectively correct.

```ts
import {GPUGraphModularity} from '@luma.gl/gpgpu/gpu-graph';

const partitionQuality = new GPUGraphModularity({
  graph,
  communities: communityIds,
  output: modularityScore,
  resolution: 1,
  communityContributions,
  valid: modularityValid
});

partitionQuality.addToGraph(workflow);
```

`communities` is a caller-owned, packed `GPUVector<'uint32'>` containing exactly one stable
community identifier per vertex. Every label must be in the range from zero through
`vertexCount - 1`. `output` is a separate caller-owned, packed one-row `GPUVector<'float32'>`.
The optional `communityContributions` result has one `float32` row per possible community label;
unused identifiers receive zero. The optional one-row `GPUVector<'uint32'>` `valid` distinguishes
a successfully evaluated partition from a zeroed failure result. Outputs may not physically alias
the graph's original buffers, community labels, or one another.

Let `W` be the total weight of all valid-endpoint original source edges and let `Lc` be the
internal original edge weight for community `c`. A missing weight column gives every edge weight
one. Directed graphs use the weighted directed modularity formula
`Q = Σc [Lc / W - γ × Kout,c × Kin,c / W²]`, where `Kout,c` and `Kin,c` are that community's
outgoing and incoming weighted volumes. Undirected graphs use
`Q = Σc [Lc / W - γ × (Kc / (2W))²]`, where `Kc` is the community's weighted degree volume. An
undirected self-loop contributes once to `W` and `Lc` but twice to `Kc`. Parallel source edges
and reciprocal directed source edges retain their original multiplicity; modularity deliberately
does not apply the simple-graph deduplication used by core numbers.

`resolution`, written `γ` above, defaults to one and must be a finite, nonnegative value that
remains finite as `float32`; it adjusts the degree-matched expectation without changing the input
partition. An invalid community identifier, a negative or nonfinite weight on an edge with valid
endpoints, an empty graph, total valid edge weight of zero, or floating-point accumulation
overflow publishes score zero, zero per-community contributions, and optional `valid` zero.
Edges with invalid endpoints are excluded entirely, including their weights. Existing source edge
batches remain separate, ordered, and borrowed; the operation reads them directly without
constructing or requiring forward or reverse CSR.

Weighted contributions, community volumes, and the final score use ordinary GPU `float32`
arithmetic; concurrent atomic accumulation can make the final low-order rounding vary across
execution orders or devices. Work is bounded by `O(V + E)`, with `O(V)` graph-owned community
volume scratch and bounded reduction storage. This contributor measures a supplied partition; it
is **not** Louvain, Leiden, automatic community optimization, hierarchical coarsening, or a
guarantee that label propagation converged.

## Related pages

- [GPU Graph overview](/docs/api-reference/experimental/gpu-graph)
- [GPU Graph operations index](/docs/api-reference/experimental/gpu-graph-operations)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
