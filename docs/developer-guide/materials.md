# Materials

References:

* This page draws a lot of content from [glTF 2.0 Materials section](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#materials).


## Concepts

## Material Models

The material system can support different material models (shader stacks). The core glTF standard uses the metallic-roughness material model, but others can also be used, programmatically or via glTF extensions.


### Default Material

The default material, used when a mesh does not specify a material, is defined to be a material with no properties specified. All the default values of [`material`](#reference-material) apply. Note that this material does not emit light and will be black unless some lighting is present in the scene.


### Point and Line Materials

The glTF specification does not define size and style of non-triangular primitives (such as POINTS or LINES). However, the following recommendations are provided for consistency:

* POINTS and LINES should have widths of 1px in viewport space.
* For LINES with `NORMAL` and `TANGENT` properties, render with standard lighting including normal maps.
* For POINTS or LINES with no `TANGENT` property, render with standard lighting but ignore any normal maps on the material.
* For POINTS or LINES with no `NORMAL` property, don't calculate lighting and instead output the `COLOR` value for each pixel drawn.


## Common Materials Properties

### Double Sided

The `doubleSided` property specifies whether the material is double sided. When this value is false, back-face culling is enabled. When this value is true, back-face culling is disabled and double sided lighting is enabled. The back-face must have its normals reversed before the lighting equation is evaluated.


### Alpha Coverage

The `alpha` value is typically defined in the `baseColor` prop, e.g. for the for metallic-roughness material model.

The `alphaMode` property defines how the alpha value of the main factor and texture should be interpreted.

`alphaMode` can be one of the following values:
* `OPAQUE` - The rendered output is fully opaque and any alpha value is ignored.
* `MASK` - The rendered output is either fully opaque or fully transparent depending on the alpha value and the specified alpha cutoff value. This mode is used to simulate geometry such as tree leaves or wire fences.
* `BLEND` - The rendered output is combined with the background using the normal painting operation (i.e. the Porter and Duff over operator). This mode is used to simulate geometry such as guaze cloth or animal fur.

 When `alphaMode` is set to `MASK` the `alphaCutoff` property specifies the cutoff threshold. If the alpha value is greater than or equal to the `alphaCutoff` value then it is rendered as fully opaque, otherwise, it is rendered as fully transparent. `alphaCutoff` value is ignored for other modes.

>**Implementation Note for Real-Time Rasterizers:** Real-time rasterizers typically use depth buffers and mesh sorting to support alpha modes. The following describe the expected behavior for these types of renderers.
>* `OPAQUE` - A depth value is written for every pixel and mesh sorting is not required for correct output.
>* `MASK` - A depth value is not written for a pixel that is discarded after the alpha test. A depth value is written for all other pixels. Mesh sorting is not required for correct output.
>* `BLEND` - Support for this mode varies. There is no perfect and fast solution that works for all cases. Implementations should try to achieve the correct blending output for as many situations as possible. Whether depth value is written or whether to sort is up to the implementation. For example, implementations can discard pixels which have zero or close to zero alpha value to avoid sorting issues.



## Common Material Maps

Material maps have the following properties:

* A texture (or sampler)
* A scale
* A texture coordinate set


### Common Material Maps

The material definition provides for common maps that can also be used with different material models, including the metallic-roughness material model selected by the core glTF standard.

| Map       | Description                           | Rendering impact when map is not supported  |
|---------- | ----------------------------          | ------------------------------------------- |
| Normal    | A tangent space normal map.           | Geometry will appear less detailed than authored. |
| Occlusion | Indicates areas of indirect lighting. | Model will appear brighter in areas that should be darker. |
| Emissive  | Controls the color and intensity of the light being emitted by the material. | Model with lights will not be lit. For example, the headlights of a car model will be off instead of on. |

> **Implementation Note:** If an implementation is resource-bound and cannot support all the maps defined it will drop these optional maps from the bottom.


The following examples shows how a normal mao can be added to a material:

```json
{
    "normalTexture": null,
    "normalTextureScale": 2,
    "normalTextureCoords": 1
}
```


### Metallic-Roughness Material Model

The metallic-roughness material model specified in the glTF 2 standard enables glTF files to be rendered consistently across platforms.

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


