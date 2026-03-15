# DynamicTexture

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.2-blue.svg?style=flat-square" alt="From-v9.2" />
  <img src="https://img.shields.io/badge/@luma.gl-engine.svg?style=flat-square" alt="@luma.gl/engine" />
</p>

> `DynamicTexture` was called `AsyncTexture` in v9.1

The `DynamicTexture` class module is designed to make it easier to work with textures in luma.gl. The underlying `Texture` class in `@luma.gl/core` module can be used, however it is not designed for convenience, as it intentionally offers only the minimal API necessary to expose GPU texture capabilities in a portable way.

| `DynamicTexture` | `Texture` | Capability | Description                                                  |
| ---------------- | --------- | ---------- | ------------------------------------------------------------ |
| ✅               | ❌        | Resize     | e.g updating textures to match changes in screen size        |
| ✅               | ❌        | Async Init | avoids callbacks and conditional logic to defer texture init |
| ✅               | ❌        | Mipmaps    | Handles mipmap generation on WebGPU                          |
| ✅               | -         | `Model`    | `Model` class is `DynamicTexture` aware                      |

- `DynamicTexture` can be resized.
  - This is very useful when developing shader based techniques that need to respond to changes in screen size.
- `DynamicTexture` can be created and "used" while data is still being loaded.
  - The `DynamicTexture` class accepts promises that resolve to texture data (images or byte arrays).
  - It postpones the creation of underlying `Textures` until the supplied promise(s) resolve and data is available.
- The `Model` class accepts `DynamicTextures` as bindings wherever a `Texture` or `TextureView` would be accepted
  - `Model` avoids rendering (`Model.draw()` call execution) until the underlying texture has been created.

## Usage

```ts
import {DynamicTexture, loadImage} from '@luma.gl/engine';
const dynamicTexture = new DynamicTexture(device, {data: loadImage(url)});
const model = new Model(device, {source, bindings: {texture: dynamicTexture}});
const renderPass = device.createRenderPass();
model.draw(renderPass); // Doesn't draw
...
await dynamicTexture.ready; // Not necessary, just for illustration
model.draw(renderPass); // Draws
```

## WebGPU mipmaps

On WebGPU, mipmap generation is owned by `DynamicTexture`.

- `DynamicTexture.generateMipmaps()` is the supported entrypoint for WebGPU mipmap generation.
- `2d`, `2d-array`, `cube`, and `cube-array` textures use a render-pass path.
- `3d` textures use a compute-shader path.
- If the texture format does not support the required capabilities, `generateMipmaps()` throws at runtime with an explicit error message.

When `mipmaps: true` is requested on a WebGPU `DynamicTexture`, luma.gl adds the texture usage flags required by the selected mipmap-generation path.

## Explicit mip arrays

`DynamicTexture` also accepts explicit mip chains as input data.

- If multiple mip levels are supplied, `DynamicTexture` allocates enough `mipLevels` to hold the validated chain.
- If explicit mip levels are supplied together with `mipmaps: true`, the supplied mip chain wins and auto-generation is skipped.
- For array, cube, and 3d textures, the final texture uses the longest mip chain that is valid across every slice.

For uncompressed textures, mip dimensions must follow the usual halving rule.

For compressed textures, `DynamicTexture` also enforces block-compression limits:

- per-level format must stay consistent across the mip chain
- mip levels smaller than one compression block are ignored
- later invalid mip levels truncate the chain instead of failing the entire texture

## Compressed textures

`DynamicTexture` is a convenience layer for texture initialization and updates, but compressed texture rules still come from the underlying backend.

Compressed mip levels can now be passed directly as texture data objects:

```ts
const texture = new DynamicTexture(device, {
  dimension: '2d',
  data: [
    {data: level0, width: 512, height: 512, textureFormat: 'bc7-rgba-unorm'},
    {data: level1, width: 256, height: 256, textureFormat: 'bc7-rgba-unorm'},
    {data: level2, width: 128, height: 128, textureFormat: 'bc7-rgba-unorm'}
  ]
});
```

During the current transition, each mip-level object may provide either:

- `textureFormat?: TextureFormat`
- `format?: TextureFormat`

If both are supplied, they must match. `textureFormat` is the preferred field name.

For compressed texture alignment, WebGL vs WebGPU behavior, and asset-preparation guidance, see [Using GPU Textures](/docs/api-guide/gpu/gpu-textures#compressed-textures).

## Types

```ts
export type DynamicTextureProps = Omit<TextureProps, 'data' | 'mipLevels' | 'width' | 'height'> &
  DynamicTextureDataProps & {
    mipmaps?: boolean;
    mipLevels?: number | 'auto';
    width?: number;
    height?: number;
  };

type DynamicTextureDataProps =
  | DynamicTexture1DProps
  | DynamicTexture2DProps
  | DynamicTexture3DProps
  | DynamicTextureArrayProps
  | DynamicTextureCubeProps
  | DynamicTextureCubeArrayProps;

type DynamicTexture1DProps = {dimension: '1d'; data: Promise<Texture1DData> | Texture1DData | null};
type DynamicTexture2DProps = {
  dimension?: '2d';
  data: Promise<Texture2DData> | Texture2DData | null;
};
type DynamicTexture3DProps = {dimension: '3d'; data: Promise<Texture3DData> | Texture3DData | null};
type DynamicTextureArrayProps = {
  dimension: '2d-array';
  data: Promise<TextureArrayData> | TextureArrayData | null;
};
type DynamicTextureCubeProps = {
  dimension: 'cube';
  data: Promise<TextureCubeData> | TextureCubeData | null;
};
type DynamicTextureCubeArrayProps = {
  dimension: 'cube-array';
  data: Promise<TextureCubeArrayData> | TextureCubeArrayData | null;
};

type TextureImageData = {
  data: TypedArray;
  width: number;
  height: number;
  textureFormat?: TextureFormat;
  format?: TextureFormat;
};
```

## Members

### `ready`

A promise that resolves when the data has completed loading / preparation and the underlying GPU texture has been created and initialized, or rejects with an `Error` instance describing the failure.

```ts
ready: Promise<Texture>;
```

### `isReady`

A flag that indicates whether data loading / preparation has completed loading and the underlying GPU texture has been created and initialized.

```ts
isReady: boolean;
```

Initial value is `false`. Once the `DynamicTexture.ready` promise resolve successfully, the `DynamicTexture.isReady` flag is guaranteed to be true.

### `texture`

It is an error to access this member if `DynamicTexture.isReady` is not true).

```ts
texture: Texture;
```

### `sampler`

Shortcut to `DynamicTexture.texture.sampler`.

It is an error to access this member if `DynamicTexture.isReady` is not true).

```ts
sampler: Sampler;
```

### `view`

Shortcut to `DynamicTexture.texture.view`.

It is an error to access this member if `DynamicTexture.isReady` is not true).

```ts
view: TextureView;
```

## Methods

### constructor

Creates a new `DynamicTexture`.

```ts
new DynamicTexture(device: Device, props: DynamicTextureProps);
```
