# Texture2DArray (WebGL2)

A `Texture2DArray` holds a array of textures of the same size and format. The entire array can be passed to the shader which uses an extra texture coordinate  to sample from. A core feature of `Texture2DArray`s is that the entire array can passed as a single uniform to and accessed in a GLSL shader.

Texture arrays can be used as texture atlases if all textures are of the same size and format.

Most texture related functionality is implemented by and documented on the [Texture](/docs/api-reference/webgl/texture.md) base class. For additional information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Texture).


## Usage

Create a new texture array
```js
if (Texture2DArray.isSupported()) {
  textureArray = new Texture2DArray(gl, {...});
}
```


## Members

* `handle` - The underlying `WebGLTexture`
* `target` - Always `GL.TEXTURE_2D_ARRAY`
* `depth` - the number of textures in the array
* `width` - width of the textures
* `height` - height of the textures
* `format` - format of the textures


## Methods

`Texture2DArray` is a subclass of the [Texture](/docs/api-reference/webgl/texture.md) and [Resource](/docs/api-reference/webgl/resource.md) classes and inherit all methods and members of those classes.


### Texture2DArray.isSupported(gl)

Returns true if the context supports creation of `Texture2DArrays`.


### constructor

`new Texture2DArray(gl, {parameters})`;


## Limits

* `GL.MAX_ARRAY_TEXTURE_LAYERS` - The maximum number of textures in the array (at least 256).


## Remarks

* The maximum number of textures in the array is implementation defined, it can be queried via `GL.MAX_ARRAY_TEXTURE_LAYERS` (at least 256).
