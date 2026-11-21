# Lighting

[Modules](https://luma.gl/next/docs/tutorials/shader-modules.md)[Injection](https://luma.gl/next/docs/tutorials/shader-injection.md)[Plugins](https://luma.gl/next/docs/tutorials/shader-plugins.md)[Lighting](https://luma.gl/next/docs/tutorials/lighting.md)

A textured cube uses a physically based material and luma.gl's ambient, directional, and spot lights. The lights stay fixed in world space as the cube rotates.

<!-- -->

0

<!-- -->

s

Scroll page · Ctrl/⌘ + scroll to interact

The cube is a `ModelNode` in a `GroupNode`. Its material comes from a `MaterialFactory` configured with the `pbrMaterial` shader module. The example binds the logo as a base-color texture and sets metallic and roughness values to describe a moderately glossy dielectric surface.

Set lights on the model's `ShaderInputs`. Positions and directions use world coordinates. Directional and spot light vectors point along the direction the light travels. Spotlight cone angles are in radians.

```
model.shaderInputs.setProps({

  lighting: {

    useByteColors: false,

    lights: [

      {type: 'ambient', color: [1, 1, 1], intensity: 0.15},

      {

        type: 'spot',

        color: [1, 0.47, 0.04],

        position: [2, 4, 3],

        direction: [-2, -4, -3],

        innerConeAngle: 0.2,

        outerConeAngle: 0.55

      }

    ]

  }

});
```

At draw time, scene traversal supplies the parent transform. Combine it with the mesh's local matrix to get the world transform, then pass that transform, its inverse transpose for normals, the camera position, and the model-view-projection matrix to `pbrProjection`. The shared PBR shader calculates the surface color on WebGL2 and WebGPU.

[Lighting example source](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/lighting)
