# gouraudMaterial

The `gouraudMaterial` shader module provides functions to apply Gouraud shading
with a simple specular model per vertex. It is typically faster than
`phongMaterial`, but highlight quality is lower because lighting is evaluated
at vertices instead of fragments.

## Props

### `specularColor?: [number, number, number]`

Specular highlight color. By default the module preserves the legacy `0..255`
authoring convention for backward compatibility.
Color interpretation is inherited from the shared
[`floatColors`](/Users/ibgreen/code/luma.gl/docs/api-reference/shadertools/shader-modules/float-colors.md)
shader module. By default, `floatColors.useByteColors` is `true`.
