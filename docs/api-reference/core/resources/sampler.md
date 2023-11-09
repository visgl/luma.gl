# Sampler

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A `Sampler` is an immutable object that holds a set of sampling parameters for texture access.
Sampling parameters are applied during shader execution and control how values ("texels")
are read from textures.

Note that luma.gl automatically creates a default `Sampler` for each `Texture`.
A texture's default sampler parameters can be specified creating the texture via `device.createTexture({sampler: SamplerProps}))`.
Unless an application needs to render the same texture with different sampling parameters,
an application typically does not need to explicitly instantiate samplers.

Note that a **Comparison sampler** is a special type of `Sampler` that compares against the depth buffer.
During comparison sampling, the interpolated and clamped `r` texture coordinate is compared to currently bound depth texture,
and the result of the comparison (`0` or `1`) is assigned to the red channel.
Specifying the `type: 'comparison-sampler'` sampler property creates a comparison sampler.

## Usage

Create a new `Sampler`

```typescript
import {luma} from '@luma.gl/core';
const device = await luma.createDevice();
const sampler = device.createSampler(gl, {
  addressModeU: 'clamp-to-edge'
});
```

Note that a default `Sampler` is automatically created for each texture:

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

Create a new **comparison sampler**, by specifying the `compare` sampler property creates a comparison sampler.

```typescript
const sampler = device.createSampler(gl, {
  compare: 'lequal'
});
```

## Types

### SamplerProps

| Sampler Parameter | Values                                                  | Description                                                         |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `type`            | `'color-sampler'` \* \| `'comparison-sampler'`          | Specify `'comparison-sampler'` to create a depth comparison sampler |
| `addressModeU?`   | `'clamp-to-edge'` \* \| `'repeat'` \| `'mirror-repeat'` | Texture wrapping for texture coordinate `u` (`s`)                   |
| `addressModeV?`   | `'clamp-to-edge'` \* \| `'repeat'` \| `'mirror-repeat'` | Texture wrapping for texture coordinate `v` (`t`)                   |
| `addressModeW?`   | `'clamp-to-edge'` \* \| `'repeat'` \| `'mirror-repeat'` | Texture wrapping for texture coordinate `w` (`r`)                   |
| `magFilter?`      | `'nearest'` \* \| `'linear'`                            | Sample nearest texel, or interpolate closest texels                 |
| `minFilter?`      | `'nearest'` \* \| `'linear'`                            | Sample nearest texel, or interpolate closest texels                 |
| `mipmapFilter?`   | `'nearest'` \* \| `'linear'`                            | Sample closest mipmap, or interpolate two closest mipmaps           |
| `maxAnisotropy?`  | `number`                                                | Combine samples from multiple mipmap levels when appropriate        |
| `lodMinClamp?`    | `number`                                                | Minimum level of detail to use when sampling                        |
| `lodMaxClamp?`    | `number`                                                | Maximum level of detail to use when sampling                        |
| `compare?`        | `less-equal` etc (see below)                            | Specifies compare function for a depth "comparison sampler"         |

#### Texture Wrapping

Controls how texture coordinates outside of the [0, 1] range are sampled.

- Parameters: `addressModeU`, `addressModeV`, `addressModeW`

| Value              | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| `repeat` (default) | use fractional part of texture coordinates                                             |
| `clamp-to-edge`    | clamp texture coordinates                                                              |
| `mirrored-repeat`  | use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac` |

#### Texture Magnification Filter

Controls how a pixel is textured when it maps to less than one texel.

Parameter: `magFilter`

| Value               | Description        |
| ------------------- | ------------------ |
| `nearest` (default) | nearest texel      |
| `linear`            | interpolated texel |

- `nearest` is faster than `linear`, but is not as smooth.

#### Texture Minification Filter

Controls how a pixel is textured when it maps to more than one texel.

Parameter: `minFilter`

| Value               | Description        |
| ------------------- | ------------------ |
| `nearest` (default) | nearest texel      |
| `linear`            | interpolated texel |

#### Texture Mipmap Filter

Controls if a pixel is textured by referencing more than one mipmap level.

Parameter: `mipmapFilter`

| Value               | Description                 |
| ------------------- | --------------------------- |
| `nearest` (default) | nearest mipmap              |
| `linear`            | interpolate between mipmaps |
| N/A                 | no mipmaps                  |

#### Texture Max Anisotropy

Controls multiple mipmap level can be consulted when texturing a pixel.

#### Texture Comparison Function

> Specifying the `compare` sampler property creates a comparison sampler.
> Comparison samplers are special samplers that compare a value against the depth buffer.

Parameter: `compare`

| `Value                 | Computed result                    |
| ---------------------- | ---------------------------------- |
| `less-equal` (default) | result = 1.0 0.0, r \<\= D t r > D t |
| `greater-equal`        | result = 1.0 0.0, r \>\= D t r < D t |
| `less`                 | result = 1.0 0.0, r < D t r \>\= D t |
| `greater`              | result = 1.0 0.0, r > D t r \<\= D t |
| `equal`                | result = 1.0 0.0, r = D t r ≠ D t  |
| `not-equal`            | result = 1.0 0.0, r ≠ D t r = D t  |
| `always`               | result = 1.0                       |
| `never`                | result = 0.0                       |

During sampling, the interpolated and clamped `r` texture coordinate is compared to currently bound depth texture,
and the result of the comparison (`0` or `1`) is assigned to the red channel.

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `Sampler`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `SamplerProps` - holds a copy of the `SamplerProps` used to create this `Sampler`.

## Methods

### `constructor(props: SamplerProps)`

`Sampler` is an abstract class and cannot be instantiated directly. Create with `device.createSampler(...)`.

```typescript
device.createSampler({...})
```

### `destroy(): void`

Free up any GPU resources associated with this sampler immediately (instead of waiting for garbage collection).


## Remarks

- WebGL: More information about `WebGLSampler` can be found in the [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Sampler_Object).
