# KHR_materials_scatter

The pinned [draft](https://github.com/MiiBond/glTF/blob/a6cd5b46fb4bd2c9ef83f0bb4a123f45a97a6d9f/extensions/2.0/Khronos/KHR_materials_scatter/README.md) has an initial **thin-wall rendering profile** in the canonical PBR material shaders on WebGL2 and WebGPU.

The material must also declare `KHR_materials_transmission`. Transmission energy is split between specular transmission and diffuse scattering by `scatterStrengthFactor`, multiplied by the strength texture's alpha channel. The scattered energy exits through the forward and backward hemispheres in proportions `(1 + g) / 2` and `(1 - g) / 2`. Its color comes from `multiscatterColorFactor` and the sRGB color texture, independently of base color. Existing UV selection and texture transforms apply.

Nonzero volume thickness is rejected. This profile does not implement volumetric transport, random walks, diffusion, or claim full draft conformance. The support registry therefore retains `loader-only`, and strict required-extension loading does not accept the draft as fully supported. Materials combining this extension with unlit, specular-glossiness, or diffuse transmission are rejected.

The shared feature example accepts `feature="scatter"`. It loads the original [Scatter Strength Thin-Walled reference](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/24871201ac46cf1c23882eda4562bfb993b88ff0/Models/ScatterStrengthThin-Walled) from the proposal-author sample-assets branch. Model, Info, and Attributions tabs separate selection, explanation, and source credits. The CC BY 4.0 asset is loaded without material rewriting. Direct-light rendering does not claim pixel equivalence to upstream environment-lit references.
