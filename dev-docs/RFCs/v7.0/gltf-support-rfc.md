# RFC: glTF2.0 Support in luma.gl

* **Author**: Ib Green
* **Date**: Dec, 2018
* **Status**: **Draft**


## Summary

This RFC details how to add glTF support to luma.gl


## Background

glTF has become a "monster" standard in the 3D world, and is now supported built-in to e.g. Windows Explorer and Facebook Feed.

### PBR Rendering and Material Support

PBR Rendering is "the great equalizer" for WebGL frameworks, since it prescribes the shader model to be used (with a Khronos reference implementation), and by implementing it correctly, a loaded model with look exactly the same in luma.gl as in any other WebGL framework.


## Work Breakdown

### Existing Functionality

Good news is that we already have several pieces in place.

In loaders.gl we have:

* `GLBDecoder`, to crack binary glTF containers. (Code is proven and had test cases.)
* `DRACODecoder`, to decode DRACO compressed meshes. (Code needs testing.)
* `glbdump` binary tool to inspect the contents of GLB files.
* `GLTFLoader` - transforms a "tabular" glTF file into a "hierarchical" JavaScript Scenegraph description.

In luma.gl itself we have:

* `Accessor` class that is modelled on the glTF Accessor concept.
* A basic, partially working scenegraph (i.e. the `Object3D` nodes).
* An initial, experimental integration with Khronos PBR rendering.
* A new lighting module that could be integrated with PBR.

In deck.gl we have:

* A MeshLayer being redied


### Missing Pieces

* More extensive scenegraph support in luma.gl
* Material support in luma.gl
* A `glTFInstantitator` class in luma.gl that can use the


### Material support

glTF allows users to specify materials. Material capture standard diffuse textures, but also PBR concepts such as metalicity etc. It would seem natural to create a `Material` class to hold this data.


## Impact on deck.gl

This should be a separate micro-RFC in deck.gl, but to give a hint of the ideas:

It is proposed that glTF support is brought to deck.gl in two ways:

* An official `MeshLayer`, which can show multiple copies of a single glTF loaded mesh primitive.
* An official `ScenegraphLayer` which can show a complete scene loaded from a glTF file, mixed in with instanced rendering.


### ScenegraphLayer

The ScenegraphLayer should:

* integrate with deck.gl's coordinate systems
* integrate with deck.gl picking
* ...
