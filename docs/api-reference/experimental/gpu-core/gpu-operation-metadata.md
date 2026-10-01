# GPU operation metadata

## Overview[​](#overview "Direct link to Overview")

Operation metadata describes logical inputs, outputs, workload, and constraints without prescribing a backend execution strategy.

## At a glance

| Question                 | Answer                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Problem**              | Expose logical workload and constraints without decoding shaders or bindings.        |
| **Reads / writes**       | Names logical inputs and outputs rather than concrete graph buffer uses.             |
| **Ownership**            | Metadata is immutable descriptive state owned by its operation.                      |
| **Output contract**      | Planner-readable input, output, workload, and constraint records.                    |
| **Expected work**        | Reports problem size while leaving command counts and dispatch geometry to lowering. |
| **Chunks**               | Shape metadata describes logical data; physical chunk handling remains explicit.     |
| **Conditions / budgets** | Consumed during planning and inspection, with no GPU work of its own.                |
| **Neighborhood**         | GPUOperation metadata → planner decisions → backend lowering report.                 |

**Cost**Small CPU-side records retained for diagnostics and planning.

**Common mistake**Do not encode a selected workgroup shape as backend-independent workload metadata.

## Why operations need metadata[​](#why-operations-need-metadata "Direct link to Why operations need metadata")

`GPUOperation` preserves semantic computation above `GPUCommandGraph` command nodes. Identity and hierarchy are enough to display a program tree, but a planner needs a little more information to reason about the computation without decoding WGSL or bindings.

Operation metadata answers four questions:

```
inputs       what logical data does this operation consume?

outputs      what logical data does it produce?

workload     how large is the mathematical problem?

constraints  what must a legal realization support?
```

Metadata deliberately does **not** answer how the operation executes. Workgroup size, subgroup mapping, dispatch count and selected kernels belong to strategy/lowering rather than semantic intent.

## Example: sparse matrix-vector multiply[​](#example-sparse-matrix-vector-multiply "Direct link to Example: sparse matrix-vector multiply")

An adaptive SpMV operation can eventually describe itself as:

```
metadata: {

  inputs: [

    {name: 'matrix', kind: 'csr-matrix', format: 'float32', shape: [rows, columns]},

    {name: 'vector', kind: 'vector', format: 'float32', shape: [columns]}

  ],

  outputs: [

    {name: 'result', kind: 'vector', format: 'float32', shape: [rows]}

  ],

  workload: {

    rows,

    columns,

    nonZeros

  },

  constraints: {

    backend: 'webgpu'

  }

}
```

The same semantic metadata remains valid whether lowering selects scalar-row, subgroup-row, workgroup-row or long-row execution.

## Metadata versus graph resources[​](#metadata-versus-graph-resources "Direct link to Metadata versus graph resources")

Semantic resources and command-graph resource uses are related but intentionally different.

```
Operation IR                         Command graph



matrix: CSR<float32>                 storage buffer reads

vector: float32[N]        lower      storage buffer read

result: float32[M]        ─────→     storage buffer write

rows / nnz                          dispatch dimensions
```

The left side is suitable for planners, inspectors and higher-level algorithms. The right side is precise enough for WebGPU hazard tracking and encoding.

Metadata does not replace `GraphDataView`, `GraphBufferHandle`, or node resource declarations.

## Workload is not strategy[​](#workload-is-not-strategy "Direct link to Workload is not strategy")

This distinction is central:

```
workload: {rows: 1_000_000, nonZeros: 5_000_000}
```

is semantic information.

```
strategy: subgroup-row

workgroupSize: 256

dispatchCount: 3907
```

is an execution decision.

Keeping those separate allows the same operation IR to be replanned for different devices without reconstructing the mathematical program.

## Constraints[​](#constraints "Direct link to Constraints")

Constraints describe requirements rather than preferences. Examples may eventually include:

* required backend capabilities;
* supported value formats;
* numerical requirements;
* dimensional or layout invariants.

They should remain sparse. Device-specific optimization preferences belong to strategy selection.

## Composite metadata[​](#composite-metadata "Direct link to Composite metadata")

`GPUCompositeOperation` may carry metadata for the composite as a whole while preserving child metadata:

```
PCG

  input: A, b

  output: x

  workload: unknowns=N, nnz=K



  ├─ SpMV

  ├─ reduction

  ├─ vector updates

  └─ Jacobi
```

This gives an inspector both algorithm-level meaning and operation-level detail.

## Direction[​](#direction "Direct link to Direction")

The intended layering is:

```
GPUOperation

  semantic identity

  semantic metadata

       ↓

planner / strategy selection

       ↓

lowering

       ↓

GPUCommandGraph nodes

       ↓

WebGPU
```

This PR intentionally adds no strategy API, cost model, fusion system, or control-flow semantics. Those features should consume the metadata contract rather than expand it preemptively.
