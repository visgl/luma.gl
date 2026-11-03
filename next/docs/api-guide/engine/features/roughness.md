# Roughness

Roughness controls the spread of microfacet reflections, from sharp polished highlights to broad matte reflections.

## Example[​](#example "Direct link to Example")

### Roughness

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

The following fields update an existing PBR material; see [Materials guide](https://luma.gl/next/docs/api-guide/engine/materials.md).

```
material.setProps({

  pbrMaterial: {

    metallicRoughnessValues: [0, 0.6]

  }

});
```

## Parameters and textures[​](#parameters-and-textures "Direct link to Parameters and textures")

The second component of `metallicRoughnessValues` is roughness, in `[0, 1]`, with a default of `1`. It is multiplied by the green channel of the linear metallic-roughness texture. Low roughness needs a useful light or environment reflection to remain visible. Roughness does not blur geometry or replace normal mapping.

## Model integration[​](#model-integration "Direct link to Model integration")

Uniform updates do not add shader features or texture resources. The glTF converter supplies the matching defines and bindings when importing these material inputs.

## Related capabilities[​](#related-capabilities "Direct link to Related capabilities")

* [Metallic](https://luma.gl/next/docs/api-guide/engine/features/metallic.md)
* [Normal Mapping](https://luma.gl/next/docs/api-guide/engine/features/normal-mapping.md)
* [Environment Lighting](https://luma.gl/next/docs/api-reference/anari/pbr-environment.md)

See [Textures and UV coordinates](https://luma.gl/next/docs/api-guide/engine/features/texture-coordinates.md) for binding names, map enablement, and color handling.
