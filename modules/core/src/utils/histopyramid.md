# Histopyramid methods

`Histopyramid` aka `Histogram Pyramid` provides an efficient way of converting sparse matrix (represented by a texture) into list of coordinates (points). Where each active cell in the matrix can contribute to 1 or more points. All operations of the algorithm can be executed in parallel hence are performed on the GPU.

Following set of methods implement `Histopyramid` operations as described in `High‐speed marching cubes using histopyramids` by `Dyken C`, `Ziegler G`, `Theobalt C` and `Seidel H`
Link to the paper: http://olmozavala.com/Custom/OpenGL/Tutorials/OpenGL4_Examples/MarchingCubes_Dyken/Dyken_et_al-2008-Computer_Graphics_Forum.pdf

## Methods

### buildHistopyramidBaseLevel(gl : WebGLRenderingContext, opts : Object) : Object

Takes an input texture, and builds base level (level 0) histogram pyramid. Also packs 4 weights of a 2X2 area into a single RGBA channel of base level texture.

* `gl` - WebGL context.
* `opts` (`Object`={}) - options
  * `texture` (`Texture2D`) - Source texture for which base histopyramid level to be built.
  * `channel` (`String`, Optional, Default: `r`) - Pixel channel of source texture to be used in building histopyramid.

Returns an object with following fields.

* `baseTexture` (`Texture2D`) - Base level texture object.
* `flatPyramidTexture` (`Texture2D`) - Texture with enough size, that can hold all levels of histopyramid. Base level texture is already copied at xy offset of (0, 0).
* `textureData` (`ArrayBuffer`, Optional) - Array containing data of base level texture. Returned only when base level texture size is 1X1.


### getHistoPyramid(gl : WebGLRenderingContext, opts : Object) : Object

Takes an input texture, and builds all levels of histogram pyramid. All levels are RGBA textues, where each pixels packs 4 weights of a 2X2 texture region.

* `gl` - WebGL context.
* `opts` (`Object`={}) - options
  * `texture` (`Texture2D`) - Source texture for which base histopyramid level to be built.
  * `channel` (`String`, Optional, Default: `r`) - Pixel channel of source texture to be used in building histopyramid.

Returns an object with following fields.

* `pyramidTextures` (`Array`) - Array of `Texture2D` objects representing all mip levels of the histopyramid.
* `flatPyramidTexture` (`Texture2D`) - `Texture2D` object with all the mip levels laid out horizontally, with base level texture at the origin. Size of this texture is same as input texture.
* `levelCount` (`Number`) - Number of mip levels generated.
* `topLevelData` (`ArrayBuffer`) - Array containing data from the last (1X1) mip level. This contains the number of points that can be generated from this texture.


### histoPyramidGenerateIndices(gl : WebGLRenderingContext, opts : Object) : Object

Takes an input texture, and generates a `Buffer` object with list of points that correspond to non zero values of the texture.

* `gl` - WebGL context.
* `opts` (`Object`={}) - options
  * `texture` (`Texture2D`) - Source texture for which base histopyramid level to be built.
  * `channel` (`String`, Optional, Default: `r`) - Pixel channel of source texture to be used in building histopyramid.

Returns an object with following fields.

* `locationAndIndexBuffer` (`Buffer`): `Buffer` object contains coordinate data of generated points. Each point is represented 4 floats (XYZW). Where `X` contains x coordinate, `Y` contains y coordinate and `Z` contains local key-index and `W` contains key-index. x and y coordiantes of the point are with in ((0,0) to (width, height)] range, where `width` and `height` are dimensions of source texture object.
