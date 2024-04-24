# Shader Modules

## Uniform Blocks

Shader modules are built around a set of well-defined uniform interface blocks.

| Interface Block    | Binding (Group) | Description                                                                           | Usage                                                                 |
| ------------------ | --------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **project**        | 0 (0)           | camera world position, view and projection matrices                                   | Usually static for a view render cycle                                |
| **lighting**       | 1 (0)           | ambient light color, directional light array, point light color array                 | Usually static for a scene                                            |
| **material**       | 2 (1)           | PBR parameters, base color, ...                                                       | Uniform buffer can be pre-calculated for each material and swapped in |
| **postprocessing** | 3               | parameters for current post processing effect (often independent of other interfaces) |

This helps respect the limited budget for uniform blocks.

## Shader Passes

It is possible to package up many typical screen-space post-processing steps as a shader module.

Sometimes a pass needs to be run several times with some internal uniform changed. This can be described
by adding the `passes` field to a shader module.

### Defining your own Shader Modules

It is critical that the order and types of declarations of uniforms match those in the shader.
