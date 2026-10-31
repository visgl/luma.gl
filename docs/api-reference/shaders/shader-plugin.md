import {ShadersDocsTabs} from '@site/src/components/docs/shaders-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# ShaderPlugin

<ShadersDocsTabs active="shader-plugin" />

`ShaderPlugin` groups reusable shader assembly contributions that can be
attached to [`Model`](/docs/api-reference/engine/model) and
[`Computation`](/docs/api-reference/engine/compute/computation). Prefer plugins
as the application-facing optional composition layer when a behavior needs
a primary shader module, defines, shader-facing vertex inputs, named injections, portable
cross-stage varyings, or backend-specific shader source.

For the authoring model, see
[Writing Customizable Shaders](/docs/api-guide/shaders/writing-customizable-shaders).

<DocumentationContract title="ShaderPlugin" rows={[
  {label: 'Languages', value: 'One portable interface with GLSL/WGSL source per injection'},
  {label: 'Dependencies', value: 'Composes ShaderModules selected by the plugin'},
  {label: 'Hooks and injections', value: 'Targets named vertex and fragment extension points'},
  {label: 'Props and bindings', value: 'Declares vertex inputs, varyings, a primary module, and defines'},
  {label: 'Assembly output', value: 'Resolved modules, defines, injections, inputs, and varyings'},
  {label: 'Cost', value: 'Resolve when configuration changes, not for every draw'}
]} />

## Usage

```ts
const model = new Model(device, {
  source: wgslSource,
  vs: glslVertexSource,
  fs: glslFragmentSource,
  plugins: [tintPlugin]
});
```

## Type

```ts
import type {AttributeShaderType} from '@luma.gl/core';
import type {ShaderInjection, ShaderModule} from '@luma.gl/shaders';

export type ShaderPlugin = {
  name: string;
  module?: ShaderModule;
  defines?: Record<string, boolean>;
  injections?: ShaderPluginInjection[];
  vertexInputs?: Record<string, AttributeShaderType>;
  varyings?: Record<string, ShaderPluginVarying>;
};

export type ShaderPluginVaryingInterpolation = 'smooth' | 'flat';

export type ShaderPluginVarying = {
  type: AttributeShaderType;
  interpolation?: ShaderPluginVaryingInterpolation;
};

export type ShaderPluginInjection = {
  target: ShaderPluginInjectionTarget;
  glsl?: string;
  wgsl?: string;
  order?: number;
};

export type ResolvedShaderPlugins = {
  modules: ShaderModule[];
  defines: Record<string, boolean>;
  injections: Record<string, ShaderInjection[]>;
  vertexInputs: Record<string, AttributeShaderType>;
  varyings: Record<string, {
    type: AttributeShaderType;
    interpolation: ShaderPluginVaryingInterpolation;
  }>;
};
```

## Primary module

A plugin optionally supplies one `module`. That module owns its uniform and binding
contract; supporting shader code belongs in `module.dependencies`. For example,
`glassTransmissionPlugin.module` depends on `glassMaterial`, which depends on
`opticalLighting`. The assembler and `ShaderInputs` resolve that dependency graph.
Filter and clip each supply their existing module; injection-only plugins omit it.

```ts
const filterPlugin: ShaderPlugin = {
  name: 'filter',
  module: filterShaderModule,
  vertexInputs: {filterValues: 'f32'},
  injections: [/* host hook injections */]
};
```

Uniform updates remain keyed by **module name**, not plugin name. Dependencies keep
independent uniform and binding namespaces; declaring a primary module does not
forward its props to dependencies. Configure each module explicitly through
`model.shaderInputs.setProps(...)`. Multiple independent features can be supplied
as multiple plugins. `Model.modules`, `Computation.modules`, and the resolved
assembly module list remain arrays.

## Resolution

| Field | Resolution |
| --- | --- |
| `module`, `defines`, `vertexInputs`, and `varyings` | Shared across shader languages. Later plugins override same-named define keys. |
| Injection `glsl` / `wgsl` | Select the source matching the assembly language. An omitted source skips that injection; an empty string remains an explicit injection. |
| `vertexInputs` | Render-shader inputs merged by input name. Repeated names must use the same shader type; conflicting types throw. Buffer ownership remains with the caller. |
| `varyings` | Cross-stage values merged by name. Repeated names must use the same type and interpolation. Floating-point values default to `smooth`; integer values default to and require `flat`. |
| Injection entries | Preserve author order within the same `order` value. |

