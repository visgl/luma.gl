# Shader inspection

**Experimental · Available from luma.gl v10.**

`@luma.gl/slang/inspect` exposes `inspectWGSL()` and `inspectGLSL()`. Both return declaration
metadata in the same intermediate representation without generating target code or creating a GPU
shader. Import either function independently: the other parser and the compiler backend are
removed by tree shaking. These functions do not add dependencies to core's runtime scanner.

```typescript
import {inspectWGSL, inspectGLSL} from '@luma.gl/slang/inspect';

const wgsl = inspectWGSL(`
  @vertex fn vertexMain(@location(0) position: vec3f)
    -> @builtin(position) vec4f { return vec4f(position, 1.0); }
`, {sourceName: 'triangle.wgsl'});

const glsl = inspectGLSL(`#version 300 es
  layout(location = 0) in vec3 position;
  void main() { gl_Position = vec4(position, 1.0); }
`, {sourceName: 'triangle.vert', stage: 'vertex'});

console.log(wgsl.entryPoints, glsl.globals);
```

## Result and limits

Both functions return `ShaderInspection`: `language`, `sourceName`, `structures`, `globals`,
`functions` and `entryPoints`; GLSL also reports its `version` directive when present.

Declarations include original names and source locations (`offset`, `line`, `column`,
`sourceName`). Scalar/vector/matrix/array/struct types use language-neutral discriminated objects.
Matrices report columns and rows explicitly. Arrays retain literal lengths or an unresolved WGSL
`lengthExpression`; inferred WGSL globals report `{kind: 'inferred'}`. Texture/sampler handles
report `{kind: 'opaque', name: ...}`. No expression type is guessed or inferred by inspection.

Variables retain qualifiers, interface attributes and explicit resource bindings. GLSL blocks
also include their block name, optional instance name and members. GLSL layout qualifiers are
preserved as source strings/flags, not calculated byte offsets. WGSL resource groups are explicit;
a GLSL binding has no group unless a `set` qualifier is present. Functions retain parameters,
return types and whether a body exists. WGSL entry points retain stage attributes; GLSL `main`
definitions are entry points, with a stage only when the caller supplies `stage`.

`inspectWGSL()` reuses the parser for the [documented WGSL authoring subset](./wgsl.md), including
function-body syntax. It does not run semantic analysis, materialize constants, reject layouts
that differ from GLSL std140, or require an entry point. Aliases are expanded into their declared
types. Compute/storage/pointers and other syntax outside that subset still raise a diagnostic.

`inspectGLSL()` implements a basic GLSL declaration parser that produces this intermediate
representation directly. It supports 32-bit scalars/vectors, float matrices, structs, explicit
literal-sized or unsized arrays, uniforms, interface/storage blocks, sampler/image handle types,
precision/interpolation/storage qualifiers, layout qualifiers, prototypes and function definitions.
Function bodies and initializers are balanced and skipped, rather than parsed into expression or
statement IR. Initializer values and implicit builtins are not reflected. Function overloads and
prototypes are returned separately in source order. This is not yet a GLSL transpiler frontend.

GLSL source must be preprocessed: `#version` and `#extension` are accepted; macros, conditionals,
includes and `#line` are rejected instead of returning misleading metadata. Symbolic GLSL array
lengths, 64-bit types, general semantic validation and linking are outside this first subset.

Unsupported/incomplete syntax raises `ShaderInspectionError` (the shared diagnostic class), with
the source location. Results contain plain serializable data, without internal syntax/call graphs.
Neither function replaces the destination driver's shader validator.

## Comparison with core's WGSL scanner

Core's `scanWGSLInterface()` is now a re-export of the implementation owned by
`@luma.gl/shaders/wgsl`. `getShaderLayoutFromWGSL()` delegates to that scanner. It remains the
appropriate runtime path for deriving a pipeline layout; this API does not replace it.

| Capability | Existing core scanner | `inspectWGSL()` | `inspectGLSL()` |
| --- | --- | --- | --- |
| Result | Pipeline `ShaderLayout` | Module declaration IR | Same declaration IR |
| Entry points | Selected vertex attributes | All vertex/fragment entries | All `main` definitions; caller supplies stage |
| Functions/struct members | Scanned as needed for pipeline layout | Exposed with locations/types | Exposed with locations/types |
| Bodies | Skipped | Parsed with WGSL subset parser | Balanced and skipped |
| Resources | Broader WebGPU bindings, including storage/compute use | Current rendering subset | GLSL uniforms/interface/storage blocks and handles |
| Ambiguity/unsupported input | Returns `null` for an explicit-layout fallback | Source diagnostic | Source diagnostic |
| Semantic/type validation | No full validation | No semantic analysis | No semantic analysis |

Tests compare the scanner and inspector on a shared vertex/resource fixture. A scanner replacement
would require broader WGSL declaration support and a deliberate adapter to `ShaderLayout`; keeping
the two contracts separate avoids narrowing core's existing runtime support.

## Bundle comparison

Standalone browser ESM bundles, esbuild minification and gzip level 9, retaining only the named
API through the public inspection barrel:

| Retained API | Minified bytes | Gzip bytes |
| --- | ---: | ---: |
| `inspectWGSL()` | 12241 | 4711 |
| `inspectGLSL()` | 6671 | 3055 |
| Core `scanWGSLInterface()` | 8312 | 3003 |
| Both inspectors | 18667 | 6898 |

The WGSL inspector costs about 1.7 KB gzip more than the runtime scanner. The GLSL inspector is
smaller because it skips function bodies, while WGSL reuses the compiler's fuller parser. Both
inspectors together share diagnostics and type-only metadata; neither imports semantic analysis,
layout lowering, the Slang parser/registry or code generation.

The scanner fixture measures its source implementation directly (the core re-export adds no
retained code), avoiding dependence on built workspace packages. Reproduce all measurements with
`node scripts/bundle-size.mjs`. Tight budgets and emitted-module graph checks guard each inspector
and their combined bundle.
