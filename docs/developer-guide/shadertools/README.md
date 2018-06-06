# ShaderTools

shadertools is a GLSL shader module system built around a GLSL "assembler". that allows you to inject chunks of reusable shader code from modules into your shader source code.

* Enables you to import and "inject" prepackaged modules of shader code into your shaders.
* Allows you to package up reusable GLSL code as shader modules.
* Adds GPU detection and a measure of portability your shaders.


## Usage

To add/inject existing modules into your shaders, just add the modules parameter to your `assembleShaders` call:

```js
import {shaderModule} from 'library-of-shader-modules';
const {vs, fs, getUniforms, moduleMap} = assembleShaders(gl, {
  fs: '...',
  vs: '...',
  modules: [shaderModule],
  ...
})
```

To create a new shader module, you need to create a descriptor object.

```js
const MY_SHADER_MODULE = {
  name: 'my-shader-module',
  vs: ....
  fs: null,
  dependencies: [],
  deprecations: [],
  getUniforms
};
```

This object can be used as shader module directly:

```js
assembleShaders(gl, {..., modules: [MY_SHADER_MODULE]});
```

Alternatively, you can register it so that it can be referred to by name.

```js
registerShaderModules([module]);
assembleShaders(gl, {..., modules: ['my-module']});
```

## Comparison with other WebGL shader module systems

Note that the shadertools shader assembler is mainly a GLSL source preprocessor. It helps you prepare a

### [glslify](https://github.com/glslify/glslify)

* Lets shader modules be published (and consumed as) npm modules.
* Does full GLSL shader parsing and renaming.
* On the downside, glslify setups typically involve build tool plugins, which can be a complication.

Note: shadertools doesn't touch the preprocessor definitions used by glslify, so running glslify either before or after shadertools should work fine.


### [shadergraph](https://github.com/unconed/shadergraph)

* Detailed matching of varyings between vertex and fragment shaders
* Nice graph visualizer
* Written in coffee-script which is a consideration if considering to fork or extend.
* No longer actively maintained.
