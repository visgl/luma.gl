# Shadertools API Reference

## Functions

### `getModuleUniforms`

Takes a list of shader module names and an object with options, and creates a combined uniform object that contains all necessary uniforms for all the modules injected into your shader.


### `assembleShaders`

Takes the source code of a vertex shader and a fragment shader, and a list of modules, defines, etc. Outputs resolved source code for both shaders, after adding prologue, adding defines, importing and transpiling modules, and injecting any shader fragments).

* `vs` - vertex shader source
* `fs` - fragment shader source code
* `id` - `id` for the shader, will be used to inject shader names (using `#define SHADER_NAME`) if not already present in the source.
* `prologue`=`true` (Boolean) - Will inject platform prologue (see below)
* `defines`=`{}` (Object) - a map of key/value pairs representing custom `#define`s to be injected into the shader source
* `modules`=`[]` (Array) - list of shader modules (either objects defining the module, or names of previously registered modules)
* `inject`=`{}` (Object) - map of substituions,
* `hookFunctions`=`[]` Array of hook functions descriptions. Descriptions can simply be the hook function signature (with a prefix `vs` for vertex shader, or `fs` for fragment shader) or an object with the hook signature, and a header and footer that will always appear in the hook function. For example:

```js
[
  'vs:MY_HOOK_FUNCTION1(inout vec4 color)',
  {
    hook: 'fs:MY_HOOK_FUNCTION2(inout vec4 color)',
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  }
]
```

* `moduleInjections`=`{}` Map of module names to injection descriptions. Descriptions are a map of hook funciton signatures to either the injection code string, or an object containing the injection code and an `order` option indicating ordering within the hook function. For example:
```js
{
  picking: {
    'vs:VERTEX_HOOK_FUNCTION': 'picking_setPickingColor(color.rgb);',
    'fs:FRAGMENT_HOOK_FUNCTION': {
      injection: 'color = picking_filterColor(color);',
      order: Number.POSITIVE_INFINITY
    },
    'fs:#main-end': 'gl_FragColor = picking_filterColor(gl_FragColor);'
  }
}
```

Returns:
* `vs` - the resolved vertex shader
* `fs` - the resolved fragment shader
* `getUniforms` - a combined `getUniforms` function covering all modules.
* `moduleMap` - a map with all resolved modules, keyed by name


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

```js
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

| Key              | Shader   | Description      |
| ---              | ---      | ---              |
| `vs:#decl`       | Vertex   | Inject at top of shader (declarations) |
| `vs:#main-start` | Vertex   | Injected at the very beginning of main function |
| `vs:#main-end`   | Vertex   | Injected at the very end of main function |
| `fs:#decl`       | Fragment | Inject at top of shader (declarations) |
| `fs:#main-start` | Fragment | Injected at the very beginning of main function |
| `fs:#main-end`   | Fragment | Injected at the very end of main function |

## Usage


### Injection Map

`assembleShaders` (and `Model` constructor) will take a new `inject` argument that contains a map of:

* keys indicating hooks (predefined or functions)
* values representing code to be injected. This can be either a simple string or an object containing the `injection` string and an `order` indicating its priority.

Examples:

```
  inject: {
    'fs:#main-end': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
```

```js
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


### Remarks

* Injection at the moment only allows code to be added, not replaced.
* At the moment the implementation for injection are fairly simple. They depend on the shader code being well organized. For instance they require that the main function must come last in the app shader. In case of issues, try to make sure that line breaks, spacing etc are natural.


