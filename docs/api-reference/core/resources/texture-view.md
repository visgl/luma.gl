import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# TextureView

<CoreDocsTabs group="textures" active="texture-view" />

A `TextureView` is a view onto some subset of the texture subresources defined by a particular `Texture`.

### Subresource Selection

The set of texture subresources of a texture view view, is the subset of the subresources 
of the associated `Texture` for which each subresource  satisfies the following:
- The mipmap level of s is ≥ props.baseMipLevel and < props.baseMipLevel + props.mipLevelCount.
- The array layer of s is ≥ props.baseArrayLayer and < props.baseArrayLayer + props.arrayLayerCount.
- The aspect of s is in the set of aspects of props.aspect.

### Render Extent

There is an implicit "render extent" associated with a renderable `TextureView`.
This render extent depends on the baseMipLevel.

### TextureView Aliasing

Two `TextureView` objects are texture-view-aliasing if and only if their sets of subresources intersect.

## Usage

```ts
const texture = device.createTexture({...});
const textureView = texture.createView({...});
```

## Types

### TextureViewProps

| Property | Description |
| --- | --- |
| `aspect?: 'all' \| 'depth-only' \| 'stencil-only'` | Selects accessible depth/stencil aspects. WebGL `stencil-only` requires `stencil-texturing-webgl`; conflicting aspects of the same WebGL texture cannot be bound in one draw because WebGL view state is texture-global. |
| `swizzle?: string` | WebGPU-only component swizzle, defaulting to `rgba`. Non-default values require `texture-component-swizzle`; WebGL rejects them. |

## Methods

### `constructor`

The constructor for `TextureView` should not be called directly. Use `Texture.createView()` instead.
