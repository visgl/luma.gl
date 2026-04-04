# phongMaterial

This `phongMaterial` shader module provides functions to apply Phong shading
with a simple specular model per fragment. It is a good default when you want
readable highlights without the cost or complexity of full PBR.

## Props

### `specularColor?: [number, number, number]`

Specular highlight color. By default the module preserves the legacy `0..255`
authoring convention for backward compatibility.
Color interpretation is inherited from the shared
[`floatColors`](./float-colors.md)
shader module. By default, `floatColors.useByteColors` is `true`.
