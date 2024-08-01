# CommandEncoder

A command encoder offering GPU memory copying operations.

## Types

### `CommandEncoderProps`

| Property      | Type                             | Description                                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| N/A  |                     |                          |


## Members

- `device`: `Device` - holds a reference to the `Device` that created this `CommandEncoder`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `CommandEncoderProps` - holds a copy of the `CommandEncoderProps` used to create this `CommandEncoder`.

## Methods

### `constructor(props: CommandEncoderProps)`

`CommandEncoder` is an abstract class and cannot be instantiated directly. Create with `device.beginCommandEncoder(...)`.


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

