# RFC: glTF2.0 Support in luma.gl

* **Author**: Ib Green
* **Date**: Dec, 2018
* **Status**: **Draft**


## Summary

This RFC details how to add glTF support to luma.gl:


## Background

glTF has become a "monster" standard in the 3D world, and is now supported built-in to e.g. Windows Explorer and Facebook Feed.


#### More extensive SceneGraph support

luma.gl needs to be able to render a full scenegraph. We have the `Group` and `Model` classes but need a `Mesh` consisting of multiple `Primitives` etc to be able to model what is loaded from glTF.


#### glTFInstantiator class

The glTF structure provided by loaders.gl must be transformed into a luma.gl scene graph. The idea is to provide a `glTFInstantiator` class in luma.gl that handles this. If the luma.gl Scenegraph API closely models the glTF structure, this should be fairly simple to do.


#### PBR Rendering

PBR (PhyRendering is part of the glTF is "the great equalizer" for WebGL frameworks, since it prescribes the shader model to be used (with a Khronos reference implementation), and by implementing it correctly, a loaded model with look exactly the same in luma.gl as in any other WebGL framework.


#### Material support

glTF allows users to specify materials. Material capture standard diffuse textures, but also PBR concepts such as metalicity etc. It would seem natural to create a `Material` class to hold this data.


### Impact on deck.gl

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

* glTF-modeled scenegraph support (luma.gl) - `Mesh`, `Primitive`... classes.
* `Material` class, basic support (luma.gl) - 
* A `glTFInstantitator` class (luma.gl)

* PBR/lighting integration (luma.gl)
* Luma Example (luma.gl) - Build on in-progress Khronos PBR Reference Example
* `MeshLayer` (deck.gl) - being finalized in 7.0

DONE

* `GLBDecoder` (loaders.gl) - crack binary glTF containers. (Code is proven and had test cases.)
* `GLTFLoader` (loaders.gl) - transforms a "tabular" glTF file into a "hierarchical" JavaScript Scenegraph description.
* `glbdump` (loaders.gl) - binary tool to inspect the contents of GLB files.

* `Accessor` class (luma.gl) - modelled on the glTF Accessor concept.
* Basic scenegraph (i.e. the `Object3D` nodes).
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



