# Material

A material instance contains data that is used to populate uniforms for a specific shader stack

See the developer-guide for more information about materials



## Properties

### doubleSided : Boolean

The `doubleSided` property specifies whether the material is double sided. When this value is false, back-face culling is enabled. When this value is true, back-face culling is disabled and double sided lighting is enabled. The back-face must have its normals reversed before the lighting equation is evaluated.


### alphaMode : Enum

The `alphaMode` property defines how the alpha value of the main factor and texture should be interpreted.

`alphaMode` can be one of the following values:
* `OPAQUE` - The rendered output is fully opaque and any alpha value is ignored.
* `MASK` - The rendered output is either fully opaque or fully transparent depending on the alpha value and the specified alpha cutoff value. This mode is used to simulate geometry such as tree leaves or wire fences.
* `BLEND` - The rendered output is combined with the background using the normal painting operation (i.e. the Porter and Duff over operator). This mode is used to simulate geometry such as guaze cloth or animal fur.

> The `alpha` value itself is typically defined in the `baseColor` prop, e.g. for the for metallic-roughness material model.


### alphaCutoff : Number

When `alphaMode` is set to `MASK` the `alphaCutoff` property specifies the cutoff threshold. If the alpha value is greater than or equal to the `alphaCutoff` value then it is rendered as fully opaque, otherwise, it is rendered as fully transparent. `alphaCutoff` value is ignored for other modes.


### normalMap: Texture2D \| Sampler2D

A tangent space normal map. Used to increase apparent detail of geometry.


### normalMapScale : Number

Scale of normal map


### normalMapCoords : Number

Set of texture coords to use for normal map


### occlusionMap: Texture2D \| Sampler2D

A tangent space occlusion map. Used to indicate areas of indirect lighting, shading e.g. corners etc.


### occlusionMapScale : Number

Scale of occlusion map


### occlusionMapCoords : Number

Set of texture coords to use for occlusion map


### emissiveMap: Texture2D \| Sampler2D

A tangent space emissive map. Used to add lights to models. For example, the headlights of a car model.


### emissiveMapScale : Number

Scale of emissive map


### emissiveMapCoords : Number

Set of texture coords to use for emissive map





### Metallic-Roughness Material Model

All parameters related to the metallic-roughness material model are defined under the `pbrMetallicRoughness` property of `material` object. The following example shows how a material like gold can be defined using the metallic-roughness parameters:

```json
{
    "baseColor": [ 1.000, 0.766, 0.336, 1.0 ],
    "metallic": 1.0,
    "roughness": 0.0,
    "baseColorMap": null,
    "metallicRoughnessMap": null,
}
```

The metallic-roughness material model is defined by the following properties:


### `baseColor` : Number

The base color of the material. The base color has two different interpretations depending on the value of metalness. When the material is a metal, the base color is the specific measured reflectance value at normal incidence (F0). For a non-metal the base color represents the reflected diffuse color of the material. In this model it is not possible to specify a F0 value for non-metals, and a linear value of 4% (0.04) is used.


### `metallic` : Number

The metalness of the material


### `roughness` : Number

The roughness of the material


### metallicRoughnessTexture

The value for each property (`baseColor`, `metallic`, `roughness`) can be defined using factors or textures. The `metallic` and `roughness` properties are packed together in a single texture called `metallicRoughnessTexture`.

```json
{
    "pbrMetallicRoughness": {
        "baseColor": [ 0.5, 0.5, 0.5, 1.0 ],
        "baseColorMap": null,
        "baseColorMapCoords": 1,
        "metallic": 1,
        "roughness": 1,
        "metallicRoughnessMap": null,
        "metallicRoughnessMapScale": 1,
        "metallicRoughnessMapCoords": 1,
    },
}
```

If a texture is not given, all respective texture components within this material model are assumed to have a value of `1.0`. If both factors and textures are present the factor value acts as a linear multiplier for the corresponding texture values. The `baseColorTexture` is in sRGB space and must be converted to linear space before it is used for any computations.
