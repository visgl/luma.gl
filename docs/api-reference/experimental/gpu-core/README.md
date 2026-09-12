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

GPU Core provides one composable vocabulary for GPU work. Applications build a `GPUProgram` by
adding analytical operations, reusable GPU primitives, control flow, or concrete command nodes in the
same ordered program.

```ts
const program = new GPUProgram({id: 'analytics'});

program.add([
  histogram,
  reduction,
  scan,
  customComputeCommand,
  renderCommand
]);
```

Some program items carry high-level intent and transform into several command nodes. Others are
already concrete commands and pass through unchanged. Users do not need to separate those categories
before composing them.

```text
GPUProgram
  ├─ analytics and algorithms
  ├─ reusable primitives
  ├─ control flow
  └─ concrete commands
             ↓ transform()
GPUCommandGraph
             ↓ compile()
CompiledGPUCommandGraph
             ↓ encode()
WebGPU command encoder
```

The useful question for application code is therefore usually **"can I add this to my program?"**,
not which internal representation layer owns it.

## Things you can add

The catalog is organized by capability. Representation level is secondary implementation metadata.

### Analysis and aggregation

- `GPUHistogram` — histogram selected or complete scalar data.
- `GPUReduction` — sum, min, max, mean, extent, and other scalar reductions.
- `GPUGroupAggregation` — dense grouped count/sum/min/max/mean.
- `GPUTopK` — bounded ranking when only the leading rows matter.

### Selection and data movement

- masks and filtering operations
- `GPUScan`
- compaction and gather/scatter primitives
- stable selection/index workflows
- explicit copy commands when a concrete copy is exactly what the program needs

### Sorting, indexing, and joins

- `GPUSort` and batch-preserving sort operations
- hash/index construction primitives
- join and lookup operations

### Numerical and scientific compute

- sparse matrix operations such as SpMV
- FFT and transform operations
- vector and scalar compute primitives
- reusable domain algorithms that retain useful semantic intent

### Spatial, raster, and visualization pipelines

- raster transforms and statistics
- geospatial projection and distance operations
- trace analysis operations
- visibility, culling, and indirect rendering workflows

### Control flow

- GPU conditionals
- bounded loops
- composites that group program items without implying synchronization

### Custom execution

Advanced users can add concrete `GPUCommandNode`s directly:

- compute command nodes
- copy command nodes
- render command nodes

A command node already describes execution work, resources, and hazards, so `transform()` passes it
through instead of wrapping it in a redundant semantic operation.

## Mixed composition

Programs intentionally allow high-level and concrete work to coexist:

```ts
program.add([
  new GPUHistogram({...}),
  new GPUReduction({...}),
  customComputeCommand,
  new GPUGroupAggregation({...}),
  copyCommand
]);
```

This keeps one composition API while allowing each abstraction to live at its natural level.
Algorithms with useful meaning remain operations or reusable primitives. A one-off compute, copy, or
render command does not need a semantic wrapper merely to participate in a program.

The backend transform behaves conceptually as follows:

```text
semantic/reusable operation ──► transform/decompose ──► command node(s)
concrete command node       ───────────────────────────► pass through
```

This is also the migration direction for older `addToGraph()` contributors: preserve reusable
algorithmic primitives, eliminate thin duplicate wrappers, and converge composition on
`GPUProgram.add()`.

## A note on categories

Documentation may label an item as an **operation**, **primitive**, or **command** when that distinction
helps explain optimization or extension behavior, but these labels do not define separate user-facing
API catalogs. All program-addable items are documented alongside related capabilities.

For example, a reduction may be useful both as a directly chosen primitive and as a building block
inside a histogram with an automatic domain. A custom compute command is already concrete. Both can
appear next to each other in a program.

## Transform and execution

`transform()` converts the program into a mutable `GPUCommandGraph`. High-level operations may
expand, specialize, fuse, or otherwise change shape before execution. Concrete command nodes pass
through.

```ts
compiler.transform(program, graph, bindings);
const executable = graph.compile();
```

The command graph remains public for inspection and advanced execution control, but ordinary users
should not need a mirrored command-level version of every algorithm. The execution vocabulary should
stay much smaller than the program vocabulary.

## When to work directly with the command graph

Use `GPUCommandGraph` directly when implementing infrastructure below `GPUProgram`, inspecting
resource hazards and scheduling, integrating execution machinery that cannot yet participate in the
program model, or debugging transformed output.

For application pipelines, prefer `GPUProgram.add()` so analytical operations, primitives, and custom
commands share one composition surface.

## The WebGPU capabilities underneath

A handful of WebGPU capabilities make the architecture practical:

- **Compute shaders and storage buffers** let one program item produce general-purpose GPU data for
  another without returning it to JavaScript.
- **GPU-writable indirect draw and dispatch arguments** let later work consume GPU-produced counts
  without CPU synchronization.
- **Explicit resource uses and command encoding** let the transformed command graph derive hazards,
  compatible transient allocations, and a reusable schedule.

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
    <strong>I want to compose GPU work</strong>
    <ol>
      <li><a href="#things-you-can-add">Things you can add</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/recipes">GPU recipes</a></li>
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
    <span>Advanced / framework</span>
    <strong>I need to inspect execution</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts">Execution model</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/gpu-command-graph">Command graph API</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts#instrumentation-and-autotuning">Instrumentation</a></li>
    </ol>
  </article>
</div>

## Live execution anatomy

The teaching model below exposes intermediate values normally hidden beneath program items. It is
useful for understanding transformed execution, not as a requirement for composing an application.

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

## Internal architecture at a glance

The mixed catalog does not remove the internal distinction between semantic intent and execution.
It simply keeps that distinction out of the primary navigation.

```text
rich program vocabulary
        ↓ transform / optimize
small command-node vocabulary
        ↓ compile / schedule
WebGPU
```

That asymmetry is deliberate: adding new GPU algorithms should usually expand the program catalog
without requiring a matching expansion of command-node types.