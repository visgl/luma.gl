# TextureTransform

`TextureTransform` is an internal helper class for `Transform`, responsible for managing resources and state required for reading from and/or writing to `Texture` objects. It auto creates `Texture` objects when requested, creates `Framebuffer` objects. Maintains all texture bindings, when swapping is eanbled, two binding objects are created for easy switching of all WebGL resource binginds.

NOTE: In following sections 'texture transform' is used to refer to 'reading from and/or writing to `Texture` objects'.

## Constructor

### Transform(gl : WebGL2RenderingContext, props: Object)

- `gl` (`WebGLRenderingContext`) gl - context
- `props` (`Object`, Optional) - contains following data.
  - `sourceTextures` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Texture` object.
  - `targetTexture` (`Texture`|`String`, Optional) - `Texture` object to which data to be written. When it is a `String`, it must be one of the source texture attributes name, a new texture object is cloned from it.
  - `targetTextureVarying` (`String`) : varying name used in vertex shader who's data should go into target texture.
  - `swapTexture` (`String`) : source texture attribute name, that is swapped with target texture every time `swap()` is called.
  - `fs` (`String`, Optional) - fragment shader string, when rendering to a texture, fragments can be processed using this custom shader, when not specified, pass through fragment shader will be used.

## Methods (Model props)

### getDrawOptions(opts: Object) : Object

Returns options required when performing `Model.draw()` options.

- `opts` (`Object`) - Any existing `opts.attributes` , `opts.parameters`, and `opts.uniforms` will be merged with new values.

Returns an Object : {attributes, framebuffer, uniforms, discard, parameters}.

### updateModelProps(props: Object) : Object

Updates input `props` object used to build `Model` object, with data required for texture transform.

- `props` (`Object`) - props for building `Model` object, it will updated with required options (`{vs, fs, modules, uniforms, inject}`) for texture transform.

Returns updated object.

## Methods (Resource management)

### swap()

If `swapTexture` is provided during construction, performs source and feedback buffers swap as per the `swapTexture` mapping.

### update(props: Object)

Updates bindings for source and target texture.

- `props` (`Object`) - contains following data.
  - `sourceTextures` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Texture` object.
  - `targetTexture` (`Texture`|`String`, Optional) - `Texture` object to which data to be written. When it is a `String`, it must be one of the source texture attributes name, a new texture object is cloned from it.

## Methods (Accessors)

### getTargetTexture() : Texture

Returns current target texture object.

### getData([options : Object]) : ArrayBufferView

Reads and returns data from current target texture.

- `options.packed` (Boolean, Optional, Default: false) - When true, data is packed to the actual size varyings. When false return array contains 4 values (R, G, B and A) for each element. Un-used element value will be 0 for R, G and B and 1 for A channel.

### getFramebuffer() : Framebuffer

Returns current `Framebuffer` object.
