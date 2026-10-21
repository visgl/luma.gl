# Shared glTF features examples

Website entries select a supported preset through a typed prop:

```tsx
<GLTFFeatureExample feature="billboard" />
<GLTFFeatureExample feature="lightmap" />
<GLTFFeatureExample feature="area-lights" />
```

Run `yarn start` in this directory for a standalone preview. Select the same preset with
`?feature=billboard` and request WebGL with `&backend=webgl`.

Add new implemented features to `presets.ts` and extend the shared application only where their
runtime behavior differs. Keep pinned source URLs and source attribution with their preset UI.
Do not copy this package for another gallery entry. Keep gallery IDs, screenshots and navigation
independent of the shared implementation directory. Unsupported feature names are rejected.

The application owns its controller and scene bundle. The website owns its device. Destroy the
scene bundle and feature controllers when replacing a model or finalizing the application.

The lightmap preset loads the pinned MIT Cornell Box (709 KB). Its baked irradiance is shown without additional runtime lights.

The area-light preset loads The Modern Living Room by Wig42 (CC BY 3.0), with conversion credit to Benedikt Bitterli and Foundation Resources. Geometry and textures stay in the source repository; the viewer routes Git LFS payloads through its media host.

### Scatter diagnostic

Use `?feature=scatter` for an authored three-panel glTF demonstrating the draft
`KHR_materials_scatter` thin-wall profile under opposing warm and cool directional
lights. Left to right: backward, balanced, forward scattering. This is an authored
diagnostic, not an upstream reference asset. Volumetric mode is rejected.
