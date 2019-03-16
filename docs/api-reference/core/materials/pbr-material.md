# PBRMaterial

Implements the PBR (Physically-Based Rendering) material system specified in the core glTF standard. The metallic-roughness material model specified in the glTF2 standard enables glTF files to be rendered consistently across platforms.

> glTF extensions that influence the material model are not currently supported.

References:

* This page draws a lot of content from [glTF 2.0 Materials section](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#materials).


## Extends Material

`PBRMaterial` implements the common recommended material properties recommended in the base `Material` class.


### Metallic-Roughness Material Model

All parameters related to the metallic-roughness material model are defined under the `pbrMetallicRoughness` property of `material` object. The following example shows how a material like gold can be defined using the metallic-roughness parameters:

```json
{
    "baseColor": [ 1.000, 0.766, 0.336, 1.0 ],
    "metallic": 1.0,
    "roughness": 0.0,
    "baseColorTexture": null,
    "metallicRoughnessTexture": null,
}
```

The metallic-roughness material model is defined by the following properties:
* `baseColor` - The base color of the material
* `metallic` - The metalness of the material
* `roughness` - The roughness of the material

The base color has two different interpretations depending on the value of metalness. When the material is a metal, the base color is the specific measured reflectance value at normal incidence (F0). For a non-metal the base color represents the reflected diffuse color of the material. In this model it is not possible to specify a F0 value for non-metals, and a linear value of 4% (0.04) is used.

The value for each property (`baseColor`, `metallic`, `roughness`) can be defined using factors or textures. The `metallic` and `roughness` properties are packed together in a single texture called `metallicRoughnessTexture`. 

```json
{
    "pbrMetallicRoughness": {
        "baseColor": [ 0.5, 0.5, 0.5, 1.0 ],
        "baseColorTexture": null,
        "baseColorTextureCoord": 1,
        "metallic": 1,
        "roughness": 1,
        "metallicRoughnessTexture": null,
        "metallicRoughnessTexture": null,
        "metallicRoughnessTextureCoord": 1,
    },
}
```

If a texture is not given, all respective texture components within this material model are assumed to have a value of `1.0`. If both factors and textures are present the factor value acts as a linear multiplier for the corresponding texture values. The `baseColorTexture` is in sRGB space and must be converted to linear space before it is used for any computations.

For example, assume a value of `[0.9, 0.5, 0.3, 1.0]` in linear space is obtained from an RGBA `baseColorTexture`, and assume that `baseColorFactor` is given as `[0.2, 1.0, 0.7, 1.0]`.
Then, the result would be
```
[0.9 * 0.2, 0.5 * 1.0, 0.3 * 0.7, 1.0 * 1.0] = [0.18, 0.5, 0.21, 1.0]
```

### Calculating Reflectance

The following equations show how to calculate bidirectional reflectance distribution function (BRDF) inputs (*c<sub>diff</sub>*, *F<sub>0</sub>*, *&alpha;*) from the metallic-roughness material properties. In addition to the material properties, if a primitive specifies a vertex color using the attribute semantic property `COLOR_0`, then this value acts as an additional linear multiplier to `baseColor`.

`const dielectricSpecular = rgb(0.04, 0.04, 0.04)`
<br>
`const black = rgb(0, 0, 0)`

*c<sub>diff</sub>* = `lerp(baseColor.rgb * (1 - dielectricSpecular.r), black, metallic)`
<br>
*F<sub>0</sub>* = `lerp(dieletricSpecular, baseColor.rgb, metallic)`
<br>
*&alpha;* = `roughness ^ 2`


