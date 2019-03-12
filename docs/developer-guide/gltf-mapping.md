# glTF mapping to luma.gl

luma.gl v7 API contains classes that closely follow the objects defined in the [glTF2 specification](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0), making the instantiation of a glTF 2.0 file in luma.gl rather trivial. However it can still be good to be able to reference a map of how various concepts are loaded.

## GLTF structure

* `scene` on the highest level, a glTF file is a list of scenes, each scene containing a list of `nodes`.
* `node` can hold a list of child nodes, and/or a `mesh`, and/or a `camera`. It also holds a transformation that should be applied to all of these.
* `mesh` is a list of `primitives` (and optionally, also some "morph weights")
* `primitive` is just a geometry: a draw mode, a bunch of accessors, optional indices (and optionally, also some "morph targets")


## Top-level Mapping

| glTF concept   | luma.gl class | |
| ---            | ---           | |
| `accessors`    | `Accessor`    | |
| `animations`   | N/A | |
| `asset`        | N/A | metadata, handled by loaders.gl |
| `buffers`      | `ArrayBuffer` | |
| `bufferView`   | `Buffer` | |
| `cameras`      | N/A | |
| `images`       | `HTMLImage`? | |
| `materials`    | `Material` (7.0) | |
| `meshes`       | `Group`/`Model` | |
| `nodes`        | `Group`, `Model` | A single `node` can generate one or more of these objects |
| `primitives`   | `Model` (7.0) | |
| `programs`     | `Program` | |
| `samplers`     | `Sampler` (WebGL2) or `Texture2D` (WebGL1) | |
| `scene`        | N/A | Selects one scene from `scenes` |
| `scenes`       | `Group`           |
| `shaders`      | `Shader`          |
| `skins`        | Not yet supported | |
| `techniques`   | TBD? | |
| `textures`     | `Texture2D`| |


## Unsupported glTF Features

* skins (needs new `Skin` class)
* morph targets (`Primitive.targets`, `Mesh.weights`)
* Animations (needs new `Animation` class)


## Remarks

* **Overloaded Nodes** - The biggest deviation from a one-to-one mapping comes from the mapping of the glTF `node` object which can contain several different things at the same time. For some background on why glTF nodes were designed the way they are, see for instance [this discussion](https://github.com/KhronosGroup/glTF/issues/13).
