# Portability

There are multiple aspects to portability. Portability across WebGL versions, and portability across browsers, operating systems and GPUs. This article focused on writing code that works on multiple versions of WebGL, taking advantage of WebGL2 and extensions when available.


## WebGL Versions


### Unified API and Polyfills

luma.gl offers a single API for accessing WebGL functionality, regardless of whether a function is provided by WebGL2 or a WebGL1 extension.

When possible, "polyfills" are done on the `WebGLRenderingContext` level, meaning that many missing WebGL2 functions are injected into WebGL1 contexts, with implementations that transparently use WebGL1 extensions while providing the WebGL2 API.

TBA - Couple of examples of polyfilled functionality (instanced rendering, ...)?


### Feature Detection System

luma.gl offers a feature detection system that is easier to work with than directly querying for WebGL extensions. The main advantages is that it allows a single function calls to determine whether a capability is present, regardless of whether it is available through a WebGL1 extension or WebGL2. It also offers a list of capability names that more accurately reflect the capability being queries, compare to the rather technical WebGL extension names.

```js
hasFeature();
```

TBA - Examples link to reference



## GLSL Versions

WebGL2 introduces GLSL version 3.00. While it introduces important new features, parts of the GLSL shader language syntax changed. This is a complication because when writing reusable shader code (such as a shader module), it would often be desirable for GLSL code to work in both GLSL 1.00 and 3.00 shaders.

See [shadertools].
