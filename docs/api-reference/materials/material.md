# Material

The `Material` class is the base class of materials. It is recommended that all materials implemente the following properties however you will need to check the documentation of each material:


## Common Materials Properties

| Property      | Default  | Comments |
| ---           | ---      | ---      |
| `doubleSided` | `false`  | |
| `alphaMode`   | `OPAQUE` | `OPAQUE`, `MASK` OR `BLEND` |

### Common Materials Maps

| Property              | Default  | Comments |
| ---                   | ---      | ---      |
| `normalTexture`       | `null`   | |
| `normalTextureScale`  | `1`      | |
| `normalTextureCoords` | `1`      | |


## Property Descriptions

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

The material definition provides for common maps that can also be used with different material models, including the metallic-roughness material model selected by the core glTF standard.

| Map       | Description                           | Rendering impact when map is not supported  |
|---------- | ----------------------------          | ------------------------------------------- |
| Normal    | A tangent space normal map.           | Geometry will appear less detailed than authored. |
| Occlusion | Indicates areas of indirect lighting. | Model will appear brighter in areas that should be darker. |
| Emissive  | Controls the color and intensity of the light being emitted by the material. | Model with lights will not be lit. For example, the headlights of a car model will be off instead of on. |

Each material map has the following properties:

* A texture (or sampler)
* A scale
* A texture coordinate set


> **Implementation Note:** If an implementation is resource-bound and cannot support all the maps defined it will drop these optional maps from the bottom.
