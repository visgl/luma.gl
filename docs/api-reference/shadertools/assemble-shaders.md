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


