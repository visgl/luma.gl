import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# TextureView

<CoreDocsTabs group="textures" active="texture-view" />

A `TextureView` is a view onto some subset of the texture subresources defined by a particular `Texture`.

## Subresource selection

The set of texture subresources of a texture view is the subset of the subresources 
of the associated `Texture` for which each subresource satisfies the following:
- Its mipmap level is ≥ props.baseMipLevel and < props.baseMipLevel + props.mipLevelCount.
- Its array layer is ≥ props.baseArrayLayer and < props.baseArrayLayer + props.arrayLayerCount.
- Its aspect is in the set of aspects of props.aspect.

## Render extent

There is an implicit "render extent" associated with a renderable `TextureView`.
This render extent depends on the baseMipLevel.

## Aliasing

Two `TextureView` objects are texture-view-aliasing if and only if their sets of subresources intersect.

## Usage

```ts
const texture = device.createTexture({...});
const textureView = texture.createView({...});
```

## Types

### TextureViewProps

Views inherit [ResourceProps](resource.md#resourceprops). `texture.createView()` accepts
partial view properties; omitted ranges are resolved by the backend from the texture.

| Property | Type | Description |
| --- | --- | --- |
| `format` | `TextureFormat` | Texture format or a compatible format declared in the texture's `viewFormats`. |
| `dimension` | `'1d' \| '2d' \| '2d-array' \| 'cube' \| 'cube-array' \| '3d'` | How to interpret the selected subresources. |
| `aspect` | `'all' \| 'depth-only' \| 'stencil-only'` | Accessible aspects; defaults to `'all'`. |
| `baseMipLevel` | `number` | First mip level; defaults to `0`. |
| `mipLevelCount` | `number` | Number of accessible mip levels. |
| `baseArrayLayer` | `number` | First array layer; defaults to `0`. |
| `arrayLayerCount` | `number` | Number of accessible array layers. |

The parent texture owns its storage. A view does not copy pixels or transfer texture ownership.
Keep the texture alive while the view is used. Backend support for dimensions and alternate
view formats varies; check the parent texture's format and feature requirements.

## Methods

### `constructor`

The constructor for `TextureView` should not be called directly. Use `Texture.createView()` instead.
