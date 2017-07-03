# Shader Modules

The luma.gl `shadertools` module enables packaging of GLSL code in reusable "modules", and allows shaders modules to specify dependencies on other shader modules, allowing gradual composition of more complex modules.


## Concepts

A shader module typically contains both vertex and fragment shader "chunks", typically containing:
* a mix of uniform and varying declarations
* one or more GLSL function definitions

In addition the shader module defintion contains:
* the module name (a String)
* a list (possibly empty) of other shader modules that this module is dependent on
* a `getUniforms` JavaScript function that maps JavaScript parameter keys to uniforms used by this module


Note that modules can define uniforms and varyings

* `name`
* `vs`
* `fs`
* `getUniforms`

Each shader module provides a method to get a map of uniforms for the shader. This function takes named arguments with defaults. It can thus be called with no arguments to generate a set of default uniform values.

Most WebGL frameworks, including luma.gl, have functions that accept a JavaScript object with keys representing uniform names and values representing uniform values.


## Platform Detection

Also does some platform detection and injects `#define` statements enabling
your shader to conditionally use code.


## Usage

To use the shader module system to inject modules into your shaders, just call `assembleShaders`:
```js
const {vs, fs, getUniforms, moduleMap} = assembleShaders(gl, {
  fs: '...',
  vs: '...',
  modules: [...],
  defines: {...}
})

Note that assembleShaders is integrated into the `Model` class"
```js
const model = new Model(gl, {
  fs: '...',
  vs,
  modules: [],
});
```

To create a new shader module, you need to create the following object
```js
const module = {
  name: 'my-mnodule',
  vs: ....
  fs: null,
  dependencies: []
};
```


## API


### `assembleShaders`

Takes the source code of a vertex shader and a fragment shader, and a list of modules, and generates combined source code for both shaders.

* `vs` - vertex shader source
* `fs` - fragment shader source code
* `modules`=`[]` - list of shader modules (either objects defining the module, or names of previously registered modules)
* `id` - `id` for the shader, will be used to inject shader names (using `#define SHADER_NAME`) if not already present in the source.
* `defines`=`{}` (Object) - a map of key/value pairs representing custom `#define`s to be injected into the shader source

Returns:
* `vs` - the resolved vertex shader
* `fs` - the resolved fragment shader
* `getUniforms` - a combined `getUniforms` function covering all modules.
* `moduleMap` - a map with all resolved modules, keyed by name

Remarks:
* Will inject platform prologue, with defines identifying GPU driver to enable bug workarounds
* Will inject a GLSL feature detection prologue, simplifying writing code that works with GLSL extensions and across GLSL versions (WebGL1 and WebGL2)
* Will follow module dependencies and inject dependency tree in correct order


### `registerShaderModules`

Can be used to "name" shader modules, making them available to `assembleShaders` using module names rather than the module definitions.

Note: Can defeat three-shaking of unused shader modules (affects size of application JavaScript bundle).


### `getShaderUniforms`

Takes a list of shader module names and an object with options, and
creates a combined uniform object that contains all necessary uniforms


### `getShaderDependencies`

* moduleNames {String[]} - Array of module names
returns {String[]} - Array of modules

Takes a list of shader module names and returns a new list of
shader module names that includes all dependencies, sorted so
that modules that are dependencies of other modules come first.

If the shader glsl code from the returned modules is concatenated
in the reverse order, it is guaranteed that all functions be resolved and
that all function and variable definitions come before use.

Note: This function is called internally by `assembleShaders` so the
application does not normally need to call it directly.


## Remarks
* **No Vertex Attributes** - At the moment shader modules are not expected to use attributes. It is up to the root application shaders to define attributes and call GLSL functions from the imported shader modules with the appropriate attributes. This is just a convention, not a hard limitation.

