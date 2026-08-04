# loadImageBitmap

[DynamicBuffer](https://luma.gl/next/docs/api-reference/engine/dynamic-buffer.md)[DynamicTexture](https://luma.gl/next/docs/api-reference/engine/dynamic-texture.md)[VideoTexture](https://luma.gl/next/docs/api-reference/engine/video-texture.md)[loadImageBitmap](https://luma.gl/next/docs/api-reference/engine/load-image-bitmap.md)

A simple small utility to load images from URLs. The loaded `ImageBitmaps` can be used to create textures.

## Usage[​](#usage "Direct link to Usage")

```
import {loadImageBitmap} from `@luma.gl/engine`;

const imageBitmap = await loadImageBitmap(url);
```

## Functions[​](#functions "Direct link to Functions")

### `loadImageBitmap()`[​](#loadimagebitmap-1 "Direct link to loadimagebitmap-1")

```
loadImageBitmap(url: string, options? : {crossOrigin?: string}): ImageBitmap
```

A basic image loading function for loading a single image (or an array of mipmap images representing a single image).

* `url`: The url for each image, it is called for each image with the `lod` of that image.
* `options.crossOrigin`: Defaults to `'anonymous'`.

Returns:

* `ImageBitmap` the loaded image

## Remarks[​](#remarks "Direct link to Remarks")

* The `@loaders.gl/textures` module provides a range of more capable texture loaders for additional compressed and super-compressed texture formats, texture cubes, composite textures etc.
