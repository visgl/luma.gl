# lights (Shader Module)

The `lights`` shader module collects uniforms describing the lights in a scene.
No view dependent uniforms are includes so the resulting uniform block should be reusable for all draw calls in a scene.

## Material modules

Actual lighting computations are done by the various material shader modules, such as:

- `phongMaterial`
- `goraudmaterial`
- `pbrMaterial`

Different draw calls can use different material uniform buffers and/or different material modules.

All material modules depend on this lighting module and base lighting calculations
on the lights defined by this module, meaning that the same lighting uniform buffer can be
bound.

## Defining lights

The lights module lets the application define the ambient light color and a number of additional lights that can either be point lights (e.g, a light bulb) or directional lights (e.g. sunlight).

