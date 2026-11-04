# Bump Mapping

Bump mapping derives small normal perturbations from a height texture without moving mesh vertices.

## Example[​](#example "Direct link to Example")

### Bump Mapping

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

0

<!-- -->

s

Scroll page · Ctrl/⌘ + scroll to interact

## Configure the material[​](#configure-the-material "Direct link to Configure the material")

The following fields update an existing PBR material; see [Materials guide](https://luma.gl/docs/api-guide/engine/materials.md).

```
material.setProps({

  pbrMaterial: {

    bumpMapEnabled: true,

    bumpFactor: 0.8

  }

});
```

## Parameters and textures[​](#parameters-and-textures "Direct link to Parameters and textures")

`pbr_bumpSampler` uses a linear red-channel height map, scaled by `bumpFactor`. It composes with normal mapping and has its own UV selection and transform. It changes shading rather than silhouette, geometry, or parallax. The corresponding glTF mapping is experimental; treat it as an evolving interoperability path.

## Model integration[​](#model-integration "Direct link to Model integration")

Bind `pbr_bumpSampler` and enable `HAS_BUMPMAP: true` in the compatible model's `defines`. Uniform updates do not add shader features or texture resources. The glTF converter supplies the matching defines and bindings when importing these material inputs.

## Related capabilities[​](#related-capabilities "Direct link to Related capabilities")

* [Normal Mapping](https://luma.gl/docs/api-guide/engine/features/normal-mapping.md)
* [Textures and UV Coordinates](https://luma.gl/docs/api-guide/engine/features/texture-coordinates.md)

See [Textures and UV coordinates](https://luma.gl/docs/api-guide/engine/features/texture-coordinates.md) for binding names, map enablement, and color handling.
