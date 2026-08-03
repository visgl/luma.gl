# dirlight

[lighting](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lighting.md)[dirlight](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/dirlight.md)[lambertMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lambert-material.md)[gouraudMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/gouraud-material.md)[phongMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/phong-material.md)[pbrMaterial](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md)

The `dirlight` shader module is a lightweight alternative to the full [`lighting`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lighting.md) module. It applies a single directional-light dot product and is intended for simple materials or examples that do not need multiple light sources.

## Props[​](#props "Direct link to Props")

### `lightDirection?: [number, number, number]`[​](#lightdirection-number-number-number "Direct link to lightdirection-number-number-number")

Direction of the light in world space.

## Usage[​](#usage "Direct link to Usage")

In the vertex shader, pass the transformed normal to the module:

```
dirlight_setNormal(normalize(worldNormal));
```

In the fragment shader, filter the output color:

```
fragColor = dirlight_filterColor(fragColor);
```

## Uniforms[​](#uniforms "Direct link to Uniforms")

```
{
  lightDirection: 'vec3<f32>'
}
```

The default light direction is `[1, 1, 2]`.

## Shader Functions[​](#shader-functions "Direct link to Shader Functions")

### `dirlight_setNormal(normal)`[​](#dirlight_setnormalnormal "Direct link to dirlight_setnormalnormal")

Stores the surface normal for later lighting evaluation.

### `dirlight_filterColor(color)`[​](#dirlight_filtercolorcolor "Direct link to dirlight_filtercolorcolor")

Applies a single directional Lambert-style term to the input color.

## Remarks[​](#remarks "Direct link to Remarks")

* `dirlight` is intentionally simple and does not share the `lighting` module's multi-light uniform layout.
* If you need ambient light, multiple lights, or shared scene lighting across several material modules, use [`lighting`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/lighting.md) instead.
