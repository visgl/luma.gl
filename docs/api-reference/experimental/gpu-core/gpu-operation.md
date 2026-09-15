import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPU operations and composition

## Overview

`GPUProgram` stores semantic operations. `GPUProgramCompiler` lowers them into explicit command
nodes and the command graph compiles those nodes into executable WebGPU work.

<GPUOperationContract operation="gpu-operation" />

```ts
const program = new GPUProgram({id: 'analysis'});
program.add([operation1, operation2]);
program.add(new GPUCompositeOperation({id: 'solver-step', operations: [spmv, dot, update]}));
const compilation = new GPUProgramCompiler(device).compile(program, bindings);
const executable = compilation.graph.compile();
```

Arrays add sibling operations; composites preserve named hierarchy for inspection. Neither implies
synchronization. Resource hazards and explicit dependencies determine execution order.

A `GPUOperation` declares `id`, `type`, and optional metadata. Its registered backend lowerer resolves
logical resources and emits nodes. `GPUProgramPrimitive` instead exposes
`getCommandNodes(graph): readonly GPUCommandNode[]`. It may declare graph-owned scratch resources,
but must not schedule nodes, encode, submit, or read back data while constructing them.

Existing graph-bound primitives can be scheduled directly with
`graph.add(primitive)`. Program primitives must construct
resources against the graph supplied by the compiler.

`GPUCommandGraphContributor` and its graph-mutation hook have been removed. There is no compatibility
fallback in the program compiler. Experimental domain builders that still mutate graphs must be
migrated before they can be added to a `GPUProgram`.

`GPUConditionalOperation` and `GPULoopOperation` preserve structured control flow. WebGPU lowers GPU
predicates using indirect dispatch and bounded loops using repeated commands; compiler support nodes
remain unconditional.

Execution composites can expose `getNodes()` returning child primitives or nested groups. Both
`graph.add(composite)` and `program.add(composite)` accept this structural contract. The graph
expands execution groups in order; semantic operations still use GPUProgramCompiler lowering.
