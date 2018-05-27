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

> The GLSL versions discussed here are the OpenGL ES versions GLSL 1.00 ES and GLSL 3.00 ES, which distinguishes them from other GLSL versions for the non ES versions of OpenGL. For simplicity, we will refer to the version numbers without the `ES`.

WebGL2 introduces GLSL version 3.00. While it introduces important new features, parts of the GLSL shader language syntax changed. This is a complication because when writing reusable shader code (such as a shader module), it would often be desirable for GLSL code to work in both GLSL 1.00 and 3.00 shaders.

If your shader needs GLSL 3.00 specific features, you should of course use GLSL 3.00 directly. In this case your GLSL code will never run on GLSL 1.00 so no need to make it compatible. But if your shader uses GLSL 1.00 features and extensions only, then you would want.


### Automatic GLSL Syntax Conversion

When using the shader module system, the shader assembler (by default) injects a prologue that sets up macros to replace keywords that increase compatibility between GLSL 1.00 and GLSL 3.00 code.

TBA - should the tables be moved to the shader module reference docs?

#### From GLSL 1.00 to GLSL 3.00

| 1.00 GLSL token | 3.00 Vertex Replacement | 3.00 Fragment Replacement | Comment |
| ---             | ---                     | ---                       | --- |
| `attribute`     | `out`                   | `in`                      |  |
| `varying`       | `out`                   | `in`                      |  |
| `texture2D`     |                         | `texture`                 | 3.00 deduces from sampler type |
| `textureCube`   |                         | `texture`                 | 3.00 deduces from sampler type |
| `gl_FragColor`  | N/A                     | `fragColor`               | Will inject an `out vec4 fragColor` if `gl_FragColor` is detected in the source |


All GLSL 1.00 extensions are available by default in WebGL2 / GLSL 3.00.

| GLSL 1.00 Extension    | 1.00 Vertex Replacement | 1.00 Fragment Replacement | Comment |
| ---                    | ---                     | ---                       | --- |
| **EXT_frag_depth**     |                         |                           ||
| `gl_FragDepth`         | N/A                     | `gl_FragDepthEXT`         | Recommendation: always use `gl_FragDepth` |
| **EXT_shader_texture_lod** |                     |                           ||
| `texture2DLod`         | `texture2DLodEXT`       | `texture2DLodEXT`         | Recommendation: always use `texture2DLod` |
| `texture2DProjLod`     | `texture2DProjLodEXT`   | `texture2DProjLodEXT`     | Recommendation: always use `texture2DProjLod` |
| `texture2DProjLod`     | `texture2DProjLodEXT`   | `texture2DProjLodEXT`     | Recommendation: always use `texture2DProjLod` |
| `textureCubeLod`       | `textureCubeLodEXT`     | `textureCubeLodEXT`       | Recommendation: always use `textureCubeLod` |
| `texture2DGrad`        | `texture2DGradEXT`      | `texture2DGradEXT`        | Recommendation: always use `texture2DGrad` |
| `texture2DProjGrad`    | `texture2DProjGradEXT`  | `texture2DProjGradEXT`    | Recommendation: always use `texture2DProjGrad` |
| `texture2DProjGrad`    | `texture2DProjGradEXT`  | `texture2DProjGradEXT`    | Recommendation: always use `texture2DProjGrad` |
| `textureCubeGrad`      | `textureCubeGradEXT`    | `textureCubeGradEXT`      | Recommendation: always use `textureCubeGrad` |


Not currently handled
| **EXT_draw_buffers** |
| `glFragData[]` |


#### From GLSL 3.00 to GLSL 1.00

luma.gl can also attempt to do a simple conversion code from GLSL 3.00 to GLSL 1.00 but this direction is more fragile. Often this conversion can not be determined without deeper context. E.g.
* Should the `texture` function be mapped to `texture2D` or `textureCube`? By mapping it to `texture2D` most cases are handled, but it will fail for cube samplers.

| 3.00 GLSL token | 1.00 Vertex Replacement | 1.00 Fragment Replacement | Comment |
| ---             | ---                     | ---                       | --- |
| `in`            | `attribute`             | `varying`                 | |
| `out`           | `varying`               | `gl_FragColor`*           | |
| `texture`       |                         | `texture2D`               | 3.00 deduces from sampler type, could be `textureCube`... |



## Testing GLSL Code

TBA
