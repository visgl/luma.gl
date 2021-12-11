# Texture

A `Texture` is a WebGL object that contains one or more images that all have the same image format. Shaders can read from textures (through a sampler uniform) and they can be set up as render targets (by attaching them to a framebuffer).

Note: This section describes the `Texture` base class that implements functionality common to all four types of WebGL:


- [`1d`] - Contains a "normal" image texture
- [`2d`] - Contains a "normal" image texture
- [`2d-array`](WebGL 2) - Holds a "stack" of textures which enables 3D interpolation.
- [`3d`](WebGL 2) - Holds a "stack" of textures which enables 3D interpolation.
- [`cube`] - Holds 6 textures representing sides of a cube.
- [`cube-array`] - Holds 6 textures representing sides of a cube.

For more details see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Texture).

Note that textures have a lot of optional capabilities made available by extensions, see the Limits section below.

## Usage

- For additional usage examples, `Texture` inherits from [`Resource`](/docs/api-reference/webgl/resource).

Configuring a Texture

```js
const texture = device.createTexture);
texture.setParameters({
  [GL.TEXTURE_WRAP_S]: GL.CLAMP
});
```

Using Textures

```js
const texture = device.createTexture, ...);

// For ease of use, the `Model` class can bind textures for a draw call
model.draw({
  uniforms({uMVMatrix: matrix, texture1: texture, texture2: texture})
});

// Alternatively, bind the textures using the `Texture` API directly
texture.bind(0);
texture.bind(1);
model.draw({
  uniforms({uMVMatrix: matrix})
});
```

## Members

A number of read only accessors are available:

- `width` - width of one face of the cube map
- `height` - height of one face of the cube map
- `format` - internal format of the face textures
- `border` - Always 0.

- `type` - type used to create face textures
- `dataFormat` - data format used to create face textures.
- `offset` - offset used to create face textures. Always 0, unless specified using WebGL 2 buffer constructor.

- `handle` - The underlying WebGL or WebGPU object.
- `id` - An identifying string that is intended to help debugging.

Sampler parameters can be accessed using `Texture.getParameter`, e.g:

`texture.getParameter(GL.TEXTURE_MAG_FILTER);`

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)


- [`Texture2D`](/docs/api-reference/webgl/texture-2d),
- [`TextureCube`](/docs/api-reference/webgl/texture-cube) and
- [`Texture3D`](/docs/api-reference/webgl/texture-3d).

The constructors for these classes should be used to create textures. They constructors all take common parameters, many of which are specified in this document.

- Pixel store parameters are described in [`State Management`](/docs/api-reference/gltools/parameter-setting).

### resize(options : Object) : Texture2D

Call to resize a texture. If size has changed, reinitializes texture with current format. Note: calling `resize` clears image and mipmaps.

- `width` (GLint) - width to resize to.
- `height` (GLint) - height to resize to.
- `mipmaps` (bool) - turn on/off mipmapping. default `false`.

### generateMipmap() : Texture2D

Call to regenerate mipmaps after modifying texture(s)

WebGL References [gl.generateMipmap](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap)

### setImageData(options : Object) : Texture2D

Allocates storage and sets image data

```js
  Texture.setImageData({
    target = this.target,
    pixels = null,
    data = null,
    width,
    height,
    level = 0,
    format = GL.RGBA,
    type,
    dataFormat,
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
    format = GL.RGBA,
    type,
    dataFormat,
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

### getActiveUnit()

Returns number of active textures.

### bind()

Binds itself to given textureUnit.

The following WebGL APIs are called in the function
[gl.activeTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture), [gl.bindTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture)

### unbind()

The following WebGL APIs are called in the function
[gl.activeTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture), [gl.bindTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture)

## Texture Image Data

WebGL allows textures to be created from a number of different data sources.

| Type                                  | Description                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `null`                                | A texture will be created with the appropriate format, size and width. Bytes will be "uninitialized". |
| `typed array`                         | Bytes will be interpreted according to format/type parameters and pixel store parameters.             |
| `Buffer` or `WebGLBuffer` (`WebGL 2`) | Bytes will be interpreted according to format/type parameters and pixel store parameters.             |
| `Image` (`HTMLImageElement`)          | image will be used to fill the texture. width and height will be deduced.                             |
| `Video` (`HTMLVideoElement`)          | video will be used to continously update the texture. width and height will be deduced.               |
| `Canvas` (`HTMLCanvasElement`)        | canvas will be used to fill the texture. width and height will be deduced.                            |
| `ImageData`                           | `canvas.getImageData()` - Used to fill the texture. width and height will be deduced.                 |

## NPOT Textures (WebGL 1)

- Any texture with a `non power of two` dimension (width or height) is referred as `NPOT` texture, under WebGL 1 NPOT textures have following limitations.

| State                   | Limitation                                 |
| ----------------------- | ------------------------------------------ |
| Mipmapping              | Should be disabled                         |
| `GL.TEXTURE_MIN_FILTER` | Must be either `GL.LINEAR` or `GL.NEAREST` |
| `GL.TEXTURE_WRAP_S`     | Must be `GL.CLAMP_TO_EDGE`                 |
| `GL.TEXTURE_WRAP_T`     | Must be `GL.CLAMP_TO_EDGE`                 |

- 'Texture' class will perform above settings when NPOT texture resource is created. When un-supported filtering is set using `Texture.setParameters`, those will be overwritten with above supported values (`GL.TEXTURE_MIN_FILTER` will be set to `GL.LINEAR`). This only happens for NPOT textures when using WebGL 1, and a warning log will be printed every time a setting is overwritten.

## Remarks

- Textures can be supplied as uniforms to shaders that can sample them using texture coordinates and color pixels accordingly.
- Parameters that affect texture sampling can be set on textures or sampler objects.
- Textures can be created from a number of different sources, including typed arrays, HTML Images, HTML Canvases, HTML Videos and WebGLBuffers (WebGL 2).
- The WebGL Context has global "pixel store" parameters that control how pixel data is laid out, including Y direction, color space etc.
- Textures are read from supplied data and written to the specified format/type parameters and pixel store parameters.
