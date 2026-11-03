# Debug depth renderer

This page describes the `debugDepth` renderer selected by an `ANARIFrame`. See [cameras, renderers, and frames](https://luma.gl/next/docs/api-reference/anari/anari-rendering.md) for shared parameters and frame lifecycle.

```
const depth = anariDevice.newRenderer('debugDepth');

frame.setParameter('renderer', depth).commitParameters();
```

`debugDepth` visualizes scene depth. Bloom is disabled automatically in this renderer mode.
