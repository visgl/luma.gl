# GLSL Support

## GLSL Versions

> The GLSL versions discussed here are the OpenGL ES versions GLSL 1.00 ES and GLSL 3.00 ES, which distinguishes them from other GLSL versions for the non ES versions of OpenGL. For simplicity, we will often refer to the version numbers without the `ES` suffix.

While WebGL1 support GLSL 1.00 only, WebGL2 introduces the choice of writing shaders in GLSL version 3.00.


## GLSL Version Compatibility

While GLSL 3.00 es introduces important new features, parts of the language syntax has changed. This is can be complication when writing shader code that is inteded to run both on WebGL1 and WebGL2 environments. In particular when creating reusable code such as for shader modules, it would often be desirable to be able to write GLSL code that can work in both GLSL 3.00 and 1.00 shaders.


## GLSL "Transpilation"

Our goal is to let developers write shader source code using the new GLSL 3.00 es syntax, while relying on the shader compiler system to automatically convert it back to GLSL 1.00 es when needed to run under WebGL1.

Using the compatiblity guidelines below, it is possible to write highly portable shaders. It does require deviating from 100% pure GLSL 3.00 es in some cases, as


## Automatic GLSL Syntax Conversion

The shader assembler injects a prologue with macros that replace keywords increasing compatibility between GLSL 3.00 es and GLSL 1.00 es code.

TBD - Should the tables be moved to the shader module reference docs?


Vertex Shaders

| 3.00 es         | 1.00 es     | Comment         |
| ---             | ---         | ---             |
| `in`            | `attribute` |                 |
| `out`           | `varying`   |                 |

Fragment Shaders

| 3.00 es         | 1.00 es        | Comment |
| ---             | ---            | ---     |
| `in`            | `varying`      |         |
| `out`           | `gl_FragColor` |         |
| `out`           | `gl_FragData`  |         |
| `texture`       | `texture2D`    | `texture` will be replaced with `texture2D` to ensure 1.00 code is correct. See note on `textureCube` below. |
| `textureCube` * | `textureCube`  | `textureCube` is not valid 3.00 syntax, but must be used to ensure 1.00 code is correct, because `texture` will be substituted with `texture2D` under 3.00 |
| `gl_FragDepth`  | `gl_FragDepthEXT` | WebGL1: **EXT_frag_depth** |


| 3.00 es             | 1.00 es                | Comment |
| ---                 | ---                    | --- |
| `texture2DLod`      | `texture2DLodEXT`      | WebGL1: **EXT_shader_texture_lod** |
| `texture2DProjLod`  | `texture2DProjLodEXT`  | WebGL1: **EXT_shader_texture_lod** |
| `texture2DProjLod`  | `texture2DProjLodEXT`  | WebGL1: **EXT_shader_texture_lod** |
| `textureCubeLod`    | `textureCubeLodEXT`    | WebGL1: **EXT_shader_texture_lod** |
| `texture2DGrad`     | `texture2DGradEXT`     | WebGL1: **EXT_shader_texture_lod** |
| `texture2DProjGrad` | `texture2DProjGradEXT` | WebGL1: **EXT_shader_texture_lod** |
| `texture2DProjGrad` | `texture2DProjGradEXT` | WebGL1: **EXT_shader_texture_lod** |
| `textureCubeGrad`   | `textureCubeGradEXT`   | WebGL1: **EXT_shader_texture_lod** |


### Not currently handled

Fragment shader `out`s are not well handled at the moment.
| **EXT_draw_buffers** |
| `glFragData[]` |


## Writing Portable Shader Modules

If your shader unconditionally needs features that are unique to GLSL 3.00, you should of course use GLSL 3.00 directly. In this case your GLSL code will never run on GLSL 1.00 so no need to make it compatible. But if your shader uses GLSL 1.00 features and extensions only, then you may want to make some extra effort to ensure it runs under WebGL1 if required.

Several of the syntactic changes between GLSL 1.00 es and 3.00 es relate to shader input/outputs. It is recommended that shader modules let the calling, top level shaders define attribute inputs and fragment shader outputs. The exception is of course "varyings" which are typically defined by shader modules that provide both a vertex and fragment shader components, in which case it is recommended that shaders use `out` and `in` syntax rather than `varying`.

* Definition of vertex shader attributes should be done in the top level shader.
* Definition of and assignment to `gl_FragColor`, `gl_FragDepth` and `gl_FragData` or their counterparts should be done in the top level fragment shader. That is, shader modules can calculate the required values but typically do not actually assign to the shader output variables. This makes shader module code independent of the naming of the output variables.


#### From GLSL 1.00 to 3.00

luma.gl can also attempt to do a simple conversion code from GLSL 1.00 to GLSL 3.00. It is essentially the reverse of the mapping described in the matrix above.


## Conditional Code


## Testing GLSL Code

TBA


## Appendix - New Features in GLSL 3.00

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

