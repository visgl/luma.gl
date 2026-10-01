# GPUScalar

## At a glance

| Question                 | Answer                                                                            |
| ------------------------ | --------------------------------------------------------------------------------- |
| **Problem**              | Represent one typed GPU-resident value without implying one physical buffer.      |
| **Reads / writes**       | Consumers load or store the scalar through its arena slot.                        |
| **Ownership**            | A GPUScalar borrows its graph-owned GPUValueArena and owns no buffer.             |
| **Output contract**      | A stable typed logical reference with byte and word offsets.                      |
| **Expected work**        | No commands by itself; scalar-producing and consuming operations contribute work. |
| **Chunks**               | Not applicable to one logical scalar value.                                       |
| **Conditions / budgets** | Remains GPU-resident across graph stages and conditioned branches.                |
| **Neighborhood**         | reduction or scalar operation → GPUScalar → arithmetic, gating, or indirect work. |

**Cost**Four arena bytes per scalar plus no additional binding.

**Common mistake**Do not read a scalar back to the CPU merely to feed the next GPU stage.

## Overview[​](#overview "Direct link to Overview")

`GPUScalar<T>` is a first-class logical value produced and consumed by GPU graph operations. It represents one `float32`, `uint32`, or `sint32` value without implying that the value owns a storage buffer or consumes its own storage-buffer binding.

`GPUScalar` is the semantic layer above the graph-owned `GPUValueArena`.

## Why is a scalar different from a one-element vector?[​](#why-is-a-scalar-different-from-a-one-element-vector "Direct link to Why is a scalar different from a one-element vector?")

Numerical algorithms naturally distinguish vector state from scalar coefficients:

```
vectors                         scalars

-------                         -------

x                               rr = r · r

r                               pDotQ = p · q

p                               alpha

q                               beta
```

A dot product takes two vectors and produces one scalar. Scalar division can then produce another scalar, which may be broadcast back into a vector operation:

```
r ─┐

   ├── dot ──▶ rr ─┐

r ─┘               │

                   ├── divide ──▶ alpha

p ─┐               │                 │

   ├── dot ─▶ pDotQ┘                 │ broadcast

q ─┘                                 ▼

                               vector MADD
```

Treating these values as one-element vectors would work physically, but would erase useful semantic information from the graph/compiler. `GPUScalar` makes the mathematical role explicit while allowing the physical representation to evolve independently.

## Physical representation[​](#physical-representation "Direct link to Physical representation")

A `GPUScalar` does **not** own a `Buffer`. Creating a scalar declares one typed slot in the graph's singleton `GPUValueArena`:

```
const alpha = createGPUScalar(graph, 'alpha', 'float32');

const active = createGPUScalar(graph, 'active', 'uint32');
```

Conceptually:

```
GPUScalar alpha ──┐

GPUScalar beta  ──┤

GPUScalar rr    ──┼──▶ graph-owned GPUValueArena ──▶ one storage buffer

GPUScalar active──┘
```

The scalar carries logical identity, type and slot metadata. Once the arena is sealed, it can expose a one-row `GraphDataView` for existing graph resource tracking.

## One binding, many values[​](#one-binding-many-values "Direct link to One binding, many values")

The initial WGSL representation binds the packed arena as words:

```
@group(0) @binding(0)

var<storage, read_write> gpuValues: array<u32>;
```

A `float32` scalar at word offset 2 can be loaded as:

```
bitcast<f32>(gpuValues[2u])
```

while a `uint32` scalar uses the same word directly. Stores perform the inverse bitcast where required.

The helper functions in this module generate these expressions so individual graph operations do not need to duplicate arena-layout knowledge.

The important property is:

```
100 logical GPUScalar values

             │

             ▼

       one arena binding
```

rather than 100 storage-buffer bindings.

## Scalar provenance[​](#scalar-provenance "Direct link to Scalar provenance")

`GPUScalar` specifically models a GPU-resident logical value. It should not force every scalar-like operand into the same physical mechanism:

```
compile-time constant       WGSL literal / override

CPU-updated parameter       uniform/parameter machinery

GPU-produced scalar         GPUScalar → GPUValueArena
```

A future common scalar-operand API can allow operations such as MADD to accept any of these sources while the compiler chooses the appropriate representation.

## Relationship to reductions[​](#relationship-to-reductions "Direct link to Relationship to reductions")

Reductions are natural scalar producers:

```
GPUVector ──▶ GPUReduction ──▶ GPUScalar



GPUVector ─┐

           ├─▶ GPUDotProduct ─▶ GPUScalar

GPUVector ─┘



GPUVector ──▶ GPUVectorNorm ──▶ GPUScalar
```

Today some primitives model scalar output as a one-row `GraphDataView`. Follow-up work can migrate them to accept `GPUScalar` while retaining arena-backed views internally for graph hazards.

## Why this matters for iterative algorithms[​](#why-this-matters-for-iterative-algorithms "Direct link to Why this matters for iterative algorithms")

Conjugate gradient computes coefficients every iteration:

```
rr = r · r

pDotQ = p · A p

alpha = rr / pDotQ

beta = newRR / rr
```

Reading those values back to JavaScript would introduce GPU/CPU synchronization into the loop. Arena-backed `GPUScalar`s let the entire dependency chain remain GPU-resident.

The same abstraction applies to convergence flags, counters, thresholds derived on GPU, adaptive algorithm state and indirect-dispatch metadata.

## Scope of this PR[​](#scope-of-this-pr "Direct link to Scope of this PR")

This PR establishes only the logical scalar type and WGSL arena access machinery. It deliberately does not add arithmetic. Keeping representation separate lets the next PR define scalar operations cleanly:

```
GPUValueArena

      ↓

 GPUScalar<T>        ← this PR

      ↓

scalar arithmetic

      ↓

scalar broadcast / MADD

      ↓

solver and GPU control flow
```

## Roadmap[​](#roadmap "Direct link to Roadmap")

1. graph-owned packed `GPUValueArena`
2. first-class `GPUScalar<T>` and WGSL access helpers
3. scalar arithmetic and comparisons
4. reduction outputs as `GPUScalar`
5. scalar/constants/parameters as broadcast operands in `GPUElementwise`
6. GPU-resident convergence and conjugate-gradient execution
7. compiler-driven arena sealing and lifetime-based slot reuse
