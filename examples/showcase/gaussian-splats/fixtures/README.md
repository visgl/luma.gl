# Gaussian glTF showcase fixture

`gaussian-splats.glb` is an original, synthetic 256-point scene generated for luma.gl. It is
redistributable under the repository's MIT license. Its only mesh contains a Gaussian primitive
with an embedded gzip-compressed SPZ v2 payload and an identity node transform. The scene is a
small integration example; it is not a format conformance reference.

Other publicly available assets for follow-up testing:

- [Cesium SH unit cube](https://github.com/CesiumGS/cesium/tree/main/Specs/Data/Cesium3DTiles/GaussianSplats/sh_unit_cube)
  and [tower](https://github.com/CesiumGS/cesium/tree/main/Specs/Data/Cesium3DTiles/GaussianSplats/tower)
  contain SPZ-compressed GLBs and authored node transforms. These files use an older draft and omit
  the now-required `kernel` and `colorSpace` fields, so loaders.gl beta.4 rejects them unchanged.
- [godot-gsplat minimal point](https://github.com/shiena/godot-gsplat/tree/main/samples/minimal_gsplat)
  is a small uncompressed glTF using the current base extension declaration.
- [Niantic SPZ samples](https://github.com/nianticlabs/spz/tree/main/samples) include captured
  scenes; these are standalone SPZ files, not glTF assets.

Check each model's asset-specific provenance and license before redistributing a copy.
