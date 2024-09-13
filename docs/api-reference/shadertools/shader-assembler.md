# ShaderAssembler

The functionality of the `shadertools` module shader system is primarily exposed 
via the `ShaderAssembler` class.

`shaderAssebler.assembleShaders()` composes base vertex and fragment shader source with 
- shader modules 
- hook functions 
- and injections 
to generate the final vertex and fragment shader source that can be used to create a program.

## Types

## `AssembleShaderOptions`

For single shader compilation
- `source` - single shader source (always WGSL)

For shader pair compilation
- `vs` - vertex shader source
- `fs` - fragment shader source code

Common options
- `prologue`=`true` (Boolean) - Will inject platform prologue (see below)
- `defines`=`{}` (Object) - a map of key/value pairs representing custom `#define`s to be injected into the shader source
- `modules`=`[]` (Array) - list of shader modules
- `inject`=`{}` (Object) - map of substituions,
- `hookFunctions`=`[]` Array of hook functions descriptions. Descriptions can simply be the hook function signature (with a prefix `vs` for vertex shader, or `fs` for fragment shader) or an object with the hook signature, and a header and footer that will always appear in the hook function.

Example of hook function

```typescript
[
  'vs:MY_HOOK_FUNCTION1(inout vec4 color)',
  {
    hook: 'fs:MY_HOOK_FUNCTION2(inout vec4 color)',
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  }
];
```

## Static Methods

### `getDefaultShaderAssembler()`

Most applications that register default modules and hooks will want to use a single `ShaderAssembler`

## Methods

### `addDefaultModule(module: ShaderModule)`

Add a module that will automatically be added to any programs created by the program manager.

### `removeDefaultModule(module: ShaderModule)`

Remove a module that is automatically being added to programs created by the program manager.

### `addShaderHook(hook: string, [opts: Object])`

Creates a shader hook function that shader modules can injection code into. Shaders can call these functions, which will be no-ops by default. If a shader module injects code it will be executed upon the hook function call. This mechanism allows the application to create shaders that can be automatically extended by included shader modules.

- `hook`: `vs:` or `fs:` followed by the name and arguments of the function, e.g. `vs:MYHOOK_func(inout vec4 value)`. Hook name without arguments
  will also be used as the name of the shader hook
- `opts.header` (optional): code always included at the beginning of a hook function
- `opts.footer` (optional): code always included at the end of a hook function

### `assembleShader(options: AssembleShaderOptions)`

generate the shader source that can be used to create a shader and then a pipeline.

- composes a single shader source (compute or unified vertex/fragment WGSL shader) with source from shader modules, 
- resolving hook functions and injections to 


Returns:

- `vs` - the resolved vertex shader
- `fs` - the resolved fragment shader
- `getUniforms` - a combined `getUniforms` function covering all modules.

### `assembleShaderPair(options: AssembleShaderOptions)`

Generate the final vertex and fragment shader source that can be compiled to create two shaders and then link them into a pipeline.

- composes base vertex and fragment shader source with source from shader modules
- resolves hook functions and injections

Takes the source code of a vertex shader and a fragment shader, and a list of modules, defines, etc. Outputs resolved source code for both shaders, after adding prologue, adding defines, and importing modules, and injecting any shader fragments).

Returns:

- `vs` - the resolved vertex shader
- `fs` - the resolved fragment shader
- `getUniforms` - a combined `getUniforms` function covering all modules.

## Shader Module Assembly

luma.gl's module shader system is primarily exposed via the function `assembleShaders` which composes base vertex and fragment shader source with shader modules, hook functions and injections to generate the final vertex and fragment shader source that can be used to create a program.

## Shader Hooks and Module Injections

Shader hooks and module injections are a system that allows for shader to be written in a generic manner, with behaviour modified when modules are included. For example if we define a shader hook as `fs:MY_HOOK_FUNCTION(inout vec4 color)`, `assembleShader` will inject the following function automatically into our fragment shader:

```c
void MY_HOOK_FUNCTION(inout vec4 color) {

}
```

We can the write our fragment shader as follows:

```c
precision highp float;

void main() {
  vec4 color = vec4(1.0);
  gl_FragColor = MY_HOOK_FUNCTION(color)
}
```

By default, the hook function is a no-op, so this doesn't do anything. However, if we add a module injection like the following:

```typescript
{
  picking: {
    'fs:VERTEX_HOOK_FUNCTION': 'color = vec4(1.0, 0.0, 0.0, 1.0);'
  }
}
```

And pass the `picking` module to `assembledShaders`, the hook function will be updated as follows:

```c
void MY_HOOK_FUNCTION(inout vec4 color) {
  color = vec4(1.0, 0.0, 0.0, 1.0);
}
```

The hook function now changes the color from white to red.


## Constants and Values

### Predefined Injection Hooks

| Key              | Shader   | Description                                     |
| ---------------- | -------- | ----------------------------------------------- |
| `vs:#decl`       | Vertex   | Inject at top of shader (declarations)          |
| `vs:#main-start` | Vertex   | Injected at the very beginning of main function |
| `vs:#main-end`   | Vertex   | Injected at the very end of main function       |
| `fs:#decl`       | Fragment | Inject at top of shader (declarations)          |
| `fs:#main-start` | Fragment | Injected at the very beginning of main function |
| `fs:#main-end`   | Fragment | Injected at the very end of main function       |

**NOTE**: Injections assume that the `main` function appears last in a shader.

## Usage

### Injection Map

`assembleShaders` (and `Model` constructor) will take an `inject` argument that contains a map of:

- keys indicating hooks (predefined or functions)
- values representing code to be injected. This can be either a simple string or an object containing the `injection` string and an `order` indicating its priority.

Examples:

```
  inject: {
    'fs:#main-end': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
```

```typescript
ProgramManager.getDefaultProgramManager(gl).addShaderHook('fs:MYHOOK_fragmentColor(inout vec4 color)');

new Model(gl, {
  vs,
  fs: `void main() {
    MYHOOK_fragmentColor(gl_FragColor);
  }`,
  modules: [picking]
  inject: {
    'fs:#main-start': 'gl_FragColor = vec4(1., 0., 0., 1.);';
    'fs:MYHOOK_fragmentColor': {
      injection: '  color = picking_filterColor(color);',
      order: 9999
  }
});
```
