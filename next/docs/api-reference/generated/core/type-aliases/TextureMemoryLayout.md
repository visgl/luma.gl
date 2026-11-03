# Type Alias: TextureMemoryLayout

> **TextureMemoryLayout** = `object`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L99)

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

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L101)

Total length in bytes

***

### bytesPerImage[​](#bytesperimage "Direct link to bytesPerImage")

> **bytesPerImage**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L105)

Stride between successive images (Use when depthOrArrayLayers > 1)

***

### bytesPerPixel[​](#bytesperpixel "Direct link to bytesPerPixel")

> **bytesPerPixel**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L111)

Number of bytes per pixel

***

### bytesPerRow[​](#bytesperrow "Direct link to bytesPerRow")

> **bytesPerRow**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L109)

Number of bytes per row (padded)

***

### depthOrArrayLayers[​](#depthorarraylayers "Direct link to depthOrArrayLayers")

> **depthOrArrayLayers**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L103)

Number of images

***

### rowsPerImage[​](#rowsperimage "Direct link to rowsPerImage")

> **rowsPerImage**: `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L107)

Number of rows per image
