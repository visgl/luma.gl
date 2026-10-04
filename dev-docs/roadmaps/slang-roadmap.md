# Slang roadmap

Status after the initial v10 experimental publication. Retain the original tranche numbers so
follow-up work can be tracked against the earlier plan. The compiler remains a practical
shader-authoring subset, with zero runtime dependencies and an approximately 28 KB gzip baseline.

## Completed tranches

| Tranche | Scope | Status |
| --- | --- | --- |
| 1 | Everyday language support: switch, do/while, inferred locals, numeric conversions and matrix constructors | Landed in #3374 |
| 3 | Reflection-driven luma integration and application-owned resource setup | Landed in #3371 |
| 4 | Compute atomics, byte-address operations, workgroup/barrier checks and a compute/render example | Landed in #3373 |
| 5 | Broader texture operations and target-specific capability diagnostics | Landed in #3373 |

These tranches cover the documented subset, not full upstream Slang compatibility.

## Remaining tranches

### 2. Reusable shader libraries through a module registry

Resolve Slang `import` statements against an application-supplied registry of named source modules.
Do not support file imports, filesystem access, network loading, or implicit package discovery.
Applications load their own strings and own the registry and compiler registration.

- Define a small synchronous registry API and deterministic module-name resolution.
- Track module identity in diagnostics and generated source maps.
- Diagnose missing modules, import cycles and conflicting declarations at their source locations.
- Define symbol visibility and naming rules before adding namespace syntax.
- Share functions and types across render shaders, compute shaders and reusable `ShaderModule` code.
- Define typed declarations for native shader-module functions and resources. The Slang compiler
  needs those declarations to check calls; assembly can then supply the matching WGSL or GLSL
  implementation. Include declared exports for native modules calling Slang helpers, with
  explicit target names and type contracts in both directions. Do not require applications to
  call generated internal names.
- Include each imported dependency once, preserving entry-point selection and reflection.

Acceptance: a shared geometry or material library works on WebGL 2 and WebGPU; nested imports,
shared dependencies and failure cases have focused coverage. A Slang shader calls the same
native module contract on both backends, with missing implementations and incompatible types
reported clearly. The registry performs no I/O and
adds no runtime dependencies. Measure compiler and generated-shader size before merging.

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

1. **Compatibility corpus:** expand upstream reference and GPU tests across language features,
   binding layouts, generated diagnostics and backend limits.
2. **Compilation performance:** measure realistic libraries; define budgets and document worker
   usage. Add caching only where measurements justify it, with explicit application ownership and
   invalidation rules, especially for registry changes.
3. **API stability:** settle registry, reflection and source-map contracts, document migration
   policy, and define evidence required to remove the experimental badge.

Acceptance: reproducible compatibility and performance results, documented budgets and ownership,
and no heavy bundled parser, reflection, worker or editor dependency. Publishing alone does not
qualify the compiler for graduation.

## Suggested order

Ship tranche 2 next. Expand tranche 7's compatibility corpus alongside it, then evaluate tranche 6
against real library needs. Keep performance and bundle-size checks active throughout.