## Injection Targets

`ShaderPlugin` only accepts named injection targets:

- `vs:#decl`
- `vs:#main-start`
- `vs:#main-end`
- `fs:#decl`
- `fs:#main-start`
- `fs:#main-end`
- named shader hooks such as `vs:OFFSET_POSITION` and `fs:FILTER_COLOR` when the active shader assembly path already exposes those hooks

Raw regex or arbitrary text-replacement targets from lower-level assembler APIs are intentionally not part of `ShaderPlugin`.

Use a named hook target only when the active shader assembly path already
registers and calls that hook. Use `#decl` for helper functions and globals,
and `#main-*` for short entry-point statements.

## Vertex Inputs

`vertexInputs` declares render-shader attribute names and shader types required
by a plugin. The plugin does not own buffers: callers still provide matching
`bufferLayout` and `attributes` to `Model`.

The assembler adds plugin vertex input declarations before reflection. Repeated
plugin declarations must use the same type. Names must be valid non-reserved
identifiers and must not conflict with existing shader inputs. `Computation`
rejects plugins with `vertexInputs` because compute shaders do not have render
vertex inputs.

For GLSL, the assembler emits portable vertex `in` declarations. For WGSL, it
inspects the selected `vertexEntryPoint`, including direct parameters and
struct-based inputs, and assigns the first unused `@location` values in plugin
declaration order. Generated entry-point parameters initialize same-invocation
private variables before other `vs:#main-start` injections, so generated hook
functions can use the public input names.

WGSL reflection maps those generated parameters back to their public names.
When an explicit `ShaderLayout` is supplied, compatible same-name metadata is
preserved and newly reflected attributes are appended. Conflicting names,
types, or locations throw.

`vertexInputs` deliberately stops at the shader interface. The application,
`GPUTable`, or a future deck.gl `AttributeManager` integration still owns the
buffer format, stride, step mode, allocation, updates, and lifecycle. Storage
resources remain `ShaderModule` bindings managed through `ShaderInputs`.

## Varyings

`varyings` declares values that plugin hook source writes during the vertex
stage and reads during the fragment stage. The assembler owns the generated
shader interface only. It does not own the source coordinates, attributes,
buffers, events, resources, or update lifecycle.

Names must be valid non-reserved identifiers and cannot conflict with plugin
vertex inputs or existing application stage I/O. Floating-point scalar and
vector types default to `smooth`; integer types default to `flat` and reject
`smooth`. Explicit `flat` interpolation is valid for all supported types.

For GLSL, the assembler generates matching vertex `out` and fragment `in`
declarations, then zero-initializes the vertex value before other main-start
injections. For WGSL, the selected vertex entry point must return a named
stage-I/O struct and the selected fragment entry point must consume exactly one
named stage-I/O struct. The assembler appends matching fields at the first
locations unused by both structs, initializes same-named private variables,
copies them to every vertex return, and initializes them from the fragment
input before fragment injections. Direct WGSL vertex outputs and ambiguous
fragment struct inputs are rejected with an assembly error.

`Computation` rejects plugins with `vertexInputs` or `varyings` because compute
pipelines do not have a render vertex-to-fragment interface.

## `filterShaderPlugin`

`filterShaderPlugin` is a portable scalar inclusive-range filter. It declares
the `filterValues: 'f32'` vertex input and attaches a `filter` shader module with
`enabled`, `min`, and `max` props. Defaults are `{enabled: true, min: 0, max: 1}`.

Compatible base shaders register and call the position hook:

```ts
shaderAssembler.addShaderHook('vs:FILTER_POSITION(inout vec4 position)'); // GLSL
shaderAssembler.addShaderHook(
  'vs:FILTER_POSITION(position: ptr<function, vec4<f32>>)'
); // WGSL
```

```glsl
FILTER_POSITION(gl_Position);
```

