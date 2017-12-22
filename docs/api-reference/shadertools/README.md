# Shader Modules

By passing your shaders to the `assembleShaders` function, the `shadertools` module adds platform detection and portability your shaders. In addition it also enables you to "inject" shader code (GLSL code) that has been packaged into reusable, composable "modules". And naturally, `shadertools` also allows you to create your own reusable shader modules.


## Usage

Note that `assembleShaders` is integrated into the `Model` class. Your shaders will automatically be passed to `assembleShaders` if you supply `modules` parameter.
```js
const model = new Model(gl, {
  fs: '...',
  vs,
  modules: [],
});
```

To use the shader module system directly to add/inject modules into your shaders, just call `assembleShaders`:
```js
const {vs, fs, getUniforms, moduleMap} = assembleShaders(gl, {
  fs: '...',
  vs: '...',
  modules: [...],
  defines: {...}
})
```

To create a new shader module, you need to create the following object
```js
const module = {
  name: 'my-mnodule',
  vs: ....
  fs: null,
  dependencies: [],
  deprecations: [],
  getUniforms
};
```

This object can be used as shader module directly, or you can register it so that it can be referred to by name.
```js
new Model(gl, {..., modules: [module]});
registerShaderModules([module]);
new Model(gl, {..., modules: ['my-module']});
```


## Concepts

A shader module is either:
* **Generic** - a set of generic GLSL functions that can be included either in a fragment shader or a vertex shader (or both). The `fp64` module is a good example of this type of module.
* **Functional** - Contains specific vertex and/or fragment shader "chunks", often set up so that the vertex shader part sets up a `varying` used by the fragment shader part.

To define a shader module, you must specify the following fields:
* `name` (*String*) - the name of the shader module
* `dependencies` (*Array*) - a list of other shader modules that this module is dependent on
* `deprecations` (*Array*) - a list of deprecated APIs. If supplied, `assembleShaders` will scan the source for usage and issue a console warning. Each API is described in the following format:
  - `type`: `uniform <type>` or `function`
  - `old`: name of the deprecated uniform/function
  - `new`: name of the new uniform/function
  - `deprecated`: whether the old API is still supported
* `getUniforms` JavaScript function that maps JavaScript parameter keys to uniforms used by this module
* `vs`
* `fs`


### GLSL Code

The GLSL code for a shader module typically contains:
* a mix of uniform and varying declarations
* one or more GLSL function definitions


### getUniforms

Each shader module provides a method to get a map of uniforms for the shader. This function takes named arguments with defaults. It can thus be called with no arguments to generate a set of default uniform values.

Most WebGL frameworks, including luma.gl, have functions that accept a JavaScript object with keys representing uniform names and values representing uniform values.

Note that modules can define uniforms and varyings


### Platform Detection

Also does some platform detection and injects `#define` statements enabling
your shader to conditionally use code.


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
* Version directive (like `#version 300 es`) must be the very first line in `vs` and `fs` shader if it exists, `assembleShaders` will make sure it is still the very first line in resolved shader.


### `registerShaderModules`

Can be used to "name" shader modules, making them available to `assembleShaders` using module names rather than the module definitions.

Note: Can defeat three-shaking of unused shader modules (affects size of application JavaScript bundle).


### `getModuleUniforms`

Takes a list of shader module names and an object with options, and creates a combined uniform object that contains all necessary uniforms for all the modules injected into your shader


## Remarks

* **No Vertex Attributes** - At the moment shader modules are not expected to use attributes. It is up to the root application shaders to define attributes and call GLSL functions from the imported shader modules with the appropriate attributes. This is just a convention, not a hard limitation.
