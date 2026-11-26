# Forward renderer

This page describes the `default` renderer selected by an `ANARIFrame`.
See [cameras, renderers, and frames](/docs/api-reference/anari/anari-rendering)
for shared parameters and frame lifecycle.

```ts
const renderer = anariDevice.newRenderer('default', {
  background: [0.012, 0.016, 0.04, 1],
  ambientRadiance: 0.16,
  exposure: 1.5,
  bloomIntensity: 0.7,
  bloomThreshold: 0.65,
  bloomRadius: 8,
  fogColor: [0.03, 0.04, 0.09],
  fogDensity: 0.0004
});
```

Bloom renders into a temporary frame-sized texture before composing the result to the canvas. The intermediate texture uses the underlying device's preferred presentation format, preserving HDR values when the canvas uses `rgba16float`.
