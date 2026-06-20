# @luma.gl/experimental

`@luma.gl/experimental` publishes incubating luma.gl APIs that are usable by applications but may
change or be removed without the compatibility guarantees applied to stable modules.

Install the package alongside matching luma.gl core, engine, and shadertools versions:

```bash
yarn add @luma.gl/experimental @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

## Order-independent Transparency

- [`ABufferRenderer`](/docs/api-reference/experimental/a-buffer-renderer) captures, sorts, and
  composites per-pixel fragment lists on WebGPU. It offers the most accurate result but consumes
  bounded storage and performs per-pixel sorting.
- [`WBOITRenderer`](/docs/api-reference/experimental/wboit-renderer) accumulates weighted color and
  revealage on WebGPU or WebGL2. It avoids sorting and storage buffers, but the result is
  approximate and requires two translucent geometry passes.

Both renderers leave scene models, shader inputs, command submission, and fallback selection under
application control.

## Packed Pixel Formats

`RGBADecoder` and `TEXTURE_FORMAT_PIXEL_DECODERS` provide the existing experimental helpers for
encoding and decoding packed texture formats.
