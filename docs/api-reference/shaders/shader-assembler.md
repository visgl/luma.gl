import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import {ShadersDocsTabs} from '@site/src/components/docs/shaders-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# ShaderAssembler

<ShadersDocsTabs active="shader-assembler" />

`ShaderAssembler` is the abstract base for stateful shader assembly. Its concrete
subclasses combine application shader source with shader modules, callable injection targets, and injections before luma.gl creates shader resources:

- `GLSLShaderAssembler` assembles GLSL vertex and fragment shaders for WebGL.
- `WGSLShaderAssembler` assembles unified WGSL shaders for WebGPU.

Applications construct and pass language-specific assemblers. Models and computations create
owned assemblers when none is supplied; share an instance explicitly when several consumers
should use the same injection targets, modules, or transpilers.

For the assembly model, see
[Shader Assembly](/docs/api-guide/shaders/shader-assembly). For extension design,
see [Shader Injection](/docs/api-guide/shaders/shader-injection).
For WGSL binding relocation and conditionals, see
[WGSL Support](/docs/api-reference/shaders/wgsl-support).

<DocumentationContract title="ShaderAssembler" rows={[
  {label: 'Languages', value: 'Separate stateful GLSL and WGSL assembler implementations'},
  {label: 'Dependencies', value: 'Initializes, resolves, de-duplicates, and orders module dependencies'},
  {label: 'Injection targets and injections', value: 'Combines registered injection target contracts with ordered plugin and application injections'},
  {label: 'Inputs', value: 'Application source, platform information, modules, defines, and injection maps'},
  {label: 'Output', value: 'Assembled source, resolved modules, layout metadata, and combined uniform mapping'},
  {label: 'Cost', value: 'Assemble when source configuration changes, before pipeline creation—not per draw'}
]} />

:::warning Common mistake
Registering targets on an assembler does not automatically configure other models. Pass the
configured instance through `shaderAssembler` to each model or computation that should use it.
:::

## Language entry points

Import `GLSLShaderAssembler` from `@luma.gl/shaders/glsl` and `WGSLShaderAssembler` from
`@luma.gl/shaders/wgsl`. The shared `ShaderAssembler` contract can be imported as a type from
the root or either language entry. Each language entry loads its own assembler and assembly backend;
shared modules, injection targets, uniforms and transpiler contracts retain their existing behavior.
The WGSL entry also retains `scanWGSLInterface` and exports WGSL binding diagnostics.

Root assembler exports remain available and share constructor identity with the subpaths, including
for CommonJS. Construct and pass a language-specific assembler; there is no global default factory.

## Usage

```typescript
import {resolveShaderPlugins, type ShaderPlugin} from '@luma.gl/shaders';
import {GLSLShaderAssembler} from '@luma.gl/shaders/glsl';
import {WGSLShaderAssembler} from '@luma.gl/shaders/wgsl';

const offsetLeftPlugin: ShaderPlugin = {
  name: 'offset-left',
  injections: [{
    stage: 'vertex',
    target: 'OFFSET_POSITION',
    glsl: 'position.x -= 0.5;',
    wgsl: '(*position).x -= 0.5;'
  }]
};

const glslShaderAssembler = new GLSLShaderAssembler();
glslShaderAssembler.addShaderInjectionTarget({name: 'OFFSET_POSITION', stage: 'vertex', glsl: {parameters: 'inout vec4 position'}});
const glslPlugin = resolveShaderPlugins([offsetLeftPlugin], 'glsl');
const assembledShaders = glslShaderAssembler.assembleGLSLShaderPair({
  platformInfo: glslPlatformInfo,
  vs: vertexShaderSource,
  fs: fragmentShaderSource,
  modules: glslPlugin.modules,
  pluginInjections: glslPlugin.injections
});

const wgslShaderAssembler = new WGSLShaderAssembler();
wgslShaderAssembler.addShaderInjectionTarget({name: 'OFFSET_POSITION', stage: 'vertex', wgsl: {parameters: 'position: ptr<function, vec4<f32>>'}});
const wgslPlugin = resolveShaderPlugins([offsetLeftPlugin], 'wgsl');
const assembledWGSLShader = wgslShaderAssembler.assembleWGSLShader({
  platformInfo: wgslPlatformInfo,
  source: wgslShaderSource,
  modules: wgslPlugin.modules,
  pluginInjections: wgslPlugin.injections
});

const isolatedGLSLShaderAssembler = new GLSLShaderAssembler();
const isolatedWGSLShaderAssembler = new WGSLShaderAssembler();
```

