# Using Shader Modules

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

To configure the shader module uniforms:

```glsl
const {vs, fs, getUniforms, ...} = assembleShaders(gl, {..., modules: [...]});

// create a program with the returned shaders using your preferred WebGL library

const uniforms = getUniforms(props);

// set returned uniforms on the program using your preferred WebGL library

```


## GLSL Versions and Shader Module Transpilation

Shader Modules are automatically converted ("transpiled") to the version of the shader you are importing them into.


## Shader Code Injection

By using the `inject` parameter, code can be injected into existing shaders.
