# Transient buffer lifetime reuse

## At a glance

| Question                 | Answer                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- |
| **Problem**              | Reuse compatible physical storage for large logical transients with disjoint lifetimes. |
| **Reads / writes**       | The planner consumes declared lifetimes and emits allocation assignments.               |
| **Ownership**            | Logical resources remain graph-owned; compiled allocations follow the plan.             |
| **Output contract**      | Deterministic logical-to-physical assignments with peak-byte accounting.                |
| **Expected work**        | CPU-side interval planning over declared transient requests.                            |
| **Chunks**               | Chunk identity remains logical and is not implicitly repacked.                          |
| **Conditions / budgets** | Planning occurs at graph compilation and never changes an encoding topology.            |
| **Neighborhood**         | graph resource lifetimes → planner → compiled transient allocations.                    |

**Cost**Planner bookkeeping versus reduced peak GPU memory for heavyweight scratch.

**Common mistake**Do not recycle tiny arena slots when stable offsets are more valuable than negligible savings.

## Overview[​](#overview "Direct link to Overview")

Large GPU algorithms frequently need scratch buffers that are never live at the same time. A sort workspace may be dead before an FFT temporary is needed; hierarchical reduction partials disappear before a later solver phase.

```
node →       0 1 2 3 4 5 6 7 8 9

sort scratch █████

FFT temp             ██████

reduction                    ███
```

Allocating all three independently makes peak physical memory equal to their sum even though their lifetimes do not overlap. A graph compiler can instead map compatible logical buffers onto fewer physical allocations.

## What is reused[​](#what-is-reused "Direct link to What is reused")

Lifetime reuse targets heavyweight transient buffers: reduction partials, sort workspace, FFT temporaries, sparse workspace and similar scratch resources.

It deliberately does **not** reuse `GPUValueArena` scalar slots. Hundreds of 32-bit values cost only hundreds or thousands of bytes, while stable scalar offsets make WGSL, traces and debugging substantially easier to understand.

## Safety[​](#safety "Direct link to Safety")

Two logical buffers can share storage only when:

1. their graph-node lifetimes do not overlap;
2. the physical allocation satisfies the required usage flags;
3. the physical allocation is at least as large as the logical buffer.

The first planner uses greedy best-fit interval reuse. It is deterministic and intentionally conservative.

## Example[​](#example "Direct link to Example")

```
A: 8 MiB, nodes 0–3 ─────┐

                         ├─ physical allocation 0: 8 MiB

B: 6 MiB, nodes 5–8 ─────┘



C: 4 MiB, nodes 2–7 ─────── physical allocation 1: 4 MiB
```

Logical storage is 18 MiB; peak physical storage is 12 MiB.

## Compiler integration[​](#compiler-integration "Direct link to Compiler integration")

This PR introduces the planning policy separately from physical graph allocation. The next integration step can derive lifetimes from resource accesses in the dependency-ordered graph and feed assignments into transient allocation. Keeping policy separate makes it straightforward to test aliasing safety before changing resource ownership.
