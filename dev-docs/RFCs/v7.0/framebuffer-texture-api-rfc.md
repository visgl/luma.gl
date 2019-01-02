# RFC: Framebuffer/Texture Methods as Global Functions

* **Author**: Ib Green
* **Date**: Dec, 2018
* **Status**: **Draft**


## Summary

This RFC proposed to move a number of blit and copy related functions from the `Framebuffer` and `Texture` classes into global functions to ensure that they can be tree-shaken out of applications that don't use them.


## Background

A not insignificant part of the RAW WebGL API consists of methods to copy and blit between textures and framebuffers. This jungle of functions are hard to discover and use for the typical user, yet they are an important part of the WebGL toolbox.

To simplify usage of these functions, luma.gl has religiously added wrappers of these functions to the Framebuffer and Texture classes.

The problem is that:
* these functions add considerable code size to these classes.
* many simpler applications don't use these methods, even if almost all applications use Framebuffers and thus textures.
* luma.gl relies on tree-shaking to reduce binary size, but methods cannot be tree-shaken.


## Proposals

* The key proposal is to move methods from Framebuffer and Texture into global functions.

> TBD - some work remains to unify the proposal

| Method                         | Replacement |
| ---                            | ---         |
| `Framebuffer.readPixels`       |  `readPixelsToArray` |
| `Framebuffer.readPixelsToBuffer`|  `readPixelsToBuffer` |
| `Frambuffer.copyToDataUrl`     |  `copyToDataUrl` |
| `Frambuffer.copyToImage`       |  `copyToImage` |
| `Frambuffer.copyToTexture`     |  `copyToTexture` |
| `Frambuffer.blit`              |  `blit` |
| `Texture.copyFramebuffer`      |  `copyToTexture` |
| `Texture.setImageData`         |  setTextureImageData |
| `Texture.setSubImageData`      |  setTextureSubImageData |
| `Texture.setImage3D`           |  setImage3D |

* Make all methods that accept `Framebuffer` objects as source or target, to accept `Texture` object in addition to `Framebuffer` object. Internally we will implement a utility method to wrap `Texture` object into a `Framebuffer` object.

## Deprecation

All removed methods will be stubbed and emit a deprecation message pointing to the luma.gl upgrade guide.
