# TextureCube

For more background and details on parameters, see [Textures and Samplers](textures-and-samplers.md).

# Usage

Creating a `TextureCube`
```js
const textureCube = new TextureCube(gl, {
  [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: imagePosX,
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: imagePosY,
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: imagePosZ,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: imageNegX,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: imageNegY,
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: imageNegZ
});
```

Sub Images

It is possible to replace part of a face texture image using `subImage`}

```js
textureCube.subImage({target: GL.TEXTURE_CUBE_MAP_POSITIVE_X, data, x, y, mipmapLevel});
```

## Remarks

* Needs to supply 6 images all of same size and format.
* Images all need to be of the same square size, i.e. `width` and `height` must be the same.
* If not supplied, `width` and `height` will be autodeduced from `GL.TEXTURE_CUBE_MAP_POSITIVE_X`.
* The same `format`, `type` etc parameters will be applied to each cube face.

## Methods

### TextureCube constructor

### Accessors

A number of read only accessors are available:

* `width` - width of one face of the cube map
* `height` - height of one face of the cube map
* `format` - internal format of the face textures
* `border` - Always 0.

* `type` - type used to create face textures
* `dataFormat` - data format used to create face textures.
* `offset` - offset used to create face textures. Always 0, unless specified using WebGL2 buffer constructor.

* `handle` - The underlying WebGL object.
* `id` - An identifying string that is intended to help debugging.

Sampler parameters can be accessed using `Texture.getParameter`, e.g:

`texture.getParameter(GL.TEXTURE_MAG_FILTER);`

* pixelStore parameters

TBD - how to retrieve?


