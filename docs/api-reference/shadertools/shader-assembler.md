# ShaderAssembler

`ShaderAssembler` combines application shader source with shadertools modules,
hook functions, and injections before luma.gl creates shader resources. Use
`assembleGLSLShaderPair()` for WebGL/GLSL and `assembleWGSLShader()` for unified
WGSL used by WebGPU.

For WGSL binding relocation and conditionals, see
[WGSL Support](/docs/api-reference/shadertools/wgsl-support).

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
| `prologue?: boolean` | GLSL only: whether to emit the luma.gl shader prologue. |

## Static Methods

### `getDefaultShaderAssembler(): ShaderAssembler`

Returns the shared assembler used by default by engine classes.

## Methods

### `addDefaultModule(module: ShaderModule): void`

Registers a module that is included in later assembly calls unless that module
is already present.

### `removeDefaultModule(module: ShaderModule): void`

Removes a previously registered default module.

### `addShaderHook(hook: string, opts?: object): void`

Registers a stage-prefixed hook function that modules can inject into. GLSL
hook signatures use GLSL syntax, for example
`vs:OFFSET_POSITION(inout vec4 position)`. WGSL hook signatures use WGSL syntax,
for example `vs:OFFSET_POSITION(position: ptr<function, vec4<f32>>)`.

### `assembleGLSLShaderPair(props: AssembleShaderProps)`

Assembles a GLSL vertex/fragment pair and returns `{vs, fs, getUniforms,
modules}`.

### `assembleWGSLShader(props: AssembleShaderProps)`

Assembles one unified WGSL source string and returns `{source, getUniforms,
modules, bindingAssignments, bindingTable}`. Module WGSL source is prepended to
application WGSL, inactive conditional branches are removed, and
`@binding(auto)` declarations are assigned concrete binding numbers before WebGPU
reflection.

## Hooks And Injections

Hooks are deliberate extension points called by application shader code.
Modules add source by using the same stage-prefixed key without the function
signature.

```typescript
shaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};
```

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
entry point in the unified source. See the
[Shader Hooks guide](/docs/api-guide/shaders/shader-hooks) for the user-facing
pattern.
