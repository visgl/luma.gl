# Framebuffer

A `Framebuffer` is a WebGL container object that the application can use for "off screen" rendering. A framebuffer does not itself contain any image data but can optionally contain attachments (one or more color buffers, a depth buffer and a stencil buffer) that store data. Attachments must be in the form of `Texture`s and `Renderbuffer`s.

For additional information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Framebuffer)


## Usage

Creating a framebuffer with default color and depth attachments
```js
const framebuffer = new Framebuffer(gl, {
  width: window.innerWidth,
  height: window.innerHeight,
  color: true,
  depth: true
});
```

Attaching textures and renderbuffers
```js
framebuffer.attach({
  [GL.DEPTH_ATTACHMENT]: new Renderbuffer(gl, {...}),
  [GL.COLOR_ATTACHMENT_0]: new Texture(gl, {...}),
  [GL.COLOR_ATTACHMENT_1]: [new TextureCube(gl, {...}), GL.TEXTURE_CUBE_MAP_POSITIVE_X],
  [GL.COLOR_ATTACHMENT_2]: [new TextureArray2D(gl, {...}), 0],
  [GL.COLOR_ATTACHMENT_3]: [new TextureArray2D(gl, {...}), 1],
  [GL.COLOR_ATTACHMENT_4]: [new Texture3D(gl, {..., depth: 8}), 2]
});
framebuffer.checkStatus(); // optional
```

Resizing a framebuffer to the size of a window
```js
framebuffer.resize({width: window.innerWidth, height: window.innerHeight});
```

Specifying a framebuffer for rendering
```js
const offScreenBuffer = new Framebuffer();
program1.draw({
  framebuffer: offScreenBuffer,
  settings: {}
});
```

Selecting a framebuffer for rendering
```js
import {withState} from 'luma.gl';
withState(gl, {framebuffer}, () => {
  program1.draw(...);
  program2.draw(...);
});
```

Blitting between framebuffers (WebGL2)
```js
framebuffer.blit({
  srcFramebuffer: ..., srcX: 0, srcy:0, srcWidth, srcHeight,
  dstX:, dstY, dstWidth, destHeight
});
```

Invalidating framebuffers (WebGL2)
```js
framebuffer.invalidate({}); // GPU can release the data for all attachments
framebuffer.invalidate({attachments: [...]}); // GPU can release the data for specified attachments
```


## Methods

### constructor

Creates a new framebuffer, optionally creating and attaching `Texture` and `Renderbuffer` attachments.

```
new Framebuffer(gl, {
  id,
  width,
  height,
  attachments,
  color,
  depth,
  stencil
})
```

* `gl` - (*WebGLContext*) - context
* `id`= - (*String*) - An optional name (id) of the buffer.
* `width=`1` - (*number*) The width of the framebuffer.
* `height`=`1` - (*number*) The height of the framebuffer.
* `attachments`={} - (*Object*, optional) - a map of Textures and/or Renderbuffers, keyed be "attachment points" (see below).
* `texture` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
* `color` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
* `depth` - shortcut to the attachment in `GL.DEPTH_ATTACHMENT`
* `stencil` - shortcut to the attachment in `GL.STENCIL_ATTACHMENT`

The luma.gl `Framebuffer` constructor enables the creation of a framebuffer with all the proper attachments in a single step and also the `resize` method makes it easy to efficiently resize a all the attachments of a `Framebuffer` with a single method.


### delete

Destroys the underlying WebGL object. When destroying `Framebuffer`s it can be important to consider that a `Framebuffer` can manage other objects that may also need to be destroyed.


### initialize

Initializes the `Framebuffer` to match the supplied parameters. Unattaches any existing attachments, attaches any supplied attachments. All new attachments will be resized if they are not already at the right size.

`Framebuffer.initialize({width, height})`

* `width=`1` - (*number*) The width of the framebuffer.
* `height`=`1` - (*number*) The height of the framebuffer.
* `attachments`={} - (*Object*, optional) - a map of Textures and/or Renderbuffers, keyed be "attachment points" (see below).
* `texture` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
* `color` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
* `depth` - shortcut to the attachment in `GL.DEPTH_ATTACHMENT`
* `stencil` - shortcut to the attachment in `GL.STENCIL_ATTACHMENT`


### resize

`Framebuffer.resize({width, height})`

Resizes all the `Framebuffer`'s current attachments to the new `width` and `height` by calling `resize` on those attachments.

* `width` (GLint) - width of `Framebuffer` in pixels
* `height` (GLint) - height of `Framebuffer` in pixels

Returns itself to enable chaining

* Each attachment's `resize` method checks if `width` or `height` have actually changed before reinitializing their data store, so calling `resize` multiple times with the same `width` and `height` does not trigger multiple resizes.
* If a resize happens, `resize` erases the current content of the attachment in question.

