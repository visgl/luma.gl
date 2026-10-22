# Punctual lighting

Directional, point, and spot lights provide explicit scene illumination with controllable direction, intensity, and color.

The **LightsPunctualLamp** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### LightsPunctualLamp

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## API[​](#api "Direct link to API")

The shared `lighting` shader module accepts `LightingProps`. A compatible model receives scene lighting through `model.shaderInputs.setProps({lighting: ...})`. Directional lights use a direction vector; point and spot lights add position and attenuation controls. Lighting is scene-shared state, separate from material state.

```
import type {LightingProps} from '@luma.gl/shadertools';



const sceneLighting = {

  lights: [

    {type: 'ambient', color: [255, 255, 255], intensity: 0.2},

    {

      type: 'directional',

      color: [255, 240, 220],

      direction: [0.5, -1, 0.3],

      intensity: 1

    }

  ]

} satisfies LightingProps;



// model is a Model whose shader includes lighting.

model.shaderInputs.setProps({lighting: sceneLighting});
```

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_lights_punctual` imports directional, point, and spot lights. `createScenegraphsFromGLTF()` exposes them in `scenegraphs.lights`; supported animation pointers update their properties. Environment lighting is configured separately with `loadPBREnvironment()`; `EXT_lights_image_based` is not handled automatically.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
