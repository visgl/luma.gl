# Shader Assembly

The `assembleShader` function provides a number of features that help applications build up shaders in a structured way.


## Features

### Version Handling

* Version directive (like `#version 300 es`) must be the very first line in `vs` and `fs` shader if it exists, `assembleShaders` will make sure it is still the very first line in resolved shader.


### Prologue Injection

A two part prologue is injected by default:

* A GPU indentification prologues, containing defines identifying GPU and driver to enable bug workarounds.
* a GLSL feature detection prologue, simplifying writing code that works with GLSL extensions and across GLSL versions (WebGL1 and WebGL2)


### \#define Statement Injection

A simple map of keys and values are injected as:

```
#define key1 value1
#define key2 value2
...
```

The defines will be included before modules and can thus be used to affect modules.


### Shader Module Import

Will follow module dependencies and inject dependency tree in correct order


### Shader Module Transpilation


### Shader Code Injection

Shader injection allows shader code "fragments" to be inserted into existing shader code, allowing applications to add code to an existing shader without having to duplicate and directly modify its source code. One main use case is adding the few lines of code needed to use a new shader module in an existing shader.


