# GLSL Reference

This page is a brief reference for both the GLSL 3.00 ES and GLSL 1.00 ES syntax, with notes about what has changed between the two versions (GLSL documentation tends to describe one version and the differences are often not emphasized).

Main sources of information for this page comes the Khronos WebGL reference cards and GLSL language specs:
* [WebGL2/GLSL 3.00 ES](https://www.khronos.org/files/webgl20-reference-guide.pdf)
* [WebGL1/GLSL 1.00 ES](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf)
* [GLSL 3.00 Spec](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf)


## Types

### Basic Types

| Type                         | GLSL 1.00 | Description     |
| ---                          | ---       | ---             |
| `void`                       |           | no function return value or empty parameter list |
| `bool`                       |           | Boolean |
| `int`                        |           | signed integer |
| `float`                      |           | floating scalar |
| `vec2`, `vec3`, `vec4`       |           | floating point vectors |
| `bvec2`, `bvec3`, `bvec4`    |           | boolean vectors |
| `ivec2`, `ivec3`, `ivec4`    |           | signed integer vectors |
| `uvec2`, `uvec3`, `uvec4`    | N/A       | unsigned integer vectors |
| `mat2`, `mat3`, `mat4`       |           | 2x2, 3x3, 4x4 float matrix |
| `mat2x2`, `mat2x3`, `mat2x4` | N/A       | 2x2, 2x3, 2x4 float matrix
| `mat3x2`, `mat3x3`, `mat3x4` | N/A       | 3x2, 3x3, 3x4 float matrix
| `mat4x2`, `mat4x3`, `mat4x4` | N/A       | 4x2, 4x3, 4x4 float matrix


### Floating Point Sampler Types

| Type                     | GLSL 1.00 | Description |
| ---                      | ---       | ---         |
| `sampler2D`              |           | access a 2D (or 3D) texture |
| `samplerCube`            |           | access cube mapped texture |
| `sampler3D`              | N/A       | access a 2D or 3D texture |
| `samplerCubeShadow`      | N/A       | access cube map depth texture with comparison |
| `sampler2DShadow`        | N/A       | access 2D depth texture with comparison |
| `sampler2DArray`         | N/A       | access 2D array texture |
| `sampler2DArrayShadow`   | N/A       | access 2D array depth texture with comparison |


### Signed Integer Sampler Types

| Type                     | GLSL 1.00 | Description |
| ---                      | ---       | ---         |
| `isampler2D, isampler3D` | N/A       | access an integer 2D or 3D texture |
| `isamplerCube`           | N/A       | access integer cube mapped texture |
| `isampler2DArray`        | N/A       | access integer 2D array texture |


### Unsigned Integer Sampler Types

| Type                     | GLSL 1.00 | Description |
| ---                      | ---       | ---         |
| `usampler2D, usampler3D` | N/A       | access unsigned integer 2D or 3D texture |
| `usamplerCube`           | N/A       | access unsigned integer cube mapped texture |
| `usampler2DArray`        | N/A       | access unsigned integer 2D array texture |


### Structures and Arrays

Structures

```
struct type-name {
 members
} struct-name[]; // optional variable declaration, optionally an array
```

Arrays

```
float foo[3];
```

Notes:

* Structures and blocks can be arrays
* Only 1-dimensional arrays supported
* Structure members can be arrays


## Qualifiers
Storage Qualifiers [4.3]
Variable declarations may be preceded by one storage qualifier.
none (Default) local read/write memory, or input parameter
const Compile-time constant, or read-only function
parameter
in
centroid in Linkage into a shader from a previous stage
out
centroid out Linkage out of a shader to a subsequent stage
uniform
Value does not change across the primitive being processed, uniforms form the linkage between a shader, OpenGL ES, and the application
The following interpolation qualifiers for shader outputs and inputs may procede in, centroid in, out, or centroid out.
smooth Perspective correct interpolation
flat No interpolation

### Interface Blocks

Uniform variable declarations can be grouped into named interface blocks, for example:

```
uniform Transform {
 mat4 ModelViewProjectionMatrix;
 uniform mat3 NormalMatrix; // restatement of qualifier
 float Deformation;
}
```

### Layout Qualifiers (GLSL 3.00)

```
layout(layout-qualifier) block-declaration
layout(layout-qualifier) in/out/uniform
layout(layout-qualifier) in/out/uniform
 declaration
```

For all shader stages:

location = integer-constant


### Uniform Block Layout Qualifiers (GLSL 3.00)

Layout qualifier identifiers for uniform blocks:

`shared`, `packed`, `std140`, `row_major`, `column_major`


### Parameter Qualifiers

Input values are copied in at function call time, output values are copied out at function return time.

| `none` (Default) | same as in |
| `in`             | For function parameters passed into a function |
| `out`            | For function parameters passed back out of a function, but not initialized for use when passed in |
| `inout`          | For function parameters passed both into and out of a function |

### Precision and Precision Qualifiers

Any floating point, integer, or sampler declaration can have the type preceded by one of these precision qualifiers:

| `highp`   | Satisfies minimum requirements for the vertex language. |
| `mediump` | Range and precision is between that provided by lowp and highp. |
| `lowp`    | Range and precision can be less than mediump, but still represents all color values for any color channel. |

Ranges and precisions for precision qualifiers (FP=floating point):

|           | FP Range       | FP Magnitude Range    | FP Precision   | Integer Range Signed   | Integer Range Unsigned |
| ---       | ---            | ---                   | ---            | ---                    | ---                    |
| `highp`   | (−2126 , 2127) | 0.0, (2^–126 , 2^127) | Relative 2^–24 | [−2^31, 2^31 −1]       | [0, 2^32 −1] |
| `mediump` | (−214 , 214)   | (2^–14 , 2^14)        | Relative 2^–10 | [−2^15, 2^15 −1]       | [0, 2^16 −1] |
| `lowp`    | (−2, 2)        | (2^–8 , 2)            | Absolute 26–8  | [−2^7, 2^7 −1]         | [0, 2^8 −1]  |

A precision statement establishes a default precision qualifier for subsequent `int`, `float`, and sampler declarations, e.g.: `precision highp int;`

### Invariant Qualifiers Examples

| `#pragma STDGL invariant(all)`       | Force all output variables to be invariant |
| `invariant gl_Position;`             | Qualify a previously declared variable |
| `invariant centroid out vec3 Color;` | Qualify as part of a variable declaration |

### Order of Qualification

When multiple qualifications are present, they must follow a strict order. This order is either:

* invariant, interpolation, storage, precision
* storage, parameter, precision


## Preprocessor

Preprocessor Directives

The number sign (#) can be immediately preceded or followed in its line by spaces or horizontal tabs.

`#` `#define` `#undef` `#if` `#ifdef` `#ifndef` `#else` `#elif` `#endif` `#error` `#pragma` `#extension` `#version` `#line`

Examples of Preprocessor Directives

* `#version 100` in a shader program specifies that the program is written in GLSL ES version 1.00. It is optional. If used, it must occur before anything else in the program other than whitespace or comments.
* `#extension extension_name : behavior`, where behavior can be `require`, `enable`, `warn`, or `disable`; and where extension_name is an extension supported by the compiler
* `#pragma optimize({on, off})` - enable or disable shader optimization (default on) - GLSL 3.00
* `#pragma debug({on, off})` - enable or disable compiling shaders with debug information (default off) - GLSL 3.00

Predefined Macros

| Macro         | Description |
| ---           | --- |
| `__LINE__`    | Decimal integer constant that is one more than the number of preceding new-lines in the current
source string |
| `__FILE__`    | Decimal integer constant that says which source string number is currently being processed |
| `__VERSION__` | Decimal integer: 100 or 300 |
| `GL_ES`       | Defined and set to integer `1` if running on an OpenGL-ES Shading Language. Always `1` in WebGL, mainly useful if sharing shader code with non-ES environments. |
| `GL_FRAGMENT_PRECISION_HIGH` | `1` if `highp` is supported in the fragment language, else undefined |


## Built-In Inputs, Outputs, and Constants

Shader programs use special variables and constants to communicate with fixed-function parts of the pipeline.

Notes:
* Output Special Variables may be read back after writing.
* Input Special Variables are read-only.
* All Special Variables have global scope.

### Built-in Vertex Shader Variables

Inputs:

| Variable         | Type            | Description                    | Units or coordinate system |
| ---              | ---             | ---                            | --- |
| `gl_VertexID`    | `int`           | integer index (GLSL 3.00 only) | |
| `gl_InstanceID`  | `int`           | instance number (GLSL 3.00 only) | |

Outputs:

| Variable         | Type            | Description                 | Units or coordinate system |
| ---              | ---             | ---                         | --- |
| `gl_Position`    | `highp vec4`    | transformed vertex position | clip coordinates |
| `gl_PointSize`   | `mediump float` | transformed point size (point rasterization only) | pixels |

### Built-in Fragment Shader Variables

Inputs:

| Variable         | Type            | Description                           | Units or coordinate system |
| ---              | ---             | ---                                   | --- |
| `gl_FragCoord`   | `mediump vec4`  | fragment position within frame buffer | window coordinates |
| `gl_FrontFacing` | `bool`          | fragment belongs to a front-facing primitive | Boolean |
| `gl_PointCoord`  | `mediump vec2`  | fragment position within a point (point rasterization only) | 0.0 to 1.0 for each component |

Outputs (GLSL 1.00 es only):

| Variable         | Type            | Description                 | Units or coordinate system |
| ---              | ---             | ---                         | --- |
| `gl_FragColor`   | `mediump vec4`  | fragment color              | RGBA color |
| `gl_FragData[n]` | `mediump vec4`  | fragment color for color attachment n | RGBA color |

Notes:
* In GLSL 3.00 es there are no built-in variables for fragment shader outputs, they are declared by the shader using the `out` syntax.
* Fragment shaders may write to `gl_FragColor` or to one or more elements of `gl_FragData[]`, but not both.
* The size of the `gl_FragData` array is given by the built-in constant `gl_MaxDrawBuffers`.

### Built-In Constants

| Constant                          | Type                | WebGL1 | WebGL2 |
| ---                               | ---                 | ---    | ---    |
| `gl_MaxVertexAttribs`             | `const mediump int` | 8      | 16     |
| `gl_MaxVertexUniformVectors`      | `const mediump int` | 128    | 256    |
| `gl_MaxVaryingVectors`            | `const mediump int` | 8      | N/A    |
| `gl_MaxVertexOutputVectors`       | `const mediump int` | N/A    | 16     |
| `gl_MaxVertexTextureImageUnits`   | `const mediump int` | 0      | 16     |
| `gl_MaxCombinedTextureImageUnits` | `const mediump int` | 8      | 32     |
| `gl_MaxTextureImageUnits`         | `const mediump int` | 8      | 16     |
| `gl_MaxFragmentInputVectors`      | `const mediump int` | N/A    | 15     |
| `gl_MaxFragmentUniformVectors`    | `const mediump int` | 16     | 224    |
| `gl_MaxDrawBuffers`               | `const mediump int` | 1      | 4      |
| `gl_MinProgramTexelOffset`        | `const mediump int` | N/A    | -8     |
| `gl_MaxProgramTexelOffset`        | `const mediump int` | N/A    | 7      |


### Built-in Uniforms

| Uniform          | Type                       | Description |
| ---              | ---                        | ---         |
| `gl_DepthRange`  | `gl_DepthRangeParameters`  | Specifies depth range in window coordinates. If an implementation does not support highp precision in the fragment language, and state is listed as highp, then that state will only be available as mediump in the fragment language. |

```
struct gl_DepthRangeParameters {
  highp float near; // n
  highp float far; // f
  highp float diff; // f - n
};
```

## GLSL Built-in Functions

### Common Functions

`T` can be `float`, `vec2`, `vec3`, `vec4`. Component-wise operation on vectors.

| `T abs(T x)`          | absolute value |
| `T sign(T x)`         | returns -1.0, 0.0, or 1.0 |
| `T floor(T x)`        | nearest integer <= x |
| `T ceil(T x)`         |  |
| `T fract(T x)`        | `x - floor(x)` |
| `T mod(T x, T y)`     | modulus |
| `T mod(T x, float y)` |  |
| `T min(T x, T y)`     | minimum value |
| `T min(T x, float y)` |  |
| `T max(T x, T y)`     | maximum value |
| `T max(T x, float y)` |  |
| `T clamp(T x, T minVal, T maxVal)`         | `min(max(x, minVal), maxVal)` |
| `T clamp(T x, float minVal, float maxVal)` | |
| `T mix(T x, T y, T a)`     | linear blend of x and y |
| `T mix(T x, T y, float a)` | |
| `T step(T edge, T x)`      | 0.0 if x < edge, else 1.0 |
| `T step(float edge, T x)`  | |
| `T smoothstep(T edge0, T edge1, T x)` | clip and smooth |
| `T smoothstep(float edge0, float edge1, T x)` |  |


### Geometric Functions

`T` can be `float`, `vec2`, `vec3`, `vec4`. These functions operate on vectors as vectors, not component-wise.

| `float length(T x)`               | length of vector |
| `float distance(T p0, T p1)`      | distance between points |
| `float dot(T x, T y)`             | dot product |
| `vec3 cross(vec3 x, vec3 y)`      | cross product |
| `T normalize(T x)`                | normalize vector to length 1 |
| `T faceforward(T N, T I, T Nref)` | returns N if dot(Nref, I) < 0, else -N |
| `T reflect(T I, T N)`             | reflection direction I - 2 * dot(N,I) * N |
| `T refract(T I, T N, float eta)`  | refraction vector |


### Matrix Functions

Type mat is any matrix type.

| `mat matrixCompMult(mat x, mat y)` | multiply x by y component-wise |


### Vector Relational Functions

Compare x and y component-wise. Sizes of input and return vectors for a particular call must match.
Type bvec is bvecn; vec is vecn; ivec is ivecn (where n is 2, 3, or 4). T is the union of vec and ivec.

| `bvec lessThan(T x, T y)`         | x < y |
| `bvec lessThanEqual(T x, T y)`    | x <= y |
| `bvec greaterThan(T x, T y)`      | x > y |
| `bvec greaterThanEqual(T x, T y)` | x >= y |
| `bvec equal(T x, T y)`            | |
| `bvec equal(bvec x, bvec y)`      | x == y |
| `bvec notEqual(T x, T y)`         | |
| `bvec notEqual(bvec x, bvec y)`   | x != y |
| `bool any(bvec x)`                | true if any component of x is true |
| `bool all(bvec x)`                | true if all components of x are true |
| `bvec not(bvec x)`                | logical complement of `x` |


### Texture Lookup Functions

Available in vertex and fragment shaders:

| `vec4 texture2D(sampler2D sampler, vec2 coord)` |
| `vec4 texture2DProj(sampler2D sampler, vec3 coord)` |
| `vec4 texture2DProj(sampler2D sampler, vec4 coord)` |
| `vec4 textureCube(samplerCube sampler, vec3 coord)` |

Available only in vertex shaders.

| `vec4 texture2DLod(sampler2D sampler, vec2 coord, float lod)` |
| `vec4 texture2DProjLod(sampler2D sampler, vec3 coord, float lod)` |
| `vec4 texture2DProjLod(sampler2D sampler, vec4 coord, float lod)` |
| `vec4 textureCubeLod(samplerCube sampler, vec3 coord, float lod)` |

Available only in fragment shaders.

| `vec4 texture2D(sampler2D sampler, vec2 coord, float bias)` |
| `vec4 texture2DProj(sampler2D sampler, vec3 coord, float bias)` |
| `vec4 texture2DProj(sampler2D sampler, vec4 coord, float bias)` |
| `vec4 textureCube(samplerCube sampler, vec3 coord, float bias)` |


### Texture Lookup Functions [8.8]

The function textureSize returns the dimensions of level lod for the texture bound to sampler, as described in [2.11.9] of the OpenGL ES 3.0 specification, under “Texture Size Query”. The initial “g” in a type name is a placeholder for nothing, “i”, or “u”.

| `highp ivec{2,3} textureSize(gsampler{2,3}D sampler, int lod);` |
| `highp ivec2 textureSize(gsamplerCube sampler, int lod);` |
| `highp ivec2 textureSize(sampler2DShadow sampler, int lod);` |
| `highp ivec2 textureSize(samplerCubeShadow sampler, int lod);` |
| `highp ivec3 textureSize(gsampler2DArray sampler, int lod);` |
| `highp ivec3 textureSize(sampler2DArrayShadow sampler, int lod);` |

Texture lookup functions using samplers are available to vertex and fragment shaders. The initial “g” in a type name is a placeholder for nothing, “i”, or “u”.

| `gvec4 texture(gsampler{2,3}D sampler, vec{2,3} P [, float bias]);` |
| `gvec4 texture(gsamplerCube sampler, vec3 P [, float bias]);` |
| `float texture(sampler2DShadow sampler, vec3 P [, float bias]);` |
| `float texture(samplerCubeShadow sampler, vec4 P [, float bias]);` |
| `gvec4 texture(gsampler2DArray sampler, vec3 P [, float bias]);` |
| `float texture(sampler2DArrayShadow sampler, vec4 P);` |
| `gvec4 textureProj(gsampler2D sampler, vec{3,4} P [, float bias]);` |
| `gvec4 textureProj(gsampler3D sampler, vec4 P [, float bias]);` |
| `float textureProj(sampler2DShadow sampler, vec4 P [, float bias]);` |
| `gvec4 textureLod(gsampler{2,3}D sampler, vec{2,3} P, float lod);` |
| `gvec4 textureLod(gsamplerCube sampler, vec3 P, float lod);` |
| `float textureLod(sampler2DShadow sampler, vec3 P, float lod);` |
| `gvec4 textureLod(gsampler2DArray sampler, vec3 P, float lod);` |
| `gvec4 textureOffset(gsampler2D sampler, vec2 P, ivec2 offset [, float bias]);` |
| `gvec4 textureOffset(gsampler3D sampler, vec3 P, ivec3 offset [, float bias]);` |
| `float textureOffset(sampler2DShadow sampler, vec3 P, ivec2 offset [, float bias]);` |
| `gvec4 textureOffset(gsampler2DArray sampler, vec3 P, ivec2 offset [, float bias]);` |
| `gvec4 texelFetch(gsampler2D sampler, ivec2 P, int lod);` |
| `gvec4 texelFetch(gsampler3D sampler, ivec3 P, int lod);` |
| `gvec4 texelFetch(gsampler2DArray sampler, ivec3 P, int lod);` |
| `gvec4 texelFetchOffset(gsampler2D sampler, ivec2 P, int lod, ivec2 offset);` |
| `gvec4 texelFetchOffset(gsampler3D sampler, ivec3 P, int lod, ivec3 offset);` |
| `gvec4 texelFetchOffset(gsampler2DArray sampler, ivec3 P, int lod, ivec2 offset);` |
| `gvec4 textureProjOffset(gsampler2D sampler, vec3 P, ivec2 offset [, float bias]);` |
| `gvec4 textureProjOffset(gsampler2D sampler, vec4 P, ivec2 offset [, float bias]);` |
| `gvec4 textureProjOffset(gsampler3D sampler, vec4 P, ivec3 offset [, float bias]);` |
| `float textureProjOffset(sampler2DShadow sampler, vec4 P, ivec2 offset [,float bias]);` |
| `gvec4 textureLodOffset(gsampler2D sampler, vec2 P, float lod, ivec2 offset);` |
| `gvec4 textureLodOffset(gsampler3D sampler, vec3 P, float lod, ivec3 offset);` |
| `float textureLodOffset(sampler2DShadow sampler, vec3 P, float lod, ivec2 offset);` |
| `gvec4 textureLodOffset(gsampler2DArray sampler, vec3 P, float lod, ivec2 offset);` |
| `gvec4 textureProjLod(gsampler2D sampler, vec3 P, float lod);` |
| `gvec4 textureProjLod(gsampler2D sampler, vec4 P, float lod);` |
| `gvec4 textureProjLod(gsampler3D sampler, vec4 P, float lod);` |
| `float textureProjLod(sampler2DShadow sampler, vec4 P, float lod);` |
| `gvec4 textureProjLodOffset(gsampler2D sampler, vec3 P, float lod, ivec2 offset);` |
| `gvec4 textureProjLodOffset(gsampler2D sampler, vec4 P, float lod, ivec2 offset);` |
| `gvec4 textureProjLodOffset(gsampler3D sampler, vec4 P, float lod, ivec3 offset);` |
| `float textureProjLodOffset(sampler2DShadow sampler, vec4 P, float lod, ivec2 offset);` |
| `gvec4 textureGrad(gsampler2D sampler, vec2 P, vec2 dPdx, vec2 dPdy);` |
| `gvec4 textureGrad(gsampler3D sampler, vec3 P, vec3 dPdx, vec3 dPdy);` |
| `gvec4 textureGrad(gsamplerCube sampler, vec3 P, vec3 dPdx, vec3 dPdy);` |
| `float textureGrad(sampler2DShadow sampler, vec3 P, vec2 dPdx, vec2 dPdy);` |
| `float textureGrad(samplerCubeShadow sampler, vec4 P, vec3 dPdx, vec3 dPdy);` |
| `gvec4 textureGrad(gsampler2DArray sampler, vec3 P, vec2 dPdx, vec2 dPdy);` |
| `float textureGrad(sampler2DArrayShadow sampler, vec4 P, vec2 dPdx, vec2 dPdy);` |
| `gvec4 textureGradOffset(gsampler2D sampler, vec2 P, vec2 dPdx, vec2 dPdy, ivec2 offset);` |
| `gvec4 textureGradOffset(gsampler3D sampler, vec3 P, vec3 dPdx, vec3 dPdy, ivec3 offset);` |
| `float textureGradOffset(sampler2DShadow sampler, vec3 P, vec2 dPdx, vec2 dPdy, ivec2 offset);` |
| `gvec4 textureGradOffset(gsampler2DArray sampler, vec3 P, vec2 dPdx, vec2 dPdy, ivec2 offset);` |
| `float textureGradOffset(sampler2DArrayShadow sampler, vec4 P, vec2 dPdx, vec2 dPdy, ivec2 offset);` |
| `gvec4 textureProjGrad(gsampler2D sampler, vec3 P, vec2 dPdx, vec2 dPdy);` |
| `gvec4 textureProjGrad(gsampler2D sampler, vec4 P, vec2 dPdx, vec2 dPdy);` |
| `gvec4 textureProjGrad(gsampler3D sampler, vec4 P, vec3 dPdx, vec3 dPdy);` |
| `float textureProjGrad(sampler2DShadow sampler, vec4 P, vec2 dPdx, vec2 dPdy);` |
| `gvec4 textureProjGradOffset(gsampler2D sampler, vec3 P, vec2 dPdx, vec2 dPdy, ivec2 offset);` |
| `gvec4 textureProjGradOffset(gsampler2D sampler, vec4 P, vec2 dPdx, vec2 dPdy, ivec2 offset);` |
| `gvec4 textureProjGradOffset(gsampler3D sampler, vec4 P, vec3 dPdx, vec3 dPdy, ivec3 offset);` |
| `float textureProjGradOffset(sampler2DShadow sampler, vec4 P, vec2 dPdx, vec2 dPdy, ivec2 offset);` |


### Fragment Processing Functions [8.9]

Approximated using local differencing.

| `T dFdx(T p); Derivative in x` |
| `T dFdy(T p); Derivative in y` |
| `T fwidth(T p); abs (dFdx (p)) + abs (dFdy (p));` |
