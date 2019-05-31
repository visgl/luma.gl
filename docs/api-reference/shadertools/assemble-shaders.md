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

### `createShaderHook(hook, [opts])`

Creates a shader hook function that shader modules can injection code into. Shaders can call these functions, which will be no-ops by default. If a shader module injects code it will be executed upon the hook function call. This mechanism allows the application to create shaders that can be automatically extended by included shader modules.

- `hook`: `vs:` or `fs:` followed by the name and arguments of the function, e.g. `vs:MYHOOK_func(inout vec4 value)`. Hook name without arguments
will also be used as the name of the shader hook
- `opts.header` (optional): code always included at the beginning of a hook function
- `opts.footer` (optional): code always included at the end of a hook function

### `createModuleInjection(moduleName, opts)`

Define a code injection for a particular hook function (defined by `createShaderHook`) and shader module. The injection code will be inserted into the hook function whenever the shader module is included.

- `moduleName`: the name of the module for which the injection is being defined
- `opts.hook`: the shader hook to inject into. This can be a hook function defined by `createShaderHook` or a predefined injection key (see below),
prefixed by `vs:` for the vertex shader or `fs:` for the fragment shader.
- `opts.injection`: the injection code
- `opts.order` (optional): the priority with which to inject code into the shader hook. Lower priority numbers will
be injected first


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

### Shader Module Code Injection

Shader module code injections involve three steps:
- Defining a shader hook function using `createShaderHook`
- Calling the hook function in a shader
- Defining hook code injections for particular modules

For example, if the application wanted to automatically enable picking color filtering when the `picking` module is included in a program, first the shader hook would be defined:

```js
createShaderHook('fs:MYHOOK_fragmentColor(inout vec4 color)');
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
createModuleInjection('picking', {
  hook: 'fs:MYHOOK_fragmentColor',
  injection: 'color = picking_filterColor(color);',
  order: Number.POSITIVE_INFINITY
});
```

If the picking module were included, the function `MYHOOK_fragmentColor` would be updated to modify the input color. Without the picking module, the function would remain a no-op. The `priority` ensures the injection always
appears last in the hook function, which is necessary for picking color filtering to work correctly.

Injecting to a predefined hook would be done as follows:

```js
createModuleInjection('picking', {
  hook: 'fs:#main-end',
  injection: 'gl_FragColor = picking_filterColor(gl_FragColor);',
  order: Number.POSITIVE_INFINITY
});
```


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
createShaderHook('fs:MYHOOK_fragmentColor(inout vec4 color)');

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


