# Texture

A `Texture` are GPU objects that contain one or more images that all have the same image format, that can be accessed from shaders.

While the underlying idea is simple in principle, GPU Textures are surprisingly complex objects and it can take some time to grasp all the details. Some 

- Shaders can read (sample) from textures
- Textures can be set up as render targets (by attaching them to a framebuffer).
- **Arrays** Textures can have multiple images (texture arrays, cube textures, 3d textures...), indexed by a `depth` parameter.
- **Mipmaps** Each texture image can have a "pyramid" of "mipmap" images representing 

Textures are supported by additional objects:
- **Samplers** - The specifics of how shaders read from textures (interpolation methods, edge behaviors etc) are controlled by **GPU Sampler objects**. luma.gl will create a default sampler object for each texture, but the application can override if designed
- **TextureViews** - A texture view specifies a subset of the images in a texture, enabling operations to be performed on such subsets. luma.gl will create a default TextureView for each texture, but the application can create additional TextureViews.
- **Framebuffers** - A framebuffer is a map of "attachment points" to one or more textures that can be used when creating `RenderPasses` and made available to shaders.

Setting texture data from CPU data:
- There is a fast path for setting texture data from "images", that can also be used for 8 bit RGBA data.
- General data transfer is more complicated, it needs to go through a GPU Buffer and a CommandEncoder object.

Notes:
- Textures tend to have optional capabilities (such as availability of advanced image formats) that depend on what features are implemented by the current `Device` (i.e. the current WebGPU or WebGL environment / browser the application is running on). Check `DeviceFeatures` if you would like to take advantage of such features when available.


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

| Type                           | Description                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `null`                         | A texture will be created with the appropriate format, size and width. Bytes will be "uninitialized". |
| `typed array`                  | Bytes will be interpreted according to format/type parameters and pixel store parameters.             |
| `Buffer`                       | Bytes will be interpreted according to format/type parameters and pixel store parameters.             |

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

### `resize(options : Object) : Texture2D`

Call to resize a texture. If size has changed, reinitializes texture with current format. Note: calling `resize` clears image and mipmaps.

- `width` (GLint) - width to resize to.
- `height` (GLint) - height to resize to.
- `mipmaps` (bool) - turn on/off mipmapping. default `false`.

### `generateMipmap() : Texture2D`

Call to regenerate mipmaps after modifying texture(s)

WebGL References [gl.generateMipmap](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap)

### `copyExternalImage()`

Copy data from an image data into the texture.
This function offers a lot of granular control but can be called with default arguments.

```ts
copyExternalImage(options: {
  source: ExternalImage;
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

| Parameter             |                                            |                                                          |
| --------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `source:`             | `ExternalImage`                            | Image                                                    |
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


### setImageData(options : Object) : Texture2D


```typescript
  Texture.setImageData({
    target = this.target,
    pixels = null,
    data = null,
    width,
    height,
    level = 0,
    type,
    offset = 0,
    border = 0,
    compressed = false,
    parameters= {}
  });
```

- `data` (\*) - Image data. Can be one of several data types see table below
- `pixels` (\*) - alternative to `data`
- `width` (GLint) -
- `height` (GLint) -
- `level` (GLint) -
- `format` (GLenum) - format of image data.
- `type` (GLenum)

* format of array (autodetect from type) or
* (WEBGL2) format of buffer

- `offset` (Number) - (WEBGL2) offset from start of buffer
- `border` (GLint) - must be 0.
- `compressed` (Boolean) -
- `parameters` (Object) - GL parameters to be temporarily applied (most of the time, pixelStorage parameters) when updating the texture.

Valid image data types:

- `null` - create empty texture of specified format
- Typed array - initializes from image data in typed array according to `format`
- `Buffer`|`WebGLBuffer` - (WEBGL2) initialized from image data in WebGLBuffer accoeding to `format`.
- `HTMLImageElement`|`Image` - Initializes with content of image. Auto deduces texture width/height from image.
- `HTMLCanvasElement` - Inits with contents of canvas. Auto width/height.
- `HTMLVideoElement` - Creates video texture that continuously updates. Auto width/height.

### setSubImageData(options : Object) : Texture2D

Redefines an area of an existing texture
Note: does not allocate storage

```
  Texture.setSubImageData({
    target = this.target,
    pixels = null,
    data = null,
    x = 0,
    y = 0,
    width,
    height,
    level = 0,
    type,
    compressed = false,
    offset = 0,
    border = 0,
    parameters = {}
  });
```

- `x` (`GLint`) - xOffset from where texture to be updated
- `y` (`GLint`) - yOffset from where texture to be updated
- `width` (`GLint`) - width of the sub image to be updated
- `height` (`GLint`) - height of the sub image to be updated
- `level` (`GLint`) - mip level to be updated
- `format` (`GLenum`) - internal format of image data.
- `typ` (`GLenum`) - format of array (autodetect from type) or (WEBGL2) format of buffer or ArrayBufferView
- `dataFormat` (`GLenum`) - format of image data.
- `offset` (`Number`) - (WEBGL2) offset from start of buffer
- `border` (`GLint`) - must be 0.
- parameters - temporary settings to be applied, can be used to supply pixel store settings.

See also [gl.compressedTexSubImage2D](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compressedTexSubImage2D), [gl.texSubImage2D](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D), [gl.bindTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture), [gl.bindBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer)

### update()

Update this texture if `HTMLVideoElement` is used as the data source. This method is automatically called before every draw call if this texture is bound to a uniform.

## Remarks

- Textures can be supplied as uniforms to shaders that can sample them using texture coordinates and color pixels accordingly.
- Parameters that affect texture sampling can be set on textures or sampler objects.
- Textures can be created from a number of different sources, including typed arrays, HTML Images, HTML Canvases, HTML Videos and WebGLBuffers (WebGL 2).
- The WebGL Context has global "pixel store" parameters that control how pixel data is laid out, including Y direction, color space etc.
- Textures are read from supplied data and written to the specified format/type parameters and pixel store parameters.
