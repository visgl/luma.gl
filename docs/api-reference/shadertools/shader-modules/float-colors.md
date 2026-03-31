# floatColors

The `floatColors` shader module provides shared utilities for semantic colors in shader code.
It centralizes byte-to-float normalization and common alpha helpers so applications and shader
modules can reuse one consistent color contract.

## Props

### `useByteColors?: boolean`

When `true`, semantic colors passed through `floatColors_normalize()` are interpreted as
byte-style `0..255` values and divided by `255.0` in shader code. When `false`, semantic
colors are interpreted directly as floats and are returned unchanged.

This is intended for semantic colors only. Raw texel storage such as `Uint8Array` texture
uploads remains byte-oriented.

## Shader Functions

### `floatColors_normalize(vec3 inputColor)`

Normalizes byte-style RGB colors to `0..1` when `useByteColors` is enabled. Float colors pass through.

### `floatColors_normalize(vec4 inputColor)`

Normalizes byte-style RGBA colors to `0..1` when `useByteColors` is enabled. Float colors pass through.

### `floatColors_premultiplyAlpha(vec4 inputColor)`

Returns `vec4(inputColor.rgb * inputColor.a, inputColor.a)`.

### `floatColors_unpremultiplyAlpha(vec4 inputColor)`

Returns the unpremultiplied RGBA color when alpha is greater than zero, otherwise returns transparent black.

## Usage

```ts
import {floatColors, lighting} from '@luma.gl/shadertools';

const shaderInputs = new ShaderInputs({floatColors, lighting});

shaderInputs.setProps({
  floatColors: {useByteColors: false},
  lighting: {
    useByteColors: false,
    lights: [{type: 'ambient', color: [1, 0.9, 0.8], intensity: 0.2}]
  }
});
```

```glsl
vec4 surfaceColor = floatColors_normalize(vec4(255.0, 128.0, 64.0, 255.0));
 surfaceColor = floatColors_premultiplyAlpha(surfaceColor);
```

## Remarks

- `floatColors` is for semantic colors, not packed image data.
- Packed vertex colors still work well with normalized vertex formats such as `unorm8x4`.
- Phase 1 compatibility defaults are preserved on the APIs that adopt `useByteColors`.
