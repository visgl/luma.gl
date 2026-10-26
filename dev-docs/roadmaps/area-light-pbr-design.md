# Area lights and PBR integration

## Decision proposal

Use linearly transformed cosines (LTC) for production rectangular area lighting. Keep numerical surface integration as a convergence reference. Increasing a regular sample grid alone does not resolve its glossy highlight artifacts reliably. Keep PR3491 experimental until the original living room passes reference comparisons.

## Public API

Add an area light description to the exported `Light` union and accept mixed lights through `LightingProps.lights`. Describe emitter shape, world position, orientation and extent independently of the material. Define radiance units explicitly (nits), preserve existing color conversion conventions, and preserve the punctual uniform ABI. An internal separate area buffer is compatible with one public collection. Do not silently treat an area light as a point light in Phong or Gouraud.

## Shader architecture

Separate emitter geometry integration from material BSDF evaluation. Start with diffuse and isotropic GGX rectangular lights. Feature gate lookup textures and bindings so materials without area lights do not pay their resource cost. Share generated coefficients, numerical conventions and lookup data between GLSL and WGSL. Own lookup textures per device and release them through normal resource ownership.

Specify coverage per lobe: clearcoat needs its own roughness evaluation; sheen, anisotropy and transmission need appropriate integration or an explicitly documented unsupported profile. An isotropic GGX fit does not establish support for every glTF material. Disk lights require a suitable disk formulation or a measured polygon approximation with an explicit error budget.

## Alternatives

- Regular quadrature: useful reference at converged sample counts; costly and creates structured highlights at low counts.
- Stochastic integration: trades structured patterns for noise and requires accumulation or denoising; unsuitable as an unqualified replacement in the interactive gallery.
- Representative point approximations: inexpensive but inaccurate near emitters and for glossy materials.
- LTC: bounded real-time cost and smooth polygon integration, with BRDF fitting error and lookup-data/resource costs that must be measured.

## Acceptance evidence

Compare the unchanged original room, the glossy floor, roughness sweeps, grazing views, near-emitter positions and back faces against converged numerical integration. Cover light area/intensity scaling, handedness, double-sided materials, multiple lights and both GPU backends. Keep diagnostic outlines independent of illumination. Report fitting error, unsupported lobes and absence of shadows separately.

## Primary references

- [LTC polygonal-light research](https://eheitzresearch.wordpress.com/415-2/)
- [Three.js LTC lookup texture library](https://threejs.org/docs/pages/RectAreaLightTexturesLib.html)
- [LTC line and disk research](https://eheitzresearch.wordpress.com/757-2/)
