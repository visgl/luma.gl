# Sampler

A Sampler is an immutable object that holds a set of sampling parameters for texture access.
Sampling parameters are applied during shader execution and control how values ("texels")
are read from textures.

Samplers allow texture sampling parameters to be specified independently of textures.
By using samplers an application can render the same texture with different
parameters without duplicating the texture, or modifying the texture parameters.

References:

- [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Sampler_Object).

## Usage

Create a new `Sampler`

```typescript
import {luma} from '@luma.gl/api';
const device = await luma.createDevice();
const sampler = device.createSampler(gl, {
  addressModeU: 'clamp-to-edge'
});
```

A `Sampler` is automatically created for each texture.

```typescript
// Create a texture
const texture = device.createTexture({
  sampler: {
    minFilter: 'linear',
    maxFilter: 'linear'
  }
});
console.log(texture.sampler);
```

## Base Classes

Sampler inherits from [Resource](/docs/modules/api/api-reference/resources/resource.md) and supports the same use cases.

## Methods

### Base Class

`Sampler` inherits methods and members from [Resource](/docs/modules/api/api-reference/resources/resource.md):

### constructor

```typescript
device.createSampler({...})
```

- `props` - an object where each key represents a sampler parameter and its value.

### destroy

Frees the underlying WebGL resource

## Sampler Parameters

| Sampler Parameter | Values                                               | Description                                                         |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `addressModeU?`   | `'clamp-to-edge'` \| `'repeat'` \| `'mirror-repeat'` | Texture wrapping for texture coordinate `u` (`s`)                   |
| `addressModeV?`   | `'clamp-to-edge'` \| `'repeat'` \| `'mirror-repeat'` | Texture wrapping for texture coordinate `v` (`t`)                   |
| `addressModeW?`   | `'clamp-to-edge'` \| `'repeat'` \| `'mirror-repeat'` | Texture wrapping for texture coordinate `w` (`r`)                   |
| `magFilter?`      | `'nearest'` \| `'linear'`                            | Sample nearest texel, or interpolate closest texels                 |
| `minFilter?`      | `'nearest'` \| `'linear'`                            | Sample nearest texel, or interpolate closest texels                 |
| `mipmapFilter?`   | `'nearest'` \| `'linear'`                            | Sample closest mipmap, or interpolate two closest mipmaps           |
| `lodMinClamp?`    | `number`                                             | Minimum level of detail to use when sampling                        |
| `lodMaxClamp?`    | `number`                                             | Maximum level of detail to use when sampling                        |
| `compare?`        | `lequal` etc (see below)                             | Create a depth "comparison sampler" with specified compare function |
| `maxAnisotropy?`  | `number`                                             | Combine samples from multiple mipmap levels when appropriate        |

### Texture Magnification Filter

Controls how a pixel is textured when it maps to less than one texel.

Parameter: `texture_mag_filter`

| Value               | Description        |
| ------------------- | ------------------ |
| `linear`            | interpolated texel |
| `nearest` (default) | nearest texel      |

- `nearest` is faster than `linear`, but is not as smooth.

### Texture Minification Filter

Controls how a pixel is textured maps to more than one texel.

ParameterL `texture_min_filter`

| Value     | Description        |
| --------- | ------------------ |
| `linear`  | interpolated texel |
| `nearest` | nearest texel      |

### Texture Minification Filter

Controls how a pixel is textured maps to more than one texel.

ParameterL `texture_min_filter`

| Value     | Description        |
| --------- | ------------------ |
| `linear`  | interpolated texel |
| `nearest` | nearest texel      |

### Texture Wrapping

Controls how texture coordinates outside of the [0, 1] range are sampled.

- Parameters: `addressModeU`, `addressModeV`, `addressModeW`

| Value              | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| `repeat` (default) | use fractional part of texture coordinates                                             |
| `clamp-to-edge`    | clamp texture coordinates                                                              |
| `mirrored-repeat`  | use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac` |

### Comparison Samplers

Specifying the `compare` sampler property creates a comparison sampler.
Comparison samplers are special samplers that compare against the depth buffer.

In other words, specifies the texture comparison mode for currently bound depth textures
(i.e. textures whose internal format is `depth_component_*`).

```typescript
const sampler = device.createSampler(gl, {
  compare: 'lequal'
});
```

During sampling, the interpolated and clamped `r` texture coordinate is compared to currently bound depth texture,
and the result of the comparison (`0` or `1`) is assigned to the red channel.

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
