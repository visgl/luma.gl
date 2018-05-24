# TextureCube

A texture cube holds six textures that represent faces of the cube. A main feature of `TextureCube`s are that they can be passed to shaders and sampled with a direction vector (looking out from the center of the cube) rather than a normal set of texture coordinates, see Usage below.

`TextureCube`s are typically used to store environment maps. As an example, by rendering an environment into a texture cube, reflections in objects can then be rendered efficiently.

Most texture related functionality is implemented by and documented on the [Texture](/docs/api-reference/webgl/texture.md) base class. For additional information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Texture).


# Usage

Creating a `TextureCube`
```js
const textureCube = new TextureCube(gl, {width, height, dataFormat, pixels: {
  [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: imagePosX,
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: imagePosY,
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: imagePosZ,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: imageNegX,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: imageNegY,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: imageNegZ
}});
```

Replacing one or more faces texture data
```js
textureCube.setCubeMapImageData({width, height, dataFormat, pixels: {
  [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: imagePosX,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: imageNegY
}});
```

Passing a `TextureCube` to a draw call...
```js
Program.draw({
  uniforms: {
    cubemap: new TextureCube(gl, {...}),
    textureDir: [1, 1, 1]
  }
});
```

...and accessing it in the shader

```
// GLSL
uniform samplerCube cubemap;
uniform vec3 textureDir;

void main()
{
    vec4 color = texture(cubemap, textureDir);
}
```


## Members

* `handle` - the underlying `WebGLTexture`
* `target` - Always `GL.TEXTURE_CUBE`
* `depth` - Always `6`
* `width` - width of the face textures
* `height` - height of the face textures
* `format` - format


## Methods

### TextureCube constructor

```js
new Texture3D(gl, {
  [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: imagePosX,
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: imagePosY,
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: imagePosZ,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: imageNegX,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: imageNegY,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: imageNegZ,
  parameters
});
```



* Needs to supply 6 images all of same size and format.
* Images all need to be of the same square size, i.e. `width` and `height` must be the same.
* If not supplied, `width` and `height` will be autodeduced from `GL.TEXTURE_CUBE_MAP_POSITIVE_X`.
* The same `format`, `type` etc parameters will be applied to each cube face.


## Limits

* `GL.MAX_CUBE_MAP_TEXTURE_SIZE`
