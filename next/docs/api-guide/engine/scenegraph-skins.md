# Skins and Skeletal Deformation

A skin binds a mesh to an ordered set of scenegraph nodes. luma.gl's `SkinController` resolves those nodes into a joint-matrix palette for the shared skin shader. The controller works with programmatically constructed hierarchies and imported assets through the same engine API.

## Example[​](#example "Direct link to Example")

### Skeletal skinning

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

0

<!-- -->

s

Scroll page · Ctrl/⌘ + scroll to interact

The authored SimpleSkin animation moves the skeleton while the mesh follows its joint weights. This demonstrates deformation, rather than a physical constraint or rigid-body simulation.

## Create a skin binding[​](#create-a-skin-binding "Direct link to Create a skin binding")

```
import {GroupNode, SkinController} from '@luma.gl/engine';



const meshNode = new GroupNode({id: 'mesh'});

const jointNode = new GroupNode({id: 'joint'});

const scene = new GroupNode({children: [meshNode, jointNode]});

const jointMatrices = new Float32Array(16);

const skins = new SkinController({

  scenes: [scene],

  bindings: [{node: meshNode, joints: [jointNode], jointMatrices, models: []}]

});



jointNode.setPosition([0, 1, 0]).updateMatrix();

skins.update();
```

This small example computes a palette. To deform rendered geometry, populate `models` with the skinned `ModelNode` primitives, supply their joint-index and weight attributes, and use compatible skin shaders. An empty `models` array does not create or draw a mesh.

## Palette and update order[​](#palette-and-update-order "Direct link to Palette and update order")

| `SkinBinding` field   | Responsibility                                                                |
| --------------------- | ----------------------------------------------------------------------------- |
| `node`                | Mesh-owning node whose world transform defines the mesh-local palette space.  |
| `joints`              | Ordered node references matching vertex joint indices.                        |
| `inverseBindMatrices` | Optional packed inverse bind matrices.                                        |
| `jointMatrices`       | Reused `Float32Array`, with 16 components per joint.                          |
| `models`              | Existing primitives receiving the palette through their `skin` shader inputs. |
| `skinJointMatrices`   | Optional buffer or texture transport for larger palettes.                     |

The palette applies `inverse(meshWorld) × jointWorld × inverseBind`. Node references and palette order establish identity; matching display names does not bind a skeleton. Update animated transforms first, call `skins.update()`, then render. `getBinding(meshNode)` retrieves a binding.

Palette calculation currently runs on the CPU. Vertex deformation runs through the GPU skin shader; large palettes can use a WebGPU storage buffer or a WebGL float texture. `skins.destroy()` releases palette transports referenced by its bindings. Share controller ownership carefully so a shared resource is not destroyed twice.

A skinning joint has no implied mass, collider, limit, or motor. See [Physical joints](https://luma.gl/next/docs/api-guide/engine/scenegraph-joints.md) for constraints and [Physics integration](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md) for explicit pose ownership. Physics pose buffers do not automatically update CPU skin palettes.

## Importing skins[​](#importing-skins "Direct link to Importing skins")

The glTF adapter resolves joint indices and inverse bind accessors into engine bindings and exposes `scenegraphs.skins`. Its animator arranges dependent skin updates. The importer owns asset interpretation; `SkinController` owns palette updates. See [glTF animation conversion](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md) for source restrictions.

See [Scenegraphs](https://luma.gl/next/docs/api-guide/engine/scenegraph.md), [Animation](https://luma.gl/next/docs/api-guide/engine/animation.md), and [Morph targets](https://luma.gl/next/docs/api-guide/engine/scenegraph-morphs.md).
