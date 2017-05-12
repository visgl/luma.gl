# Texture2D

For more background and details on parameters, see [Textures and Samplers](textures-and-samplers.md).

# Usage

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
  data=, width=, height=, mipmaps=, format=, type=, dataFormat=,
  parameters=, pixelStore=
})
```

* `gl` (WebGLRenderingContext) - gl context
* `data`=null (*) - If not provided (null), a solid color texture will be allocated of the specified size.
* `width` (*Number*, default 0) - The width of the texture.
* `height` (*Number*, default 0) - The height of the texture.
* `mipmaps` (*Array* | *Boolean* | *Enum*, default false) - `n`th mipmap reduction level, 0 represents base image
* `format` (*enum*, default `GL.RGBA`) - internal format that WebGL should use.
* `type` (*enum*, default is autodeduced from format) - type of pixel data (GL.UNSIGNED_BYTE, GL.FLOAT etc).
* `dataFormat` (*enum*, default is autodeduced from `format`) - internal format that WebGL should use.
* `parameters`=`{}` (object) - texture sampler parameters (see [Sampler](./sampler.md)
* `pixelStore`=`{}` (object) - pixel store parameters (see separate article)



| Type                               | Description  |
| ---------------------------------- | -----------  |
| `null`                             | A texture will be created with the appropriate format, size and width. Bytes will be "uninitialized". |
| `typed array`                      | Bytes will be interpreted according to format/type parameters and pixel store settings. |
| `Buffer` or `WebGLBuffer` (`WebGL2`) | Bytes will be interpreted according to format/type parameters and pixel store settings. |
| `Image` (`HTMLImageElement`)       | image will be used to fill the texture. width and height will be deduced. |
| `Video` (`HTMLVideoElement`)       | video will be played, continously updating the texture. width and height will be deduced. |
| `Canvas` (`HTMLCanvasElement`)     | canvas will be used to fill the texture. width and height will be deduced. |
| `ImageData`                        | `canvas.getImageData()` - Used to fill the texture. width and height will be deduced. |

#### format

The internal format of the texture. WebGL will unpack `data` into this format. Defaults to `GL.RGBA`.

Some common formats are listed here. See tables below for additional supported formats

| Format                  | Components | Description |
| ----------------------- | ---------- | ----------- |
| `GL.RGB`                |          3 | sampler reads the red, green and blue components, alpha is 1.0 |
| `GL.RGBA`               |          4 | Red, green, blue and alpha components are sampled from the color buffer. |
| `GL.LUMINANCE`          |          1 | Red, green, blue components are sampled from a single luminance value. alpha is 1.0. |
| `GL.LUMINANCE_ALPHA`    |          2 | Each component is a luminance/alpha double. When sampled, rgb are all set to luminance, alpha from component. |
| `GL.ALPHA`              |          1 | Discards the red, green and blue components and reads the alpha component. |

#### type

Format of pixel data (i.e. format of color components in the `data` memory block (only applies to typed arrays/WebGL buffers).

Some common types are listed here. See tables below for additional supported types.

| Type | Description |
| --- | --- |
| `GL.UNSIGNED_BYTE` | 8 bits per channel for `GL.RGBA` |
| `GL.HALF_FLOAT` (WebGL2, OES_texture_half_float) | |
| `GL.FLOAT` (WebGL2, OES_texture_float) | |

Note: luma.gl attempts to autodeduce `type` from the `format` parameter, so for common formats you would not need to specify this parameter.

`dataFormat` - Normally autodeduced from the `format` parameter. Does
  not need to be specified for any texture format specified in the WebGL standard.


#### Texture Sampler Parameters

Texture parameters control how textures are sampled in the shaders.
Also see [`Sampler`](sampler.md).



