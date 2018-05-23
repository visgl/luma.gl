# Sampler

A [Sampler object](https://www.khronos.org/opengl/wiki/Sampler_Object) is an OpenGL Object that stores the sampling parameters for a texture access inside of a shader. While texture sampling parameters can be specified directly on textures, samplers allow them to be specified independently. Thus, by using samplers an application can render the same texture with different parameters without duplicating the texture or modifying the texture parameters.

To use a sampler, bind it to the same texture unit as a texture to control sampling for that texture. When using the higher level [`Model`](/docs/api-reference/core/model.md) class, samplers can be specified using uniform names instead of texture indices.

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Sampler_Object).


## Usage

Sampler inherits from [Resource](/docs/api-reference/webgl/resource.md) and supports the same use cases.

Create a new `Sampler`
```js
import {Sampler} from 'luma.gl';
const sampler = new Sampler(gl, {
  parameters: {
  	[GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE
  }
});
```

Reconfiguring a `Sampler`
```js
const sampler = new Sampler(gl);
sampler.setParameters({
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE
});
```

Using `Samplers` via `Model.draw`
```js
// Create a texture
const texture = new Texture2D(gl, ...);

// Create two samplers to sample the same texture in different ways
const sampler1 = new Sampler(gl, {parameters: {[GL.MIN_FILTER]: GL.LINEAR, ...}});
const sampler2 = new Sampler(gl, {parameters: {[GL.MIN_FILTER]: GL.NEAREST, ...}});

// The `Model` class can optionally bind samplers for each draw call
model.draw({
  uniforms: {texture1: texture, texture2: texture, ...},
  samplers: {texture1: sampler1, texture2: sampler2}
});
```

Using Samplers via direct bindings

```js
const texture = new Texture2D(gl, ...);
texture.bind(0);
texture.bind(1);

// Create two samplers to sample the same texture in different ways
const sampler1 = new Sampler(gl, {parameters: {[GL.MIN_FILTER]: GL.LINEAR, ...}});
const sampler2 = new Sampler(gl, {parameters: {[GL.MIN_FILTER]: GL.NEAREST, ...}});
sampler1.bind(0);
sampler2.bind(1);
```


## Methods

### Base Class

`Sampler` inherits methods and members from [Resource](/docs/api-reference/webgl/resource.md), with the following remarks:

* `handle` - Handle to the underlying `WebGLSampler` object
* `getParameters` uses WebGL APIs [WebGLRenderingContext.getSamplerParameter](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getSamplerParameter)
* `setParameters` see below.


### constructor

```js
new Sampler(gl, {parameters: {...}})
```

* `gl` - gl context
* `parameters` - an object where each key represents a sampler parameter and its value.

WebGL APIs [gl.createSampler](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createSampler)


### delete

Frees the underlying WebGL resource

WebGL APIs [gl.deleteSampler](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteSampler)

### setParameters

`Sampler.setParameters(parameters)`

* `parameters` (Object) - keys are parameters, value are values to be assigned

WebGL APIs [gl.getSamplerParameter](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getSamplerParameter)

### bind

Note: Normally not called by the application. Instead use the samplers Model

`Sampler.bind(unit)`

* param {GLuint} unit - texture unit index
return {Sampler} - returns self to enable chaining

WebGL APIs [gl.bindSampler](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindSampler)

### unbind

Note: Normally not called by the application

Bind to the same texture unit as a texture to control sampling for that texture
* param {GLuint} unit - texture unit index
return {Sampler} - returns self to enable chaining


## Sampler Parameters

