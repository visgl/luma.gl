# loadImageBitmap

A simple small utility to load images from URLs. The loaded `ImageBitmaps` can be used to create textures.

## Usage

```typescript
import {loadImageBitmap} from `@luma.gl/engine`;
const imageBitmap = await loadImageBitmap(url);
```

## Functions

### `loadImageBitmap()`

```ts
loadImageBitmap(url: string, options? : {crossOrigin?: string}): ImageBitmap
```
A basic image loading function for loading a single image (or an array of mipmap images representing a single image).

- `url`: The url for each image, it is called for each image with the `lod` of that image.
- `options.crossOrigin`: Defaults to `'anonymous'`.

Returns:

- `ImageBitmap` the loaded image

## Remarks

- The `@loaders.gl/textures` module provides a range of more capable texture loaders for additional compressed and super-compressed texture formats, texture cubes, composite textures etc.