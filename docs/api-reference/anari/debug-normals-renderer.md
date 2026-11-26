# Debug normals renderer

This page describes the `debugNormals` renderer selected by an `ANARIFrame`.
See [cameras, renderers, and frames](/docs/api-reference/anari/anari-rendering)
for shared parameters and frame lifecycle.

```ts
const normals = anariDevice.newRenderer('debugNormals');
frame.setParameter('renderer', normals).commitParameters();
```

`debugNormals` visualizes world-space surface normals as RGB values. Bloom is disabled automatically in this renderer mode.
