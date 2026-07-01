# RFC: High-Quality Hybrid Shadow System

## Status

Implemented experimentally for WebGPU.

## Ownership boundary

`ShadowMapRenderer` owns depth textures, per-layer framebuffers, stable light cameras, and samplers.
The application owns scene traversal and caster models. Its callback is invoked once for every
directional cascade, spot map, and canonical point face; the renderer records but does not submit
commands. Caster models must retain independent per-view uniforms until submission.

## Light-space stage

Directional lights use practical split cascades, bounding-sphere stabilization, light-space texel
snapping, overlap blending, caster-depth extrusion, and a far fade. Spot lights use perspective
array layers. Point lights render six canonical faces and sample through a cube-array view so PCSS
filtering remains continuous at face boundaries. All resources use `depth32float`.

The group-2 `shadow` WGSL module exposes explicit directional, spot, and point visibility functions.
Applications multiply those factors into the matching direct-light contributions; the module does
not modify built-in materials or ambient, emissive, and indirect terms.

## Screen-space contact stage

The contact pipeline reconstructs view positions from camera depth, marches toward the primary
directional light, terminates at foreground discontinuities, and applies separable depth/normal
bilateral cleanup. Its composite receives the already-shadowed directional direct-light attachment,
allowing contact occlusion without darkening unrelated lighting. TAA follows the contact pass and
stabilizes both the ray-march rotation and PCSS sampling.

## Reference composition

Visualization City renders light-space shadows during MRT scene shading, then runs contact shadows,
SSAO, SSR, fog, outlines, TAA, and motion blur. Separate unshadowed-color and shadow-debug targets
preserve a meaningful split comparison and per-technique diagnostics.
