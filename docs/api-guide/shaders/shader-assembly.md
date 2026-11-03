import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Shader Assembly

<ShaderLevelDocsTabs active="shader-assembly" />

A core luma.gl principle is that applications remain in full control of their
shaders. Unlike traditional 3D engines that often generate shaders on an
application's behalf, luma.gl lets applications define the main shader control
flow, including:

- Entry points, i.e. the shader **main** functions
- Attributes
- Inter-stage variables (varyings)

## Shader Composition

Applications can provide complete WGSL or GLSL shaders, but a more typical use
case is to build shaders by composing reusable shader code. Shader assembly is
textual composition around application-owned shader source.

`@luma.gl/shaders` adds reusable source and extension code before `Model`,
`Computation`, or a lower-level pipeline compiles the final shader.

## Assembly Pieces

| Piece | Owns | Use it for | Reference |
| --- | --- | --- | --- |
| Application shader source | The shader entry points and primary flow. | The WGSL `source` string or GLSL `vs`/`fs` strings supplied by the application. | [`Model`](/docs/api-reference/engine/model) |
| `ShaderInputs` | Module props, uniforms, and bindings after assembly. | Updating typed module props and explicit resource bindings after source assembly. | [`ShaderInputs`](/docs/api-reference/engine/shader-inputs) |
| `ShaderModule` | Reusable WGSL/GLSL source, uniform descriptors, bindings, dependencies, and optional injections. | Importing a static shader library such as picking, lighting, projection, or a helper library. | [`ShaderModule`](/docs/api-reference/shaders/shader-module) |
| `ShaderPlugin` | A reusable primary module, defines, shader-facing vertex inputs, varyings, hooks, and named injections resolved for one shader language. | Attaching a dynamic, optional shader extension to a `Model` or `Computation`. | [`ShaderPlugin`](/docs/api-reference/shaders/shader-plugin) |
| Shader dependency | Module ordering. | Bringing required modules in before a module that calls them. | [`ShaderModule.dependencies`](/docs/api-reference/shaders/shader-module#fields) |
| Define | Conditional source selection. | Backend or feature switches evaluated before assembly. | [`WGSL Support`](/docs/api-reference/shaders/wgsl-support) |
| Shader hook | A named callback emitted by the assembler and called by base shader source. | A deliberate extension point such as `OFFSET_POSITION` or `FILTER_COLOR`. | [`ShaderAssembler`](/docs/api-reference/shaders/shader-assembler#hooks-and-injections) |
| Injection | Ordered source inserted at a named hook or standard anchor. | Adding declarations or small flow changes without copying the base shader. | [`ShaderAssembler`](/docs/api-reference/shaders/shader-assembler#hooks-and-injections) |

## Assembly Flow

| Step | What happens |
| --- | --- |
| 1. Author base source | Write unified WGSL for WebGPU, GLSL stage strings for WebGL 2, or both. |
| 2. Attach modules and plugins | Pass `modules` and `plugins` to `Model` or `Computation`, or call `ShaderAssembler` directly. |
| 3. Resolve composition | Plugin injection sources are selected for the active shader language, modules are deduplicated by name, and module dependencies are ordered before their consumers. |
| 4. Apply defines | Platform, module, plugin, and application defines select active source before final assembly. |
| 5. Assemble source | Module source is prepended, hooks are emitted, and ordered injections are applied. |
| 6. Relocate WGSL bindings | Assembled WGSL rewrites `@binding(auto)` declarations to concrete binding numbers. |
| 7. Compile and bind | The engine reflects the assembled source, creates shaders and pipelines, and uses `ShaderInputs` plus explicit bindings at draw or dispatch time. |

## Choosing The Primitive

| Need | Prefer |
| --- | --- |
| Import static reusable functions, uniform blocks, bindings, or dependencies into shaders. | `ShaderModule` |
| Expose a callback point owned by a base shader. | Shader hook |
| Insert declarations or a short statement at a standard shader anchor. | Named injection |
| Attach dynamic optional reusable behavior to `Model` or `Computation`. | `ShaderPlugin` |
| Run a shader module as a fullscreen texture-processing stage. | `ShaderPass` with `ShaderPassRenderer` |

Modules and plugins are related but not interchangeable. A module is like a
static library import: it contributes reusable shader code and its shader-facing
data whenever the shader is assembled. A plugin is a dynamic, optional
extension: it can add modules, defines, shader-facing vertex inputs, and
injections when a `Model` or `Computation` opts into that behavior. Hooks are
the contract a base shader exposes when attached code must participate in its
flow.

A plugin can provide GLSL and WGSL implementations of its hooks and injections,
plus vertex input and inter-stage varying definitions. This is particularly
useful for portable extensions: unlike GLSL, WGSL cannot add these inputs and
outputs with global declarations alone. Shader assembly updates the WGSL entry
point interfaces and assigns locations as needed. The application or extension
still manages buffers, accessor updates, and its own lifecycle; the plugin
handles shader composition. For example, deck.gl extensions can use this shared
composition path for WebGL 2 and WebGPU while retaining their existing lifecycle
and attribute management.

## Hooks And Standard Anchors

Hooks are named functions, while standard anchors are named locations in the
source. Base shaders should expose hooks when callers need a stable semantic
extension point. Use standard anchors for smaller structural additions.

| Target | Meaning |
| --- | --- |
| `vs:HOOK_NAME` | Vertex hook registered with the assembler. |
| `fs:HOOK_NAME` | Fragment hook registered with the assembler. |
| `vs:#decl`, `fs:#decl` | Declarations near the top of the matching shader stage. |
| `vs:#main-start`, `fs:#main-start` | Statements at the start of the matching main function. |
| `vs:#main-end`, `fs:#main-end` | Statements at the end of the matching main function. |

For the authoring choices behind these extension points, continue with
[Writing Customizable Shaders](/docs/api-guide/shaders/writing-customizable-shaders).
For exact descriptor fields and examples, use the
[`ShaderModule`](/docs/api-reference/shaders/shader-module),
[`ShaderPlugin`](/docs/api-reference/shaders/shader-plugin), and
[`ShaderAssembler`](/docs/api-reference/shaders/shader-assembler) reference
pages.
