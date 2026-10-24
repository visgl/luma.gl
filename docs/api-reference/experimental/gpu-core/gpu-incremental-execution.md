# GPUIncrementalExecution

[Command Graph](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-command-graph.md)[Incremental Execution](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-incremental-execution.md)[Texture History](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-texture-history.md)[Readback Ring](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/docs/api-reference/experimental/gpu-core/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUIncrementalExecution` caches GPU-resident partial results for explicitly versioned batches. It composes existing graph operations through two callbacks: compute a partial for one batch, then merge the ordered live partials into caller-owned outputs. Source `GPUData` and `GPUVector` storage remains borrowed, with no implicit concatenation, upload, or readback.

The [GPU Data Analysis example](https://luma.gl/examples/experimental/gpu-data-analysis) includes a live streaming panel with fixed-bin histograms, a sum, grouped counts, and stable unsigned Top-K. Its counters show computed/reused/removed batches, submitted batch and merge commands, and persistent cache bytes.

## At a glance

| Question                 | Answer                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Problem**              | Update analytical results over changing batches without repeating unchanged source work.                  |
| **Reads / writes**       | Batch graphs read borrowed inputs and write cached partials; the merge writes caller-owned outputs.       |
| **Ownership**            | The executor owns cached partial buffers and temporary graphs; sources and final outputs remain borrowed. |
| **Output contract**      | GPU-resident analytical results plus computed, reused, removed, command, and cache-byte counters.         |
| **Expected work**        | Only new or invalidated batches execute; each changed snapshot merges all live partials.                  |
| **Chunks**               | Preserves source batches and their chunk topology; only explicit derived candidates may be staged.        |
| **Conditions / budgets** | update() owns submission and commits its cache only after successful synchronous submission.              |
| **Neighborhood**         | versioned batches → batch-local graph operations → cached partials → live merge.                          |

**Cost**Persistent storage scales with live partials; merge cost scales with live partial count.

**Common mistake**Bump revisions for buffer writes and shared parameter changes; byte mutations are not inferred.

## Usage: streaming sum[​](#usage-streaming-sum "Direct link to Usage: streaming sum")

```
import {GPUIncrementalExecution, GPUReduction} from '@luma.gl/gpgpu/gpu-core';

import type {GPUData, GPUVectorLike} from '@luma.gl/gpgpu/gpu-data';



// output is a caller-owned one-row GPUData<'uint32'>.

const execution = new GPUIncrementalExecution<GPUVectorLike<'uint32'>, GPUData<'uint32'>>(

  device,

  {

    createPartial: (batch, {graph, createData}) => {

      const sum = createData('uint32', 1);

      graph.add(new GPUReduction({

        input: graph.importGPUVector('input', batch),

        output: graph.importGPUData('partial', sum),

        operation: 'sum'

      }));

      return sum;

    },

    merge: (partials, graph) => {

      graph.add(new GPUReduction({

        input: graph.importGPUVector('partials', {

          format: 'uint32',

          length: partials.length,

          data: partials

        }),

        output: graph.importGPUData('output', output),

        operation: 'sum'

      }));

    }

  }

);



const first = {id: 'batch-0', revision: 0, data: firstVector};

const second = {id: 'batch-1', revision: 0, data: secondVector};

execution.update([first]);

const append = execution.update([first, second]);

// append.computedBatchIds = ['batch-1']; append.reusedBatchIds = ['batch-0'].

const unchanged = execution.update([first, second]);

// unchanged.submitted = false; both node counts are zero.

execution.update([second]); // Re-merge cached batch-1; no source batches execute.

execution.destroy(); // Releases cached partials, never source vectors or output.
```

## Change tracking and invalidation[​](#change-tracking-and-invalidation "Direct link to Change tracking and invalidation")

`update(batches, revision = 0)` accepts a **complete ordered snapshot**, not a list of deltas. Each entry contains a unique string `id`, a nonnegative safe-integer `revision`, and `data`. Revisions are equality tokens; increasing them is a convenient application convention.

| Change                                         | Batch work                                        | Merge work                               |
| ---------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Initial snapshot, including empty              | Every batch                                       | Publish result, including empty identity |
| Append a new ID                                | New batch only                                    | All live cached partials                 |
| Change a batch revision or its `data` identity | Changed batch only                                | All live cached partials                 |
| Omit an ID                                     | None for surviving batches; free removed partials | All remaining partials                   |
| Reorder IDs                                    | None                                              | Merge in new order                       |
| Identical ordered snapshot                     | None                                              | None; no submission                      |
| Change the update-level revision               | Every live batch                                  | All new partials                         |

**Input byte changes are explicit.** After writing a borrowed buffer, changing a mask, changing chunk topology inside an existing vector, or replacing a dynamic buffer's physical storage, bump that batch's revision. If a shared parameter changes the meaning of all partials, bump the update-level revision. A new wrapper identity conservatively invalidates the batch even when its revision is unchanged. Never use batch position as a stable source-row identity.

Callbacks must be deterministic for their declared batch and query revision. A batch callback must not depend on other batches, the snapshot position, or unversioned mutable state. Split independent views into separate executors to avoid invalidating unrelated statistics when only one parameter changes. The example deliberately uses one composite query and invalidates all its partials when histogram domain changes.

## Supported decompositions and broader recomputation[​](#supported-decompositions-and-broader-recomputation "Direct link to Supported decompositions and broader recomputation")

This is an explicit composition API. It does not automatically incrementalize arbitrary `GPUProgram` operations or dataframe queries.

| Operation                                                              | Reusable partial                                                | Merge and invalidation rule                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sum                                                                    | One batch sum                                                   | Reduce live sums; floating-point rounding can differ from a full reduction            |
| Fixed-domain or fixed-edge histogram                                   | One counts vector per batch                                     | Elementwise sum; domain, edge, or predicate changes invalidate affected partials      |
| Dense grouped count or sum                                             | One vector per batch using the same group dictionary            | Elementwise sum; dictionary/predicate changes invalidate affected partials            |
| Mean                                                                   | Sum **and valid count**, never a batch mean alone               | Sum numerators/counts, then divide; masks and non-finite-value rules must match       |
| Minimum, maximum, extent                                               | Extrema **and validity**                                        | Ignore empty/invalid partials; existing final zero sentinels are not merge identities |
| Top-K                                                                  | Up to K ordered candidates with stable row identities per batch | Select global K from the live candidates; preserve batch/row order to break ties      |
| Automatic-domain histogram                                             | Global extent plus counts under that domain                     | A changed extent invalidates every histogram partial                                  |
| Global scan, rank, complete sort, cross-batch joins, iterative solvers | Operation-specific state                                        | Require broader recomputation or a separate incremental algorithm                     |

The shipped live composition exercises unsigned sum, fixed-domain histogram, dense grouped count, and descending unsigned Top-K through existing `GPUReduction`, `GPUHistogram`, `GPUGroupAggregation`, `GPUElementwise`, and `GPUSort`. Mean, validity-aware extrema, floating/null Top-K, and automatic dataframe-query decomposition remain follow-up integrations, not implied capabilities of that example.

Top-K sorts each changed source batch and retains only `min(K, batch.length)` candidates. The final merge sorts at most `batchCount * K` candidates. It may stage those small derived arrays in graph-owned scratch; it never concatenates source batches. Removing a winning batch recomputes the global result from surviving candidates without revisiting their original rows. K, direction, or comparison semantics changes require invalidation and appropriately sized outputs.

For dense grouped sums with floating contributions, use the existing primitive's finite-value semantics. Unsigned sums and histogram/group counts retain uint32 overflow semantics. Cache contents are GPU results, not a mechanism for correcting numeric overflow.

## Lifecycle, failures, and instrumentation[​](#lifecycle-failures-and-instrumentation "Direct link to Lifecycle, failures, and instrumentation")

* `createPartial(data, context)` records commands into `context.graph` and returns any typed partial description. `context.createData(format, length)` allocates executor-owned persistent scalar storage, distinct from graph-owned transient scratch. Supported formats are `uint32`, `sint32`, and `float32`; each allocation must fit the device storage-binding limit.
* `merge(partials, graph)` receives partials in snapshot order. It must publish a complete result and handle an empty array. Final outputs belong to the application and must remain alive.
* `update()` builds and encodes changed batches followed by the merge, and **owns their submission**. It marks the snapshot valid only after successful submission; there is no abandoned-encoder cache state. Rendering submitted afterward can read the outputs on the same device queue.
* Synchronous callback, compilation, encoding, or submission failures destroy new allocations and leave the last committed cache retryable. Callback side effects outside graph recording are the application's responsibility. Asynchronous WebGPU validation errors or device loss require recreating the executor; submission success is not GPU-completion confirmation.
* Partial buffers are retained until replacement, removal, or `destroy()`. Compiled graphs and transient scratch are released after submission. Source buffers remain caller-owned throughout. Source changes and queue writes must precede `update()` on the same device.
* Returned frozen statistics include `computedBatchIds`, `reusedBatchIds`, `removedBatchIds`, `invalidation`, `batchNodeCount`, `mergeNodeCount`, `cachedByteLength`, and `submitted`. Node counts come from actual graph encoding; they include compute and copy commands, not GPU timing measurements. Cache bytes count persistent allocations, including minimum empty-buffer capacity; they exclude borrowed sources, final outputs, and temporary merge scratch.

The cache retains every live batch partial. Bound memory by removing old batches, as the example's six-batch rolling window does. The current merge rebuilds and reads all live partials after a change: it avoids unchanged **source** work, but does not promise O(1) total append cost. Hierarchical merge caches, automatic eviction, asynchronous compilation, and incremental query planning remain future optimizations.
