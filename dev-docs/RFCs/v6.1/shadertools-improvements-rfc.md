# RFC: shadertools improvements

* **Author**: Ib Green
* **Date**: Aug, 2017
* **Status**: Draft

## Overview

Extend our shader module support with a number of new concepts.


## Motivation

Simplifying shader programming.
* Create generic common/compute shader modules that can be used both in vertex and fragment shaders
* Make it possible to specify dependencies separately for each type of shader


## Shader Module system improvements

- App should be able to add its uniforms to the shader module system.
- Shader module system can to accept function valued uniforms, allowing animation of uniforms.
- Support for "Compute" shaders (i.e. shaders that can be used in either )
- Support for Uniform Buffers
- Unit tests for shader modules under both GLSL 1.00 and GLSL 3.00


## Updates to the module system


### Callbacks

Shader modules can now use forward declarations to define "callbacks", i.e. functions that must be provided by the app or the importing module.

In the `raymarch` module
```
vec3 raymarch_callback_render_scene(...); // forward declare
```
In the app
```
vec3 raymarch_callback_render_scene(...) { // supply the definition
   ...
   return ...;
}
```

Naming convention is _module-prefix_ `callback` _function-name_.


### Types

Shader modules can use `struct`s to define interfaces

### Interfaces

Shader modules can use GLSL function overloading and `struct`s to define interfaces


### Templates

Templates works naturally with types and interfaces, as each template instantiations just adds an overload to the interface methods.


## New Shader Type ("common")

Define three types of shaders:
* `vertex` (`vs`):
* `fragment` (`fs`):
* `common` (`cs`): it is often tempting to think of this as a `compute` shader, although technically there is no WebGL support for compute shaders yet.

* `cs` field (new) - common shader source

### Dependency Extensions

* `dependencies` (updated) - can now be an array or an object
    * if array, dependencies apply to all specified shaders (`vs`, `fs`, `cs`)
    * if object, each shader type's dependencies can be independently specified.

Dependency resolution rules:
* shader module dependencies are treated as a DAG (directed acyclic graph) and a linear order is extracted, this ensures that each module is injected before any modules that use it.
* each shader type will look for the corresponding shader in each dependency, falling back to `cs`

### Example

```js
export const fp64 = {
  name: 'fp64',
  cs: `...` // can be used both in vertex and fragment shaders, so expose as `cs`
};

export const project64 = {
  name: 'project64',
  vs: `...`,
  fs: `...`,
  dependencies: {
    vs: [fp64], // injects the fp64 in the vertex shader only
    fs: [...],
    cs: [...]
  }
};
```

## Tooling


### Test Tooling


### Benchmark Tooling

