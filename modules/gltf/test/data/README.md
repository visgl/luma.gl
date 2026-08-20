# glTF Native Extension Fixtures

## Khronos fixtures (CC0-1.0)

These compact binary assets come from the Khronos glTF Sample Assets repository at
commit `2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf`:

- `SimpleInstancing.glb`: `EXT_mesh_gpu_instancing` transforms and accessor data.
- `CubeVisibility.glb`: recursive `KHR_node_visibility` mesh visibility.
- `LightVisibility.glb`: recursive `KHR_node_visibility` punctual-light visibility.

Each source asset is released under CC0-1.0. See the corresponding model directories in
https://github.com/KhronosGroup/glTF-Sample-Assets/tree/2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf/Models.

`SimpleSkinLOD.gltf` is derived from the CC0-1.0 Simple Skin sample by Marco Hutter, already
included at `examples/showcase/scene/public/gltf/SimpleSkin.gltf`. It adds three `MSFT_lod` mesh
levels while preserving the original joint attributes, two-joint skin, and skeletal animation.

`BumpMaterial.gltf` is a compact positive fixture authored by vis.gl contributors for the
experimental `EXT_materials_bump` extension. Its geometry and embedded height texture are
dedicated to the public domain under CC0-1.0.

## luma.gl negative fixture (MIT)

`UnsupportedRequiredExtensions.gltf` is authored by vis.gl contributors and declares every
registry entry with support level `none` as required. It is distributed under the repository's
MIT license and must remain synchronized with the runtime registry.

## Babylon.js reference fixture (Apache-2.0)

`msft-lod.gltf` is an unmodified, self-contained three-level `MSFT_lod` interoperability fixture
from Babylon.js commit `b15e177d5b7871248a2fccdbca0896cd609e8721`:

https://github.com/BabylonJS/Babylon.js/blob/b15e177d5b7871248a2fccdbca0896cd609e8721/packages/tools/playground/public/scenes/msft-lod.gltf

This fixture is distributed under the Apache License, Version 2.0. The complete upstream license
is included in `licenses/BabylonJS-Apache-2.0.txt`. The upstream notice is:

> Babylon.js
> Copyright 2023 The Babylon.js team
