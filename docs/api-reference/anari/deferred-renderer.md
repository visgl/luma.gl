# Deferred renderer

This page describes the `deferred` renderer selected by an `ANARIFrame`. See [cameras, renderers, and frames](https://luma.gl/docs/api-reference/anari/anari-rendering.md) for shared parameters and frame lifecycle.

```
const renderer = anariDevice.newRenderer('deferred', {

  ambientRadiance: 0.08,

  background: [0.006, 0.008, 0.018, 1]

});
```

`deferred` is a WebGPU-only alternate renderer that writes committed ANARI surfaces into a shared `GBuffer`, then resolves opaque PBR lighting with the experimental `deferredLighting` shader pass. It currently supports base color, normal, metallic-roughness, emissive, and occlusion maps, plus ambient, directional, point, and spot lights. Scenes containing spot lights use the shared forward fallback so their cone attenuation is preserved.

Its compact G-buffer uses four color attachments: HDR scene color (`rgba16float`), normal and roughness (`rgba8unorm`), base color and metallic (`rgba8unorm`), and HDR emissive color with occlusion (`rgba16float`). WebGPU charges eight render-target bytes for each format, totaling the default CORE limit of 32 bytes per sample. No elevated device limits or `featureLevel: 'max'` are required. The omitted velocity target previously contained only zeroes; HDR, physically based material channels, direct lighting, and emissive output remain intact.

The deferred path is intended as an architecture baseline for richer ANARI renderers. It does not yet include the full Deferred Illumination Lab chain such as clustered light bins, GTAO, SSGI, SSR, velocity history, or bloom.
