# TextureView

[Texture](https://luma.gl/docs/api-reference/core/resources/texture.md)[TextureView](https://luma.gl/docs/api-reference/core/resources/texture-view.md)[Sampler](https://luma.gl/docs/api-reference/core/resources/sampler.md)[ExternalTexture](https://luma.gl/docs/api-reference/core/resources/external-texture.md)

A `TextureView` is a view onto some subset of the texture subresources defined by a particular `Texture`.

### Subresource Selection[​](#subresource-selection "Direct link to Subresource Selection")

The set of texture subresources of a texture view view, is the subset of the subresources of the associated `Texture` for which each subresource satisfies the following:

* The mipmap level of s is ≥ props.baseMipLevel and < props.baseMipLevel + props.mipLevelCount.
* The array layer of s is ≥ props.baseArrayLayer and < props.baseArrayLayer + props.arrayLayerCount.
* The aspect of s is in the set of aspects of props.aspect.

### Render Extent[​](#render-extent "Direct link to Render Extent")

There is an implicit "render extent" associated with a renderable `TextureView`. This render extent depends on the baseMipLevel.

### TextureView Aliasing[​](#textureview-aliasing "Direct link to TextureView Aliasing")

Two `TextureView` objects are texture-view-aliasing if and only if their sets of subresources intersect.

## Usage[​](#usage "Direct link to Usage")

```
const texture = device.createTexture({...});

const textureView = texture.createView({...});
```

## Types[​](#types "Direct link to Types")

### TextureViewProps[​](#textureviewprops "Direct link to TextureViewProps")

## Methods[​](#methods "Direct link to Methods")

### `constructor`[​](#constructor "Direct link to constructor")

The constructor for `TextureView` should not be called directly. Use `Texture.createView()` instead.
