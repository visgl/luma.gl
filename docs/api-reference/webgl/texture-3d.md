# Texture3D (WebGL2)

3D textures hold basic volumetric textures and can be thought of 3-dimentional arrays with a width, height and depth. They hold image memory of a certain format and size, determined at initialization time. They can be sampled in shaders using the `texture` function with a 3D texture coordinate.

Most texture related functionality is implemented by and documented on the [Texture](/docs/api-reference/webgl/texture.md) base class. For additional information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Texture).


## Usage

Create a new 3D texture
```js
if (Texture3D.isSupported()) {
  texture3D = new Texture3D(gl, {...});
}
```


## Members

* `handle` - The underlying `WebGLTexture`
* `target` - Always `GL.TEXTURE_3D`
* `width` - width of texture
* `height` - height of texture
* `depth` - depth of the texture
* `format` - format of texture


## Methods

`Texture3D` is a subclass of the [Texture](texture.md) and [Resource](resource.md) classes and inherit all methods and members of those classes. Note that `setSubImageData` is not currently supported for 3D textures.


### Texture3D.isSupported(gl)

Returns true if the context supports creation of `Texture3Ds`.


### constructor

`new Texture3D(gl, {parameters})`;

```
const texture = new Texture3D(gl, {
  width: TEXTURE_DIMENSIONS,
  height: TEXTURE_DIMENSIONS,
  depth: TEXTURE_DIMENSIONS,
  data: textureData,
  format: gl.RED,
  dataFormat: gl.R8
});
```

* `gl` (WebGLRenderingContext) - gl context
* `data`=`null` (*) - See below.
* `width`=`0` (*Number*) - The width of the texture.
* `height`=`0` (*Number*) - The height of the texture.
* `depth`=`0` (*Number*) - The depth of the texture.
* `mipmaps`=`true` (*Boolean*) - whether to generate mipmaps
* `format` (*enum*, default `GL.RGBA`) - internal format that WebGL should use.
* `type` (*enum*, default is autodeduced from format) - type of pixel data (GL.UNSIGNED_BYTE, GL.FLOAT etc).
* `dataFormat` (*enum*, default is autodeduced from `format`) - internal format that WebGL should use.
* `parameters`=`{}` (object) - texture


## Limits

* The maximum size of a `Texture3D` (width/height/depth) is implementation defined, it can be queried via `GL.MAX_3D_TEXTURE_SIZE` (at least 256).
