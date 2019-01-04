# RFC: glTF2.0 Support in luma.gl

* **Author**: Ib Green
* **Date**: Dec, 2018
* **Status**: **Draft**


References
* [glTF2 standard](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0)
* [glTF2 Poster](https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/figures/gltfOverview-2.0.0a.png)


## Summary

This RFC details how to add glTF support to luma.gl.


## Background

glTF has become a "monster" standard in the 3D world, and is now supported built-in to e.g. Windows Explorer and Facebook Feed.


## Required Features

### More extensive SceneGraph support

luma.gl needs to be able to render a full scenegraph. We have the `Group` and `Model` classes, but we also need a small `Camera` class so that we can position cameras within the hierarchical scene graph for animation purposes.


### Composite Geometry support.

luma v6 only supports primitive geometries in scenegraphs (i.e. the `Model` class which is the `ScenegraphNode` that holds the position can only reference one `Geometry` which is drawn as a single GPU call)
.

We need a `Mesh` consisting of multiple `Geometry` primitives to be able to model what is loaded from glTF.

**NOTE**: The biggest change to luma.gl API will probably be the change of `Model` from holding just one `Geometry` and doing draw calls with that, to referencing a `Mesh` and traversing it to do multiple draw calls.

Impact on instanced model usage.


To manage the fallout, we could:

* Move completely to meshes, which will probably break some deck.gl layers.
* Update `Model` to work on either a `Geometry` or a `Mesh` (adding complexity to the already complex `Model` class).
* Create a separate `MeshModel` class (perhaps in this case we should call the clas `Mesh` and have it reference a `MeshGeometry` or `CompositeGeometry`, although this would deviate more from glTF naming conventions).


### glTFInstantiator class

The GLB envelope is cracked and the high-level glTF structure resolved by loaders.gl. But that is as far as the framework agnostic loaders.gl can go. The resulting tree structure must be traversed transformed into a luma.gl scene graph. The idea is to provide a `glTFInstantiator` class in luma.gl that handles this. If the luma.gl Scenegraph API closely models the glTF structure, this should be fairly simple to do.


### PBR Rendering

PBR (Physically Based Rendering) is part of the glTF, and can be considered as "a great equalizer" for WebGL frameworks, since it prescribes the shader material model to be used (together with a Khronos reference implementation). B implementing it correctly, a glTF2 model loaded into luma.gl will look EXACTLY the same in luma.gl as in any other WebGL framework, or in the Windows explorer, or in the facebook feed etc.


### Material support

glTF allows users to specify materials. Material capture standard diffuse textures, but also PBR concepts such as metalicity etc. It would seem natural to create a `Material` class to hold this data.


### Impacts on deck.gl

This should be a separate micro-RFC in deck.gl, but to give a hint of hoglTF support could be brought to deck.gl in :


#### MeshLayer

An official `MeshLayer`, which can show multiple copies of a single glTF loaded mesh primitive.

A glTF mesh can consist of multiple primitives, so a glTFMeshLayer would essentially need to be a multi-model layer.


#### ScenegraphLayer

An official `ScenegraphLayer` which can show a complete scene loaded from a glTF file, mixed in with instanced rendering.

The ScenegraphLayer should:

* integrate with deck.gl's coordinate systems
* integrate with deck.gl picking
* TBD...



## Proposal


### 7.0

* glTF-modeled scenegraph support (luma.gl) - `Mesh`, `Camera`... classes.
* `Material` class, basic support (luma.gl) -
* A `glTFInstantitator` class (luma.gl)
* Improved hierarchical scenegraph traversal


* PBR Material support / lighting integration (luma.gl)
* Luma Example (luma.gl) - Build on in-progress Khronos PBR Reference Example
* `MeshLayer` (deck.gl) - being finalized in 7.0

DONE

* `GLBDecoder` (loaders.gl) - "cracks open" binary glTF containers.
* `GLTFLoader` (loaders.gl) - transforms a "tabular" glTF file into a "hierarchical" JavaScript Scenegraph description.
* `glbdump` (loaders.gl) - binary tool to inspect the contents of GLB files.

* `Accessor` class (luma.gl) - modelled on the glTF Accessor concept.
* Basic scenegraph (i.e. the `Object3D/ScenegraphNode` class).
* An initial, experimental integration with Khronos PBR rendering.
* A new lighting module that could be integrated with PBR.


### 7.1

* Support JSON glTF (loaders.gl) - base64 encoded data
* Support JSON Multi-file glTF (loaders.gl) - load all URLs with images and buffers
* Async Textures (luma.gl) - Handle texture assets in separate files
* DRACO Compressed Mesh Support (loaders.gl)

DONE

* `DRACODecoder` (loaders.gl) to decode DRACO compressed meshes (coded / needs testing).


### 7.2

* Support Animated glTF Meshes (Mostly luma.gl)
* Skin and Weights (luma.gl)
* AnimationLoop integration (luma.gl)



