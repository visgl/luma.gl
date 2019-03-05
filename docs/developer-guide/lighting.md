# Lighting

Luma.gl supports different shading modules.
To make 


## Light Sources

## Example
You can use the `lighting` example to play with lights.

## Currently supported lighting models
- Phong (Available in the `phong-lighting` module)
- PBR (Available in the `pbr` module)

## Accepting lights in your shader module

### Add dependency on *lighting*
```
export default {
  name: '<YOUR SHADER MODULE>',
  vs, // Vertex Shader
  fs, // Fragment Shader
  defines: {
    LIGHTING_FRAGMENT: 1
    // define LIGHTING_VERTEX instead if you want the light sources there
  },
  dependencies: [lighting]
};
```

### Available uniforms

- `lighting_uAmbientLight`
- `lighting_uPointLight[MAX_LIGHTS]`
- `lighting_uDirectionalLight[MAX_LIGHTS]`
- `lighting_uPointLightCount`
- `lighting_uDirectionalLightCount`
- `lighting_uEnabled`
- Function `getPointLightAttenuation(PointLight pointLight, float distance)`


