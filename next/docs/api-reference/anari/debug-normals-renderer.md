# Debug normals renderer

This page describes the `debugNormals` renderer selected by an `ANARIFrame`. See [cameras, renderers, and frames](https://luma.gl/next/docs/api-reference/anari/anari-rendering.md) for shared parameters and frame lifecycle.

```
const normals = anariDevice.newRenderer('debugNormals');

frame.setParameter('renderer', normals).commitParameters();
```

`debugNormals` visualizes world-space surface normals as RGB values. Bloom is disabled automatically in this renderer mode.