## Types

### `AssembleShaderProps`

Common assembly props:

| Property | Description |
| --- | --- |
| `platformInfo: PlatformInfo` | Current backend, shader language, device limits, and features. |
| `source?: string` | Unified WGSL source for `assembleWGSLShader()`. |
| `vs?: string` | GLSL vertex shader source for `assembleGLSLShaderPair()`. |
| `fs?: string` | GLSL fragment shader source for `assembleGLSLShaderPair()`. |
| `modules?: ShaderModule[]` | Shader modules to resolve and add to the assembled source. |
| `defines?: Record<string, boolean \| number>` | Boolean or numeric preprocessor defines used while assembling shader source. |
| `injectionTargets?: readonly ShaderInjectionTarget[]` | Callable targets to emit into assembled source. |
| `inject?: ShaderInjection[] \| Record<string, string \| ResolvedShaderInjection>` | Named target or standard injection source. |
| `pluginInjections?: Record<string, ResolvedShaderInjection[]>` | Ordered named injections already resolved from `ShaderPlugin` descriptors. |
| `pluginVertexInputs?: Record<string, AttributeShaderType>` | Render-shader vertex inputs already resolved from `ShaderPlugin` descriptors. |
| `vertexEntryPoint?: string` | WGSL vertex entry point selected by the render pipeline. Defaults to `vertexMain`. |
| `fragmentEntryPoint?: string` | WGSL fragment entry point selected by the render pipeline. Defaults to `fragmentMain`. |
| `prologue?: boolean` | GLSL only: whether to emit the luma.gl shader prologue. |

## Methods

### `addDefaultModule(module: ShaderModule): void`

Registers a module that is included in later assembly calls unless that module
is already present.

### `removeDefaultModule(module: ShaderModule): void`

Removes a previously registered default module.

### `addShaderInjectionTarget(target: ShaderInjectionTarget): void`

Registers one callable injection target with language-specific source:

```typescript
const target: ShaderInjectionTarget = {
  name: 'OFFSET_POSITION',
  stage: 'vertex',
  glsl: {parameters: 'inout vec4 position'},
  wgsl: {parameters: 'position: ptr<function, vec4<f32>>'}
};
glslShaderAssembler.addShaderInjectionTarget(target);
wgslShaderAssembler.addShaderInjectionTarget(target);
```

Import `ShaderInjectionTarget` from `@luma.gl/shaders`. `stage` is `vertex` or `fragment`.
Each language implementation supplies `parameters` without parentheses and optional
`header` and `footer` source around injected code. Set `returnType` to a GLSL or
WGSL type to return a value. Omit it (or use `void`) for a callable target with no return value.
A value-returning target must provide a default return path in its header/footer.
WGSL targets share one function namespace: use distinct names for vertex and fragment injection targets. Missing language implementations
are skipped. Registration and assembly do not modify descriptors.

Injection targets remain `vs:OFFSET_POSITION` and `fs:TARGET_NAME`. Use root-level
`injections` on ShaderPlugin, with `glsl` and `wgsl` source on each entry, for
language-specific bodies. Shared target names do not translate injection source. Shaders still call the target explicitly,
using GLSL `inout` arguments or WGSL pointers as appropriate.

