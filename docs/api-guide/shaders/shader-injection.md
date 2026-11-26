import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Shader Injection

<ShaderLevelDocsTabs active="shader-injection" />

Shader injection lets an application keep control of its shader source while optional
features add code at named locations. A **target** identifies where code can be added;
an **injection** supplies the code. A `ShaderPlugin` can declare callable targets,
contribute injections, or do both.

## Injection targets

Every target belongs to a shader stage. The built-in targets need no declaration:

| Target | Placement |
| --- | --- |
| `vs:#decl`, `fs:#decl` | Declarations near the top of the vertex or fragment shader. |
| `vs:#main-start`, `fs:#main-start` | Statements at the start of the stage's main function. |
| `vs:#main-end`, `fs:#main-end` | Statements at the end of the stage's main function. |

For WGSL, the vertex and fragment targets refer to the matching entry points in
the unified source. Use `#decl` for functions and globals, and the main targets
for short statements tied to entry-point flow.

A shader can also expose a **callable target** such as `vs:OFFSET_POSITION` or
`fs:FILTER_COLOR`. Declare its signature and call the generated function in the
host shader. The assembler generates an empty function when nothing injects into
it, so the host can call it unconditionally.

```typescript
import type {ShaderPlugin} from '@luma.gl/shaders';

const positionTarget: ShaderPlugin = {
  name: 'position-target',
  injectionTargets: [{
    name: 'OFFSET_POSITION',
    stage: 'vertex',
    glsl: {parameters: 'inout vec4 position'},
    wgsl: {parameters: 'position: ptr<function, vec4<f32>>'}
  }]
};
```

<Tabs groupId="shader-language">
<TabItem value="glsl" label="GLSL">

```glsl
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  OFFSET_POSITION(gl_Position);
}
```

</TabItem>
<TabItem value="wgsl" label="WGSL">

```wgsl
@vertex
fn vertexMain(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
  var shaderPosition = vec4<f32>(position, 0.0, 1.0);
  OFFSET_POSITION(&shaderPosition);
  return shaderPosition;
}
```

</TabItem>
</Tabs>

GLSL `inout` lets injected statements modify the caller's `gl_Position`.
WGSL passes a pointer to a mutable local; injected statements write through
`(*position)`. A declaration describes a function signature;
it does not insert the call into the host shader. `ShaderInjectionTarget` has
`name`, `stage`, and optional `glsl`/`wgsl` objects. Each language object has
`parameters` and optional `returnType`, `header`, and `footer`. A target with a
return value needs a default return path in its header or footer.

An application can register a target on a configured `GLSLShaderAssembler` or
`WGSLShaderAssembler` with `addShaderInjectionTarget()`, or pass per-assembly
`injectionTargets`. A plugin declares targets through its `injectionTargets`
field. A named target must be declared for the active language and stage before
an injection can use it. Conflicting declarations fail during assembly.

## Injections

An injection selects a stage and target and provides source for one or both
shader languages. `ShaderInjection.target` names the target without the stage
prefix. For example, an optional plugin can modify the callable target above:

```typescript
const offsetLeftPlugin: ShaderPlugin = {
  name: 'offset-left',
  injections: [{
    stage: 'vertex',
    target: 'OFFSET_POSITION',
    glsl: 'position.x -= 0.5;',
    wgsl: '(*position).x -= 0.5;',
    order: 0
  }]
};
```

Attach both plugins to a `Model` with `plugins: [positionTarget,
offsetLeftPlugin]`. The target provider and injection provider can be separate;
the assembler collects declarations before validating injections. A missing
language variant contributes no source in that language.

### Multiple injections and ordering

Any number of plugins can contribute to the same target. They all run inside
the generated target function. For example, these two injections first scale
the position, then shift it left:

```typescript
const scalePlugin: ShaderPlugin = {
  name: 'scale-position',
  injections: [{
    stage: 'vertex', target: 'OFFSET_POSITION', order: -10,
    glsl: 'position.xy *= 2.0;',
    wgsl: '(*position).x *= 2.0; (*position).y *= 2.0;'
  }]
};

const shiftPlugin: ShaderPlugin = {
  name: 'shift-position',
  injections: [{
    stage: 'vertex', target: 'OFFSET_POSITION', order: 10,
    glsl: 'position.x -= 0.5;',
    wgsl: '(*position).x -= 0.5;'
  }]
};

const model = new Model(device, {
  // ...shader source and attributes...
  plugins: [positionTarget, shiftPlugin, scalePlugin]
});
```

The assembler sorts injections by ascending `order`, which defaults to `0`.
The `scalePlugin` runs before `shiftPlugin` despite their order in `plugins`.
Equal order values preserve the order of injections within a plugin and the
order of plugins in the `plugins` array. Application `inject` entries follow
plugin injections when their orders are equal. Use explicit order values only
when one operation depends on another; otherwise, keep the default and choose
the plugin order at the call site.

An application calling the assembler directly can add its own injections on
top of plugin contributions. The same target can receive both:

```typescript
import {resolveShaderPlugins, type ShaderInjection} from '@luma.gl/shaders';

const resolvedPlugins = resolveShaderPlugins(
  [positionTarget, scalePlugin, shiftPlugin], 'glsl'
);
const applicationInjections: ShaderInjection[] = [{
  stage: 'vertex', target: 'OFFSET_POSITION', order: 20,
  glsl: 'position.y += 0.25;'
}];

const assembledShaders = glslShaderAssembler.assembleGLSLShaderPair({
  platformInfo,
  vs: vertexShaderSource,
  fs: fragmentShaderSource,
  modules: resolvedPlugins.modules,
  pluginInjectionTargets: resolvedPlugins.injectionTargets,
  pluginInjections: resolvedPlugins.injections,
  inject: applicationInjections
});
```

Here the generated `OFFSET_POSITION` body scales (`-10`), shifts (`10`), then
moves upward (`20`). The application injection could instead use `order: 0` to
run between the two plugin injections. When orders tie, plugin contributions
come first because they are collected before application `inject` entries.

Use a built-in target when the host does not need a callable function:

```typescript
const tintPlugin: ShaderPlugin = {
  name: 'tint',
  injections: [{
    stage: 'fragment',
    target: '#decl',
    glsl: 'vec4 plugin_tint(vec4 color) { return color * vec4(1.0, 0.5, 0.5, 1.0); }',
    wgsl: 'fn pluginTint(color: vec4<f32>) -> vec4<f32> { return color * vec4<f32>(1.0, 0.5, 0.5, 1.0); }'
  }]
};
```

Plugin injections also support string keys such as `glsl:fs:FILTER_COLOR` and
`wgsl:fs:FILTER_COLOR`. Object entries are clearer when one injection has both
language sources or an explicit order. The lower-level assembler `inject` option
accepts the same `ShaderInjection[]` and preserves its existing source-map form.

## Choosing a target

Declare a callable target when a base shader intentionally exposes an operation
that extensions can customize, such as position offset or color filtering.
Keep its arguments narrow and give it a semantic name. Use built-in targets
for declarations or small additions to an entry point. Put reusable functions,
uniforms, and bindings in a `ShaderModule`; a plugin can attach one primary
module and place supporting modules in its dependencies. The application still
owns the base shader, buffer layout, buffers, and resource lifecycle.

See the [ShaderPlugin](/docs/api-reference/shaders/shader-plugin) and
[ShaderAssembler](/docs/api-reference/shaders/shader-assembler) reference pages
for exact fields, and the [Shader Injection tutorial](/docs/tutorials/shader-injection)
for a runnable example.
