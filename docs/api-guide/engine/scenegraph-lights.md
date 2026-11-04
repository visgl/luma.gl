# Scenegraph Lights

Scenegraph lighting attaches light definitions to spatial nodes. `AreaLightController` resolves visible rectangle and disk emitters using current node transforms; the shared lighting shaders implement their surface response. Punctual lights use the existing directional, point, and spot light descriptions.

## Example[​](#example "Direct link to Example")

Loading interactive example…

## Construct an area light[​](#construct-an-area-light "Direct link to Construct an area light")

```
import {AreaLightController, GroupNode} from '@luma.gl/engine';



const lightNode = new GroupNode({position: [0, 3, 0]});

const scene = new GroupNode({children: [lightNode]});

const areaLights = new AreaLightController({

  scenes: [scene],

  bindings: [{

    node: lightNode,

    definition: {type: 'rect', width: 4, height: 2, intensity: 1000, color: [1, 1, 1]}

  }]

});



// model uses the compatible shared lighting/PBR shader modules.

model.shaderInputs.setProps({

  lighting: {lights: areaLights.getLights(), useByteColors: false}

});
```

`getLights(sceneIndex)` recomputes current world-space light instances after animation. Invisible branches do not emit. Definitions use normalized linear colors; intensity is luminance in nits. Emitters face local negative Z. Increasing area at fixed luminance increases emitted flux.

The controller borrows scene nodes. Explicit matrix-authored nodes require the matching `matrixAuthored`/`matrixNodes` metadata so orientation can be resolved independently of scale. The shader and renderer must support the returned area-light type; merely attaching a light definition does not add a lighting pass or configure its resources.

## Rendering support[​](#rendering-support "Direct link to Rendering support")

The shared PBR path supports rectangle and disk emitters with bounded direct-light evaluation. LTC resources can accelerate supported lobes; a numerical fallback has a sample-count tradeoff. This path does not provide area-light shadows, indirect bounces, or universal integration across all material families. See [lighting](https://luma.gl/docs/api-reference/shaders/shader-modules/lighting.md) for shader inputs and [glTF area-light conversion](https://luma.gl/docs/api-reference/gltf/gltf-area-lights.md) for importer profile limits.

See [punctual lighting](https://luma.gl/docs/api-guide/engine/features/lighting.md), [Materials](https://luma.gl/docs/api-guide/engine/materials.md), and [Scenegraphs](https://luma.gl/docs/api-guide/engine/scenegraph.md).
