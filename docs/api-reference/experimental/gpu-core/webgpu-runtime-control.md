# WebGPU runtime control-flow lowering

## Overview[​](#overview "Direct link to Overview")

WebGPU has indirect compute dispatch but no executable graph loop or device-side command launch. Jarnevon therefore lowers semantic runtime control flow into a bounded command sequence whose individual compute dispatches are enabled or disabled entirely on the GPU.

## At a glance

| Question                 | Answer                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **Problem**              | Execute bounded semantic predicates without CPU readback on WebGPU.                    |
| **Reads / writes**       | Gate updates read logical predicate scalars and write indirect dispatch arguments.     |
| **Ownership**            | The compiled graph owns gate buffers; logical predicate state remains program-owned.   |
| **Output contract**      | Conditioned compute nodes whose direct dispatches become GPU-controlled indirect work. |
| **Expected work**        | One small gate update per conditioned command plus the enabled command workload.       |
| **Chunks**               | Conditioning changes execution only and does not repack data.                          |
| **Conditions / budgets** | Compiler support nodes run outside semantic predicate decoration scopes.               |
| **Neighborhood**         | uint32 predicate → dispatch gate → conditioned compute command.                        |

**Cost**Adds bounded gate dispatches while avoiding queue synchronization and readback.

**Common mistake**Do not infer exact dispatch geometry from a workload estimate.

## Logical predicate state[​](#logical-predicate-state "Direct link to Logical predicate state")

A `GPUProgram` declares backend-independent scalar state:

```
const active = program.scalar('active', 'uint32');
```

A control-flow predicate references that logical scalar. Zero means false; non-zero means true. The semantic program contains no WebGPU buffer or binding.

During WebGPU compilation each logical scalar is materialized as a `GPUScalar` in the graph's packed `GPUValueArena`. `compilation.scalars` exposes the resulting backend bindings for diagnostics and native WebGPU lowerers.

## Exact dispatch geometry[​](#exact-dispatch-geometry "Direct link to Exact dispatch geometry")

A runtime-conditioned compute node must declare the exact direct workgroup dimensions it would normally dispatch:

```
setGPUComputeDispatchWorkgroups(node, [x, y, z]);
```

This is deliberately separate from `maximumWorkgroupCount`. A workload estimate is not execution geometry and must never be guessed into an indirect command.

## Conditional lowering[​](#conditional-lowering "Direct link to Conditional lowering")

For a compute node with true dispatch `[x,y,z]`, the compiler inserts a tiny gate update before the node:

```
logical uint32 predicate

        |

        v

GPU gate update

        |

        +-- false -> indirect args [0,y,z]

        |

        +-- true  -> indirect args [x,y,z]

        v

original compute node

  dispatch() redirected to dispatchIndirect()
```

No predicate readback reaches JavaScript.

## Loop lowering[​](#loop-lowering "Direct link to Loop lowering")

WebGPU cannot repeat an arbitrary multi-dispatch body dynamically, so a semantic loop becomes a bounded sequence:

```
GPULoopOperation max=256

        |

        v

iteration 0: gated body

iteration 1: gated body

...

iteration 255: gated body
```

The body may update the logical predicate scalar. Each later gate reads the new GPU value. Once it becomes zero, later indirect dispatches execute zero workgroups.

`minimumIterations` leaves the requested initial iterations ungated before runtime convergence begins.

This differs from a future CUDA backend, where the same semantic loop may lower to a native CUDA Graph conditional WHILE node.

## Migration constraint[​](#migration-constraint "Direct link to Migration constraint")

Dynamic runtime control requires exact dispatch geometry. Existing legacy `getCommandNodes()` contributors can participate only after their compute-node descriptors opt into `setGPUComputeDispatchWorkgroups()`. Native semantic operation lowerers should provide this metadata as part of their WebGPU realization.

The compiler rejects missing geometry rather than assuming a one-dimensional dispatch.

## Nested predicates[​](#nested-predicates "Direct link to Nested predicates")

The first WebGPU realization accepts one active runtime predicate at a time. Nested semantic conditionals remain valid IR, but WebGPU lowering will reject them until predicate-conjunction gates are added. This keeps the current implementation explicit rather than silently dropping an outer condition.
