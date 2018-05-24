# Texture3D (WebGL2)

A `Texture3D` holds a number of textures of the same size and format. The entire array can be passed to the shader which uses an extra texture coordinate to sample from it. A core feature of `Texture3D` is that the entire stack of images can passed as a single uniform to and accessed in a GLSL shader, and sampled using 3D coordinates.

3D textures are typically used to store volumetric data or for 3D lookup tables in shaders.

Most texture related functionality is implemented by and documented on the [Texture](/docs/api-reference/webgl/texture.md) base class. For additional information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Texture).


## Usage

Create a new texture array
```js
if (Texture3D.isSupported()) {
  texture3D = new Texture3D(gl, {...});
}
```


## Members

* `handle` - The underlying `WebGLTexture`
* `target` - Always `GL.TEXTURE_3D`
* `depth` - the number of texture layers
* `width` - width of the layer textures
* `height` - height of the layer textures
* `format` - format of the layer textures


## Methods

`Texture3D` is a subclass of the [Texture](texture.md) and [Resource](resource.md) classes and inherit all methods and members of those classes.


### Texture3D.isSupported(gl)

Returns true if the context supports creation of `Texture3Ds`.


### constructor

`new Texture3D(gl, {parameters})`;

* `gl` (WebGLRenderingContext) - gl context
* `data`=`null` (*) - See below.
* `width`=`0` (*Number*) - The width of the texture.
* `height`=`0` (*Number*) - The height of the texture.
* `mipmaps`=`GL/ (*Enum*, default false) - `n`th mipmap reduction level, 0 represents base image
* `format` (*enum*, default `GL.RGBA`) - internal format that WebGL should use.
* `type` (*enum*, default is autodeduced from format) - type of pixel data (GL.UNSIGNED_BYTE, GL.FLOAT etc).
* `dataFormat` (*enum*, default is autodeduced from `format`) - internal format that WebGL should use.
* `parameters`=`{}` (object) - texture


## Limits

* The maximum size of a `Texture3D` (width/height/depth) is implementation defined, it can be queried via `GL.MAX_3D_TEXTURE_SIZE` (at least 256).
