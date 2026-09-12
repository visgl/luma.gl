import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUExampleCard} from '@site/src/components/docs/gpu-example-card';
import {GPUCorePipelineTutorial} from '@site/src/components/docs/gpu-core-pipeline-tutorial';

# GPU Core

<GPUCoreDocsTabs active="overview" />

<DocumentationBadges>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="webgpu">WebGPU required</DocumentationBadge>
</DocumentationBadges>

## Overview

GPU Core is luma.gl's experimental semantic GPU programming and execution layer for WebGPU.
Applications normally describe reusable GPU work as operations in a `GPUProgram`; a backend
transform turns that program into a `GPUCommandGraph`, and graph compilation prepares the reusable
execution plan.

```text
GPUProgram
  └─ GPU operations
        ↓ transform()
GPUCommandGraph
  └─ command nodes
        ↓ compile()
CompiledGPUCommandGraph
        ↓ encode()
WebGPU command encoder
```

The operation layer is the primary API. It is where analytical, numerical, selection, and dataflow
intent belongs: histograms, reductions, grouped aggregation, sparse matrix work, sorting, and other
composable GPU operations. The command graph is the lower-level execution representation used for
resource hazards, transient allocation, scheduling, conditions, indirect work, and inspection.

GPU Core does not own command submission or the application frame loop. Intermediate datasets can
remain GPU-resident while the application retains control of synchronization, frame pacing,
readback, cancellation, and publication.

## Start with operations

For new application code, prefer composing a semantic program rather than manually assembling the
passes used to implement an algorithm.

```ts
const program = new GPUProgram({id: 'analytics'});

program.add([
  new GPUHistogram({
    input: values,
    mask: selection,
    output: bins,
    domain: [0, 100]
  }),
  new GPUGroupAggregation({
    keys: categories,
    mask: selection,
    output: categoryCounts,
    operation: 'count'
  })
]);

compiler.transform(program, graph, {
  views: {
    values: valueView,
    selection: selectionMask,
    bins: histogramOutput,
    categories: categoryView,
    categoryCounts: categoryOutput
  }
});

const executable = graph.compile();
```

The exact set of semantic operations is experimental and expanding. The important architectural
contract is stable: **compose operations, transform to commands, compile the command graph**.

## When to use the command graph directly

`GPUCommandGraph` remains public because advanced applications and framework authors need explicit
control over execution. Use it directly when implementing a reusable operation, integrating custom
compute/render/copy work, inspecting hazards, managing indirect dispatch, or building infrastructure
below the semantic operation layer.

Most application documentation should not require choosing between an "operation version" and a
"command version" of every algorithm. Execution helpers are implementation machinery; operation
pages are the primary conceptual reference.

## The WebGPU capabilities underneath

A handful of WebGPU capabilities make the architecture practical:

- **Compute shaders and storage buffers** let one operation produce general-purpose GPU data for the
  next operation without returning it to JavaScript.
- **GPU-writable indirect draw and dispatch arguments** let later work consume GPU-produced counts
  without CPU synchronization.
- **Explicit resource uses and command encoding** let the command graph derive hazards, compatible
  transient allocations, and a reusable schedule.

```text
GPU-resident source data
        ↓
selection and transformation
        ↓
scan, compaction, sorting, aggregation
        ↓
bounded output and indirect commands
        ↓
rendering, picking, or small readback
```

## Choose a learning path

<div className="gpu-core-reading-paths">
  <article className="gpu-core-reading-path">
    <span>Application developer</span>
    <strong>I want to build a GPU pipeline</strong>
    <ol>
      <li>Programs and operations</li>
      <li><a href="/docs/api-reference/experimental/gpu-core/recipes">GPU operation recipes</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-dataframe">GPU Dataframe</a></li>
    </ol>
  </article>
  <article className="gpu-core-reading-path">
    <span>Data visualization</span>
    <strong>I need interactive GPU analytics</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/recipes#aggregate-a-selection">Aggregate a selection</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-dataframe-operations">Dataframe operations</a></li>
      <li>Million-row linked-view showcase</li>
    </ol>
  </article>
  <article className="gpu-core-reading-path">
    <span>Framework author</span>
    <strong>I need execution-level control</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts">Execution model</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/gpu-command-graph">Command graph API</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts#instrumentation-and-autotuning">Instrumentation</a></li>
    </ol>
  </article>
</div>

## Live execution anatomy

The teaching model below exposes intermediate values that production operations normally keep
inside GPU buffers. Use it to understand what the semantic layer eventually transforms into; it is
not the recommended amount of command-level code for ordinary application analytics.

<GPUExampleCard
  demonstrates={['mask', 'scan', 'stable compaction', 'indirect drawing']}
  input="Eight source rows with editable visibility flags"
  gpuOutput="Packed source IDs and one indirect draw record"
  cpuReadback="None"
  execution="Deterministic teaching model; production topology compiles once"
  compatibility="Conceptual model plus WebGPU production APIs"
  fullPageHref="/docs/api-reference/experimental/gpu-core/tutorial"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/website/src/components/docs/gpu-core-pipeline-tutorial.tsx"
  inspectorHref="/docs/api-reference/experimental/gpu-core/concepts#interactive-compiler-anatomy"
/>

<GPUCorePipelineTutorial compact />

## API layers

| Layer | Primary concepts | Typical audience |
| --- | --- | --- |
| Semantic | `GPUProgram`, `GPUOperation`, `GPUHistogram`, `GPUReduction`, `GPUGroupAggregation` | Application and library authors |
| Transform | backend compiler, validation, planning, optimization | Framework and backend authors |
| Execution | `GPUCommandGraph`, `GPUCommandNode`, resource views, conditions | Advanced applications and infrastructure |
| Executable | `CompiledGPUCommandGraph`, encoding, timing, inspection | Frame-loop and runtime integration |

The remainder of the GPU Core reference documents execution primitives where they are useful to
operation implementers. Those primitives are not intended to form a second mirrored application
API.