# DynamicTexture

`DynamicTexture` is the engine-level convenience wrapper around core [`Texture`](/docs/api-reference/core/resources/texture) resources.
It adds async initialization, resizing, mipmap generation, and helpers for more complex texture layouts while still producing a normal `Texture`, `Sampler`, and `TextureView` once ready.

## Usage

```typescript
import {DynamicTexture, loadImageBitmap, Model} from '@luma.gl/engine';

const dynamicTexture = new DynamicTexture(device, {
  data: loadImageBitmap('/path/to/image.png'),
  mipmaps: true
});

const model = new Model(device, {
  source,
  bindings: {texture: dynamicTexture}
});

await dynamicTexture.ready;
```

## Types

### `DynamicTextureProps`

```ts
export type DynamicTextureProps =
  Omit<TextureProps, 'data' | 'mipLevels' | 'width' | 'height'> &
  TextureDataAsyncProps & {
    mipmaps?: boolean;
    mipLevels?: number | 'auto';
    width?: number;
    height?: number;
  };
```

`DynamicTextureProps` combines normal texture props with async-friendly texture data props from `texture-data.ts`.

## Properties

### `device`, `id`

Owning device and application-provided identifier.

### `props`

Resolved texture props, with defaults applied and async `data` removed after initialization begins.

### `ready: Promise<Texture>`

Resolves when the underlying texture has been created and any initial data has been uploaded.

### `isReady: boolean`

Indicates whether `ready` has resolved successfully.

### `destroyed: boolean`

Indicates whether the dynamic texture has been destroyed.

### `texture`, `sampler`, `view`

Shortcuts to the underlying core texture resources. Accessing them before `isReady` is an error.

## Methods

### `constructor(device: Device, props: DynamicTextureProps)`

Starts async initialization immediately.

### `destroy(): void`

Destroys the underlying texture and marks the wrapper as destroyed.

### `generateMipmaps(): void`

Generates mipmaps for the current texture. Uses the appropriate WebGL or WebGPU backend path.

### `setSampler(sampler: Sampler | SamplerProps = {}): void`

Sets a sampler on the underlying texture.

### `resize(size: {width: number; height: number}): boolean`

Clones the immutable underlying texture to a new size. Returns `false` when the size did not change.

### `getCubeFaceIndex(face: TextureCubeFace): number`

Returns the layer index for one cube face.

### `getCubeArrayFaceIndex(cubeIndex: number, face: TextureCubeFace): number`

Returns the layer index for a face within a cube-array texture.

### `setTexture1DData(data: Texture1DData): void`

Uploads 1D texture data.

### `setTexture2DData(data: Texture2DData, z = 0): void`

Uploads 2D texture data, optionally targeting a slice index.

### `setTexture3DData(data: Texture3DData): void`

Uploads 3D texture data.

### `setTextureArrayData(data: TextureArrayData): void`

Uploads 2D-array texture data.

### `setTextureCubeData(data: TextureCubeData): void`

Uploads cube texture data.

### `setTextureCubeArrayData(data: TextureCubeArrayData): void`

Uploads cube-array texture data.

## Remarks

- `DynamicTexture` is directly supported anywhere [`Model`](/docs/api-reference/engine/model) accepts bindings.
- It is the recommended way to work with promise-backed texture data and backend-independent mipmap generation.
