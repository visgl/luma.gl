# lambertMaterial

This `lambertMaterial` shader module provides a diffuse-only matte material
model. It applies Lambert shading per fragment using the shared
[`lighting`](/docs/api-reference/shadertools/shader-modules/lighting) module.
It is the cleanest and cheapest built-in lit material when you do not want
specular highlights.

## Bind Group Convention

`lambertMaterial` currently assigns its uniform block to bind group `3`, the
recommended luma.gl slot for per-material surface state.

## Uniforms

| Uniform | Type | Default | Description |
| --- | --- | --- | --- |
| `unlit` | `i32` | `false` | When enabled, bypasses lighting and returns the incoming surface color. |
| `ambient` | `f32` | `0.35` | Scales the contribution from `lighting.ambientColor`. |
| `diffuse` | `f32` | `0.6` | Scales the diffuse Lambert term for point, spot, and directional lights. |
