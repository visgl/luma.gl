# AsyncTexture

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.1-blue.svg?style=flat-square" alt="From-v9.1" />
</p>

The `AsyncTexture` class accepts promises that resolve to texture data (images or byte arrays). It postpones the creation of actual `Textures` until the supplied promise(s) resolve and data is available.
- The `Model` class accepts `AsyncTextures` as bindings (where a `Texture` or `TextureView` would be accepted), and defers rendering (i.e. `Model.draw()` call execution) until the underlying texture has been created.

## Usage

```ts
import {AsyncTexture, loadImage} from '@luma.gl/engine';
const asyncTexture = new AsyncTexture({data: loadImage(url)});
const model = new Model(device, {source, bindings: {texture: asyncTexture}});
const renderPass = device.createRenderPass();
model.draw(renderPass); // Doesn't draw
...
await asyncTexture.ready; // Not necessary, just for illustration
model.draw(renderPass); // Draws
```

## Types

```ts
export type AsyncTextureProps = Omit<TextureProps, 'data'> & AsyncTextureDataProps;

type AsyncTextureDataProps =
  | AsyncTexture1DProps
  | AsyncTexture2DProps
  | AsyncTexture3DProps
  | AsyncTextureArrayProps
  | AsyncTextureCubeProps
  | AsyncTextureCubeArrayProps;

type AsyncTexture1DProps = {dimension: '1d'; data: Promise<Texture1DData> | Texture1DData | null};
type AsyncTexture2DProps = {dimension?: '2d'; data: Promise<Texture2DData> | Texture2DData | null};
type AsyncTexture3DProps = {dimension: '3d'; data: Promise<Texture3DData> | Texture3DData | null};
type AsyncTextureArrayProps = {
  dimension: '2d-array';
  data: Promise<TextureArrayData> | TextureArrayData | null;
};
type AsyncTextureCubeProps = {
  dimension: 'cube';
  data: Promise<TextureCubeData> | TextureCubeData | null;
};
type AsyncTextureCubeArrayProps = {
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

Initial value is `false`. Once the `asyncTexture.ready` promise resolve successfully, the `asyncTexture.isReady` flag is guaranteed to be true.

### `texture`

It is an error to access this member if `asyncTexture.isReady` is not true).

```ts
texture: Texture;
```

### `sampler`

Shortcut to `asyncTexture.texture.sampler`.

It is an error to access this member if `asyncTexture.isReady` is not true).

```ts
sampler: Sampler;
```

### `view`

Shortcut to `asyncTexture.texture.view`.

It is an error to access this member if `asyncTexture.isReady` is not true).

```ts
view: TextureView;
```

## Methods

### constructor

Creates a new `AsyncTexture`.

```ts
new AsyncTexture(device: Device, props: AsyncTextureProps);
```

## Remarks

- As of v9.1, in order to streamline code across WebGL and WebGPU, `Textures` no longer accept promises (for e.g. `loadImage(url)` when setting data.
- The AsyncTexture class can be seen as an optional convenience class that helps applications avoid tedious book keeping of texture data (image) loading.
