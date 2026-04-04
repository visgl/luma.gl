# pbrMaterial

Implements Physically Based Shading of a microfacet surface defined by a glTF material.

Lighting is expected to be defined by the `lights` module.

## Bind Group Convention

The `pbrMaterial` module's material uniform buffer, textures, and samplers are
currently assigned to bind group `3`. The module also depends on lighting,
which is assigned to bind group `2`, while projection-style globals typically
remain in group `0`.

See the [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings) for
details on how grouped bindings are declared and supplied.

## References

- [Real Shading in Unreal Engine 4](http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf)
- [Physically Based Shading at Disney](http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf)
- [README.md - Environment Maps](https://github.com/KhronosGroup/glTF-WebGL-PBR/#environment-maps)
- ["An Inexpensive BRDF Model for Physically based Rendering" by Christophe Schlick](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf)

## Attribution

This implementation of PBR (Physically-Based Rendering) is a fork of the [Khronos Reference Implementation](https://github.com/KhronosGroup/glTF-WebGL-PBR) under the Apache 2.0 license.
