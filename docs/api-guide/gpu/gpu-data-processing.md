import {GpuGuideDocsTabs} from '@site/src/components/docs/gpu-guide-docs-tabs';

# Choosing a GPU Data-Processing API

<GpuGuideDocsTabs group="execution" active="data-processing" />

luma.gl offers several ways to transform data on the GPU. The right starting point depends mainly
on whether your application must run on WebGL, how much control it needs over command submission,
and whether the computation is a single transformation or a reusable multi-pass workflow.

## Which API Should I Use?

| Start with | Use it when |
| --- | --- |
| [`@luma.gl/gpgpu`](/docs/api-reference/gpgpu) | You want portable, composable data operations that run on CPU, WebGL, or WebGPU. |
| [`GPUCommandGraph`](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph) | You are building a WebGPU-only, multi-pass workflow and need explicit control over resources, command encoding, and temporary memory. |
| [`Computation`](/docs/api-reference/engine/compute/computation) | You want to write and dispatch one custom WebGPU compute shader directly. |
| [`BufferTransform`](/docs/api-reference/engine/compute/buffer-transform) | You want to write a custom WebGL transform-feedback operation directly. |

For most portable buffer transformations, begin with GPGPU evaluators. Move to a command graph
when the workflow itself—not just an individual operation—needs WebGPU scheduling and resource
management.

## GPGPU Evaluators

The `@luma.gl/gpgpu` module presents computation as lazy values. Operations such as `add()`,
`gather()`, and `interleave()` return a `GPUDataEvaluator`; no work runs until the result is
evaluated.

```ts
import {add, multiply} from '@luma.gl/gpgpu';

const adjusted = add(multiply(sourceData, 2), 1);
const result = await adjusted.evaluate(device);
```

The same expression can use the CPU, WebGL, or WebGPU backend selected for the evaluation device.
GPGPU allocates packed output storage automatically and is a good fit when the application thinks
in terms of input and output values rather than passes and intermediate resources.

Portable evaluator operations have CPU, WebGL, and WebGPU handlers. APIs exported only from a
backend-specific entry point, such as a WebGPU-only helper, do not carry that portability guarantee.

## GPUCommandGraph

`GPUCommandGraph` presents computation as a reusable WebGPU command workflow. The application
declares logical buffers and textures, adds compute, render, and copy nodes, then compiles the graph.
The compiled graph can be encoded repeatedly with new parameters or compatible imported resources.

The graph is useful when an application needs to:

- combine several compute, copy, and render passes in one command stream;
- order reads and writes to shared resources safely;
- reuse temporary buffers and textures whose lifetimes do not overlap;
- run vector-wide algorithms such as scan, compaction, reduction, histogram, or grid binning; or
- control when the command encoder is finished and submitted.

The command graph deliberately remains WebGPU-only. Its compute passes, storage resources, texture
hazards, and explicit command encoding do not map directly to WebGL transform feedback or CPU
execution.

## Comparing the APIs

| Concern | GPGPU evaluators | `GPUCommandGraph` |
| --- | --- | --- |
| Backend support | CPU, WebGL, and WebGPU | WebGPU only |
| Programming model | Functional operations that produce lazy values | Explicit resources and compute, render, or copy nodes |
| Execution | `await evaluator.evaluate(device)` | `compile()`, then encode into a caller-owned command encoder |
| Submission | Managed by the selected backend | Controlled by the application |
| Reuse | Materialized results are cached | A compiled workflow can be encoded repeatedly |
| Temporary memory | Output buffers come from a reusable pool | Graph compilation aliases compatible transients with non-overlapping lifetimes |
| Ordering | Follows evaluator dependencies | Uses explicit dependencies and conflicting resource accesses |
| Outputs | Packed storage is allocated automatically | Outputs are imported caller-owned resources or graph-owned transients |
| Data model | `GPUData`, `GPUDataView`, and chunk-preserving `GPUVectorEvaluator` | Graph handles plus typed data and vector views |
| Chunk behavior | Vector mapping normally transforms each chunk independently | Selected primitives treat all chunks as one logical sequence |
| Operation strengths | Arithmetic, expressions, gather, select, swizzle, and row transforms | Scan, compaction, sort, reduction, histogram, grid binning, rendering, and copies |

Neither API is intended to replace the other. GPGPU provides a convenient portable vocabulary for
computed values. The command graph manages a complete WebGPU execution and its physical resources.

## Using Them Together Today

The two APIs exchange caller-owned table resources without repacking them. A materialized GPGPU
result is a `GPUVector`, which can be imported into a command graph:

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';

const evaluatedVector = await adjusted.evaluate(webgpuDevice);

const graph = new GPUCommandGraph(webgpuDevice);
const graphInput = graph.importGPUVector('adjusted', evaluatedVector);
```

In the other direction, allocate a `GPUData` or `GPUVector`, import it as a graph output, submit the
encoded graph, and then pass the same caller-owned data to a GPGPU operation. Both systems borrow
imported storage; ownership stays with the caller.

This boundary has several current limitations:

- GPGPU evaluation and command-graph encoding remain separate execution steps.
- Submit graph work before evaluating a GPGPU expression that consumes its output.
- Graph-owned transient allocations cannot escape the graph. Use an imported caller-owned output
  for data that another system must consume.
- `GPUCommandGraph.importGPUVector()` currently accepts fixed-width, non-interleaved vectors.
- There is no automatic lowering from an evaluator expression into command-graph nodes.

## Integration Direction

A useful future integration would preserve GPGPU as the portable, value-oriented API while allowing
its evaluator expressions to use `GPUCommandGraph` as an optimized WebGPU execution target. On
WebGL and CPU devices, the same expressions would continue using their existing backends.

Such an integration would:

- share `GPUDataView` layout metadata between evaluators and graph resources;
- let WebGPU operation implementations encode work without submitting each operation separately;
- lower one evaluator dependency graph into command-graph nodes and transients;
- keep independently mapped chunks distinct from vector-wide algorithms; and
- expose graph primitives as portable GPGPU operations only when equivalent CPU and WebGL
  implementations exist.

This describes an architectural direction, not a currently available API. Applications should use
the explicit resource boundary described above today.

## Related Pages

- [GPGPU overview](/docs/api-reference/gpgpu)
- [GPGPU operations](/docs/api-reference/gpgpu/operations)
- [GPU evaluators](/docs/api-reference/gpgpu/gpu-data-evaluator)
- [GPUCommandGraph](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph)
- [GPU tables](/docs/api-guide/gpu/gpu-tables)
- [Issuing GPU commands](/docs/api-guide/gpu/gpu-commands)
