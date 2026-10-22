# Scene controllers

Scene controllers in `@luma.gl/engine` operate on engine nodes, materials, and resolved resource bindings. Applications can construct these inputs directly. glTF is a core supported source: `@luma.gl/gltf` maps its asset records and extensions into the same engine APIs.

| API                   | Inputs                                                                                              | Per-frame operation                                                                              | Ownership                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `SkinController`      | Scenes and `SkinBinding[]` with mesh nodes, joint nodes, inverse bind matrices, and palette storage | `update()` refreshes mesh-local joint palettes and bound model uniforms                          | `destroy()` releases supplied palette GPU transports; model and joint nodes remain caller-owned                 |
| `MaterialVariants`    | Named variants and per-model material/parameter mappings                                            | `selectVariant(name)` or `resetVariant()` changes existing models                                | Materials and models remain caller-owned                                                                        |
| `BillboardController` | Scenes and node orientation bindings                                                                | `getDrawEntries({viewMatrix, cameraId})` returns camera-facing transforms without mutating nodes | `destroy()` clears controller state; nodes remain caller-owned                                                  |
| `AreaLightController` | Scenes and area-light bindings with shape, width, height, color, and intensity                      | `getLights(sceneIndex)` resolves visible lights using current transforms                         | `destroy()` clears bindings; nodes remain caller-owned                                                          |
| `AudioController`     | Scene, audio/source/emitter definitions, node bindings, optional processing graphs and environments | `update(listenerMatrix)` updates listener and emitter spatial state                              | The controller owns its processing nodes and sources; the application owns and activates its `BaseAudioContext` |
| `Interactivity`       | Typed operation graphs and a host property adapter                                                  | `start()`, `tick(timeSeconds)`, and host events execute the graph                                | Host properties and scene objects remain caller-owned                                                           |

## Construct engine inputs directly[​](#construct-engine-inputs-directly "Direct link to Construct engine inputs directly")

A rectangle light uses width and height directly. It does not need a source document or extension object:

```
import {AreaLightController, GroupNode} from '@luma.gl/engine';



const lightNode = new GroupNode({position: [0, 3, 0]});

const scene = new GroupNode({children: [lightNode]});

const lights = new AreaLightController({

  scenes: [scene],

  bindings: [{

    node: lightNode,

    definition: {type: 'rect', width: 4, height: 2, intensity: 1000}

  }]

});



// After updating animated node transforms, pass these to your lighting shader inputs.

const currentLights = lights.getLights();
```

`BillboardOrientation.rotationAxis` accepts `'all'` or `'y'`. `MaterialVariants` accepts explicit `ModelNode` bindings, avoiding source-specific metadata lookups. `SkinController.getBinding(node)` uses the resolved mesh node rather than an asset index.

## Supporting audio APIs[​](#supporting-audio-apis "Direct link to Supporting audio APIs")

`AudioGraph` constructs processing nodes and connects scheduled sources to borrowed emitter inputs. `AudioReverbBus`, `createParametricAudioResponse()`, and `selectAudioEnvironmentZone()` provide reusable reverb and spatial-zone behavior. They do not load glTF documents.

The audio context must be resumed from a user gesture before realtime playback. `AudioController.initialize()` fetches and decodes resources, `play()` starts sources, `stop()` stops playback, and `destroy()` releases owned processing resources. Audio is opt-in and independent of the graphics backend.

## glTF mapping[​](#gltf-mapping "Direct link to glTF mapping")

`createScenegraphsFromGLTF()` returns engine `skins` and `variants` controllers automatically. Optional features use parsers that return engine construction props:

```
import {AreaLightController, AudioController, BillboardController} from '@luma.gl/engine';

import {parseGLTFAreaLights, parseGLTFAudio, parseGLTFBillboards} from '@luma.gl/gltf';



const areaLights = new AreaLightController(parseGLTFAreaLights(scenegraphs));

const billboards = new BillboardController(parseGLTFBillboards(scenegraphs));

const audio = new AudioController(parseGLTFAudio({

  scenegraphs,

  audioContext,

  baseUrl: modelUrl

}));
```

The parsers resolve extension names, source indices, scene attachments, and embedded buffer views. The engine controllers receive nodes, dimensions, typed graphs, and audio bytes. This keeps loading and source-format interpretation in glTF while runtime behavior belongs to engine.

See the glTF integration references for [billboards](https://luma.gl/docs/api-reference/gltf/gltf-billboard.md), [area lights](https://luma.gl/docs/api-reference/gltf/gltf-area-lights.md), [audio](https://luma.gl/docs/api-reference/gltf/gltf-audio.md), and [native extensions](https://luma.gl/docs/api-reference/gltf/gltf-native-extensions.md) for supported extension profiles and limits.
