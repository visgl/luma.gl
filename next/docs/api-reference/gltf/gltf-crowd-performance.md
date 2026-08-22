# GPU-animated crowd performance and LOD

[Overview](https://luma.gl/next/docs/api-reference/gltf.md)[Materials](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md)[Native Extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-native-extensions.md)[Animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md)[Animated Crowd](https://luma.gl/next/docs/api-reference/gltf/gltf-animated-crowd.md)[Interchange](https://luma.gl/next/docs/api-reference/gltf/gltf-interchange.md)[Extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md)

[Overview](https://luma.gl/next/docs/api-reference/gltf/gltf-animated-crowd.md)[Usage](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-usage.md)[Performance & LOD](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-performance.md)[API](https://luma.gl/next/docs/api-reference/gltf/gltf-crowd-api.md)

## Performance characteristics[​](#performance-characteristics "Direct link to Performance characteristics")

Batching removes repeated draw submission and duplicated immutable GPU resources; it does not eliminate the cost of independently evaluating animations:

* Source parsing, material creation, and geometry allocation happen once per crowd.
* CPU mode evaluates one existing animation mixer per active actor and uploads node transforms, joint palettes, and morph weights.
* Baked GPU mode advances clocks and crossfades on the CPU but samples immutable clip frames, skeletal palettes, rigid transforms, and morph weights in vertex shaders.
* Active transform columns and compact pose data are uploaded once per occupied primitive/detail group.
* Without LOD, the CPU submits one instanced draw per compatible reachable source primitive.
* With LOD, each occupied source-primitive/detail bucket submits one instanced draw; empty buckets submit none.
* Unused fixed-capacity slots are allocated but are not rewritten every frame.

Real performance therefore depends on actor count, source node count, joint count, clip complexity, primitive count, and the number of skinned groups. Measure representative scenes on your target devices instead of assuming that fewer draws imply proportional frame-rate gains.

Prefer `addActors()`, `removeActors()`, and one `crowd.update()` per frame. Avoid rebuilding the crowd when clips change, issuing one `actor.update()` per character, or allocating a capacity that greatly exceeds your actual hardware budget.

Screen-space actor classification, compact bucket assignment, and mesh decimation currently run on the CPU; the resulting instance transforms and pose data are consumed by GPU vertex shaders. Distance-based animation-rate reduction, compute-driven classification, GPU-produced indirect commands, lazy geometry upload, and progressive streaming remain separate potential improvements.

## Screen-space levels of detail[​](#screen-space-levels-of-detail "Direct link to Screen-space levels of detail")

Opt in to detail selection when creating the crowd, then provide the current camera and viewport whenever they change:

```
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';



const crowd = createGLTFAnimatedCrowd(device, gltf, {

  capacity: 100,

  lod: {

    enabled: true,

    autoGenerate: true,

    ratios: [0.5, 0.25],

    preserveBoundary: false,

    screenCoverage: [0.5, 0.2, 0.01],

    hysteresis: 0.1,

    vertexBudget: 12000

  }

});



crowd.update(deltaSeconds, {

  viewMatrix,

  projectionMatrix,

  viewportWidth: canvas.width,

  viewportHeight: canvas.height

});



console.table(crowd.lodStats.levels);

console.log({

  source: crowd.lodStats.source,

  visibleActors: crowd.lodStats.visibleActors,

  culledActors: crowd.lodStats.culledActors,

  instancedDraws: crowd.lodStats.drawCount,

  submittedTriangles: crowd.lodStats.triangles,

  submittedVertices: crowd.lodStats.vertices,

  vertexBudget: crowd.lodStats.vertexBudget,

  demotedActors: crowd.lodStats.demotedActors,

  budgetSatisfied: crowd.lodStats.budgetSatisfied

});
```

If the asset already contains authored `MSFT_lod` nodes, those levels take precedence and `lodStats.source` is `'authored'`. Otherwise `autoGenerate: true` attempts to create lower-detail index buffers and reports `'generated'` when simplification succeeds. Assets that cannot be simplified retain their original geometry and report `'none'`.

| Option or control                         | Meaning                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `lod.enabled`                             | Enables per-actor screen-size classification. Defaults to `false`.                                       |
| `lod.autoGenerate`                        | Derives index-only alternatives when no authored node levels are present.                                |
| `lod.ratios`                              | Descending target index-count ratios, such as `[0.5, 0.25]`.                                             |
| `lod.preserveBoundary`                    | Keeps open mesh-chart boundaries fixed when `true`; generated LOD defaults to `false`.                   |
| `lod.screenCoverage`                      | Optional descending thresholds overriding authored screen-coverage hints.                                |
| `lod.hysteresis`                          | Relative transition dead band; defaults to `0.1`.                                                        |
| `lod.vertexBudget`                        | Optional maximum submitted index references across all visible actors; zero or omission means unlimited. |
| `crowd.update(deltaSeconds, view)`        | Advances animation and applies the current camera in one shared-buffer refresh.                          |
| `crowd.setLODView(view)`                  | Updates camera selection immediately when animation is paused or state changes independently.            |
| `crowd.setLODEnabled(enabled)`            | Toggles prepared levels without recreating actors or changing clips.                                     |
| `crowd.setLODBias(bias)`                  | Positive detail multiplier; larger values retain higher-detail meshes longer.                            |
| `crowd.setLODVertexBudget(vertexBudget?)` | Applies or clears the global indexed-vertex limit and refreshes existing actor buckets immediately.      |
| `crowd.lodStats`                          | Source kind, visibility, draw/triangle/index counts, level histogram, and budget diagnostics.            |

Actor coverage is estimated from the model's bounding sphere, actor placement and maximum axis scale, camera-space distance, projection scale, and viewport shape. Offscreen actors, actors behind the camera, and actors smaller than the lowest coverage threshold are excluded. Hysteresis prevents minor camera movement from repeatedly switching actors across a threshold.

For example, a one-primitive asset with three mesh levels and actors in every bucket submits three instanced draws rather than one; 100 actors still do not create 100 draw calls:

```
near actors   → LOD 0 → original indices      → one shared instanced draw

middle actors → LOD 1 → fewer indices         → one shared instanced draw

far actors    → LOD 2 → fewest indices        → one shared instanced draw

tiny actors   → culled                        → no draw
```

Each bucket preserves the selected actor's original animation hierarchy, clip, phase, world placement, and skin pose. Actor identities do not change when the camera moves between buckets.

### Keep visible geometry within a global vertex budget[​](#keep-visible-geometry-within-a-global-vertex-budget "Direct link to Keep visible geometry within a global vertex budget")

Screen coverage selects the appropriate detail for each individual actor, but many individually reasonable actors can still exceed a frame's aggregate geometry budget. Set `lod.vertexBudget` to redistribute detail across the entire crowd while preserving every visible character:

```
const crowd = createGLTFAnimatedCrowd(device, gltf, {

  capacity: 100,

  lod: {

    enabled: true,

    autoGenerate: true,

    ratios: [0.5, 0.25],

    vertexBudget: 12000

  }

});



crowd.addActors(actorOptions);

crowd.update(deltaSeconds, {

  viewMatrix,

  projectionMatrix,

  viewportWidth: canvas.width,

  viewportHeight: canvas.height

});



const {vertices, vertexBudget, demotedActors, budgetSatisfied, visibleActors} = crowd.lodStats;

console.log({vertices, vertexBudget, demotedActors, budgetSatisfied, visibleActors});



crowd.setLODVertexBudget(6000); // Reclassify and upload once immediately.

crowd.setLODVertexBudget(0); // Disable the limit without removing actors or LOD levels.
```

Here **vertices means submitted index references**, not distinct positions in the source mesh:

```
submitted vertices = sum over visible actors and their selected source primitives

                     of that primitive's index count at the chosen detail level
```

A triangle-list primitive with 600 indices contributes 600 submitted vertices, or 200 submitted triangles, for **each actor** using that level. Repeated references are counted intentionally: the limit estimates indexed draw work across instances rather than immutable vertex-buffer size. It is not a promise about exact GPU vertex-shader invocation counts, which also depend on hardware post-transform caching, nor is it a memory-allocation budget.

The selection policy is deterministic:

1. Classify and cull actors using their ordinary projected screen coverage and hysteresis.
2. Add the selected index counts for every source primitive belonging to every visible actor.
3. If the total exceeds the configured limit, demote the actor with the smallest projected coverage first, changing all of that character's compatible source primitives together.
4. Continue toward lower prepared levels, resolving equal coverage in stable actor insertion order, until the budget is satisfied or every eligible actor is already at minimum detail.

This policy protects nearer, larger characters before reducing distant ones. A 19-primitive character is charged for all 19 source primitives, not treated as one mesh. Independent clips, joint palettes, placement, and actor identities remain intact; budget-only demotions do not overwrite the screen-size hysteresis state used when the limit is relaxed.

An impossibly small budget **never hides actors to manufacture success**. Existing frustum and minimum-screen-size culling still apply, but actors that remain visible stay visible at their lowest available detail. In that case `lodStats.vertices` can exceed `lodStats.vertexBudget`, and `lodStats.budgetSatisfied` is `false`. Increase the limit, supply more effective lower-detail levels, or reduce the number of visible actors yourself.

The limit is opt-in and applies only while crowd LOD is enabled. An omitted, `undefined`, or zero budget is unlimited; `lodStats.vertexBudget` is then absent and normal screen-coverage selection is unchanged. `lodStats.demotedActors` counts actors reduced below their preferred screen-space level, not the number of primitive groups or individual level transitions.

Budgeting remains CPU-side and does not require GPU readback. Per-level primitive costs are prepared once for the crowd, visible actors are sorted by projected coverage, and selected levels reuse the existing single packed-buffer upload. For `A` visible actors, `P` source primitive groups, and `L` detail levels, preparation costs `O(P × L)` once, followed by approximately `O(A × log(A) + A × L)` when a refresh needs budget-driven demotion. Independent CPU animation and skin-palette preparation can still dominate large crowds.

### Automatic index-only mesh decimation[​](#automatic-index-only-mesh-decimation "Direct link to Automatic index-only mesh decimation")

Automatic levels use the reusable `simplifyMesh()` function from `@luma.gl/engine`. The dependency-free simplifier performs deterministic, quadric-error edge collapses while retaining existing vertex endpoints. It protects triangle orientation and categorical joint assignments, and considers available normal, texture-coordinate, and skin-weight data. The standalone helper preserves open mesh boundaries by default:

```
import {simplifyMesh} from '@luma.gl/engine';



const result = simplifyMesh({

  positions: sourcePositions,

  indices: sourceIndices,

  targetRatio: 0.5,

  attributes: [{values: sourceTextureCoordinates, size: 2}],

  preserveBoundary: true

});



console.log(result.indices.length, result.geometricError);
```

The resulting index array keeps the source `Uint8Array`, `Uint16Array`, or `Uint32Array` type and references the original vertices. Position, normal, UV, joint, weight, material, and morph accessors remain unchanged. Conservative boundary or skinning constraints can prevent reaching an exact requested ratio; no invalid geometry is synthesized merely to satisfy a target.

Automatic crowd generation defaults to `preserveBoundary: false` because production character meshes often split hard normals and UV charts into independent boundaries; preserving all of those chart edges can prevent meaningful decimation. Enable `lod.preserveBoundary` when open silhouette or chart-boundary fidelity is more important than reaching lower triangle counts. Joint-domain protection, unchanged source attributes, and triangle-orientation checks remain active in either mode.

For explicit document preparation, use `generateGLTFLODLevels()`:

```
import {generateGLTFLODLevels, getGLTFNodeLODs} from '@luma.gl/gltf';



const prepared = generateGLTFLODLevels(gltf, {

  ratios: [0.5, 0.25],

  screenCoverage: [0.5, 0.2, 0.01],

  preserveBoundary: false

});



const levels = getGLTFNodeLODs(prepared, 0);

console.table(

  levels?.map(level => ({

    level: level.level,

    nodeIndex: level.nodeIndex,

    screenCoverage: level.screenCoverage,

    indices: level.node.mesh?.primitives[0]?.indices?.count

  }))

);
```

The source document is not mutated. Lower-detail nodes remain detached alternatives and reuse the original postprocessed vertex accessors, materials, skin references, and animation tracks. Prepared render levels still own their normal GPU models and instance resources; index-only source sharing does not imply lazy GPU upload or zero additional GPU memory.

### Authored `MSFT_lod` assets[​](#authored-msft_lod-assets "Direct link to authored-msft_lod-assets")

The Microsoft vendor extension `MSFT_lod` can describe multiple geometry levels on the highest quality glTF node:

```
{

  "mesh": 0,

  "skin": 0,

  "extensions": {

    "MSFT_lod": {

      "ids": [3, 4]

    }

  },

  "extras": {

    "MSFT_screencoverage": [0.5, 0.2, 0.01]

  }

}
```

The extension references progressively lower-detail node indices. Its optional `MSFT_screencoverage` values are authored hints, including the highest-quality level. It is a Microsoft vendor extension, not a Khronos-ratified core LOD standard.

The repository includes two complementary fixtures:

* `SimpleSkinLOD.gltf` is a 5.5 KB CC0 derivative of Marco Hutter's Simple Skin sample. It preserves one animation, a two-joint skeleton, and shared joint attributes across three mesh levels containing 24, 12, and 6 indices. The Animation Studio includes this animated asset in the model selector and under its `MSFT_lod` extension filter.
* `msft-lod.gltf` is an unmodified Apache-2.0 Babylon.js interoperability fixture. Its static three-level model contains 5,796, 324, and 36 indices. It is retained for reference and testing, and is intentionally excluded from the Studio's animation-only model menu.

The ordinary scenegraph and crowds without `lod` configured retain highest-detail fallback. An opted-in crowd resolves authored alternatives with `getGLTFNodeLODs()`, selects each actor's level from projected coverage, and submits one draw per occupied source-primitive/detail bucket. Detached lower-detail meshes reuse the highest-detail node's animation and skin binding rather than incorrectly evaluating their own detached hierarchy.

`getGLTFExtensionSupport()` reports `MSFT_lod` as `parsed-and-wired`, so strict extension validation accepts supported node-level LOD assets. Material-level LOD, GPU-compute classification, indirect drawing, progressive transfer, and lazy resource creation are not implemented.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPU-animated glTF crowds](https://luma.gl/next/docs/api-reference/gltf/gltf-animated-crowd.md)
* [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md)
* [glTF overview](https://luma.gl/next/docs/api-reference/gltf.md)
