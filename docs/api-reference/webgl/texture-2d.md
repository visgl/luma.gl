# Texture2D

2D textures hold basic "single image" textures (although technically they can contain multiple mimap levels). They hold image memory of a certain format and size, determined at initialization time. They can be read from using shaders and written to by attaching them to frame buffers.

Most texture related functionality is implemented by and documented on the [Texture](texture.md) base class. For additional information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Texture).


## Usage

Construct a new texture from an image
```js
const texture = new Texture2D(gl, {
  data: image,
  parameters: {
    [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
    [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
  },
  pixelStore: {
    [GL.UNPACK_FLIP_Y_WEBGL]: true,
  },
  mipmaps: GL.NICEST
});
```

Construct a texture initialized with a data array
```js
const texture = new Texture2D(gl, {
  width: 2,
  height: 1,
  format: GL.RGB,
  data: new Uint8Array([255, 0, 0,  0, 0, 255]),
  parameters: {
    [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
    [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
  },
  pixelStore: {
    [GL.UNPACK_FLIP_Y_WEBGL]: true
  },
  mipmaps: true
});
```

Construct an empty 1x1 texture
```js
const texture = new Texture2D(gl);
```

Resize it (this clears the texture).
```js
texture.update({width: 10, height: 10});
```

Write a sub image into the texture
```js
texture.subImage({data, x, y, mipmapLevel});
```

Accessing elements
```js
console.log(
  texture2D.width,
  texture2D.height,
  texture2D.format,
  texture2D.type,
  texture2D.getParameter(GL.TEXTURE_MAG_FILTER)
);
```

## Methods

### Texture2D constructor

```
new Texture2D(gl, {
  data=,
  width=,
  height=,
  mipmaps=,
  format=,
  type=,
  dataFormat=,
  parameters=, pixelStore=
})
```

* `gl` (WebGLRenderingContext) - gl context
* `data`=null (*) - If not provided (null), a solid color texture will be allocated of the specified size.
* `width`=`0` (*Number*) - The width of the texture.
* `height`=`0` (*Number*) - The height of the texture.
* `mipmaps`= - (*GLenum*) - How mipmaps should be created.
* `format`=`GL.RGBA` (*GLenum* ) - internal format that WebGL should use.
* `type`= (*enum*) - type of pixel data (`GL.UNSIGNED_BYTE`, `GL.FLOAT` etc). Default is autodeduced from `format`.
* `dataFormat`= (*GLenum*) - internal format that WebGL should use. Default is autodeduced from `format`.
* `parameters`=`{}` (*object*) - map of texture sampler parameters
* `pixelStore`=`{}` (*object*) - map of pixel store settings (controls how `data` is interpreted)

Note that since many of the constructor parameters are common to all the `Texture` classes they are detailed in [`Texture`](texture.md). Sampler parameters are specified in [Sampler](./sampler.md), and pixel store parameters are specified in [State Management](./context-state.md)


## Limits