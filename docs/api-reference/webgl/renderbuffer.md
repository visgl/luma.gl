# Renderbuffer

`Renderbuffer`s are WebGL Objects that contain textures. They are optimized for use as render targets, while vanilla `Texture`s may not be, and are the logical choice when you do not need to sample (i.e. in a post-pass shader) from the produced image. If you do need to sample (such as when reading depth back in a second shader pass), use [`Texture`](/docs/api-reference/webgl/texture.md) instead. In addition, in WebGL2, `Renderbuffer` can do [Multisampling (MSAA)](https://www.khronos.org/opengl/wiki/Multisampling) just like standard framebuffer.

For additional information, see [OpenGL Wiki](https://www.opengl.org/wiki/Renderbuffer_Object)


## Usage

Creating a `Renderbuffer`
```js
const renderbuffer = new Renderbuffer(gl, {format: GL.RGBA4, width: 100, height: 100});
```

Reformatting/reinitializing a `Renderbuffer`
```js
const renderbuffer = new Renderbuffer(gl, {format: GL.RGBA4, width: 100, height: 100});
renderbuffer.initialize({format: GL.RGB565, width: 50, height: 50});
```

Resizing a `Renderbuffer`
```js
const renderbuffer = new Renderbuffer(gl, {format: GL.RGBA4});
renderbuffer.resize({width: 200, height: 200});
```

Attaching a `Renderbuffer` to a `Framebuffer` (automatically resizes the `Renderbuffer`)
```js
framebuffer.attach({
  [GL.DEPTH_ATTACHMENT]: new Renderbuffer(gl, {format: GL.DEPTH_COMPONENT16})
 });
```

## Members

* `id` (string) - id for debugging
* `handle` (`WebGLRenderbuffer`) - the underlying WebGLRenderbuffer object
* `width` (number) - width of renderbuffer in pixels
* `height` (number) - height of renderbuffer in pixels
* `format` (number) - internal format of the renderbuffer (e.g. `GL.DEPTH_COMPONENT16`)
* `samples` (number) - samples (always `0` in non-WebGL2 contexts)


## Methods

### getSamplesForFormat (static method)

Queries valid sample counts for a `Renderbuffer` format. The sample counts can be provided as a parameter to the `Renderbuffer` constructor.

`Renderbuffer.getSamplesForFormat({format})`

* `format` (GLenum) - internal format of the renderbuffer (e.g. `GL.DEPTH_COMPONENT16`)

Returns (Number[]) - An list of valid sample counts in descending order.

If multisampling is not supported the returned value will be `[0]`, e.g. signed and unsigned integer internal formats in WebGL2. Note that this method always returns `[0]` in WebGL1.

### constructor

Creates a new `Renderbuffer` and initalizes it by calling `initialize` with the provided parameters.

`new Renderbuffer(gl, {id=, format, width, height, samples=})`

* `gl` (WebGLRenderingContext) - gl context
* `id`= (String) - optional string id
* `format` (GLenum) - internal format of the renderbuffer (e.g. `GL.DEPTH_COMPONENT16`)
* `width`=`1` (GLint) - width of renderbuffer in pixels
* `height`=`1` (GLint) - height of renderbuffer in pixels
* `samples`=0 (GLint) - (WebGL2) number of samples to be used for storage.

WebGL References [gl.createRenderbuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createRenderbuffer), also see `initialize`.

### initialize

Creates and initializes a renderbuffer object's data store. Used to update a `Renderbuffer`s format and size after it was initially created.

`Renderbuffer.initialize({format, width, height, samples=})`

* `format` (GLenum) - internal format of the renderbuffer (e.g. `GL.DEPTH_COMPONENT16`)
* `width`=`1` (GLint) - width of renderbuffer in pixels
* `height`=`1` (GLint) - height of renderbuffer in pixels
* `samples`=0 (GLint) - (WebGL2) number of samples to be used for storage.

Returns itself to enable chaining

* `initialize` erases the current content of the `Renderbuffer`.


WebGL References [gl.renderbufferStorage](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage), [gl.renderbufferStorageMultisample](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/renderbufferStorageMultisample) (WebGL2), [gl.bindRenderbuffer](WebGLRenderingContext.bindRenderbuffer())

### resize

Reinitializes the `Renderbuffer`'s data store with the new `width` and `height` but unchanged `format` (and `samples`, if available).

`Renderbuffer.resize({width, height})`

* `width` (GLint) - width of `Renderbuffer` in pixels
* `height` (GLint) - height of `Renderbuffer` in pixels

Returns itself to enable chaining

* Checks if `width` or `height` have actually changed before calling `initialize`.
* If a resize happens, `resize` erases the current content of the `Renderbuffer`.

WebGL References see `initialize`.

## Renderbuffer Formats

The "internal" format of the `Renderbuffer`.

| Value                  | Description |
| ---                    | --- |
| `GL.RGBA4`             |  4 red bits, 4 green bits, 4 blue bits 4 alpha bits |
| `GL.RGB565`            |  5 red bits, 6 green bits, 5 blue bits |
| `GL.RGB5_A1`           |  5 red bits, 5 green bits, 5 blue bits, 1 alpha bit |
| `GL.DEPTH_COMPONENT16` |  16 depth bits |
| `GL.STENCIL_INDEX8`    |  8 stencil bits |

This table lists the basic formats supported in WebGL1. For a full table of formats supported in WebGL2 and via WebGL extensions, see [Texture](/docs/api-reference/webgl/texture.md).

| Sized Internal Format   | Format               | Type | Depth Bits | Stencil Bits |
| ---                     | ---                  | ---  | ---        | --- |
| `GL.DEPTH_COMPONENT16`  | `GL.DEPTH_COMPONENT` | `GL.UNSIGNED_SHORT`, `GL.UNSIGNED_INT` | 16 | 0 |
| `GL.DEPTH_COMPONENT24`  | `GL.DEPTH_COMPONENT` | `GL.UNSIGNED_INT` | 24 | 0 |
| `GL.DEPTH_COMPONENT32F` | `GL.DEPTH_COMPONENT` | `GL.FLOAT` | f32 | 0 |
| `GL.DEPTH24_STENCIL8`   | `GL.DEPTH_STENCIL`   | `GL.UNSIGNED_INT_24_8` | 24 | 8 |
| `GL.DEPTH32F_STENCIL8`  | `GL.DEPTH_STENCIL`   | `GL.FLOAT_32_UNSIGNED_INT_24_8_REV` | f32 | 8 |


When using the WEBGL_depth_texture extension:
`GL.DEPTH_COMPONENT`
`GL.DEPTH_STENCIL`
When using the EXT_sRGB extension:
`EXT.SRGB_EXT`
`EXT.SRGB_ALPHA_EXT`

When using a WebGL 2 context, the following values are available additionally:
* `GL.R8`
* `GL.R16F`
* `GL.R32F`
* `GL.R8UI`
* `GL.RG8`
* `GL.RG16F`
* `GL.RG32F`
* `GL.RGUI`
* `GL.RGB8`
* `GL.SRGB8`
* `GL.RGB565`
* `GL.R11F_G11F_B10F`
* `GL.RGB9_E5`
* `GL.RGB16F`
* `GL.RGB32F`
* `GL.RGB8UI`
* `GL.RGBA8`
* `GL.SRGB_APLHA8`
* `GL.RGB5_A1`
* `GL.RGBA4444`
* `GL.RGBA16F`
* `GL.RGBA32F`
* `GL.RGBA8UI`


## Parameters

| Parameter                          | Type   | Read/Write |Description |
| ---                                | ---    | ---        | --- |
| `GL.RENDERBUFFER_WIDTH`            | GLint  | R | height of the image of renderbuffer |
| `GL.RENDERBUFFER_HEIGHT`           | GLint  | R | height of the image of renderbuffer |
| `GL.RENDERBUFFER_INTERNAL_FORMAT`  | GLenum | R | See below |
| `GL.RENDERBUFFER_GREEN_SIZE`       | GLint  | R | resolution (bits) of green color |
| `GL.RENDERBUFFER_BLUE_SIZE`        | GLint  | R | resolution (bits) of blue color |
| `GL.RENDERBUFFER_RED_SIZE`         | GLint  | R | resolution (bits) of red color |
| `GL.RENDERBUFFER_ALPHA_SIZE`       | GLint  | R | resolution (bits) of alpha component |
| `GL.RENDERBUFFER_DEPTH_SIZE`       | GLint  | R | resolution (bits) of depth component |
| `GL.RENDERBUFFER_STENCIL_SIZE`     | GLint  | R | resolution (bits) of stencil component |
| `GL.RENDERBUFFER_SAMPLES` (WebGL2) | GLint  | R | |

## Limits

| Limit                      |                               | WebGL2   | WebGL1 |
| ---                        |---                            | ---      | ---    |
| `GL.MAX_RENDERBUFFER_SIZE` | Max renderbuffer width/height | `>=2048` | `>=1`  |
| `GL.MAX_SAMPLES`           | Max samples for multisampling | `>=4`    | `0`    |


## Remarks

* The only way to work with a renderbuffer, besides creating it, is to attach it to a [`Framebuffer`](/docs/api-reference/webgl/framebuffer.md).
* A `Renderbuffer` cannot be accessed by a shader in any way.
* Multisampling is only available in WebGL2
