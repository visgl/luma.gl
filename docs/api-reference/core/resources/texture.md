# Texture

A `Texture` are GPU objects that contain one or more images that all have the same image format, that can be accessed from shaders.

While the idea behind textures is simple in principle (a grid of pixels stored on GPU memory), GPU Textures are surprisingly complex objects. It can be helpful to read the [API Guide section on textures](http://localhost:3000/docs/api-guide/gpu/gpu-textures) to make sure you have a full picture.


## Usage

Creating a texture

```typescript
const texture = device.createTexture({sampler: {addressModeU: 'clamp-to-edge'});
```

Setting texture data from an image

```ts
const imageBitmap = // load an image from a URL, perhaps with loaders.gl ImageLoader
texture.copyFromExternalImage({source: imageBitmap});
```

Note that setting texture data from 8 bit RGBA arrays can also be done via `texture.copyFromExternalImage()` via `ImageData`.

```ts
const data = new ClampedUint8Array([...]);
const imageData = new ImageData(data, width, height); 
texture.copyFromExternalImage({source: imageData});
```

Setting texture data for non-8-bit-per-channel bit depths, texture arrays etc.

:::caution
This is still WIP
:::

```ts
const commandEncoder = device.createCommandEncoder();
const buffer = device.createBuffer({usage: , byteLength});
const texture = device.createTexture({ })
commandEncoder.end();
```

Reading from Textures In Shaders

```typescript
const texture = device.createTexture, ...);

// For ease of use, the `Model` class can bind textures for a draw call
model.draw({
  renderPass,
  bindings({texture1: texture, texture2: texture})
});


const framebuffer = device.createFramebuffer({
  colorAttachments: [texture]
});

const renderPass = device.createRenderPass({
  framebuffer
});


// Alternatively, bind the textures using the `Texture` API directly
model.draw({
  uniforms({uMVMatrix: matrix})
});
```

- For additional usage examples, `Texture` inherits from `Resource`.

## Types

### `TextureProps`

| Property      | Type                             | Description                                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `usage?`      | `number`                         | Bit mask of Usage flags                                                      |
| `byteLength?` | `number`                         | Length of buffer (cannot be changed after creation).                         |
| `data?`       | `ArrayBuffer \| ArrayBufferView` | Data to be copied into buffer. `byteLength` will be deduced if not supplied. |
| `byteOffset?` | `number`                         | Offset for `data`                                                            |
| `indexType?`  | `'uint16' \| 'uint32'`           | If props.usage & Buffer.INDEX                                                |

### Usage

Usage expresses two things: The type of texture and what operations can be performed on it.

Note that the allowed combinations are very limited, especially in WebGPU.

| Usage Flag                  | Value | Description                                                                       |
| --------------------------- | ----- | --------------------------------------------------------------------------------- |
| `Texture.COPY_SRC`          | 0x01  | Enables this texture to be used as a source in CommandEncoder copy commands.      |
| `Texture.COPY_DST`          | 0x02  | Enables this texture to be used as a destination in CommandEncoder copy commands. |
| `Texture.TEXTURE`           | 0x04  |                                                                                   |
| `Texture.STORAGE_BINDING`   | 0x08  | Enables this texture to used as a storage binding.                                |
| `Texture.RENDER_ATTACHMENT` | 0x10  | Enables this texture to be used as a render attachment.                           |

## TextureDimension

| Dimension | WebGPU | WebGL2 | Description |
| --------- | ------ | ------ || -------------------------------------------------------------------- |
| `1d`         | ✅      | ❌      | Contains a one dimensional texture (typically used for compute )     |
| `2d`         | ✅      | ✅      | Contains a "normal" image texture                                    |
| `2d-array`   | ✅      | ✅      | Holds an "array" of 2D textures.                                     |
| `3d`         | ✅      | ✅      | Holds a "stack" of textures which enables 3D interpolation.          |
| `cube`       | ✅      | ✅      | Holds 6 textures representing sides of a cube.                       |
| `cube-array` | ✅      | ❌      | Holds an array where every 6 textures represent the sides of a cube. |


## ExternalImage

luma.gl allows texture data to be initialized from a number of different CPU object that hold an image.
These are referred to as external (to the GPU) images.

| `Image` (`HTMLImageElement`)   | image will be used to fill the texture. width and height will be deduced.                             |
| `Canvas` (`HTMLCanvasElement`) | canvas will be used to fill the texture. width and height will be deduced.                            |
| `Video` (`HTMLVideoElement`)   | video will be used to continously update the texture. width and height will be deduced.               |
| `ImageData`                    | `canvas.getImageData()` - Used to fill the texture. width and height will be deduced.                 |

## TextureData

luma.gl allows textures to be created from a number of different data sources.

| Type          | Description                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `null`        | A texture will be created with the appropriate format, size and width. Bytes will be "uninitialized". |
| `typed array` | Bytes will be interpreted according to format/type parameters and pixel store parameters.             |
| `Buffer`      | Bytes will be interpreted according to format/type parameters and pixel store parameters.             |

## CubeFace

Lets cube faces be specified with semantic strings instead of just depth indexes (0-5).

```ts
type TextureCubeFace = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';
```

## Members

A number of read only accessors are available:

- `device`: `Device` - holds a reference to the `Device` that created this `Texture`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `TextureProps` - holds a copy of the `TextureProps` used to create this `Texture`.

- `width` - width of one face of the cube map
- `height` - height of one face of the cube map
- `format` - internal format of the face textures
- `border` - Always 0.

- `type` - type used to create face textures
- `dataFormat` - data format used to create face textures.
- `offset` - offset used to create face textures.

- `handle` - The underlying WebGL or WebGPU object.
- `id` - An identifying string that is intended to help debugging.


## Static Methods

### `Texture.isExternalImage()`

Check whether a value is a valid external image object.

### `Texture.getExternalImageSize()`

Deduces the size (width and height) of an "external image" object.

### `Texture.isTextureLevelData()`

Check whether a value is valid as data for setting a texture level.

### `Texture.getTextureDataSize()`

Calculates the size of texture data for a composite texture data object

###  `Texture.getMipLevelCount()`

Calculate the number of mip levels for a texture of width and height.
It performs the standard calculation `Math.floor(Math.log2(Math.max(width, height))) + 1`.

```ts
Texture.getMipLevelCount(width: number, height: number): number
```

### `Texture.getCubeFaceDepth()`

Convert luma.gl cubemap face constants to texture depth index (0-based).

```ts
Texture.getCubeFaceDepth(face: TextureCubeFace): number
```

## Methods

### `constructor(props: TextureProps)`

`Texture` is an abstract class and cannot be instantiated directly. Create with `device.createTexture(...)`.

### `destroy(): void`

Free up any GPU resources associated with this texture immediately (instead of waiting for garbage collection).

### `generateMipmap() : Texture2D`

Call to regenerate mipmaps after modifying texture(s)

WebGL References [gl.generateMipmap](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap)

### `copyExternalImage()`

Copy data from an image data into the texture. 

This function offers a highly granular control but can be called with just an `image` parameter and the remaining arguments will be deduced or set to canonical defaults.

```ts
copyExternalImage(options: {
  image: ExternalImage;
  sourceX?: number;
  sourceY?: number;
  width?: number;
  height?: number;
  depth?: number;
  mipLevel?: number;
  x?: number;
  y?: number;
  z?: number;
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  colorSpace?: 'srgb';
  premultipliedAlpha?: boolean;
}: {width: number; height: number}
```

| Parameter             | Type                                       |                                                          |
| --------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `image`               | `ExternalImage`                            | Image                                                    |
| `sourceX?`            | `number`                                   | Copy from image x offset (default 0)                     |
| `sourceY?`            | `number`                                   | Copy from image y offset (default 0)                     |
| `width?`              | `number`                                   | Copy area width (default 1)                              |
| `height?`             | `number`                                   | Copy area height (default 1)                             |
| `depth?`              | `number`                                   | Copy depth (default 1)                                   |
| `mipLevel?`           | `number`                                   | Which mip-level to copy into (default 0)                 |
| `x?`                  | `number`                                   | Start copying into offset x (default 0)                  |
| `y?`                  | `number`                                   | Start copying into offset y (default 0)                  |
| `z?`                  | `number`                                   | Start copying from depth layer z (default 0)             |
| `aspect?`             | `'all' \| 'stencil-only' \| 'depth-only'`; | When copying into depth stencil textures (default 'all') |
| `colorSpace?`         | `'srgb'`                                   | Specific color space of image data                       |
| `premultipliedAlpha?` | `boolean`                                  | premultiplied                                            |
