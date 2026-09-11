# GPU operation lowering

## Why preserve lowering provenance?

The operation IR describes computation semantically while `GPUCommandGraph` describes executable GPU work. One semantic operation may lower into one command node or dozens of nodes, and composite/control-flow operations introduce additional hierarchy.

Jarnevon therefore preserves the relationship instead of discarding it during lowering:

```text
PCG                         semantic operation
└─ iteration                semantic composite
   ├─ SpMV                  semantic operation
   │  └─ spmv-main          compute node
   ├─ dot                   semantic operation
   │  ├─ reduce-stage-0     compute node
   │  ├─ reduce-stage-1     compute node
   │  └─ reduce-final       compute node
   └─ update                semantic operation
      └─ madd               compute node
```

`graph.operationLowering` returns both the semantic operation tree and an immutable list of lowered command nodes with their root-to-leaf operation paths.

## Why this is compiler infrastructure

Without provenance, diagnostics can say that `reduce-stage-1` took time or consumed memory, but cannot explain which algorithm requested it. With provenance the compiler/inspector can aggregate execution information back to semantic intent:

```text
PCG
  SpMV       0.42 ms
  reductions 0.19 ms
  updates    0.08 ms
```

The same mapping is needed by future compiler passes for:

- semantic timing and memory attribution;
- selected-strategy explanations;
- generated WGSL navigation;
- control-flow lowering;
- fusion diagnostics;
- Ploor planning/execution boundaries.

## Dynamic control-flow boundary

A semantic GPU predicate is not itself a WebGPU command. A dynamic conditional or loop body can contain operations that lower into dispatches with different true workgroup dimensions.

```text
semantic predicate: active
        │
        ├─ SpMV      true dispatch = [4096,1,1]
        ├─ reduction true dispatch = [ 256,1,1]
        └─ scalar    true dispatch = [   1,1,1]
```

WebGPU conditional compute is realized with GPU-written indirect dispatch arguments. A false predicate writes a zero workgroup dimension; a true predicate must preserve the concrete dispatch dimensions of that particular command node.

Operation-aware lowering therefore needs both pieces of information:

1. which semantic predicate applies to a lowered node;
2. what concrete dispatch geometry that node requires.

This PR establishes (1) through semantic provenance. Capturing/rewriting concrete dispatch geometry for dynamic GPU control is a subsequent lowering capability rather than pretending one generic gate can condition an arbitrary composite.

## Compatibility

Existing contributors and direct `addComputePass()`, `addRenderPass()`, and `addCopyPass()` calls continue to work. Nodes emitted outside `graph.add(operation)` have no semantic operation ancestry and therefore do not appear in the operation-lowering node map.

The initial implementation instruments pass addition additively while the operation API remains experimental. Once the design stabilizes, provenance recording should move into the native `GPUCommandGraph` node-insertion path without changing the public operation model.
