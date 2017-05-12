# Sampler

[OpenGL Wiki](https://www.khronos.org/opengl/wiki/Sampler_Object): A Sampler Object is an OpenGL Object that stores the sampling parameters for a Texture access inside of a shader.

`Sampler` allow texture sampling and filtering parameters to be specified independently from a texture. By using samplers an application can render the same texture with different parameters without duplicating the texture or modifying the texture parameters.

The sampling parameters available are the same as on the [`Texture`](./texture.md) classes.

To use a sampler, bind it to the same texture unit as a texture to control sampling for that texture.

Note: When using the higher level [`Model`]('./model.md') class, samplers can be specified using uniform names instead of texture indices.

## Usage

Sampler inherits from [Resource](./resource) and supports the same use cases.

Create a new Sampler
```js
import {Sampler} from 'luma.gl';
const sampler = new Sampler(gl, {
  parameters: {
  	[GL.TEXTURE_WRAP_S]: GL.CLAMP
  }
});
```

Configuring a Sampler
```js
const sampler = new Sampler(gl);
sampler.setParameters({
  [GL.TEXTURE_WRAP_S]: GL.CLAMP
});
```

Using Samplers
```js
// Create two samplers to sample the same texture in different ways
const texture = new Texture2D(gl, ...);
const sampler1 = new Sampler(gl, ...);
const sampler2 = new Sampler(gl, ...);

// For ease of use, the `Model` class can bind samplers for a draw call
model.draw({
  uniforms({texture1: texture, texture2: texture}),
  samplers({texture1: sampler1, texture2: sampler2})
});

// Alternatively, bind the samplers using the `Sampler` API directly
texture.bind(0);
sampler1.bind(0);
texture.bind(1);
sampler2.bind(1);
```

## Members

`Sampler` inherits methods and members from [Resource](./resource).

### handle

Handle to the underlying `WebGLSampler` object.


## Methods

### Sampler Constructor

`new Sampler(gl, {parameters: {...}})`

* `gl` - gl context
* `parameters` - an object where each key represents a sampler parameter and its value.

WebGL APIs [gl.createSampler]()


### delete

Frees the underlying WebGL resource

WebGL APIs [gl.deleteSampler]()


### Sampler.bind

Note: Normally not called by the application.

* param {GLuint} unit - texture unit index
return {Sampler} - returns self to enable chaining

WebGL APIs [gl.bindSampler]()

### Sampler.unbind

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
| ------------------------------------ | -------------- | ----------- |
| `GL.TEXTURE_WRAP_R` **WebGL2**       | `GL.REPEAT`    | texture wrapping function for texture coordinate `r` |
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
