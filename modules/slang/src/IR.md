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

These are the first two stages of the shared representation migration. Expressions and statements
still use the existing Slang AST; their typed lowering belongs to the next tranche. The shared
representation is internal and is not a stable public compiler API.

## Size baseline

Measured using esbuild with bundling, minification and ESM output, then gzip level 9:

| Slang compiler | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| Before | 106768 | 30338 |
| After | 107795 | 30708 |
| Increase | 1027 | 370 |

Keep the existing standalone compiler and luma integration bundle tests active. Shared code must
remain free of frontend imports so adding a WGSL entry point does not pull its parser into Slang
applications or the Slang parser into WGSL applications.
