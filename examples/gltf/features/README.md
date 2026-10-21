# Shared glTF features examples

Website entries select a supported preset through a typed prop:

```tsx
<GLTFFeatureExample feature="billboard" />
<GLTFFeatureExample feature="lightmap" />
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
