# DepthTextureCopy

`DepthTextureCopy` copies an `r32float` projected-depth texture into a WebGPU render
pass's depth attachment while preserving its color. Raster overlays drawn afterward
can use ordinary depth testing to remain occluded by ray-traced geometry.

```typescript
import {DepthTextureCopy} from '@luma.gl/experimental';

const depthCopy = new DepthTextureCopy(graphicsDevice);
frame.render();
graphicsDevice.submit();
const channels = frame.captureChannels();
if (channels) {
  try {
    const pass = graphicsDevice.beginRenderPass({
      framebuffer, // The same color target used by frame.render(), with a depth attachment.
      clearColor: false,
      clearDepth: 1
    });
    depthCopy.draw(pass, {depthTexture: channels.projectedDepthTexture});
    // Draw raster labels/geometry here using depthCompare: 'less-equal'.
    // Use the same camera, viewport and zero-to-one clip-depth convention.
    pass.end();
    graphicsDevice.submit();
  } finally {
    channels.destroy();
  }
}
// On teardown:
depthCopy.destroy();
```

## draw(renderPass, options)

The destination must have a depth attachment. The source `depthTexture` is borrowed,
sampled `r32float` data containing projected device depth in the range zero to one.
The helper uses unfiltered texel loads, always passes the depth test, writes depth,
and disables color writes. It does not clear attachments or submit GPU commands.

`viewportOrigin` defaults to `[0, 0]`. Set it to the destination viewport's pixel origin
for a source texture corresponding to an inset viewport. Pixels map one-to-one; the
helper does not scale or resample. Pixels outside the source image are discarded,
preserving existing destination depth. Clear destination depth to one when uncovered
regions should represent background.

Submit a draw before changing options on the same helper instance or destroying its
borrowed texture. `destroy()` releases the helper's model and uniform buffer only.

## Ray-traced depth

`ANARIFrame.captureChannels().projectedDepthTexture` captures one centered primary
intersection at full output resolution using the camera of the last rendered frame.
Perspective and orthographic cameras are supported. Background is one; the other
channels still use zero for misses. This depth is independent of radiance sampling,
resolution scaling, and temporal history.

Depth conversion maps the scene camera's OpenGL clip range to WebGPU's zero-to-one
attachment range. Raster overlays must use matching camera matrices with the same
conversion, viewport dimensions, and standard near-zero/far-one depth convention.
Reverse depth and custom depth ranges are not handled automatically. The capture uses
opaque intersections; transparent transport and multisampled edge coverage remain
separate work. The application owns overlay geometry, label layout, target selection,
and command submission. This helper does not modify the temporal radiance history.
