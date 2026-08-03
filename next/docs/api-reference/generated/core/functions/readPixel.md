# Function: readPixel()

> **readPixel**(`pixelData`, `x`, `y`, `bitsPerChannel`): \[`number`, `number`, `number`, `number`]

Defined in: [modules/core/src/shadertypes/texture-types/pixel-utils.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/pixel-utils.ts#L58)

Extracts a single RGBA pixel value from PixelData at the given (x, y) coordinate.

The pixel's data is assumed to be packed according to pixelData.bitsPerChannel. The pixel data for a given row is padded to pixelData.bytesPerRow.

## Parameters[​](#parameters "Direct link to Parameters")

### pixelData[​](#pixeldata "Direct link to pixelData")

[`PixelData`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PixelData.md)

The metadata and data for the pixel buffer.

### x[​](#x "Direct link to x")

`number`

The x coordinate (0-based).

### y[​](#y "Direct link to y")

`number`

The y coordinate (0-based).

### bitsPerChannel[​](#bitsperchannel "Direct link to bitsPerChannel")

\[`number`, `number`, `number`, `number`]

## Returns[​](#returns "Direct link to Returns")

\[`number`, `number`, `number`, `number`]

A tuple \[r, g, b, a] where each channel is the extracted numeric value.

## Example[​](#example "Direct link to Example")

```
Assume you obtained an ArrayBuffer from copyTextureToBuffer and have the following metadata:

 const pixelData: PixelData = {
   bitsPerChannel: [5, 6, 5, 0], // For example, a 16-bit RGB565 format (no alpha)
   width: 800,
   height: 600,
   bytesPerPixel: 2,           // 16 bits per pixel
   bytesPerRow: 1600,          // Assuming no extra padding
   arrayBuffer: myTextureBuffer, // Obtained from copyTextureToBuffer
 };

You can then extract the pixel at (x, y) like so:

 const rgba = extractPixel(pixelData, x, y);
 console.log("Extracted RGBA:", rgba);

For RGBA formats where all channels are present (e.g. [8, 8, 8, 8]), the function will extract a 4-channel pixel value.
```
