# Function: writePixel()

> **writePixel**(`dataView`, `bitOffset`, `bitsPerChannel`, `pixel`): `void`

Defined in: [modules/core/src/shadertypes/texture-types/pixel-utils.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/pixel-utils.ts#L125)

Encodes an RGBA pixel into a DataView at a given bit offset according to a specified bit layout.

The channels are written sequentially in the order R, G, B, A. For each channel, the number of bits is taken from the bitsPerChannel array. Channel values are masked to fit within the specified width.

## Parameters[​](#parameters "Direct link to Parameters")

### dataView[​](#dataview "Direct link to dataView")

`DataView`

The DataView into which the pixel will be encoded.

### bitOffset[​](#bitoffset "Direct link to bitOffset")

`number`

The bit offset in the DataView where the pixel should be written.

### bitsPerChannel[​](#bitsperchannel "Direct link to bitsPerChannel")

\[`number`, `number`, `number`, `number`]

A tuple specifying the number of bits for each channel: \[R, G, B, A].

### pixel[​](#pixel "Direct link to pixel")

\[`number`, `number`, `number`, `number`]

A tuple \[r, g, b, a] containing the channel values (as numbers).

## Returns[​](#returns "Direct link to Returns")

`void`

## Example[​](#example "Direct link to Example")

```
Assume you want to encode a pixel into a packed format where:

 - Red uses 5 bits

 - Green uses 6 bits

 - Blue uses 5 bits

 - Alpha is not used (0 bits)

And the pixel format is packed into 16 bits total.



You might have:

 const bitsPerChannel: [number, number, number, number] = [5, 6, 5, 0];

 const pixel: [number, number, number, number] = [15, 31, 15, 0]; // Example values

 const buffer = new ArrayBuffer(2); // 16 bits = 2 bytes

 const dataView = new DataView(buffer);



Now encode the pixel at bit offset 0:

 encodePixel(dataView, 0, bitsPerChannel, pixel);



The dataView now contains the 16-bit packed pixel value in big-endian order.
```
