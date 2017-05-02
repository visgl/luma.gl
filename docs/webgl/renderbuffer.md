# Renderbuffer

From [OpenGL Wiki](https://www.opengl.org/wiki/Renderbuffer_Object):

Renderbuffer Objects are OpenGL Objects that contain images. They are created and used specifically with Framebuffer Objects. They are optimized for use as render targets, while Textures may not be, and are the logical choice when you do not need to sample (i.e. in a post-pass shader) from the produced image.
If you need to resample (such as when reading depth back in a second shader pass), use Textures instead.
Renderbuffer objects also natively accommodate Multisampling (MSAA).

## Usage

Creating a Renderbuffer
```js
const renderbuffer = new Renderbuffer(gl, {format: GL.RGBA4, width: 100, height: 100});
```

Reformatting/Resizing a Renderbuffer
```js
const renderbuffer = new Renderbuffer(gl, {format: GL.RGBA4, width: 100, height: 100});
renderbuffer.storage({format: GL.RGBA4, width: 100, height: 100});
```

Attaching a renderbuffer to a Framebuffer
```js
const renderbuffer = new Renderbuffer(gl, {format: GL.RGBA4, width: 100, height: 100});
framebuffer.attachRenderbuffer({attachment, renderbuffer});
```

## Remarks

* Renderbuffers cannot be accessed by Shaders in any way. The only way to work with a renderbuffer, besides creating it, is to attach it to a Framebuffer.
=======
Remarks:
* Renderbuffers cannot be accessed by Shaders in any way. The only way to work
  with a renderbuffer, besides creating it, is to attach it to a Framebuffer.
>>>>>>> 88036ab... Texture docs
* The luma.gl Framebuffer class can autocreate Renderbuffers for you.
* Multisampling is only available in WebGL2

## Types

### Formats

| Value | Description |
| --- | --- |
| `GL.RGBA4` |  4 red bits, 4 green bits, 4 blue bits 4 alpha bits |
| `GL.RGB565` |  5 red bits, 6 green bits, 5 blue bits |
| `GL.RGB5_A1` |  5 red bits, 5 green bits, 5 blue bits, 1 alpha bit |
| `GL.DEPTH_COMPONENT16` |  16 depth bits |
| `GL.STENCIL_INDEX8` |  8 stencil bits |

This table lists the basic formats supported in WebGL1. For a full table of formats supported in WebGL2 and via WebGL extensions, see [Texture](/docs/webgl/texture.md).

### Parameters

| Parameter | Types | Read/Write |Description |
| --- | --- | --- |
| `GL.RENDERBUFFER_WIDTH` | GLint | Read | height of the image of renderbuffer |
| `GL.RENDERBUFFER_HEIGHT` | GLint | Read | height of the image of renderbuffer |
| `GL.RENDERBUFFER_INTERNAL_FORMAT` | GLenum | Read | See below |
| `GL.RENDERBUFFER_GREEN_SIZE` | GLint | Read | resolution (bits) of green color |
| `GL.RENDERBUFFER_BLUE_SIZE` | GLint | Read | resolution (bits) of blue color |
| `GL.RENDERBUFFER_RED_SIZE` | GLint | Read | resolution (bits) of red color |
| `GL.RENDERBUFFER_ALPHA_SIZE` | GLint | Read | resolution (bits) of alpha component |
| `GL.RENDERBUFFER_DEPTH_SIZE` | GLint | Read | resolution (bits) of depth component |
| `GL.RENDERBUFFER_STENCIL_SIZE` | GLint | Read | resolution (bits) of stencil component |
| `GL.RENDERBUFFER_SAMPLES` **`WebGL2`** |  | R | samples |


## Methods

### Renderbuffer constructor

Parameters
* `gl` (WebGLRenderingContext) - gl context
* `options`
    * `format` (GLenum) - internal format of the renderbuffer (often GL.DEPTH_COMPONENT16)
    * `width` (GLint) - width of renderbuffer
    * `height` (GLint) - height of renderbuffer
    * `samples`=0 (GLint) - (WebGL2) number of samples to be used for storage.

WebGL References [gl.createRenderbuffer](), [gl.renderbufferStorage](), [gl.bindRenderbuffer]()

### Renderbuffer.storage

Creates and initializes a renderbuffer object's data store. Can be used to update a renderbuffers format and size after it was initially created.

Parameters
* `options`
    * `format` (GLenum) - internal format of the renderbuffer (often GL.DEPTH_COMPONENT16)
    * `width` (GLint) - width of renderbuffer
    * `height` (GLint) - height of renderbuffer
    * `samples`=0 (GLint) - (WebGL2) number of samples to be used for storage.

Returns:
* itself (`Renderbuffer`) to enable chaining

WebGL References [gl.renderbufferStorage](), [gl.bindRenderbuffer]()

### Renderbuffer.bind

Returns:
* itself (`Renderbuffer`) to enable chaining

Note: Applications typically would not use this method. Binding and unbinding is done automatically by luma.gl.

WebGL References [gl.bindRenderbuffer]()

### Renderbuffer.unbind

Returns:
* itself (`Renderbuffer`) to enable chaining

Note: Applications typically would not use this method. Binding and unbinding is done automatically by luma.gl.

WebGL References [gl.bindRenderbuffer]()

=======
* opt.format (GLenum) - internal format of the renderbuffer (often GL.DEPTH_COMPONENT16)
* opt.width (GLint) - width of renderbuffer
* opt.height (GLint) - height of renderbuffer
* opt.samples=0 (GLint) - (WebGL2) number of samples to be used for storage.

### Renderbuffer.storage

Creates and initializes a renderbuffer object's data store

Parameters
* opt.format (GLenum) - internal format of the renderbuffer (often GL.DEPTH_COMPONENT16)
* opt.width (GLint) - width of renderbuffer
* opt.height (GLint) - height of renderbuffer
* opt.samples=0 (GLint) - (WebGL2) number of samples to be used for storage.

Returns
* (Renderbuffer) - returns itself to enable chaining

### Renderbuffer.bind

### Renderbuffer.unbind

## Parameters

| Parameter | Types | Read/Write |Description |
| --- | --- | --- |
| `GL.RENDERBUFFER_WIDTH` | GLint | R | height of the image of renderbuffer |
| `GL.RENDERBUFFER_HEIGHT` | GLint | R | height of the image of renderbuffer |
| `GL.RENDERBUFFER_INTERNAL_FORMAT` | GLenum | R | See below |
| `GL.RENDERBUFFER_GREEN_SIZE` | GLint | R | resolution (bits) of green color |
| `GL.RENDERBUFFER_BLUE_SIZE` | GLint | R | resolution (bits) of blue color |
| `GL.RENDERBUFFER_RED_SIZE` | GLint | R | resolution (bits) of red color |
| `GL.RENDERBUFFER_ALPHA_SIZE` | GLint | R | resolution (bits) of alpha component |
| `GL.RENDERBUFFER_DEPTH_SIZE` | GLint | R | resolution (bits) of depth component |
| `GL.RENDERBUFFER_STENCIL_SIZE` | GLint | R | resolution (bits) of stencil component |
| `GL.RENDERBUFFER_SAMPLES` (WebGL2) | R | |

`GL.RENDERBUFFER_INTERNAL_FORMAT` is the "internal" format of the currently bound renderbuffer. The default is `GL.RGBA4`.
| Value | Description |
| --- | --- |
| `GL.RGBA4` |  4 red bits, 4 green bits, 4 blue bits 4 alpha bits |
| `GL.RGB565` |  5 red bits, 6 green bits, 5 blue bits |
| `GL.RGB5_A1` |  5 red bits, 5 green bits, 5 blue bits, 1 alpha bit |
| `GL.DEPTH_COMPONENT16` |  16 depth bits |
| `GL.STENCIL_INDEX8` |  8 stencil bits |
