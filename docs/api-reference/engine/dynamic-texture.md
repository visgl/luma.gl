# DynamicTexture

[DynamicBuffer](https://luma.gl/docs/api-reference/engine/dynamic-buffer.md)[DynamicTexture](https://luma.gl/docs/api-reference/engine/dynamic-texture.md)[VideoTexture](https://luma.gl/docs/api-reference/engine/video-texture.md)[loadImageBitmap](https://luma.gl/docs/api-reference/engine/load-image-bitmap.md)

From v9.3

`DynamicTexture` is the engine-level convenience wrapper around core [`Texture`](https://luma.gl/docs/api-reference/core/resources/texture.md) resources. It adds async initialization, resizing, mipmap generation, and helpers for more complex texture layouts while still producing a normal `Texture`, `Sampler`, and `TextureView` once ready.

This cubemap loads six faces asynchronously, generates mipmaps, and samples the result for both the room and the reflective object:

### Texture Cube

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/api/cubemap)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## Usage[​](#usage "Direct link to Usage")

```
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

## Types[​](#types "Direct link to Types")

### `DynamicTextureProps`[​](#dynamictextureprops "Direct link to dynamictextureprops")

```
export type DynamicTextureProps =

  Omit<TextureProps, 'data' | 'mipLevels' | 'width' | 'height'> &

  TextureDataAsyncProps & {

    mipmaps?: boolean;

    mipLevels?: number | 'auto';

    width?: number;

    height?: number;

  };
```

`DynamicTextureProps` combines normal texture props with async-friendly texture data props from `texture-data.ts`. For simple `2d` textures, `data` may still be provided as a bare typed array when `width` and `height` are supplied.

## Properties[​](#properties "Direct link to Properties")

### `device`, `id`[​](#device-id "Direct link to device-id")

Owning device and application-provided identifier.

### `props`[​](#props "Direct link to props")

Resolved texture props, with defaults applied and async `data` removed after initialization begins.

### `ready: Promise<Texture>`[​](#ready-promisetexture "Direct link to ready-promisetexture")

Resolves when the underlying texture has been created and any initial data has been uploaded.

### `isReady: boolean`[​](#isready-boolean "Direct link to isready-boolean")

Indicates whether `ready` has resolved successfully.

### `destroyed: boolean`[​](#destroyed-boolean "Direct link to destroyed-boolean")

Indicates whether the dynamic texture has been destroyed.

### `texture`, `sampler`, `view`[​](#texture-sampler-view "Direct link to texture-sampler-view")

Shortcuts to the underlying core texture resources. Accessing them before `isReady` is an error.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: DynamicTextureProps)`[​](#constructordevice-device-props-dynamictextureprops "Direct link to constructordevice-device-props-dynamictextureprops")

Starts async initialization immediately.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the underlying texture and marks the wrapper as destroyed.

### `generateMipmaps(): void`[​](#generatemipmaps-void "Direct link to generatemipmaps-void")

Generates mipmaps for the current texture. Uses the appropriate WebGL or WebGPU backend path.

### `setSampler(sampler: Sampler | SamplerProps = {}): void`[​](#setsamplersampler-sampler--samplerprops---void "Direct link to setsamplersampler-sampler--samplerprops---void")

Sets a sampler on the underlying texture.

### `readBuffer(options?: TextureReadOptions): Promise<Buffer>`[​](#readbufferoptions-texturereadoptions-promisebuffer "Direct link to readbufferoptions-texturereadoptions-promisebuffer")

Allocates a temporary GPU readback buffer, copies the requested region into it, waits for GPU completion, and returns the ready-to-read buffer. The caller owns the returned buffer and must destroy it.

The underlying texture must support `Texture.COPY_SRC`. `DynamicTexture` owns the temporary buffer allocation, but it does not broaden texture usage automatically.

### `readAsync(options?: TextureReadOptions): Promise<ArrayBuffer>`[​](#readasyncoptions-texturereadoptions-promisearraybuffer "Direct link to readasyncoptions-texturereadoptions-promisearraybuffer")

Convenience readback built on `readBuffer()`. Allocates a temporary buffer, copies the requested region, maps it, returns the bytes as an `ArrayBuffer`, and destroys the temporary buffer.

### `resize(size: {width: number; height: number}): boolean`[​](#resizesize-width-number-height-number-boolean "Direct link to resizesize-width-number-height-number-boolean")

Clones the immutable underlying texture to a new size. Returns `false` when the size did not change.

### `getCubeFaceIndex(face: TextureCubeFace): number`[​](#getcubefaceindexface-texturecubeface-number "Direct link to getcubefaceindexface-texturecubeface-number")

Returns the layer index for one cube face.

### `getCubeArrayFaceIndex(cubeIndex: number, face: TextureCubeFace): number`[​](#getcubearrayfaceindexcubeindex-number-face-texturecubeface-number "Direct link to getcubearrayfaceindexcubeindex-number-face-texturecubeface-number")

Returns the layer index for a face within a cube-array texture.

### `setTexture1DData(data: Texture1DData): void`[​](#settexture1ddatadata-texture1ddata-void "Direct link to settexture1ddatadata-texture1ddata-void")

Uploads 1D texture data.

### `setTexture2DData(data: Texture2DData, z = 0): void`[​](#settexture2ddatadata-texture2ddata-z--0-void "Direct link to settexture2ddatadata-texture2ddata-z--0-void")

Uploads 2D texture data, optionally targeting a slice index.

### `setTexture3DData(data: Texture3DData): void`[​](#settexture3ddatadata-texture3ddata-void "Direct link to settexture3ddatadata-texture3ddata-void")

Uploads 3D texture data.

### `setTextureArrayData(data: TextureArrayData): void`[​](#settexturearraydatadata-texturearraydata-void "Direct link to settexturearraydatadata-texturearraydata-void")

Uploads 2D-array texture data.

### `setTextureCubeData(data: TextureCubeData): void`[​](#settexturecubedatadata-texturecubedata-void "Direct link to settexturecubedatadata-texturecubedata-void")

Uploads cube texture data.

### `setTextureCubeArrayData(data: TextureCubeArrayData): void`[​](#settexturecubearraydatadata-texturecubearraydata-void "Direct link to settexturecubearraydatadata-texturecubearraydata-void")

Uploads cube-array texture data.

## Remarks[​](#remarks "Direct link to Remarks")

* `DynamicTexture` is directly supported anywhere [`Model`](https://luma.gl/docs/api-reference/engine/model.md) accepts bindings.
* It is the recommended way to work with promise-backed texture data and backend-independent mipmap generation.
