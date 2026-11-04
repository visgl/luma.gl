# Metallic

Metallic controls the transition between a dielectric surface, such as plastic, and a conductor, such as bare metal.

## Example[​](#example "Direct link to Example")

### Metallic

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

    metallicRoughnessValues: [1, 0.3]

  }

});
```

## Parameters and textures[​](#parameters-and-textures "Direct link to Parameters and textures")

`metallicRoughnessValues` stores `[metallic, roughness]`, both defaulting to `1`. Metallic ranges from `0` for dielectrics to `1` for conductors and is multiplied by the blue channel of the linear metallic-roughness texture. Metals have no ordinary diffuse lobe; their base color controls specular reflection. Intermediate values are useful at boundaries in a texture.

## Model integration[​](#model-integration "Direct link to Model integration")

Uniform updates do not add shader features or texture resources. The glTF converter supplies the matching defines and bindings when importing these material inputs.

## Related capabilities[​](#related-capabilities "Direct link to Related capabilities")

* [Base Color](https://luma.gl/docs/api-guide/engine/features/base-color.md)
* [Roughness](https://luma.gl/docs/api-guide/engine/features/roughness.md)
* [Specular](https://luma.gl/docs/api-guide/engine/features/specular.md)

See [Textures and UV coordinates](https://luma.gl/docs/api-guide/engine/features/texture-coordinates.md) for binding names, map enablement, and color handling.
