# ShaderPlugin

`ShaderPlugin` groups reusable shader assembly contributions that can be
attached to [`Model`](/docs/api-reference/engine/model) and
[`Computation`](/docs/api-reference/engine/compute/computation). Prefer plugins
as the application-facing optional composition layer when a behavior needs
modules, defines, shader-facing vertex inputs, named injections, portable
cross-stage varyings, or backend-specific shader source.

For the authoring model, see
[Writing Customizable Shaders](/docs/api-guide/shaders/writing-customizable-shaders).

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
import type {ShaderInjection, ShaderModule} from '@luma.gl/shadertools';

export type ShaderPlugin = {
  name: string;
  modules?: ShaderModule[];
  defines?: Record<string, boolean>;
  injections?: ShaderPluginInjection[];
  vertexInputs?: Record<string, AttributeShaderType>;
  varyings?: Record<string, ShaderPluginVarying>;
  glsl?: ShaderPluginVariant;
  wgsl?: ShaderPluginVariant;
};

export type ShaderPluginVariant = {
  modules?: ShaderModule[];
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
  injection: string;
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

## Resolution

| Field | Resolution |
| --- | --- |
| Top-level `modules`, `defines`, `injections`, `vertexInputs`, and `varyings` | Shared across shader languages. |
| `glsl` | Added for GLSL assembly. |
| `wgsl` | Added for WGSL assembly. |
| Backend define keys | Override same-named shared define keys. |
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
  glsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: 'vec4 plugin_getTint() { return vec4(1.0, 0.4, 0.2, 1.0); }'
      }
    ]
  },
  wgsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: 'fn pluginGetTint() -> vec4<f32> { return vec4<f32>(1.0, 0.4, 0.2, 1.0); }'
      }
    ]
  }
};
```

For runnable examples, see [Shader Plugins](/docs/tutorials/shader-plugins) and
[Arrow ShaderPlugin Filtering](/examples/arrow/arrow-filtering).
