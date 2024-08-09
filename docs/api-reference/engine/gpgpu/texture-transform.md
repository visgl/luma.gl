# TextureTransform

`TextureTransform` is responsible for managing resources and state required for reading from and/or writing to `Texture` objects. It auto creates `Texture` objects when requested, creates `Framebuffer` objects. Maintains all texture bindings, when swapping is eanbled, two binding objects are created for easy switching of all WebGL resource binginds.

NOTE: In following sections 'texture transform' is used to refer to 'reading from and/or writing to `Texture` objects'.

## Types

### `TextureTransformProps`

```ts
export type TextureTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs']; // override as optional
  targetTexture: Texture;
  targetTextureChannels: 1 | 2 | 3 | 4;
  targetTextureVarying: string;

  /** @deprecated TODO(donmccurdy): Needed? */
  inject?: Record<string, string>;
  /** @deprecated TODO(donmccurdy): Needed? */
  framebuffer?: Framebuffer;
  /** @deprecated TODO(donmccurdy): Model already handles this? */
  sourceBuffers?: Record<string, Buffer>;
  /** @deprecated TODO(donmccurdy): Model already handles this? */
  sourceTextures?: Record<string, Texture>;
};
```

### `TextureBinding`

```ts
type TextureBinding = {
  sourceBuffers: Record<string, Buffer>;
  sourceTextures: Record<string, Texture>;
  targetTexture: Texture;
  framebuffer?: Framebuffer;
};
```

## Methods

### `constructor`

`new TextureTransform(device: Device, props: TextureTransformProps)`

- `device` - Device
- `props.sourceTextures` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Texture` object.
- `props.targetTexture` (`Texture`|`String`, Optional) - `props.Texture` object to which data to be written. When it is a `String`, it must be one of the source texture attributes name, a new texture object is cloned from it.
- `props.targetTextureVarying` : varying name used in vertex shader who's data should go into target texture.
- `props.swapTexture` : source texture attribute name, that is swapped with target texture every time `swap()` is called.
- `props.fs`  - fragment shader string, when rendering to a texture, fragments can be processed using this custom shader, when not specified, pass through fragment shader will be used.

### getDrawOptions(opts: Object) : Object

Returns options required when performing `Model.draw()` options.

- `opts` (`Object`) - Any existing `opts.attributes` , `opts.parameters`, and `opts.uniforms` will be merged with new values.

Returns an Object : attributes, framebuffer, uniforms, discard, parameters

### updateModelProps(props: Object) : Object

Updates input `props` object used to build `Model` object, with data required for texture transform.

- `props` (`Object`) - props for building `Model` object, it will updated with required options (`{vs, fs, modules, uniforms, inject}`) for texture transform.

Returns updated object.

### run(props: Object)

Updates bindings for source and target texture.

- `props` (`Object`) - contains following data.
  - `sourceTextures` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Texture` object.
  - `targetTexture` (`Texture`|`String`, Optional) - `Texture` object to which data to be written. When it is a `String`, it must be one of the source texture attributes name, a new texture object is cloned from it.


### getTargetTexture() : Texture

Returns current target texture object.

### getData([options : Object]) : ArrayBufferView

Reads and returns data from current target texture.

- `options.packed` (Boolean, Optional, Default: false) - When true, data is packed to the actual size varyings. When false return array contains 4 values (R, G, B and A) for each element. Un-used element value will be 0 for R, G and B and 1 for A channel.

### getFramebuffer() : Framebuffer

Returns current `Framebuffer` object.
