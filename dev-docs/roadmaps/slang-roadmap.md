# Slang roadmap

Status after the initial v10 experimental publication. Retain the original tranche numbers so
follow-up work can be tracked against the earlier plan. The compiler remains a practical
shader-authoring subset, with zero runtime dependencies and an approximately 30 KB gzip compiler (2.1 KB above the pre-registry baseline).

## Completed tranches

| Tranche | Scope | Status |
| --- | --- | --- |
| 2a | Application-owned named imports, transitive deduplication and module diagnostics/source maps | Implemented in the module-registry PR |
| 2b | Typed native WGSL/GLSL contracts, explicit public exports, shared types/resources and two-way calls | Implemented in the module-registry PR |
| 7a | Registry/native compatibility corpus, GPU execution and mapped target diagnostics | Implemented in the module-registry PR |
| 1 | Everyday language support: switch, do/while, inferred locals, numeric conversions and matrix constructors | Landed in #3374 |
| 3 | Reflection-driven luma integration and application-owned resource setup | Landed in #3371 |
| 4 | Compute atomics, byte-address operations, workgroup/barrier checks and a compute/render example | Landed in #3373 |
| 5 | Broader texture operations and target-specific capability diagnostics | Landed in #3373 |

These tranches cover the documented subset, not full upstream Slang compatibility.

## Remaining tranches

### 2. Registry follow-ups

The synchronous registry and native bridge are implemented. Modules share a flat namespace;
file imports, upstream module visibility and namespace syntax remain unsupported. Native
implementation contracts are checked on the Slang side and validated by the destination compiler.
Future increments should be justified by real libraries rather than general language parity.

### 6. Selective language abstractions

After the registry supports useful libraries, add only abstractions justified by concrete shader
patterns. Candidate increments are compile-time specialization, bounded generics and struct
methods. Interfaces remain conditional on a demonstrated use case; full Slang compatibility is
not the goal.

Acceptance: each increment includes a real library example, explicit unsupported cases, target
compilation checks, and measurements of compiler size, generated code size and compilation time.
Reject unbounded specialization or features whose cost outweighs their authoring benefit.

### 7. Hardening and experimental API graduation

Publication, experimental v10 badges, application-owned integration, bundle-size guards, and live
documentation examples are complete. The sculpture example now exposes source and the generated
shaders used by the active backend. Remaining work can ship in smaller increments:

1. **7a compatibility corpus — implemented:** upstream reference tests remain pinned; registry
   fixtures add both-backend native calls, callbacks, public types/resources and diagnostic maps.
   Extend this corpus whenever new language or bridge features are added.
2. **7b compilation performance:** measure realistic libraries; define budgets and document worker
   usage. Add caching only where measurements justify it, with explicit application ownership and
   invalidation rules, especially for registry changes.
3. **7c API stability:** settle registry, reflection and source-map contracts, document migration
   policy, and define evidence required to remove the experimental badge.

Acceptance: reproducible compatibility and performance results, documented budgets and ownership,
and no heavy bundled parser, reflection, worker or editor dependency. Publishing alone does not
qualify the compiler for graduation.

## Suggested order

Measure compilation performance in 7b next, then evaluate tranche 6 against real library needs.
Settle API contracts in 7c after applications exercise the registry and native bridge. Keep performance and bundle-size checks active throughout.
