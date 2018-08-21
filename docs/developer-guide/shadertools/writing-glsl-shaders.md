# Writing GLSL Shaders

## GLSL Versions and Compatibility

> The GLSL versions discussed here are the two GLSL versions supported by WebGL2, namely GLSL 3.00 ES and GLSL 1.00 ES. The ES suffix indicates that they are related to the OpenGL ES standards used by WebGL. For simplicity, we will often refer to the GLSL version numbers without the `ES` suffix.

While WebGL1 supports only GLSL 1.00 ES (with four extensions), WebGL2 introduces the choice of writing shaders in GLSL version 3.00 ES. While GLSL 3.00 ES introduces important new features, some parts of the language syntax has changed.

These syntax differences between versions can be a complication when writing shader code that is inteded to run both on WebGL1 and WebGL2 environments. In particular when creating reusable code for shader modules, it is desirable to be able to write GLSL code that can work in both GLSL 3.00 and 1.00 shaders.


## GLSL "Transpilation"

The shadertools system lets developers write shader source code using the new GLSL 3.00 ES syntax. This allows shader modules to be used in new GLSL 3.00 ES shaders, while relying on the shader assembler system to automatically convert ("transpile") the GLSL code to GLSL 1.00 ES when needed to run in GLSL 1.00 ES shaders or under WebGL1.

Using the compatiblity guidelines below, it is possible to write highly portable shaders. In rare cases it can require deviating from writing pure GLSL 3.00 ES in some cases.

Naturally, "transpiled" GLSL 3.00 ES shaders will only compile successfully in GLSL 1.00 ES if they don't use any GLSL 3.00 ES unique features.


## Writing Portable Shader Modules

If your shader unconditionally needs features that are unique to GLSL 3.00, you should of course use GLSL 3.00 directly. In this case your GLSL code will never run on GLSL 1.00 so no need to make it compatible. But if your shader uses GLSL 1.00 features and extensions only, then you may want to make some extra effort to ensure it runs under WebGL1 if required.

Several of the syntactic changes between GLSL 1.00 ES and 3.00 ES relate to shader input/outputs. It is recommended that shader modules let the calling, top level shaders define attribute inputs and fragment shader outputs. The exception is of course "varyings" which are typically defined by shader modules that provide both a vertex and fragment shader components, in which case it is recommended that shaders use `out` and `in` syntax rather than `varying`.

* Definition of vertex shader attributes should be done in the top level shader.
* Definition of and assignment to `gl_FragColor`, `gl_FragDepth` and `gl_FragData` or their counterparts should be done in the top level fragment shader. That is, shader modules can calculate the required values but typically do not actually assign to the shader output variables. This makes shader module code independent of the naming of the output variables.


#### From GLSL 1.00 to 3.00

References

* [Shaderific's Guide on how to update shaders to GLSL 3.00]http://www.shaderific.com/blog/2014/3/13/tutorial-how-to-update-a-shader-for-opengl-es-30

luma.gl can also attempt to do a simple conversion code from GLSL 1.00 to GLSL 3.00. It is essentially the reverse of the mapping described in the matrix above.


## Conditional Code


## Testing GLSL Code

TBA


## GLSL Syntax Conversion Reference

The shader assembler replaces keywords to ensure compatibility between GLSL 3.00 ES and GLSL 1.00 ES code per the following rules.

TBD - Should the tables be moved to the shader module reference docs?


Vertex Shaders

| 3.00 ES         | 1.00 ES     | Comment         |
| ---             | ---         | ---             |
| `in`            | `attribute` |                 |
| `out`           | `varying`   |                 |

Fragment Shaders

| 3.00 ES         | 1.00 ES        | Comment |
| ---             | ---            | ---     |
| `in`            | `varying`      |         |
| `out`           | `gl_FragColor` |         |
| `out`           | `gl_FragData`  |         |
| `texture`       | `texture2D`    | `texture` will be replaced with `texture2D` to ensure 1.00 code is correct. See note on `textureCube` below. |
| `textureCube` * | `textureCube`  | `textureCube` is not valid 3.00 syntax, but must be used to ensure 1.00 code is correct, because `texture` will be substituted with `texture2D` when transpiled to 100. Also `textureCube` will be replaced with correct `texture` syntax when transpiled to 300. |
| `gl_FragDepth`  | `gl_FragDepthEXT` | WebGL1: **EXT_frag_depth** |


| 3.00 ES             | 1.00 ES                | Comment |
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


## Appendix - New Features in GLSL 3.00

The following features are only available in GLSL 3.00 and cannot be directly emulated in 1.00.


#### Texture sizes and Pixel Fetch

Shaders have access to texture sizes and can query by pixel coordinates instead of uv coordinates.

```
vec2 size = textureSize(sampler, lod)
vec4 values = texelFetch(sampler, ivec2Position, lod);
```

#### Texture Arrays and 3D textures

```
vec4 color = texture(sampler2DArray, vec3(u, v, index));
vec4 color = texture(sampler3D, vec3(u, v, depth));
```

#### Non-constant loops



#### Matrix functions

```
mat4 m = inverse(matrix);
mat4 t = transpose(matrix);
```

#### Integer textures, attributes and math

In WebGL2 you can have integer attributes and integer textures.

GLSL 3.00 ES allows you to do integer math in the shaders, including bit manipulations of integers.


#### Uniform Buffer Objects


#### Transform Feedback




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

Each shader module provides a method to get a map of uniforms for the shader. This function will be called with two arguments:
- `opts` - the module settings to update. This argument may not be provided when `getUniforms` is called to generate a set of default uniform values.
- `context` - the uniforms generated by this module's dependencies.

The function should return a JavaScript object with keys representing uniform names and values representing uniform values.

The function should expect the shape of the dependency uniforms to vary based on what's passed in `opts`. This behavior is intended because we only want to recalculate a uniform if the uniforms that it depends on are changed. An example is the `project` and `project64` modules in deck.gl. When `opts.viewport` is provided, `project64` will receive the updated projection matrix generated by the `project` module. If `opts.viewport` is empty, then the `project` module generates nothing and so should `project64`.


### Platform Detection

Also does some platform detection and injects `#define` statements enabling
your shader to conditionally use code.


## Remarks

* **No Vertex Attributes** - At the moment shader modules are not expected to use attributes. It is up to the root application shaders to define attributes and call GLSL functions from the imported shader modules with the appropriate attributes. This is just a convention, not a hard limitation.
