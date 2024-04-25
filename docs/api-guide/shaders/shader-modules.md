# Shader Modules

luma.device provides a shader module system (through the `@luma.device/shadertools` module) that allows you build modular shaders. The system is built around a shader "assembler", and addresses the lack of a module/import system in the GLSL and WGSL languages. The shader assembler allows you to import chunks of reusable shader code from separately defined shader fragments into your shader program source code, which allows you to organize your shader code in reusable modules.

- Enables you to import and "inject" prepackaged modules of shader code into your shaders.
- Allows you to package up reusable GLSL and/or WGSL code as shader modules.
- Adds GPU detection and a measure of portability your shaders.

## Usage

To add/inject existing modules into your shaders, just add the modules parameter to your `assembleShaders` call:

```typescript
import {shaderModule} from 'library-of-shader-modules';
const {vs, fs, getUniforms, moduleMap} = assembleShaders(device, {
  fs: '...',
  vs: '...',
  modules: [shaderModule],
  ...
})
```

To create a new shader module, you need to create a descriptor object.

```typescript
const MY_SHADER_MODULE = {
  name: 'my-shader-module',
  vs: ....
  fs: null,
  inject: {},
  dependencies: [],
  deprecations: [],
  getUniforms
};
```

This object can be used as shader module directly:

```typescript
assembleShaders(device, {..., modules: [MY_SHADER_MODULE]});
```

## Structure of a Shader Module

The simplest shader modules just contain one or more reusable generic global GLSL / WGLS functions that can be included either in fragment or vertex shaders (or both). The shader assembles just adds the functions to the top of the assembled shader. The `fp64` module is an example of this type of module.

More complex shader modules contain specific vertex and/or fragment shader "chunks". In this case the shader module defines vertex shader inputs and outputs requiring more sophisticated shader generation to wire up the inputs and outputs between shader stages.

### Shader Module Descriptors

To define a new shader module, you create a descriptor object that brings together all the necessary pieces:

```typescript
import type {ShaderModule} from '@luma.gl/shadertools';

export const myShaderModule = {
  name: 'my-shader-module',
  vs: '...',
  fs: '...',
  inject: {},
  dependencies: [],
  deprecations: [],
  getUniforms
} as const satisfies ShaderModule;
```

For details see the [`ShaderModule`](/docs/api-reference/shadertools/shader-module) type reference page.

Several functions are also available to initialize and use shader modules.
