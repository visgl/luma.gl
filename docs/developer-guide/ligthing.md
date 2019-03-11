# Lighting

luma.gl allows the application to specify a set of lights. Note that lights do not affect anything on their own. They are interpreted by materials (or more properly by each material models). So you will want to specify both lights and a material to use lighting.

## Specifying Lights

luma.gl specifies a standard set of lights. The intention is that each material model should support these lights, so that meshes rendering using different material models (shader stacks) in the same scene will still be lit in the same way.

All lights have a color. A neutral light would have a white color [255, 255, 255].

Notes:
* material characteristics such as metallicity and roughness may influence how and if the material is affected by lights, in particular ambient light.

### Ambient Light

Ambient light comes from all directions and is useful as base lighting.

### Directional Light

This light has a direction but does not attenuate with distance, it is typically used to represent "infinitely" distant light sources such as the sun.

### Point Light

This light has a position in space and attenuates by distance. It is typically used to represent a smaller light source such as a lamp.


## Using Lights in Scenegraphs

> It is not currently possible to place lights inside a scenegraph. The ability to place lights within the graph is desirable because this way they could follow the transformation of parent nodes. In addition, the expectaion is that lights inside the graph could be auto extracted before each render pass and automatically used as lighting uniforms during that render.


### Other Light Sources

* It may also be possible to specify an emissive map in a material.
* Light maps can be "pre-baked" and add shadows
* Effects like Shadows and SSAO (screen space ambient occlusion) can also affect lighting.


## Specifying Material Models

Niote that lights do not affect anything on their own. They are interpreted by the shader stacks associated with material models.
