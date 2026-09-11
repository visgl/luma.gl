# GPU value arena materialization

## Overview

Small GPU-produced values such as solver coefficients, counters, predicates and indirect-control state share one graph-owned `GPUValueArena` storage buffer.

Algorithms allocate logical values and declare the arena buffer as a normal graph resource. They do **not** allocate, seal, resize or otherwise materialize GPU storage themselves.

```text
algorithm contributors
        │
        ├── alpha : f32 @ 0
        ├── beta  : f32 @ 4
        ├── active: u32 @ 8
        │
        ▼
GPUValueArena logical buffer handle
        │
        ▼
GPUCommandGraph compilation
        │
        ▼
physical transient allocation
```

This follows the command graph's existing resource model: `GraphBufferHandle` is logical during graph construction; the compiled graph owns physical transient allocations.

## Why there is no `seal()`

Earlier prototypes used an explicit `arena.seal()` call. That created an undesirable ordering constraint: the first algorithm to consume a scalar effectively decided when scalar declarations had to stop.

That is backwards. Contributors should describe work; graph compilation should own physical resources.

The arena therefore exposes one stable logical buffer from construction onward. Scalar-producing and scalar-consuming nodes can reference it immediately.

## Stable offsets

Arena slots remain monotonically allocated and stable for the graph lifetime:

```text
alpha       @ 0
beta        @ 4
residual²   @ 8
active      @ 12
iteration   @ 16
```

Stable offsets keep generated WGSL, traces and debugging easy to inspect. Small-value slot recycling is intentionally not performed.

## Capacity

The initial arena reserves 16 KiB, enough for 4096 32-bit values. This is deliberately small in GPU-memory terms while avoiding mutable buffer descriptors during graph construction.

If real workloads approach this limit, the architecture can add an explicit graph-level arena-capacity option. Algorithms should not choose arena capacity independently.

## Binding pressure

The principal optimization is binding count, not memory size:

```text
100 logical scalars
        ↓
one arena buffer
        ↓
one storage binding per shader that accesses graph values
```

This is particularly important for WebGPU workloads that already consume several storage bindings for vectors, sparse matrix structures and scratch resources.

## Relationship to compilation

The value arena deliberately uses ordinary graph transient-resource machinery. There is no separate arena allocator in the compiler:

```text
logical arena handle
       │
       ├── hazard tracking
       ├── dependency ordering
       └── transient allocation
                │
                ▼
        existing graph compiler
```

This keeps the scalar-state architecture aligned with the rest of the command graph rather than creating a special resource lifecycle.
