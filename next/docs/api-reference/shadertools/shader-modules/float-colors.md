# colors, floatColors, and storageColors

The `colors` shader module provides shared utilities for semantic colors in shader code. `floatColors` is the legacy helper-name alias retained for callers that already import `floatColors_*` functions. `storageColors` is the separate WGSL storage-buffer reader for packed RGBA rows.

## Props[​](#props "Direct link to Props")

### `useByteColors?: boolean`[​](#usebytecolors-boolean "Direct link to usebytecolors-boolean")

When `true`, semantic colors passed through `colors_normalize()` or `floatColors_normalize()` are interpreted as byte-style `0..255` values and divided by `255.0` in shader code. When `false`, semantic colors are interpreted directly as floats and are returned unchanged.

This is intended for semantic colors only. Raw texel storage such as `Uint8Array` texture uploads remains byte-oriented.

## Shader Functions[​](#shader-functions "Direct link to Shader Functions")

### `colors_normalize(vec3 inputColor)` / `floatColors_normalize(vec3 inputColor)`[​](#colors_normalizevec3-inputcolor--floatcolors_normalizevec3-inputcolor "Direct link to colors_normalizevec3-inputcolor--floatcolors_normalizevec3-inputcolor")

Normalizes byte-style RGB colors to `0..1` when `useByteColors` is enabled. Float colors pass through.

### `colors_normalize(vec4 inputColor)` / `colors_normalize4(vec4<f32>)`[​](#colors_normalizevec4-inputcolor--colors_normalize4vec4f32 "Direct link to colors_normalizevec4-inputcolor--colors_normalize4vec4f32")

GLSL uses `colors_normalize(vec4)` while WGSL uses `colors_normalize4(vec4<f32>)`. The legacy `floatColors` namespace follows the same GLSL/WGSL naming split. Byte-style RGBA colors normalize to `0..1` when `useByteColors` is enabled. Float colors pass through.

### `colors_premultiplyAlpha(vec4 inputColor)` / `floatColors_premultiplyAlpha(vec4 inputColor)`[​](#colors_premultiplyalphavec4-inputcolor--floatcolors_premultiplyalphavec4-inputcolor "Direct link to colors_premultiplyalphavec4-inputcolor--floatcolors_premultiplyalphavec4-inputcolor")

Returns `vec4(inputColor.rgb * inputColor.a, inputColor.a)`.

### `colors_unpremultiplyAlpha(vec4 inputColor)` / `floatColors_unpremultiplyAlpha(vec4 inputColor)`[​](#colors_unpremultiplyalphavec4-inputcolor--floatcolors_unpremultiplyalphavec4-inputcolor "Direct link to colors_unpremultiplyalphavec4-inputcolor--floatcolors_unpremultiplyalphavec4-inputcolor")

Returns the unpremultiplied RGBA color when alpha is greater than zero, otherwise returns transparent black.

## Usage[​](#usage "Direct link to Usage")

```
import {colors, lighting} from '@luma.gl/shadertools';

const shaderInputs = new ShaderInputs({colors, lighting});

shaderInputs.setProps({
  colors: {useByteColors: false},
  lighting: {
    useByteColors: false,
    lights: [{type: 'ambient', color: [1, 0.9, 0.8], intensity: 0.2}]
  }
});
```

```
var surfaceColor = colors_normalize4(vec4<f32>(255.0, 128.0, 64.0, 255.0));
surfaceColor = colors_premultiplyAlpha(surfaceColor);
```

## Packed Storage Colors[​](#packed-storage-colors "Direct link to Packed Storage Colors")

`storageColors` reads packed read-only storage rows in WGSL. It accepts `rgba8unorm`, `rgba16float`, and `rgba32float` rows, represented by `STORAGE_COLOR_FORMAT` numeric tags plus 4-byte aligned `byteOffset` and `byteStride` props.

```
import {storageColors} from '@luma.gl/shadertools';

const shaderInputs = new ShaderInputs({storageColors});
shaderInputs.setProps({
  storageColors: {
    colorBuffer,
    format: 'rgba8unorm',
    byteStride: 4
  }
});
```

```
let color = storageColors_readColor(instanceIndex);
```

`storageColors_readColor()` returns normalized Float32 RGBA values. The storage reader does not implicitly bind `colors`; include both modules when a shader also needs semantic color normalization helpers.

## Remarks[​](#remarks "Direct link to Remarks")

* `colors` and `floatColors` are for semantic colors, not packed image data.
* `floatColors` preserves legacy helper names; new WGSL code should prefer `colors`.
* `storageColors` is WGSL-only because it reads read-only storage buffers.
* Packed vertex colors still work well with normalized vertex formats such as `unorm8x4`.
* Phase 1 compatibility defaults are preserved on the APIs that adopt `useByteColors`.