WebGL References see `initialize`.


### attach

Used to attach or unattach `Texture`s and `Renderbuffer`s from the `Framebuffer`s various attachment points.

`Framebuffer.attach(attachments)`

* `attachments` - a map of attachments.

Returns itself to enable chaining.

The key of an attachment must be a valid attachment point, see below.

The following values can be provided for each attachment
* `null` - unattaches any current binding
* `Renderbuffer` - attaches the `Renderbuffer`
* `Texture` - attaches the `Texture`
* [`Texture`, layer=0 (Number), mipmapLevel=0 (Number)] - attaches the specific layer from the `Texture` (WebGL2)

WebGL calls [`gl.framebufferRenderbuffer`](), [`gl.bindFramebuffer`]()
WebGL calls [`gl.framebufferTexture2D`](), [`gl.bindFramebuffer`]()
WebGL calls [`gl.framebufferTextureLayer`](), [`gl.bindFramebuffer`]()


### checkStatus

Check that the framebuffer contains a valid combination of attachments

[`gl.framebufferCheckStatus`](), [`gl.bindFramebuffer`]()


### readPixels

App can provide pixelArray or have it auto allocated by this method
    x = 0,
    y = 0,
    width,
    height,
    format = GL.RGBA,
    type,
    pixelArray = null

NOTE: Slow requires roundtrip to GPU

[gl.readPixels](), [`gl.bindFramebuffer`]()


### readBuffer

Selects a color buffer as the source for pixels for subsequent calls to
copyTexImage2D, copyTexSubImage2D, copyTexSubImage3D or readPixels.

Parameters: src
* `gl.BACK` - Reads from the back color buffer.
* `gl.NONE` - Reads from no color buffer.
* `gl.COLOR_ATTACHMENT{0-15}` - Reads from one of 16 color attachment buffers.


### blit (WebGL2)

Copies a rectangle of pixels between framebuffers

Parameters
* `srcFramebuffer`
* `srcX0`
* `srcY0`
* `srcX1`
* `srcY1`
* `dstX0`
* `dstY0`
* `dstX1`
* `dstY1`
* `mask`
* `filter` = GL.NEAREST

[`gl.blitFramebuffer`](), [`gl.bindFramebuffer`]()


### invalidate (WebGL2)

Signals to the GL that it need not preserve the pixels of a specified region of the framebuffer
(by default all pixels of the specified framebuffer attachments are invalidated).

Parameters
* attachments - list of attachments to invalidate

[`gl.invalidateFramebuffer`](), [`gl.invalidateSubFramebuffer`](), [`gl.bindFramebuffer`]()


## Framebuffer Parameters

### Framebuffer Attachment Points

| Attachment Point              | Description |
| ---                           | --- |
| `GL.COLOR_ATTACHMENT`{0-15}   | Attaches the texture to one of the framebuffer's color buffers |
| `GL.DEPTH_ATTACHMENT`         | Attaches the texture to the framebuffer's depth buffer |
| `GL.STENCIL_ATTACHMENT`       | Attaches the texture to the framebuffer's stencil buffer |
| `GL.DEPTH_STENCIL_ATTACHMENT` | Combined depth and stencil buffer |

The set of available attachments is larger in WebGL2, and also the extensions WEBGL_draw_buffers and WEBGL_depth_texture provide additional attachments that match or exceed the WebGL2 set.


### Framebuffer Attachment Values

The following values can be provided for each attachment point
* `null` - unattaches any current binding
* `Renderbuffer` - attaches the `Renderbuffer`
* `Texture2D` - attaches at mipmapLevel 0 of the supplied `Texture2D`.
* [`Texture2D`, 0, mipmapLevel] - attaches the specified mipmapLevel from the supplied `Texture2D` (WebGL2), or cubemap face. The second element in the array must be `0`. In WebGL1, mipmapLevel must be 0.
* [`TextureCube`, face (Number), mipmapLevel=0 (Number)] - attaches the specifed cubemap face from the `Texture`, at the specified mipmap level. In WebGL1, mipmapLevel must be 0.
* [`Texture2DArray`, layer (Number), mipmapLevel=0 (Number)] - attaches the specifed layer from the `Texture2DArray`, at the specified mipmap level.
* [`Texture3D`, layer (Number), mipmapLevel=0 (Number)] - attaches the specifed layer from the `Texture3D`, at the specified mipmap level.


## Remarks

* In the raw WebGL API, creating a set of properly configured and matching textures and renderbuffers can require a lot of careful coding and boilerplate.
* This is further complicated by many capabilities (such as support for multiple color buffers and various image formats) depending on WebGL extensions or WebGL versions.


