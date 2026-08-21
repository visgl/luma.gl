# ANARI Animation and glTF Integration

`@luma.gl/scene/gltf` is an optional entry point that projects glTF-owned animation data onto
retained ANARI objects. It reuses `@luma.gl/gltf` parsing and the shared `@luma.gl/engine`
animation mixer; the ordinary `@luma.gl/scene` entry point does not import a glTF loader or own a
second animation runtime.

:::caution[Experimental optional adapter]
`@luma.gl/scene` is a published experimental package. Import the `/gltf` subpath only
when glTF animation integration is needed and `@luma.gl/gltf` is available.
:::

## Optional entry-point exports

```ts
import {
  makeANARIAnimationClipsFromGLTF,
  makeANARIAnimationDataFromGLTF,
  makeANARIAnimationScene
} from '@luma.gl/scene/gltf';

import type {
  ANARIAnimationBindings,
  ANARIAnimationSceneHandle,
  ANARIGLTFAnimationMappings
} from '@luma.gl/scene/gltf';
```

- `makeANARIAnimationClipsFromGLTF(animations, mappings?)` converts already-decoded glTF clips
  into JSON-compatible retained tracks.
- `makeANARIAnimationDataFromGLTF(scenegraphs, mappings?)` extracts retained source-node
  hierarchy, decoded clips, initial morph weights, and playback defaults from a
  `GLTFScenegraphs` bundle.
- `makeANARIAnimationScene(description, bindings)` binds a retained scene description to existing
  objects and returns shared mixer/playback controls.

None of these functions reads a `.gltf` or `.glb` file. Load/postprocess the asset with
`@loaders.gl/gltf`; decode source animation channels through `@luma.gl/gltf`.

## Bind a retained animated scene

```ts
import {makeANARIAnimationDataFromGLTF, makeANARIAnimationScene} from '@luma.gl/scene/gltf';

const animationData = makeANARIAnimationDataFromGLTF(scenegraphs, {
  instanceIdentifiers: {
    CharacterNode: ['character-instance']
  },
  geometryIdentifiers: {
    CharacterNode: ['character-geometry']
  },
  materialIdentifiers: ['character-material']
});

const animations = makeANARIAnimationScene(animationData, {
  instances: new Map([['character-instance', instance]]),
  geometries: new Map([['character-geometry', geometry]]),
  materials: new Map([['character-material', material]]),
  samplers: new Map([['base-color-sampler', sampler]])
});

function renderFrame(timeMilliseconds: number): void {
  animations.update(timeMilliseconds / 1000);
  frame.render();
  graphicsDevice.submit();
  requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);
```

`animations.update(timeSeconds)` takes an **absolute, monotonically increasing time in seconds**;
it computes the elapsed mixer delta internally. This differs from `GLTFAnimator.setTime()`, which
accepts absolute **milliseconds**, and direct `AnimationMixer.update()`, which accepts a delta in
**seconds**.

Retained objects remain caller-owned. All changes targeting one retained object during a frame are
staged together and committed once.

## Playback controls

```ts
console.log(animations.clipNames);

animations.selectClip('Walk');
animations.play();
animations.setSpeed(1.5);
animations.pause();
animations.seek(0.75);
```

The `ANARIAnimationSceneHandle` exposes `clipNames`, `activeClip`, `update()`, `selectClip()`,
`play()`, `pause()`, `seek()`, `setSpeed()`, and the existing engine `mixer`.

Loop behavior can be declared as `once`, `repeat`, or `ping-pong`; negative playback speed enables
reverse traversal. Access `animations.mixer` for shared-engine action weights, blending, and
crossfades. See the [engine animation guide](/docs/api-guide/engine/animation) and
[AnimationMixer API reference](/docs/api-reference/engine/animation/animation-mixer).

## Retained JSON hierarchy and clips

```json
{
  "nodes": {
    "character": {
      "translation": [0, 0, 0],
      "weights": [0],
      "instances": ["character-instance"],
      "geometries": ["character-geometry"]
    },
    "hand": {
      "parent": "character",
      "translation": [0, 1, 0],
      "instances": ["hand-instance"]
    }
  },
  "clips": [
    {
      "name": "Expression",
      "tracks": [
        {
          "target": {
            "type": "node",
            "identifier": "character",
            "path": "weights"
          },
          "times": [0, 0.5, 1],
          "values": [[0], [1], [0]],
          "interpolation": "LINEAR"
        }
      ]
    }
  ],
  "playback": {
    "clip": "Expression",
    "playing": true,
    "speed": 1,
    "loop": "repeat"
  }
}
```

Node transforms preserve hierarchy, including meshless parent nodes. Instance placements inherit
parent transforms; shared surface reuse and renderer instancing are preserved. Morph-weight tracks
update only the retained geometries listed by their source node, keeping shared-mesh instances
independent.

## Supported animation targets

| Target type | Supported uses |
| --- | --- |
| `node` | Translation, rotation, scale, and morph `weights`. |
| `instance` | Retained instance transform values. |
| `material` | Supported PBR scalar/vector factors and alpha cutoff. |
| `sampler` | Retained UV transform offset, rotation, and scale. |
| `light` | Caller-declared retained light properties. |
| `camera` | Caller-declared retained camera properties. |

`STEP`, `LINEAR`, and `CUBICSPLINE` interpolation use the shared engine implementation. glTF
`KHR_animation_pointer` translates supported node/material/texture-transform channels; it does not
automatically import arbitrary camera pointers, structural material switches, animated `texCoord`,
or UV sets above `TEXCOORD_1`.

## Morph targets and skins

The showcase importer preserves morph `POSITION`, `NORMAL`, and `TANGENT` deltas, initial
node/mesh weights, and node-local geometry identities. Retained node weight animation updates the
existing mesh vertex data without rebuilding its model.

Source `JOINTS_0` and `WEIGHTS_0` attributes are also preserved, and programmatic surfaces can
use `skin: {jointMatrices}`. The showcase importer does not currently create or animate that joint
palette automatically; complete imported skeletal playback requires application-provided palette
integration. See [ANARI arrays and geometry](/docs/api-reference/scene/anari-geometry).

## Validation

The optional `@luma.gl/scene/schemas` entry point validates animation nodes, targets, tracks,
clips, playback settings, parent relationships, retained references, increasing keyframe times,
and cubic tangent/value/tangent counts. See
[ANARI scene schemas](/docs/api-reference/scene/anari-schemas).
