# gouraudMaterial

[lighting](https://luma.gl/docs/api-reference/shadertools/shader-modules/lighting.md)[dirlight](https://luma.gl/docs/api-reference/shadertools/shader-modules/dirlight.md)[lambertMaterial](https://luma.gl/docs/api-reference/shadertools/shader-modules/lambert-material.md)[gouraudMaterial](https://luma.gl/docs/api-reference/shadertools/shader-modules/gouraud-material.md)[phongMaterial](https://luma.gl/docs/api-reference/shadertools/shader-modules/phong-material.md)[pbrMaterial](https://luma.gl/docs/api-reference/shadertools/shader-modules/pbr-material.md)

The `gouraudMaterial` shader module provides functions to apply Gouraud shading with a simple specular model per vertex. It is typically faster than `phongMaterial`, but highlight quality is lower because lighting is evaluated at vertices instead of fragments.

## Props[​](#props "Direct link to Props")

### `specularColor?: [number, number, number]`[​](#specularcolor-number-number-number "Direct link to specularcolor-number-number-number")

Specular highlight color. By default the module preserves the legacy `0..255` authoring convention for backward compatibility. Color interpretation is inherited from the shared [`floatColors`](https://luma.gl/docs/api-reference/shadertools/shader-modules/float-colors.md) shader module. By default, `floatColors.useByteColors` is `true`.
