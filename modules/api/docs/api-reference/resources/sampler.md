# Sampler

A [Sampler object](https://www.khronos.org/opengl/wiki/Sampler_Object)
stores the sampling parameters for a texture access inside of a shader.
Samplers allow texture sampling parameters to be specified independently of textures.
Thus, by using samplers an application can render the same texture with different
parameters without duplicating the texture or modifying the texture parameters.

To use a sampler, bind it to the same texture unit as a texture to control sampling for that texture. When using the higher level [`Model`](/docs/api-reference/core/model.md) class, samplers can be specified using uniform names instead of texture indices.

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Sampler_Object).

## Usage

Create a new `Sampler`

```js
import {Sampler} from 'luma.gl';
const sampler = new Sampler(gl, {
  parameters: {
    [texture_wrap_s]: clamp_to_edge
  }
});
```

Reconfiguring a `Sampler`

```js
const sampler = new Sampler(gl);
sampler.setParameters({
  [texture_wrap_s]: clamp_to_edge
});
```

Using `Samplers` via `Model.draw`

```js
// Create a texture
const texture = new Texture2D(gl, ...);

// Create two samplers to sample the same texture in different ways
const sampler1 = new Sampler(gl, {parameters: {[min_filter]: linear, ...}});
const sampler2 = new Sampler(gl, {parameters: {[min_filter]: nearest, ...}});

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
const sampler1 = new Sampler(gl, {parameters: {[min_filter]: linear, ...}});
const sampler2 = new Sampler(gl, {parameters: {[min_filter]: nearest, ...}});
sampler1.bind(0);
sampler2.bind(1);
```

## Base Classes

Sampler inherits from [Resource](/docs/modules/api/api-reference/resources/resource.md) and supports the same use cases.

## Methods

### Base Class

`Sampler` inherits methods and members from [Resource](/docs/modules/api/api-reference/resources/resource.md), with the following remarks:

- `handle` - Handle to the underlying `WebGLSampler` object
- `getParameters` uses WebGL APIs [WebGLRenderingContext.getSamplerParameter](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getSamplerParameter)
- `setParameters` see below.

### constructor

```js
device.createSampler({...})
```

- `gl` - gl context
- `parameters` - an object where each key represents a sampler parameter and its value.

WebGL APIs [gl.createSampler](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createSampler)

### delete

Frees the underlying WebGL resource

WebGL APIs [gl.deleteSampler](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteSampler)

### setParameters

`Sampler.setParameters(parameters)`

- `parameters` (Object) - keys are parameters, value are values to be assigned

WebGL APIs [gl.getSamplerParameter](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getSamplerParameter)

### bind

Note: Normally not called by the application. Instead use the samplers Model

`Sampler.bind(unit)`

- param {GLuint} unit - texture unit index
  return {Sampler} - returns self to enable chaining

WebGL APIs [gl.bindSampler](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindSampler)

### unbind

Note: Normally not called by the application

Bind to the same texture unit as a texture to control sampling for that texture

- param {GLuint} unit - texture unit index
  return {Sampler} - returns self to enable chaining

## Sampler Parameters

| Sampler Parameter                | Values                                               | Description                                             |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `addressModeU?`                  | `'clamp-to-edge'` \| `'repeat'` \| `'mirror-repeat'` | texture wrapping for texture coordinate `u` (`s`)       |
| `addressModeV?`                  | `'clamp-to-edge'` \| `'repeat'` \| `'mirror-repeat'` | texture wrapping for texture coordinate `v` (`t`)       |
| `addressModeW?`                  | `'clamp-to-edge'` \| `'repeat'` \| `'mirror-repeat'` | texture wrapping for texture coordinate `w` (`r`)       |
| `magFilter?`                     | `'nearest'` \| `'linear'`                            | texture magnification filter                            |
| `minFilter?`                     | `'nearest'` \| `'linear'`                            | texture minification filter                             |
| `mipmapFilter?`                  | `'nearest'` \| `'linear'`                            |
| `lodMinClamp?`                   | `number`                                             |
| `lodMaxClamp?`                   | `number`                                             |
| `compare?`                       | `CompareFunction`                                    |
| `maxAnisotropy?`                 | `number`                                             | `GL_TEXTURE_MAX_ANISOTROPY`                             |

| `texture_mag_filter`             | `linear`                                             |
| `texture_min_filter`             | `nearest_mipmap_linear`                              |
| `texture_wrap_s`                 | `repeat`                                             |
| `texture_wrap_t`                 | `repeat`                                             |
| `texture_wrap_r` **WebGL2**      | `repeat`                                             |
| `texture_base_level`**WebGL2**   | `0`                                                  | Texture mipmap level                                    |
| `texture_max_level`**WebGL2**    | `1000`                                               | Maximum texture mipmap array level                      |
| `texture_compare_func`**WebGL2** | `lequal`                                             | texture comparison function                             |
| `texture_compare_mode`**WebGL2** | `none`                                               | whether r tex coord should be compared to depth texture |
| `texture_min_lod`**WebGL2**      | `-1000`                                              | minimum level-of-detail value                           |
| `texture_max_lod`**WebGL2**      | `1000`                                               | maximum level-of-detail value                           |

### Texture Magnification Filter

Controls how a pixel is textured when it maps to less than one texel.

Parameter: `texture_mag_filter`

| Value              | Description        |
| ------------------ | ------------------ |
| `linear` (default) | interpolated texel |
| `nearest`          | nearest texel      |

- `nearest` is faster than `linear`, but is not as smooth.

### Texture Minification Filter

Controls how a pixel is textured maps to more than one texel.

ParameterL `texture_min_filter`

| Value                             | Description                                 |
| --------------------------------- | ------------------------------------------- |
| `linear`                          | interpolated texel                          |
| `nearest`                         | nearest texel                               |
| `nearest_mipmap_nearest`          | nearest texel in closest mipmap             |
| `linear_mipmap_nearest`           | interpolated texel in closest mipmap        |
| `nearest_mipmap_linear` (default) | average texel from two closest mipmaps      |
| `linear_mipmap_linear`            | interpolated texel from two closest mipmaps |

### Texture Wrapping

Controls how texture coordinates outside of the [0, 1] range are sampled.

- Parameters: `texture_wrap_s`, `texture_wrap_t`, `texture_wrap_r`

| Value              | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| `repeat` (default) | use fractional part of texture coordinates                                             |
| `clamp_to_edge`    | clamp texture coordinates                                                              |
| `mirrored_repeat`  | use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac` |

### Texture Comparison Mode

Specifies the texture comparison mode for currently bound depth textures (i.e. textures whose internal format is `depth_component_*`)

- Parameters `texture_compare_mode`

| Value                    | Description                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `none` (default)         | no comparison of `r` coordinate is performed                                                                                        |
| `compare_ref_to_texture` | interpolated and clamped `r` texture coordinate is compared to currently bound depth texture, result is assigned to the red channel |

### Texture Comparison Function

Parameter: `texture_compare_func`

| `Value             | Computed result                    |
| ------------------ | ---------------------------------- |
| `lequal` (default) | result = 1.0 0.0, r <= D t r > D t |
| `gequal`           | result = 1.0 0.0, r >= D t r < D t |
| `less`             | result = 1.0 0.0, r < D t r >= D t |
| `greater`          | result = 1.0 0.0, r > D t r <= D t |
| `equal`            | result = 1.0 0.0, r = D t r ≠ D t  |
| `notequal`         | result = 1.0 0.0, r ≠ D t r = D t  |
| `always`           | result = 1.0                       |
| `never`            | result = 0.0                       |
