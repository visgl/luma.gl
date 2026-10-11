# SelectionOutline

`SelectionOutline` in `@luma.gl/experimental` draws a WebGPU selection overlay from a
sampled `r32uint` visible-placement ID texture. It borrows the texture and draws an inward
stroke only on pixels matching the selected identifier. Background and other visible
objects stay unchanged, including objects occluding the selected placement.

```ts
import {SelectionOutline} from '@luma.gl/experimental';

const outline = new SelectionOutline(graphicsDevice);
// Render and submit the scene before capturing its current primary-hit channels.
frame.render();
graphicsDevice.submit();
const channels = frame.captureChannels();
if (channels) {
  try {
    const selectedIdentifier = channels.identifiers.findIndex(
      identity => identity.placementId === selectedPlacementId
    ) + 1;
    const renderPass = graphicsDevice.beginRenderPass({
      clearColor: false,
      clearDepth: false,
      clearStencil: false
    });
    outline.draw(renderPass, {
      identifierTexture: channels.identifierTexture,
      selectedIdentifier,
      width: 2,
      color: [1, 0.6, 0.05, 1]
    });
    renderPass.end();
    graphicsDevice.submit();
  } finally {
    // Input ownership stays with the snapshot. Release only after submission.
    channels.destroy();
  }
}
// On application teardown, after submitting the overlay's final GPU use:
outline.destroy();
```

| Draw option | Meaning |
| --- | --- |
| `identifierTexture` | Caller-owned sampled `r32uint` texture with zero for background. |
| `selectedIdentifier` | Exact uint32 texture value for the current snapshot. Zero disables the overlay. |
| `width` | Inward stroke width in output pixels, rounded down and clamped to 0–8; default 2. Zero disables the overlay. |
| `color` | Linear, straight-alpha RGBA; default opaque amber `[1, 0.6, 0.05, 1]`. The overlay premultiplies and blends over destination color. |
| `viewportOrigin` | Top-left destination viewport origin, default `[0, 0]`. Texture pixels map one-to-one to destination pixels. |

`draw(renderPass, options)` encodes one fullscreen triangle and returns whether it drew.
Use a color-preserving render pass with a viewport matching the ID texture's dimensions.
For an offset viewport, also supply its origin. The overlay treats neighbors outside the
ID image as background, so selected regions touching an image boundary receive a border.
It checks up to eight neighboring pixels along each of the four screen axes; corners
follow this four-axis inward-border convention. It does not scale ID textures or draw
silhouettes through occluders.

Submit a draw before changing options on the same outline instance. The outline owns its
model and uniform buffer; `destroy()` releases those resources and never destroys the
borrowed ID texture. Submit the final use before destroying either resource.

The JSON playground captures current channels only while a ray-traced mark is selected.
Selection is retained as a placement ID and re-resolved against each snapshot, so packed
integer reordering does not select a different object. Capturing channels adds a full
primary-ray traversal and allocates 28 bytes per output pixel; the outline adds one
fullscreen draw with bounded texture lookups. Use
[`DepthTextureCopy`](./depth-texture-copy.md) with the snapshot's projected depth for raster
overlay occlusion. Raster ID production remains separate work.
