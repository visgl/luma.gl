# Morph-Target Helpers

[Workflow](https://luma.gl/next/docs/api-guide/engine/animation.md)[Mixer](https://luma.gl/next/docs/api-reference/engine/animation/animation-mixer.md)[Morph targets](https://luma.gl/next/docs/api-reference/engine/animation/morph-targets.md)[AnimationLoop](https://luma.gl/next/docs/api-reference/engine/animation-loop.md)[Template](https://luma.gl/next/docs/api-reference/engine/animation-loop-template.md)[KeyFrames](https://luma.gl/next/docs/api-reference/engine/animation/key-frames.md)[Timeline](https://luma.gl/next/docs/api-reference/engine/animation/timeline.md)

`@luma.gl/engine` provides format-independent helpers for weighted vertex deformation. They combine morph-target deltas with immutable base geometry and can update an existing model's GPU vertex buffers in place.

The helpers use canonical mesh attribute semantics: `POSITION`, `NORMAL`, and `TANGENT`.

## Usage[​](#usage "Direct link to Usage")

```
import {applyMorphTargets, type MorphTargetAttributes} from '@luma.gl/engine';



const baseAttributes: MorphTargetAttributes = {

  POSITION: new Float32Array([

    0, 0, 0,

    1, 0, 0,

    0, 1, 0

  ]),

  NORMAL: new Float32Array([

    0, 0, 1,

    0, 0, 1,

    0, 0, 1

  ]),

  TANGENT: new Float32Array([

    1, 0, 0, 1,

    1, 0, 0, 1,

    1, 0, 0, 1

  ])

};



const targets: MorphTargetAttributes[] = [

  {

    POSITION: new Float32Array([

      1, 0, 0,

      0, 0, 0,

      0, 0, 0

    ])

  },

  {

    POSITION: new Float32Array([

      0, 1, 0,

      0, 0, 0,

      0, 0, 0

    ])

  }

];



const attributes = applyMorphTargets(baseAttributes, targets, [0.5, 0.25]);



// attributes.POSITION begins with [0.5, 0.25, 0].

// baseAttributes.POSITION still begins with [0, 0, 0].
```

## MorphTargetAttributes[​](#morphtargetattributes "Direct link to MorphTargetAttributes")

```
type MorphTargetAttributes = {

  POSITION?: Float32Array;

  NORMAL?: Float32Array;

  TANGENT?: Float32Array;

};
```

* `POSITION` — Three components per vertex.
* `NORMAL` — Three components per vertex.
* `TANGENT` — Four components per vertex for base attributes; target deltas normally contain three components per vertex.

All semantics are optional. A target only affects the attributes that it provides and that also exist in the base geometry.

## applyMorphTargets[​](#applymorphtargets "Direct link to applyMorphTargets")

```
function applyMorphTargets(

  baseAttributes: Readonly<MorphTargetAttributes>,

  targets: readonly Readonly<MorphTargetAttributes>[],

  weights: readonly number[]

): MorphTargetAttributes;
```

Returns newly allocated vertex arrays containing the weighted combination:

```
result = base + target[0] * weight[0] + target[1] * weight[1] + ...
```

The input base arrays and target arrays are never modified.

### Parameters[​](#parameters "Direct link to Parameters")

* `baseAttributes` — Immutable bind-pose `POSITION`, `NORMAL`, and `TANGENT` arrays.
* `targets` — Per-target additive attribute deltas.
* `weights` — One numeric weight per target. Targets without a corresponding weight and zero-weight targets do not contribute.

### Normals and Tangents[​](#normals-and-tangents "Direct link to Normals and Tangents")

Resulting `NORMAL` and `TANGENT` direction vectors are normalized after their weighted deltas are added. For tangents, only the `x`, `y`, and `z` components are deformed; the base `w` handedness component is preserved exactly.

Target tangent arrays may contain either three components per vertex or four components per vertex. In both cases, the target's fourth component does not replace the base handedness.

## updateMorphTargetBuffers[​](#updatemorphtargetbuffers "Direct link to updateMorphTargetBuffers")

```
function updateMorphTargetBuffers(

  model: Model,

  geometry: Geometry,

  targets: readonly Readonly<MorphTargetAttributes>[],

  weights: readonly number[]

): void;
```

Updates the existing GPU vertex buffer for an already-created model. Source attributes are read from the provided CPU `Geometry`, combined with the target deltas, and repacked using the geometry's original attribute order and layout.

```
import {

  type Geometry,

  type Model,

  type MorphTargetAttributes,

  updateMorphTargetBuffers

} from '@luma.gl/engine';



function setCharacterExpression(

  model: Model,

  geometry: Geometry,

  targets: MorphTargetAttributes[],

  smileWeight: number,

  blinkWeight: number

): void {

  updateMorphTargetBuffers(model, geometry, targets, [smileWeight, blinkWeight]);

}
```

The operation:

* Preserves the original CPU geometry and all unrelated vertex attributes.
* Preserves canonical source attribute semantics, attribute order, indices, and the existing buffer layout.
* Writes to the model's existing interleaved vertex buffer, with a fallback for separately bound attributes.
* Avoids recreating the model or its render pipeline when only morph weights change.
* Works with both WebGPU and WebGL devices.

### Ownership and Shared Geometry[​](#ownership-and-shared-geometry "Direct link to Ownership and Shared Geometry")

Always provide the original immutable base geometry on every update. Feeding previously morphed results back as the base causes deltas to accumulate across frames.

Morph weights are specific to a model's current vertex buffer. Instances that share one mutable vertex buffer cannot display different weights simultaneously; use distinct model buffers when two instances need independent poses.

## Relationship to Animation[​](#relationship-to-animation "Direct link to Relationship to Animation")

An [`AnimationTrack`](https://luma.gl/next/docs/api-reference/engine/animation/animation-mixer.md) can bind an array of morph weights and call `updateMorphTargetBuffers` from its binding. Asset adapters and higher-level scene renderers already integrate these shared helpers with their own scene objects.

```
const weightTrack = new AnimationTrack({

  name: 'character.weights',

  times: [0, 1],

  values: [

    [0, 0],

    [1, 0.5]

  ],

  binding: {

    id: 'character.weights',

    getValue: () => [0, 0],

    setValue: weights => {

      updateMorphTargetBuffers(model, geometry, targets, weights);

    }

  }

});
```

glTF-specific accessor decoding, morph-target discovery, and animation-channel parsing belong to `@luma.gl/gltf`. The engine helpers only operate on decoded numeric arrays and generic engine geometry.

## Related Documentation[​](#related-documentation "Direct link to Related Documentation")

* [Animation and deformation guide](https://luma.gl/next/docs/api-guide/engine/animation.md)
* [AnimationMixer, clips, tracks, and actions](https://luma.gl/next/docs/api-reference/engine/animation/animation-mixer.md)
* [Geometry](https://luma.gl/next/docs/api-reference/engine/geometry.md)
* [GPUGeometry](https://luma.gl/next/docs/api-reference/engine/geometry/gpu-geometry.md)
