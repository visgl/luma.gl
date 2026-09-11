import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUValueArena

<GPUCoreDocsTabs active="reduction" />

## Overview

A `GPUCommandGraph` has one default `GPUValueArena` for small GPU-produced values. Algorithms declare logical values first; once declarations are complete, the arena is sealed and materializes **one exactly-sized transient storage buffer** for the graph.

The central invariant is:

> **Logical value count must not imply storage-binding count.**

## Why an arena?

Numerical and control algorithms produce many values that are logically scalars:

```text
rr      = r · r
pDotQ   = p · q
alpha   = rr / pDotQ
beta    = newRR / rr
active  = residual > tolerance
```

They must remain GPU-resident to avoid CPU synchronization. Giving every four-byte scalar its own storage buffer would waste one of WebGPU's limited storage-buffer bindings for each value.

Instead the graph packs them together:

```text
CG declares:       rr, pDotQ, alpha, beta
control declares:  active, iteration
other nodes:       counters / small state
                         │
                         ▼
                  graph value arena
                         │
                         ▼
              one storage-buffer binding
```

## Graph ownership

The normal API does not ask each algorithm to create or size an arena. Every contributor obtains the graph's shared arena:

```ts
const values = getGPUValueArena(graph);

const rr = values.allocate('cg-rr', 'float32');
const alpha = values.allocate('cg-alpha', 'float32');
const active = values.allocate('cg-active', 'uint32');
```

Repeated calls to `getGPUValueArena(graph)` return the same arena. Algorithms therefore contribute logical value requirements to one graph-wide packing problem rather than creating solver-, sorting-, or control-specific buffers.

## Two-phase layout

The arena separates **declaration** from **physical allocation**.

During graph construction, values receive stable packed offsets:

```text
rr          f32  @  0
pDotQ       f32  @  4
alpha       f32  @  8
beta        f32  @ 12
active      u32  @ 16
iteration   u32  @ 20
```

No capacity is guessed by the caller. Once all values have been declared:

```ts
const binding = values.seal();
```

sealing creates one transient graph buffer whose byte length is exactly the packed requirement:

```text
0    ┌───────────────┐
     │ rr      f32   │
4    ├───────────────┤
     │ pDotQ   f32   │
8    ├───────────────┤
     │ alpha   f32   │
12   ├───────────────┤
     │ beta    f32   │
16   ├───────────────┤
     │ active  u32   │
20   ├───────────────┤
     │ iteration u32 │
24   └───────────────┘

arena.byteLength = 24
```

No further values may be declared after sealing because that would invalidate offsets and the physical allocation.

## Logical slots and graph views

A declared `GPUValueSlot<T>` is logical metadata:

```text
(id, format, byteOffset)
```

It is deliberately not a buffer. After sealing, `getView(slot)` produces a one-row `GraphDataView<T>` into the shared arena buffer so existing graph resource and hazard machinery can consume the value.

All such views share the same underlying `GraphBufferHandle`. Current hazards are therefore conservatively buffer-granular; this is correct even before the compiler learns arena subranges.

## Arena versus uniform parameters

Not every scalar belongs in the value arena:

```text
CPU-known constant       → WGSL literal / override where appropriate
CPU-updated parameter    → uniform / parameter machinery
GPU-produced value       → graph GPUValueArena
```

An application timestep is naturally a CPU parameter. Conjugate-gradient `alpha`, by contrast, is produced from GPU dot products during execution and belongs in GPU-resident graph state.

The eventual operation API should accept logical scalar operands without forcing callers to care which physical representation supplies them.

## Relationship to GPUScalar

`GPUValueArena` is the physical packing substrate, not the final mathematical API. A following `GPUScalar<T>` abstraction can refer to a graph value slot:

```text
GPUScalar<float32>
       │
       └── graph value slot
              │
              └── shared GPUValueArena @ byteOffset
```

That keeps scalar semantics independent from storage-buffer allocation.

## Binding model

A kernel that consumes several logical graph values should bind the arena once:

```wgsl
@group(0) @binding(0)
var<storage, read_write> graphValues: array<u32>;
```

Generated accessors can load or store the appropriate word and bitcast according to logical format. Ten, one hundred, or more logical graph values can therefore remain one storage-buffer binding for a kernel that needs access to the arena.

## Future: lifetime-based packing

The initial layout is deliberately simple: every declared value receives a unique stable four-byte slot. The graph compiler can eventually use producer/consumer lifetimes to reuse physical slots whose live ranges do not overlap:

```text
logical A:  ─────────┐
                     X dead
logical B:             ───────────

physical offset 12:  [ A ][ B ]
```

This is analogous to register allocation. It can shrink the arena without changing `GPUScalar` or algorithm APIs. That optimization should follow real lifetime information rather than complicating the first representation.

## Why `GPUValueArena`, not `GPUScalarArena`?

The same packed state can hold mathematical scalars, counters, convergence flags, compact metadata, indirect-dispatch dimensions and similar small GPU-produced control values. The name describes the physical mechanism without restricting its eventual uses.

## Roadmap

1. graph-owned, exactly-sized `GPUValueArena`
2. first-class `GPUScalar<T>` logical values
3. generated WGSL arena access helpers
4. scalar arithmetic and comparisons
5. scalar constants/broadcast in `GPUElementwise` / MADD
6. GPU convergence/control integration
7. complete GPU-resident conjugate-gradient execution
8. compiler lifetime analysis and slot reuse

The graph should own the packing problem; algorithms should only declare the values they need.