```wgsl
FILTER_POSITION(&outputs.position);
```

The caller supplies the data and updates only shader inputs when the range
changes:

```ts
const model = new Model(device, {
  plugins: [filterShaderPlugin],
  shaderAssembler,
  bufferLayout: [{name: 'filterValues', format: 'float32', stepMode: 'instance'}],
  attributes: {filterValues: filterValueBuffer}
});

model.shaderInputs.setProps({filter: {enabled: true, min: 0.2, max: 0.8}});
```

Rejected vertices are moved outside clip space. This first version does not
support category filters, filtered-row counts, fp64 values, or storage-buffer
inputs.

## `clipShaderPlugin`

`clipShaderPlugin` provides coordinate-system-neutral rectangular clipping.
It declares a smooth `clipCoordinates: vec2<f32>` varying and a `clip` shader
module with these props:

```ts
export type ClipShaderPluginProps = {
  enabled?: boolean;
  bounds?: readonly [number, number, number, number];
  mode?: 'instance' | 'geometry';
};
```

Defaults are `{enabled: true, bounds: [0, 0, 1, 1], mode: 'geometry'}`.
Lower bounds are inclusive and upper bounds are exclusive. Coordinates and
bounds must use the same application-defined coordinate system.

Compatible shaders register and call both hooks:

```glsl
vs:CLIP_POSITION(
  inout vec4 position,
  vec2 instanceCoordinates,
  vec2 geometryCoordinates
)
fs:CLIP_COLOR(inout vec4 color)
```

```wgsl
vs:CLIP_POSITION(
  position: ptr<function, vec4<f32>>,
  instanceCoordinates: vec2<f32>,
  geometryCoordinates: vec2<f32>
)
fs:CLIP_COLOR(color: ptr<function, vec4<f32>>)
```

The vertex hook always stores `geometryCoordinates` in the generated varying.
In `instance` mode, an out-of-bounds `instanceCoordinates` value moves the
complete object outside clip space. In `geometry` mode, the fragment hook
discards pixels whose interpolated coordinates are outside the bounds.

```ts
model.shaderInputs.setProps({
  clip: {enabled: true, mode: 'geometry', bounds: [-0.5, -0.5, 0.5, 0.5]}
});
```

This update changes only the managed clip uniforms. It does not rebuild the
model, buffers, shaders, or pipeline.

## Example

```ts
const tintPlugin: ShaderPlugin = {
  name: 'tint-plugin',
  injections: [
    {
      target: 'fs:#decl',
      glsl: 'vec4 plugin_getTint() { return vec4(1.0, 0.4, 0.2, 1.0); }',
      wgsl: 'fn pluginGetTint() -> vec4<f32> { return vec4<f32>(1.0, 0.4, 0.2, 1.0); }'
    }
  ]
};
```

For runnable examples, see [Shader Plugins](/docs/tutorials/shader-plugins) and
[Arrow ShaderPlugin Filtering](/examples/arrow/arrow-filtering).

## Hook diagnostics and ownership

Unknown named injection targets report the stage-prefixed hook and contributing
plugin names. Register the hook on an application-owned assembler or pass
`hookFunctions` to an assembly call. Per-call hooks follow registered hooks and
override matching stage-prefixed names without changing subsequent assemblies.
For WGSL mutable arguments, use pointers such as
`fs:FILTER_COLOR(color: ptr<function, vec4<f32>>)` and write through `*color`.

## Composition diagnostics

`mergeShaderPluginModules(modules, pluginModules, {onConflict})` optionally
reports distinct module descriptors sharing a name. The callback receives
`(name, selected, ignored)`. Repeated references to one descriptor are compatible;
separately created descriptors are reported even if structurally equivalent.
Omitting the callback preserves existing behavior. Explicit modules retain
precedence and plugin modules use first-seen name selection.

Plugin contributions are collected in plugin declaration order, selecting each
injection's source for the active language. Hook injections execute in
ascending `order`; equal-order plugin injections retain declaration order.

Legacy application injections append to plugin injections at the same target
instead of replacing them. Module injections follow application injections;
explicit `order` values take precedence over collection order.