### `resetShaderInjectionTargets(): void`

Removes every target registered with `addShaderInjectionTarget()`. Default modules are not
affected. Use this instead of mutating assembler internals when an application
needs to re-register its injection targets.

### `GLSLShaderAssembler.assembleGLSLShaderPair(props: AssembleShaderProps)`

Assembles a GLSL vertex/fragment pair and returns `{vs, fs, getUniforms,
modules}`.

### `WGSLShaderAssembler.assembleWGSLShader(props: AssembleShaderProps)`

Assembles one unified WGSL source string and returns `{source, getUniforms,
modules, bindingAssignments, bindingTable}`. Module WGSL source is prepended to
application WGSL, inactive conditional branches are removed, and
`@binding(auto)` declarations are assigned concrete binding numbers before WebGPU
reflection.

## Injection Targets And Injections

Callable injection targets are deliberate extension points called by application shader code. The
base shader registers a stage-prefixed injection target signature, calls the generated target
function, and lets plugin contributions add ordered source by targeting the
registered target name and stage.

<Tabs groupId="shader-language">
<TabItem value="glsl" label="GLSL">

```typescript
glslShaderAssembler.addShaderInjectionTarget({name: 'OFFSET_POSITION', stage: 'vertex', glsl: {parameters: 'inout vec4 position'}});

const offsetLeftPlugin: ShaderPlugin = {
  name: 'offsetLeft',
  injections: [{stage: 'vertex', target: 'OFFSET_POSITION', glsl: 'position.x -= 0.5;'}]
};
```

```glsl
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  OFFSET_POSITION(gl_Position);
}
```


</TabItem>
<TabItem value="wgsl" label="WGSL">

```typescript
wgslShaderAssembler.addShaderInjectionTarget({name: 'OFFSET_POSITION', stage: 'vertex', wgsl: {parameters: 'position: ptr<function, vec4<f32>>'}});
```

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

If no plugin injects into a callable target, the generated target function is a no-op.
WGSL uses pointer arguments for mutable values.

Named target injections must target a callable target registered for the shader stage.
Plugin injections targeting undeclared targets fail during assembly.

Standard named injections are also available:

| Key | Shader | Description |
| --- | --- | --- |
| `vs:#decl` | Vertex | Inject declarations near the top of the vertex shader. |
| `vs:#main-start` | Vertex | Inject at the beginning of the vertex main function. |
| `vs:#main-end` | Vertex | Inject at the end of the vertex main function. |
| `fs:#decl` | Fragment | Inject declarations near the top of the fragment shader. |
| `fs:#main-start` | Fragment | Inject at the beginning of the fragment main function. |
| `fs:#main-end` | Fragment | Inject at the end of the fragment main function. |

For assembled WGSL, these keys target the matching `@vertex` or `@fragment`
entry point in the unified source. `ShaderPlugin` accepts only named target and
built-in targets; lower-level assembler `inject` also preserves the
legacy arbitrary text-replacement escape hatch.

## Application-owned transpilers

Call `addShaderTranspiler({name, sourceLanguage, transpile})` on an assembler to
register a synchronous compiler for an input language. Registration is local to
that assembler; registering the same language replaces its compiler.
`removeShaderTranspiler(sourceLanguage)` removes it. Shaders neither imports
nor installs a compiler. The application imports the implementation and supplies
the callback, keeping unused compiler code out of its bundle.

Set `sourceLanguage` on assembly options, `Model`, or `Computation`. GLSL uses
`vs` and `fs` as separate source-language translation units. WGSL uses `source`
as one translation unit, including all requested render or compute entries.
The callback receives `source`, `target`, `stage`, `entryPoints`, and
`platformInfo`, and returns `{code, entryPoints?}`. `stage` is set for GLSL or
compute; unified WGSL render compilation leaves it undefined. Returned
entry-point names are used for WGSL interface scanning and pipeline creation.
For direct WGSL compute assembly, set `shaderStage: 'compute'` even if the entry-point
name is omitted. `Computation` sets this automatically. An explicit `computeEntryPoint`
also selects compute compilation for compatibility. Omitted names remain undefined so
the compiler can select its default entry point. Compiler diagnostics propagate to the caller.

