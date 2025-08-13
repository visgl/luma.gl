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
| 🚧               | ❌        | Mipmaps    | Handles mipmap generation on WebGPU                          |
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
const dynamicTexture = new DynamicTexture({data: loadImage(url)});
const model = new Model(device, {source, bindings: {texture: DynamicTexture}});
const renderPass = device.createRenderPass();
model.draw(renderPass); // Doesn't draw
...
await dynamicTexture.ready; // Not necessary, just for illustration
model.draw(renderPass); // Draws
```

## Types

```ts
export type DynamicTextureProps = Omit<TextureProps, 'data'> & DynamicTextureDataProps;

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
```

## Members

### `ready`

A promise that resolves when the data has completed loading / preparation and the underlying GPU texture has been created and initialized, or rejects with an `Error` instance describing the failure.

```ts
ready: Promise<void>;
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
