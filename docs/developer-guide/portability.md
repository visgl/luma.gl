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

The goal is to let applications use GLSL 3.00 es syntax, with some care so that shaders can be automatically converted back to GLSL 1.00 es under WebGL1.

The shader assembler (by default) injects a prologue that sets up macros to replace keywords that increase compatibility between GLSL 1.00 es and GLSL 3.00 es code.

TBA - should the tables be moved to the shader module reference docs?

#### From GLSL 1.00 to GLSL 3.00

| 3.00 Vertex | 3.00 Fragment | 1.00 GLSL token | Comment | --- |
| ---         | ---           | ---             | ---     | --- |
| `out` *     | `in` *        | `attribute`     |  |
| `out` *     | `in` *        | `varying`       |  |
|             | `texture` *   | `texture2D`     | 3.00 deduces from sampler type |
|             | `texture`     | `textureCube` * | 3.00 deduces from sampler type |
| N/A         | `fragColor`   | `gl_FragColor`  | Will inject an `out vec4 fragColor` if `gl_FragColor` is detected in the source |


All GLSL 1.00 extensions are available by default in WebGL2 / GLSL 3.00.

| GLSL 3.00 token       | 1.00 Vertex | 1.00 Fragment             | Comment |
| ---                   | ---         | ---                       | --- |
| **EXT_frag_depth**    |             |                           | |
| `gl_FragDepth` *      | N/A         | `gl_FragDepthEXT`         | Recommendation: always use `gl_FragDepth` |
| **EXT_shader_texture_lod** |        |                           | |
| `texture2DLod` *      |             | `texture2DLodEXT`         | Recommendation: always use `texture2DLod` |
| `texture2DProjLod` *  |             | `texture2DProjLodEXT`     | Recommendation: always use `texture2DProjLod` |
| `texture2DProjLod` *  |             | `texture2DProjLodEXT`     | Recommendation: always use `texture2DProjLod` |
| `textureCubeLod` *    |             | `textureCubeLodEXT`       | Recommendation: always use `textureCubeLod` |
| `texture2DGrad` *     |             | `texture2DGradEXT`        | Recommendation: always use `texture2DGrad` |
| `texture2DProjGrad` * |             | `texture2DProjGradEXT`    | Recommendation: always use `texture2DProjGrad` |
| `texture2DProjGrad` * |             | `texture2DProjGradEXT`    | Recommendation: always use `texture2DProjGrad` |
| `textureCubeGrad` *   |             | `textureCubeGradEXT`      | Recommendation: always use `textureCubeGrad` |


Not currently handled
| **EXT_draw_buffers** |
| `glFragData[]` |


### Shader Modules Recommendations

Many syntactic changes between GLSL 1.00es and 3.00es relate to shader input/outputs. The recommendation is that shader modules leave these choices up to the calling `main` shader. The main exception is "varyings" which are typically defined by shader modules that provide both a vertex and fragment shader component.

* Definition of attributes should be done in.
* Assignment to `gl_FragColor`, `gl_FragDepth` and `gl_FragData` should be done in the top level shader's `main` function. That is, shader modules can calculate the required values but typically do not actually assign to the shader output variables. This makes shader module code independent of the naming of the output variables.


#### From GLSL 3.00 to GLSL 1.00

luma.gl can also attempt to do a simple conversion code from GLSL 3.00 to GLSL 1.00 but this direction is more fragile. Often this conversion can not be determined without deeper context. E.g.
* Should the `texture` function be mapped to `texture2D` or `textureCube`? By mapping it to `texture2D` most cases are handled, but it will fail for cube samplers.

| 3.00 GLSL token | 1.00 Vertex Replacement | 1.00 Fragment Replacement | Comment |
| ---             | ---                     | ---                       | --- |
| `in`            | `attribute`             | `varying`                 | |
| `out`           | `varying`               | `gl_FragColor`*           | |
| `texture`       |                         | `texture2D`               | 3.00 deduces from sampler type, could be `textureCube`... |


## Conditional Code

### New Features in GLSL 3.00

The following features are only available in GLSL 3.00 and cannot be directly emulated in 1.00.


#### Texture sizes and Pixel Fetch

Shaders have access to texture sizes and can query by pixel coordinates instead of uv coordinates.

```glsl
vec2 size = textureSize(sampler, lod)
vec4 values = texelFetch(sampler, ivec2Position, lod);
```

#### Texture Arrays and 3D textures

```glsl
vec4 color = texture(sampler2DArray, vec3(u, v, index));
vec4 color = texture(sampler3D, vec3(u, v, depth));
```

#### Non-constant loops



#### Matrix functions

```glsl
mat4 m = inverse(matrix);
mat4 t = transpose(matrix);
```

#### Integer textures, attributes and math

In WebGL2 you can have integer attributes and integer textures.

GLSL 300 es allows you to do integer math in the shaders, including bit manipulations of integers.


#### Uniform Buffer Objects


#### Transform Feedback


## Testing GLSL Code

TBA
