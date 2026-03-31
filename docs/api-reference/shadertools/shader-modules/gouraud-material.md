# gouraudMaterial

The `gouraudMaterial` shader module provides functions to apply Gouraud shading
with a simple specular model per vertex. It is typically faster than
`phongMaterial`, but highlight quality is lower because lighting is evaluated
at vertices instead of fragments.

## Props

### `specularColor?: [number, number, number]`

Specular highlight color. By default the module preserves the legacy `0..255`
authoring convention for backward compatibility.

### `useByteColors?: boolean`

When `true`, `specularColor` is interpreted as a byte-style `0..255` color.
When `false`, `specularColor` is interpreted directly as a float color, enabling HDR values above `1`.
