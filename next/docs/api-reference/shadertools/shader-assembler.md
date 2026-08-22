# ShaderAssembler

[ShaderModule](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md)[ShaderPlugin](https://luma.gl/next/docs/api-reference/shadertools/shader-plugin.md)[Assembler](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)[Conventions](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)

`ShaderAssembler` is the abstract base for stateful shader assembly. Its concrete subclasses combine application shader source with shadertools modules, hook functions, and injections before luma.gl creates shader resources:

* `GLSLShaderAssembler` assembles GLSL vertex and fragment shaders for WebGL.
* `WGSLShaderAssembler` assembles unified WGSL shaders for WebGPU.

Each shader language has its own default assembler, keeping language-specific hooks, default modules, and other assembly state isolated.

For the assembly model, see [Shader Assembly](https://luma.gl/next/docs/api-guide/shaders/shader-assembly.md). For extension design, see [Writing Customizable Shaders](https://luma.gl/next/docs/api-guide/shaders/writing-customizable-shaders.md). For WGSL binding relocation and conditionals, see [WGSL Support](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md).

**ShaderAssembler**

* Languages

  Separate stateful GLSL and WGSL assembler implementations

* Dependencies

  Initializes, resolves, de-duplicates, and orders module dependencies

* Hooks and injections

  Combines registered hook contracts with ordered module and application injections

* Inputs

  Application source, platform information, modules, defines, and injection maps

* Output

  Assembled source, resolved modules, layout metadata, and combined uniform mapping

* Cost

  Assemble when source configuration changes, before pipeline creation—not per draw

:::warning Common mistake The default assembler is shared state for one shader language. Register global hooks or default modules deliberately; use an isolated assembler when one application must not affect another. :::

## Usage[​](#usage "Direct link to Usage")

```
import {

  GLSLShaderAssembler,

  ShaderAssembler,

  WGSLShaderAssembler

} from '@luma.gl/shadertools';



const glslShaderAssembler = ShaderAssembler.getDefaultShaderAssembler('glsl');

glslShaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');



const assembledShaders = glslShaderAssembler.assembleGLSLShaderPair({

  platformInfo: glslPlatformInfo,

  vs: vertexShaderSource,

  fs: fragmentShaderSource,

  modules: [offsetLeftModule]

});



const wgslShaderAssembler = ShaderAssembler.getDefaultShaderAssembler('wgsl');

const assembledWGSLShader = wgslShaderAssembler.assembleWGSLShader({

  platformInfo: wgslPlatformInfo,

  source: wgslShaderSource,

  modules: [offsetLeftModule]

});



const isolatedGLSLShaderAssembler = new GLSLShaderAssembler();

const isolatedWGSLShaderAssembler = new WGSLShaderAssembler();
```

## Types[​](#types "Direct link to Types")

### `AssembleShaderProps`[​](#assembleshaderprops "Direct link to assembleshaderprops")

Common assembly props:

| Property                                                   | Description                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `platformInfo: PlatformInfo`                               | Current backend, shader language, device limits, and features.                         |
| `source?: string`                                          | Unified WGSL source for `assembleWGSLShader()`.                                        |
| `vs?: string`                                              | GLSL vertex shader source for `assembleGLSLShaderPair()`.                              |
| `fs?: string`                                              | GLSL fragment shader source for `assembleGLSLShaderPair()`.                            |
| `modules?: ShaderModule[]`                                 | Shader modules to resolve and add to the assembled source.                             |
| `defines?: Record<string, boolean \| number>`              | Boolean or numeric preprocessor defines used while assembling shader source.           |
| `hookFunctions?: (ShaderHook \| string)[]`                 | Hook functions to emit into assembled source.                                          |
| `inject?: Record<string, string \| ShaderInjection>`       | Named hook or standard injection source.                                               |
| `pluginInjections?: Record<string, ShaderInjection[]>`     | Ordered named injections already resolved from `ShaderPlugin` descriptors.             |
| `pluginVertexInputs?: Record<string, AttributeShaderType>` | Render-shader vertex inputs already resolved from `ShaderPlugin` descriptors.          |
| `vertexEntryPoint?: string`                                | WGSL vertex entry point selected by the render pipeline. Defaults to `vertexMain`.     |
| `fragmentEntryPoint?: string`                              | WGSL fragment entry point selected by the render pipeline. Defaults to `fragmentMain`. |
| `prologue?: boolean`                                       | GLSL only: whether to emit the luma.gl shader prologue.                                |

## Static Methods[​](#static-methods "Direct link to Static Methods")

### `getDefaultShaderAssembler('glsl'): GLSLShaderAssembler`[​](#getdefaultshaderassemblerglsl-glslshaderassembler "Direct link to getdefaultshaderassemblerglsl-glslshaderassembler")

### `getDefaultShaderAssembler('wgsl'): WGSLShaderAssembler`[​](#getdefaultshaderassemblerwgsl-wgslshaderassembler "Direct link to getdefaultshaderassemblerwgsl-wgslshaderassembler")

Returns the shared assembler for the explicitly requested shader language. The language argument is required. GLSL and WGSL use separate instances, so registering hooks for one language cannot overwrite or remove hooks for the other.

## Methods[​](#methods "Direct link to Methods")

### `addDefaultModule(module: ShaderModule): void`[​](#adddefaultmodulemodule-shadermodule-void "Direct link to adddefaultmodulemodule-shadermodule-void")

Registers a module that is included in later assembly calls unless that module is already present.

### `removeDefaultModule(module: ShaderModule): void`[​](#removedefaultmodulemodule-shadermodule-void "Direct link to removedefaultmodulemodule-shadermodule-void")

Removes a previously registered default module.

### `addShaderHook(hook: string, opts?: object): void`[​](#addshaderhookhook-string-opts-object-void "Direct link to addshaderhookhook-string-opts-object-void")

Registers a stage-prefixed hook function that modules can inject into. GLSL hook signatures use GLSL syntax, for example `vs:OFFSET_POSITION(inout vec4 position)`. WGSL hook signatures use WGSL syntax, for example `vs:OFFSET_POSITION(position: ptr<function, vec4<f32>>)`.

### `GLSLShaderAssembler.assembleGLSLShaderPair(props: AssembleShaderProps)`[​](#glslshaderassemblerassembleglslshaderpairprops-assembleshaderprops "Direct link to glslshaderassemblerassembleglslshaderpairprops-assembleshaderprops")

Assembles a GLSL vertex/fragment pair and returns `{vs, fs, getUniforms, modules}`.

### `WGSLShaderAssembler.assembleWGSLShader(props: AssembleShaderProps)`[​](#wgslshaderassemblerassemblewgslshaderprops-assembleshaderprops "Direct link to wgslshaderassemblerassemblewgslshaderprops-assembleshaderprops")

Assembles one unified WGSL source string and returns `{source, getUniforms, modules, bindingAssignments, bindingTable}`. Module WGSL source is prepended to application WGSL, inactive conditional branches are removed, and `@binding(auto)` declarations are assigned concrete binding numbers before WebGPU reflection.

## Hooks And Injections[​](#hooks-and-injections "Direct link to Hooks And Injections")

Hooks are deliberate extension points called by application shader code. The base shader registers a stage-prefixed hook signature, calls the generated hook function, and lets modules or plugin contributions add ordered source by using the same stage-prefixed key without the function signature.

```
glslShaderAssembler.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');



const offsetLeftModule = {

  name: 'offsetLeft',

  inject: {

    'vs:OFFSET_POSITION': 'position.x -= 0.5;'

  }

};
```

```
void main() {

  gl_Position = vec4(position, 0.0, 1.0);

  OFFSET_POSITION(gl_Position);

}
```

If no module injects into a hook, the generated hook function is a no-op. WGSL uses the same flow with WGSL hook signatures and pointer arguments:

```
wgslShaderAssembler.addShaderHook('vs:OFFSET_POSITION(position: ptr<function, vec4<f32>>)');
```

```
@vertex

fn vertexMain(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {

  var shaderPosition = vec4<f32>(position, 0.0, 1.0);

  OFFSET_POSITION(&shaderPosition);

  return shaderPosition;

}
```

Standard named injections are also available:

| Key              | Shader   | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `vs:#decl`       | Vertex   | Inject declarations near the top of the vertex shader.   |
| `vs:#main-start` | Vertex   | Inject at the beginning of the vertex main function.     |
| `vs:#main-end`   | Vertex   | Inject at the end of the vertex main function.           |
| `fs:#decl`       | Fragment | Inject declarations near the top of the fragment shader. |
| `fs:#main-start` | Fragment | Inject at the beginning of the fragment main function.   |
| `fs:#main-end`   | Fragment | Inject at the end of the fragment main function.         |

For assembled WGSL, these keys target the matching `@vertex` or `@fragment` entry point in the unified source. `ShaderPlugin` accepts only named hook and standard anchor targets; lower-level assembler `inject` also preserves the legacy arbitrary text-replacement escape hatch.