| Sampler Parameter                    | Default        | Description |
| ------------------------------------ | -------------- | ----------- |
| `GL.TEXTURE_MAG_FILTER`              | `GL.LINEAR`    | texture magnification filter |
| `GL.TEXTURE_MIN_FILTER`              | `GL.NEAREST_MIPMAP_LINEAR` | texture minification filter |
| `GL.TEXTURE_WRAP_S`                  | `GL.REPEAT`    | texture wrapping function for texture coordinate `s` |
| `GL.TEXTURE_WRAP_T`                  | `GL.REPEAT`    | texture wrapping function for texture coordinate `t` |
| `GL.TEXTURE_WRAP_R` **WebGL2**       | `GL.REPEAT`    | texture wrapping function for texture coordinate `r` |
| `GL_TEXTURE_MAX_ANISOTROPY           | fLargest
| `GL.TEXTURE_BASE_LEVEL` **WebGL2**   | `0`            | Texture mipmap level |
| `GL.TEXTURE_MAX_LEVEL` **WebGL2**    | `1000`         | Maximum texture mipmap array level |
| `GL.TEXTURE_COMPARE_FUNC` **WebGL2** | `GL.LEQUAL`    | texture comparison function |
| `GL.TEXTURE_COMPARE_MODE` **WebGL2** | `GL.NONE`      | whether r tex coord should be compared to depth texture |
| `GL.TEXTURE_MIN_LOD` **WebGL2**      | `-1000`        | minimum level-of-detail value |
| `GL.TEXTURE_MAX_LOD` **WebGL2**      | `1000`         | maximum level-of-detail value |

### Texture Magnification Filter

Controls how a pixel is textured when it maps to less than one texel.

Parameter: `GL.TEXTURE_MAG_FILTER`

| Value                       | Description                     |
| --------------------------- | ------------------------------- |
| `GL.LINEAR` (default)       | interpolated texel              |
| `GL.NEAREST`                | nearest texel                   |

* `GL.NEAREST` is faster than `GL.LINEAR`, but is not as smooth.


### Texture Minification Filter

Controls how a pixel is textured maps to more than one texel.

ParameterL `GL.TEXTURE_MIN_FILTER`

| Value                       | Description                     |
| --------------------------- | ------------------------------- |
| `GL.LINEAR`                 | interpolated texel              |
| `GL.NEAREST`                | nearest texel                   |
| `GL.NEAREST_MIPMAP_NEAREST` | nearest texel in closest mipmap |
| `GL.LINEAR_MIPMAP_NEAREST`  | interpolated texel in closest mipmap |
| `GL.NEAREST_MIPMAP_LINEAR` (default) | average texel from two closest mipmaps |
| `GL.LINEAR_MIPMAP_LINEAR`   | interpolated texel from two closest mipmaps |


### Texture Wrapping

Controls how texture coordinates outside of the [0, 1] range are sampled.

* Parameters: `GL.TEXTURE_WRAP_S`, `GL.TEXTURE_WRAP_T`, `GL.TEXTURE_WRAP_R`

| Value                       | Description                     |
| --------------------------- | ------------------------------- |
| `GL.REPEAT` (default)       | use fractional part of texture coordinates |
| `GL.CLAMP_TO_EDGE`          | clamp texture coordinates                |
| `GL.MIRRORED_REPEAT`        | use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac` |


### Texture Comparison Mode

Specifies the texture comparison mode for currently bound depth textures (i.e. textures whose internal format is `GL.DEPTH_COMPONENT_*`)

* Parameters `GL.TEXTURE_COMPARE_MODE`

| Value                       | Description                     |
| --------------------------- | ------------------------------- |
| `GL.NONE` (default)         | no comparison of `r` coordinate is performed |
| `GL.COMPARE_REF_TO_TEXTURE` | interpolated and clamped `r` texture coordinate is compared to currently bound depth texture, result is assigned to the red channel |


### Texture Comparison Function

Parameter: `GL.TEXTURE_COMPARE_FUNC`

| `Value                      | Computed result                    |
| --------------------------- | ---------------------------------- |
| `GL.LEQUAL` (default)       | result = 1.0 0.0, r <= D t r > D t |
| `GL.GEQUAL`                 | result = 1.0 0.0, r >= D t r < D t |
| `GL.LESS`                   | result = 1.0 0.0, r < D t r >= D t |
| `GL.GREATER`                | result = 1.0 0.0, r > D t r <= D t |
| `GL.EQUAL`                  | result = 1.0 0.0, r = D t r ≠ D t  |
| `GL.NOTEQUAL`               | result = 1.0 0.0, r ≠ D t r = D t  |
| `GL.ALWAYS`                 | result = 1.0                       |
| `GL.NEVER`                  | result = 0.0                       |
