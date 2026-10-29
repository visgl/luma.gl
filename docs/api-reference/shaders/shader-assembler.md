import {ShadersDocsTabs} from '@site/src/components/docs/shaders-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# ShaderAssembler

<ShadersDocsTabs active="shader-assembler" />

`ShaderAssembler` is the abstract base for stateful shader assembly. Its concrete
subclasses combine application shader source with shaders modules, hook
functions, and injections before luma.gl creates shader resources:

- `GLSLShaderAssembler` assembles GLSL vertex and fragment shaders for WebGL.
- `WGSLShaderAssembler` assembles unified WGSL shaders for WebGPU.

Applications construct and pass language-specific assemblers. Models and computations create
owned assemblers when none is supplied; share an instance explicitly when several consumers
should use the same hooks, modules, or transpilers.

For the assembly model, see
[Shader Assembly](/docs/api-guide/shaders/shader-assembly). For extension design,
see [Writing Customizable Shaders](/docs/api-guide/shaders/writing-customizable-shaders).
For WGSL binding relocation and conditionals, see
[WGSL Support](/docs/api-reference/shaders/wgsl-support).

<DocumentationContract title="ShaderAssembler" rows={[
  {label: 'Languages', value: 'Separate stateful GLSL and WGSL assembler implementations'},
  {label: 'Dependencies', value: 'Initializes, resolves, de-duplicates, and orders module dependencies'},
  {label: 'Hooks and injections', value: 'Combines registered hook contracts with ordered module and application injections'},
  {label: 'Inputs', value: 'Application source, platform information, modules, defines, and injection maps'},
  {label: 'Output', value: 'Assembled source, resolved modules, layout metadata, and combined uniform mapping'},
  {label: 'Cost', value: 'Assemble when source configuration changes, before pipeline creation—not per draw'}
]} />

:::warning Common mistake
Registering hooks on an assembler does not automatically configure other models. Pass the
configured instance through `shaderAssembler` to each model or computation that should use it.
:::

## Language entry points

Import `GLSLShaderAssembler` from `@luma.gl/shaders/glsl` and `WGSLShaderAssembler` from
`@luma.gl/shaders/wgsl`. The shared `ShaderAssembler` contract can be imported as a type from
the root or either language entry. Each language entry loads its own assembler and assembly backend;
shared modules, hooks, uniforms and transpiler contracts retain their existing behavior.
The WGSL entry also retains `scanWGSLInterface` and exports WGSL binding diagnostics.

Root assembler exports remain available and share constructor identity with the subpaths, including
for CommonJS. The deprecated `ShaderAssembler.getDefaultShaderAssembler(...)` factory is initialized
only by the root runtime facade. New code should construct and pass a language-specific assembler.

## Usage

```typescript
import {GLSLShaderAssembler} from '@luma.gl/shaders/glsl';
import {WGSLShaderAssembler} from '@luma.gl/shaders/wgsl';

const glslShaderAssembler = new GLSLShaderAssembler();
glslShaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

const assembledShaders = glslShaderAssembler.assembleGLSLShaderPair({
  platformInfo: glslPlatformInfo,
  vs: vertexShaderSource,
  fs: fragmentShaderSource,
  modules: [offsetLeftModule]
});

const wgslShaderAssembler = new WGSLShaderAssembler();
const assembledWGSLShader = wgslShaderAssembler.assembleWGSLShader({
  platformInfo: wgslPlatformInfo,
  source: wgslShaderSource,
  modules: [offsetLeftModule]
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
| `hookFunctions?: (ShaderHook \| string)[]` | Hook functions to emit into assembled source. |
| `inject?: Record<string, string \| ShaderInjection>` | Named hook or standard injection source. |
| `pluginInjections?: Record<string, ShaderInjection[]>` | Ordered named injections already resolved from `ShaderPlugin` descriptors. |
| `pluginVertexInputs?: Record<string, AttributeShaderType>` | Render-shader vertex inputs already resolved from `ShaderPlugin` descriptors. |
| `vertexEntryPoint?: string` | WGSL vertex entry point selected by the render pipeline. Defaults to `vertexMain`. |
| `fragmentEntryPoint?: string` | WGSL fragment entry point selected by the render pipeline. Defaults to `fragmentMain`. |
| `prologue?: boolean` | GLSL only: whether to emit the luma.gl shader prologue. |

## Static Methods

### `getDefaultShaderAssembler('glsl'): GLSLShaderAssembler`

### `getDefaultShaderAssembler('wgsl'): WGSLShaderAssembler`

Deprecated compatibility API. The language argument remains required. New code should
construct a `GLSLShaderAssembler` or `WGSLShaderAssembler` and pass it explicitly.
Engine, gpgpu and graph no longer read these shared defaults.

## Methods

### `addDefaultModule(module: ShaderModule): void`

Registers a module that is included in later assembly calls unless that module
is already present.

### `removeDefaultModule(module: ShaderModule): void`

Removes a previously registered default module.

### `addShaderHook(hook: string, options?: ShaderHookOptions): void`

Registers a stage-prefixed hook function that modules can inject into. GLSL
hook signatures use GLSL syntax, for example
`vs:OFFSET_POSITION(inout vec4 position)`. WGSL hook signatures use WGSL syntax,
for example `vs:OFFSET_POSITION(position: ptr<function, vec4<f32>>)`.
`options.header` and `options.footer` are emitted at the start and end of the
generated hook function.

### `resetShaderHooks(): void`

Removes every hook registered with `addShaderHook()`. Default modules are not
affected. Use this instead of mutating assembler internals when an application
needs to re-register its hooks.

### `GLSLShaderAssembler.assembleGLSLShaderPair(props: AssembleShaderProps)`

Assembles a GLSL vertex/fragment pair and returns `{vs, fs, getUniforms,
modules}`.

### `WGSLShaderAssembler.assembleWGSLShader(props: AssembleShaderProps)`

Assembles one unified WGSL source string and returns `{source, getUniforms,
modules, bindingAssignments, bindingTable}`. Module WGSL source is prepended to
application WGSL, inactive conditional branches are removed, and
`@binding(auto)` declarations are assigned concrete binding numbers before WebGPU
reflection.

## Hooks And Injections

Hooks are deliberate extension points called by application shader code. The
base shader registers a stage-prefixed hook signature, calls the generated hook
function, and lets modules or plugin contributions add ordered source by using
the same stage-prefixed key without the function signature.

```typescript
glslShaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};
```

```glsl
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  OFFSET_POSITION(gl_Position);
}
```

If no module injects into a hook, the generated hook function is a no-op. WGSL
uses the same flow with WGSL hook signatures and pointer arguments:

```typescript
wgslShaderAssembler.addShaderHook('vs:OFFSET_POSITION(position: ptr<function, vec4<f32>>)');
```

```wgsl
@vertex
fn vertexMain(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
  var shaderPosition = vec4<f32>(position, 0.0, 1.0);
  OFFSET_POSITION(&shaderPosition);
  return shaderPosition;
}
```

Named hook injections must target a hook registered for the shader stage. WGSL
ignores module injections for unregistered hooks because module injections may contain
GLSL-only code.

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
entry point in the unified source. `ShaderPlugin` accepts only named hook and
standard anchor targets; lower-level assembler `inject` also preserves the
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
compiler runs. Native modules, hooks, and injections are assembled afterward in
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
