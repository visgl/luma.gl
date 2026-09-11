import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUValueArena

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUValueArena` packs many small GPU-produced values into one graph-managed storage buffer. Each logical value receives a typed slot and stable byte offset, while operations can bind the shared arena instead of consuming a separate storage-buffer binding for every scalar.

## Why an arena?

Numerical and control algorithms produce values that are logically scalars:

```text
rr      = r · r
pDotQ   = p · q
alpha   = rr / pDotQ
beta    = newRR / rr
active  = residual > tolerance
```

These values must remain on the GPU if an iterative command graph is to avoid CPU synchronization. Representing every scalar as an independent storage buffer would be simple, but WebGPU exposes a deliberately limited number of storage-buffer bindings per shader stage. A solver or graph algorithm could therefore exhaust binding capacity with tiny four-byte resources long before it exhausted GPU memory or arithmetic capacity.

The arena separates **logical values** from **physical bindings**:

```text
logical GPU values

rr        f32 ─┐
pDotQ     f32 ─┤
alpha     f32 ─┤
beta      f32 ─┼──▶ GPUValueArena ───▶ one storage buffer
active    u32 ─┘
```

A slot is not a buffer. It is a typed range inside the arena buffer.

## Representation

The initial arena uses 32-bit scalar slots:

```text
byte offset
    0   ┌───────────────┐
        │ rr      f32   │
    4   ├───────────────┤
        │ pDotQ   f32   │
    8   ├───────────────┤
        │ alpha   f32   │
   12   ├───────────────┤
        │ beta    f32   │
   16   ├───────────────┤
        │ active  u32   │
   20   └───────────────┘
```

Each allocation returns metadata containing the format, byte offset, and a one-row `GraphDataView`. The view lets existing graph resource/hazard machinery reason about the value while all slots still alias the same underlying graph buffer.

```ts
const values = new GPUValueArena(graph, {
  id: 'cg-state',
  byteLength: 256
});

const rr = values.allocate('rr', 'float32');
const alpha = values.allocate('alpha', 'float32');
const active = values.allocate('active', 'uint32');
```

## Arena versus uniform parameters

Not every scalar belongs in this arena.

```text
CPU-known constant       → WGSL literal / override where appropriate
CPU-updated parameter    → uniform/parameter storage
GPU-produced value       → GPUValueArena
```

For example, an application-provided timestep is naturally a CPU parameter. Conjugate-gradient `alpha`, by contrast, is produced by GPU dot products and scalar division during execution and must remain GPU-resident.

The public operation layer should eventually accept logical scalar operands without requiring callers to care whether their physical representation is a constant, uniform parameter, or arena slot.

## Relationship to GPUScalar

`GPUValueArena` is deliberately the physical substrate, not the final scalar API. A following `GPUScalar<T>` abstraction can be a first-class graph value backed by an arena slot:

```text
GPUScalar<float32>
       │
       └── arena + byteOffset + format
```

This ordering avoids baking “one scalar equals one storage buffer” into the graph API before binding pressure is addressed.

## Why `GPUValueArena`, not `GPUScalarArena`?

The same packed storage can eventually hold more than mathematical scalars: counters, convergence flags, compact metadata, indirect-dispatch parameters and other small GPU-produced control values. `GPUValueArena` names the physical mechanism without prematurely restricting its role.

The initial PR intentionally allocates scalar-sized slots only. Small structs or arrays should be added only when concrete consumers establish their layout requirements.

## Graph and lifetime semantics

The first implementation creates one transient `GraphBufferHandle` through `GPUCommandGraph`. Slots have stable offsets for the lifetime of the graph and share that handle. Because graph hazards are currently buffer-granular, accesses to different slots conservatively alias; this is correct but may reduce scheduling freedom.

A future compiler can understand arena subranges and lifetimes more precisely, potentially reuse dead slots, coalesce arenas, or promote selected values into other physical representations without changing their logical APIs.

## Binding model

The key design goal is to let a kernel consume several logical values through one arena binding:

```wgsl
@group(0) @binding(0)
var<storage, read_write> values: array<u32>;
```

Generated/accessor code can load the appropriate word and bitcast it according to slot format. Later work may provide typed WGSL helpers so individual operations do not hand-code arena offsets.

The first PR establishes allocation and graph representation; scalar arithmetic and generated WGSL accessors follow separately.

## Roadmap

1. packed `GPUValueArena` with typed 32-bit slots
2. first-class `GPUScalar<T>` logical values backed by arena slots
3. scalar arithmetic (`add`, `multiply`, `divide`, `sqrt`, comparisons)
4. scalar broadcast into `GPUElementwise` / MADD
5. GPU convergence/control values
6. complete GPU-resident conjugate-gradient execution
7. compiler lifetime analysis and slot reuse where worthwhile

The central invariant is that **logical value count must not imply storage-binding count**.
