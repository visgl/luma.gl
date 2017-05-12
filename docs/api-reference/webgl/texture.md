# Texture Class

`Texture` is a base class for
* [`Texture2D`](./texture-2d.md),
* [TextureCube],
* [`Texture2DArray`](./texture-2d-array.md) and
* [`Texture3D`](./texture-3d.md).

Also note that in WebGL2 it is possible to specify sampling parameters independently from the texture. See [`Sampler`](./sampler.md).

## Usage

* For additional usage examples, `Texture` inherits from [`Resource`](./resource.md).

Configuring a Texture
```js
const sampler = new Texture2D(gl);
sampler.setParameters({
  [GL.TEXTURE_WRAP_S]: GL.CLAMP
});
```

Using Textures
```js
// Create two samplers to sample the same texture in different ways
const texture = new Texture2D(gl, ...);

// For ease of use, the `Model` class can bind textures for a draw call
model.draw({
  uniforms({texture1: texture, texture2: texture})
});

// Alternatively, bind the textures using the `Texture` API directly
texture.bind(0);
texture.bind(1);
```

## Remarks

* Textures are special because when you first bind them to a target, they get special information. When you first bind a texture as a GL_TEXTURE_2D, you are actually setting special state in the texture. You are saying that this texture is a 2D texture. And it will always be a 2D texture; this state cannot be changed ever. If you have a texture that was first bound as a GL_TEXTURE_2D, you must always bind it as a GL_TEXTURE_2D; attempting to bind it as GL_TEXTURE_1D will give rise to an error (while run-time).


## Methods

### Constructor

Note that in WebGL2 it is possible to specify sampling parameters independently from the texture. See [`Sampler`](./sampler.md).

* textureType - (*enum*, optional) The texture type used to call `gl.bindTexture` with. Default's `gl.TEXTURE_2D`.
* pixelStore - (*array*, optional) An array of objects with name, value options to be set with `gl.pixelStorei` calls.
Default's `[{ name: gl.UNPACK_FLIP_Y_WEBGL, value: true }]`.
* parameters - (*array*, optional) An array of objects with nane, value options to be set with `gl.texParameteri`.
Default's `[{ name: gl.TEXTURE_MAG_FILTER, value: gl.NEAREST }, { name: gl.TEXTURE_MIN_FILTER, value: gl.NEAREST }]`.
* data - (*object*, optional) An object with properties described below:
  * format - (*enum*, optional) The format used for `gl.texImage2D` calls. Default's `gl.RGBA`.
  * value - (*object*, optional) If set to an `Image` object then this image will be used to fill the texture. Default's false. If no image is set then we might want to set the width and height of the texture.
  * width - (*number*, optional) The width of the texture. Default's 0.
  * height - (*number*, optional) The height of the texture. Default's 0.
  * border - (*number*, optional) The border of the texture. Default's 0.


### generateMipmap

Call to regenerate mipmaps after modifying texture(s)

WebGL References [gl.generateMipmap]()

### setImageData

Allocates storage

```js
  setImageData({
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
    compressed = false
  });
```

* `pixels` (*) -
 null - create empty texture of specified format
 Typed array - init from image data in typed array
 Buffer|WebGLBuffer - (WEBGL2) init from image data in WebGLBuffer
 HTMLImageElement|Image - Inits with content of image. Auto width/height
 HTMLCanvasElement - Inits with contents of canvas. Auto width/height
 HTMLVideoElement - Creates video texture. Auto width/height
* `width` (GLint) -
* `height` (GLint) -
* `mipMapLevel` (GLint) -
* `format` (GLenum) - format of image data.
* `type` (GLenum)
 - format of array (autodetect from type) or
 - (WEBGL2) format of buffer
* `offset` (Number) - (WEBGL2) offset from start of buffer
* `border` (GLint) - must be 0.

### subImage

Redefines an area of an existing texture
Note: does not allocate storage

```
  subImage({
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
    border = 0
  });
```

WebGL References [gl.compressedTexSubImage2D](), [gl.texSubImage2D](), [gl.bindTexture](), [gl.bindBuffer]()


### copyFramebuffer

Defines a two-dimensional texture image or cube-map texture image with pixels from the current framebuffer (rather than from client memory). (gl.copyTexImage2D wrapper)

Note that binding a texture into a Framebuffer's color buffer and rendering can be faster than `copyFramebuffer`.

```js
  copyFramebuffer
    target = this.target,
    framebuffer,
    offset = 0,
    x = 0,
    y = 0,
    width,
    height,
    level = 0,
    internalFormat = GL.RGBA,
    border = 0
  });
```

WebGL References [copyTexImage2D](), [gl.bindFramebuffer]()


### getActiveUnit

[gl.getParameter]()


### bind

 * textureUnit

WebGL References [gl.activeTexture](), [gl.bindTexture]()


### unbind()

WebGL References [gl.activeTexture](), [gl.bindTexture]()
