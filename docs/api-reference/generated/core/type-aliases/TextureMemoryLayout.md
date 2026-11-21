# Type Alias: TextureMemoryLayout

> **TextureMemoryLayout** = `object`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L79)

Memory layout for reading/writing data to a texture's memory.

## Note[​](#note "Direct link to Note")

Due to alignment, GPU texture data is typically not contiguous.

## Note[​](#note-1 "Direct link to Note")

GPU texure data must be accessed according to this layout.

* On CPU, only the range of rows that are actually read or written need to be allocated.
* However, space for the full, padded/aligned rows must be allocated in the buffer, even if just a partial horizontal range `{x, width}` is actually read or written.

## Note[​](#note-2 "Direct link to Note")

byteLength = bytesPerRow \* rowsPerImage \* depthOrArrayLayers.

## Properties[​](#properties "Direct link to Properties")

### byteLength[​](#bytelength "Direct link to byteLength")

> **byteLength**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L81)

Total length in bytes

***

### bytesPerImage[​](#bytesperimage "Direct link to bytesPerImage")

> **bytesPerImage**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L85)

Stride between successive images (Use when depthOrArrayLayers > 1)

***

### bytesPerPixel[​](#bytesperpixel "Direct link to bytesPerPixel")

> **bytesPerPixel**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L91)

Number of bytes per pixel

***

### bytesPerRow[​](#bytesperrow "Direct link to bytesPerRow")

> **bytesPerRow**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L89)

Number of bytes per row (padded)

***

### depthOrArrayLayers[​](#depthorarraylayers "Direct link to depthOrArrayLayers")

> **depthOrArrayLayers**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L83)

Number of images

***

### rowsPerImage[​](#rowsperimage "Direct link to rowsPerImage")

> **rowsPerImage**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L87)

Number of rows per image
