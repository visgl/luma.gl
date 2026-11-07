# Shared shader metadata

`ir.ts` owns internal language-neutral value types, source locations, interfaces and resource
metadata. It contains types only. `ir-types.ts` emits numeric target types without importing a
frontend. Keep future WGSL parsing and semantic analysis behind their own entry point; neither
shared file should import Slang or WGSL parsing, registry resolution, or source-language rules.

`slang-types.ts` lowers Slang value types into this representation. Slang matrix rows become
target columns to preserve the existing ABI; this convention belongs to that adapter. A WGSL
adapter should use WGSL column/row dimensions directly. Buffer packing and matrix arithmetic
remain separate concerns and retain the existing Slang implementation.

`slang-interface.ts` resolves source semantics and inherited interpolation into explicit builtin,
location, interpolation and sampling metadata. Target interface generation consumes those fields.
Source semantics remain available for public Slang reflection and diagnostics.

`lowerSlangResource` resolves binding, resource kind, address space and access before target
resource declaration and reflection generation. Texture format discovery and physical buffer
layout remain separate from these logical resource properties.

Expressions retain structured syntax and source locations, with resolved value types, explicit
cast nodes, resolved function/constructor references and canonical intrinsic/texture operations.
`expression-analysis.ts` owns shared expression type resolution; the emitter supplies symbol,
overload and resource context. `signatures.ts` keeps signature helpers independent of registry
parsing. Slang operation/interface adapters are injected by its entry point.

The WGSL entry point parses and checks its own value subset, materializes abstract constants,
inserts zero initialization and resolves function calls before code generation. It shares the
emitter and numeric/resource infrastructure, but imports neither Slang parsing nor registry code.
Syntax walkers skip resolved call references so semantic graph edges are not traversed as syntax.
Backend capability checks and target-specific resource expansion remain in the emitter. The
representation is internal and is not a stable public compiler API.

## Size baseline

Measured using esbuild with bundling, minification and ESM output, then gzip level 9:

| Slang compiler | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| Before | 106768 | 30338 |
| After | 107777 | 30726 |
| Increase | 1009 | 388 |

Keep the existing standalone compiler and luma integration bundle tests active. Shared code must
remain free of frontend imports so adding a WGSL entry point does not pull its parser into Slang
applications or the Slang parser into WGSL applications.

## WGSL frontend bundle measurements

After typed expression analysis and the separate WGSL frontend:

| Browser entry point | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| Slang only (`index.ts`) | 110373 | 31538 |
| WGSL only (`wgsl.ts`) | 108842 | 31135 |
| Both frontends | 126954 | 36977 |

The Slang-only increase over the merged metadata baseline is 812 gzip bytes (2.64%). The two
frontends together cost about 5.4 KB gzip above Slang alone, because code generation is shared.
Dependency-graph tests reject WGSL parser/analyzer imports from the Slang bundle and Slang
parser/lexer/registry/interface/operation adapters from the WGSL bundle. These are complete
compiler bundles, rather than incremental frontend-only sizes. Both targets remain available
inside the shared backend; this tranche separates source frontends, not per-target backends.


## WGSL rendering and language extensions (tranches 5–6)

WGSL analysis now lowers uniform buffers and 2D sampling into existing resource metadata and
canonical texture operations. It compares natural WGSL byte layouts against std140 before
emission; no source buffers are implicitly repacked. Matrices retain WGSL column semantics via
an explicit matrix-multiply operation. Fixed array constructors, bitcasts, eager select and
texture dimensions have typed syntax nodes. A source evaluation-order flag makes the shared
backend capture WGSL operands before later arguments can mutate their inputs. Slang semantics
and frontend adapters remain separate.

| Browser entry point | Minified bytes | Gzip bytes | Gzip increase over tranches 3–4 |
| --- | ---: | ---: | ---: |
| Slang only | 112655 | 32059 | 521 (1.7%) |
| WGSL only | 127754 | 36571 | 5436 (17.5%) |
| Both frontends | 145869 | 42545 | 5568 (15.1%) |

These are full compiler bundles measured with the same esbuild/gzip settings above. Tight
standalone and combined budgets, plus frontend dependency-graph assertions, remain test gates.