Reusable modules can set `{name, sourceLanguage, source}`. Their dependency code
is combined, once per module name, ahead of the application source before the
compiler runs. Native modules, injection targets, and injections are assembled afterward in
the **target language**. Module uniform getters and other metadata are preserved.
Foreign modules must use the same language as the application translation unit;
calling foreign helpers from native application source is not supported.
Source-language modules should declare their uniforms and resources in their
source and supply matching binding/uniform metadata and packing where needed.
Automatic resource-name or uniform-layout translation is not part of this API.

For example, an application using the experimental `@luma.gl/slang` package (available from v10)
can register an adapter. These imports belong to the application:

```typescript
import {transpileSlang, transpileSlangWGSL} from '@luma.gl/slang';
import {type ShaderTranspiler} from '@luma.gl/shaders';

const slangTranspiler: ShaderTranspiler = {
  name: 'slang',
  sourceLanguage: 'slang',
  transpile({source, target, stage, entryPoints}) {
    if (target === 'glsl') {
      return transpileSlang(source, {
        target,
        glslVersion: '300 es',
        stage,
        entryPoint: stage ? entryPoints[stage] : undefined
      });
    }
    const selected = Object.values(entryPoints).filter(
      (entryPoint): entryPoint is string => Boolean(entryPoint)
    );
    const result = transpileSlangWGSL(source, {
      entryPoints: selected.length ? selected : undefined
    });
    return {
      code: result.code,
      entryPoints: Object.fromEntries(
        Object.values(result.entryPoints).map(entry => [entry.stage, entry.entryPoint])
      )
    };
  }
};

const glslShaderAssembler = new GLSLShaderAssembler();
const wgslShaderAssembler = new WGSLShaderAssembler();
glslShaderAssembler.addShaderTranspiler(slangTranspiler);
wgslShaderAssembler.addShaderTranspiler(slangTranspiler);
// Pass the configured assembler to Model or Computation via shaderAssembler.
```

The [Slang Shaders example](/examples/tutorials/slang-shaders) demonstrates this adapter
with animated ray-marched geometry, lighting, and a floor reflection. Its reusable Slang
distance-field and material modules run on both backends, with camera and material controls.

Slang remains a practical shader-authoring subset with documented limits.
The adapter must select supported entry points and follow its resource layout
rules; registering it does not add full Slang compiler compatibility.


## Shared injection declarations

`ShaderInjectionTarget` and `ShaderInjection` describe extension points and source independently
of where they are registered. Register targets with `addShaderInjectionTarget()` or pass them as
assembly `injectionTargets` or plugin `injectionTargets`. Pass the same `ShaderInjection[]` to
application-level `inject` or plugin `injections`:

```typescript
import type {ShaderInjection} from '@luma.gl/shaders';

const injections: ShaderInjection[] = [{
  stage: 'fragment',
  target: 'FILTER_COLOR',
  glsl: 'color.r *= 0.5;',
  wgsl: '(*color).r *= 0.5;',
  order: 0
}];

const shaders = glslShaderAssembler.assembleGLSLShaderPair({
  platformInfo, vs, fs, inject: injections
});
```

Declare and call `FILTER_COLOR` in the host shader. Missing language implementations
are skipped; injections into undeclared targets throw. Repeated targets retain all
injections, sorted by `order` with declaration order breaking ties. Application
injections follow plugin injections when orders tie.

The existing application injection map also accepts native source or
`ResolvedShaderInjection` values. `ResolvedShaderInjection` represents selected
source with an injection order and optional plugin provenance; it has no language variants.
