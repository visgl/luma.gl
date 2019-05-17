# Shadertools API Reference

## Functions

### `registerShaderModules`

Can be used to "name" shader modules, making them available to `assembleShaders` using module names rather than the module definitions.

Note: Can defeat three-shaking of unused shader modules (affects size of application JavaScript bundle).


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
* `inject`=`{}` (Object) - map of substituions

Returns:
* `vs` - the resolved vertex shader
* `fs` - the resolved fragment shader
* `getUniforms` - a combined `getUniforms` function covering all modules.
* `moduleMap` - a map with all resolved modules, keyed by name

### `setShaderHook(shaderType, opts)`

Creates a shader hook function that shader modules can injection code into. Shaders can call these functions, which will be no-ops by default. If a shader module injects code it will be executed upon the hook function call. This mechanism allows the application to create shaders that can be automatically extended by included shader modules.

- `shaderType`: `vs` or `fs`, the type of shader
- `opts.signature`: name and arguments of the function, e.g. `MYHOOK_func(inout vec4 value)`. Name of the function
will also be used as the name of the shader hook
- `opts.header` (optional): code always included at the beginning of a hook function
- `opts.footer` (optional): code always included at the end of a hook function

### `setModuleInjection(shaderType, moduleName, opts)`

Define a code injection for a particular hook function (defined by `setShaderHook`) and shader module. The injection code will be inserted into the hook function whenever the shader module is included.

- `shaderType`: `vs` or `fs`, the type of shader
- `moduleName`: the name of the module for which the injection is being defined
- `opts.shaderHook`: the shader hook to inject into
- `opts.injection`: the injection code
- `opts.priority` (optional): the priority with which to inject code into the shader hook. Lower priority numbers will
be injected first


## Constants and Values

### Predefined Injection Keys

| Key              | Shader   | Description      |
| ---              | ---      | ---              |
| `vs:#decl`       | Vertex   | Inject at top of shader (declarations) |
| `vs:#main-start` | Vertex   | Injected at the very beginning of main function |
| `vs:#main-end`   | Vertex   | Injected at the very end of main function |
| `fs:#decl`       | Fragment | Inject at top of shader (declarations) |
| `fs:#main-start` | Fragment | Injected at the very beginning of main function |
| `fs:#main-end`   | Fragment | Injected at the very end of main function |

## Usage

### Shader Module Code Injection

Shader module code injections involve three steps:
- Defining a shader hook function using `setShaderHook`
- Calling the hook function in a shader
- Defining hook code injections for particular modules

For example, if the application wanted to automatically enable picking color filtering when the `picking` module is included in a program, first the shader hook would be defined:

```js
setShaderHook('fs', {
  signature: 'MYHOOK_fragmentColor(inout vec4 color)'
});
```

In the fragment shader `main` function, the new hook function would called as follows:
```js
void main() {
  //...
  MYHOOK_fragmentColor(gl_FragColor)
}
```

And the injection for the picking module would be defined as follows:

```js
setModuleInjection('fs', 'picking', {
  shaderHook: 'MYHOOK_fragmentColor',
  injection: 'color = picking_filterColor(color)',
  priority: Number.POSITIVE_INFINITY
});
```

If the picking module were included, the function `MYHOOK_fragmentColor` would be updated to modify the input color. Without the picking module, the function would remain a no-op. The `priority` ensures the injection always
appears last in the hook function, which is necessary for picking color filtering to work correctly.


### Injection Map

`assembleShaders` (and `Model` constructor) will take a new `inject` argument that contains a map of:

* keys representing "patterns"
* values representing code to be injected.

```
  inject: {
    'COLOR_FILTERS': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
```

Shaders can leave hints in comments representing injection points, that can be used as keys for injection. It does mean that main shaders need to be modified.

```js
new Model(gl, {
  vs,
  fs: `void main() {
    gl_FragColor = vec4(1., 0., 0., 1.);
    // COLOR_FILTERS_HINT
  }`,
  modules: ['picking']
  inject: {
    'COLOR_FILTERS_HINT': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
});
```

### Pattern Based Injection

To avoid the need for adding hints to existing shaders, one could also do pattern matching against the existing code. It is recommended that the injections would always happen on the next line.

```js
new Model(gl, {
  vs,
  fs: `void main() {
    gl_FragColor = vec4(1., 0., 0., 1.);
    // COLOR_FILTERS
  }`,
  modules: ['picking']
  inject: {
    'gl_FragColor =': '  gl_FragColor = picking_filterColor(gl_FragColor)'
  }
});
```


### Remarks

* Injection at the moment only allows code to be added, not replaced.
* At the moment the implementation for injection are fairly simple. They depend on the shader code being well organized. For instance they require that the main function must come last in the app shader. In case of issues, try to make sure that line breaks, spacing etc are natural.


