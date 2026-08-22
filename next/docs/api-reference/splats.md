# @luma.gl/splats

[Overview](https://luma.gl/next/docs/api-reference/splats.md)[Renderers](https://luma.gl/next/docs/api-reference/splats/renderers.md)[Data & shading](https://luma.gl/next/docs/api-reference/splats/data-and-shading.md)[Streaming](https://luma.gl/next/docs/api-reference/splats/streaming-and-residency.md)[Picking & scenes](https://luma.gl/next/docs/api-reference/splats/picking-and-scenes.md)[Formats & loaders](https://luma.gl/next/docs/api-reference/splats/formats-and-loaders.md)

`@luma.gl/splats` provides experimental GPU-native Gaussian splat rendering. It owns prepared splat data, directional spherical harmonics, semantic filtering, GPU picking, hierarchy traversal, bounded residency, decoded Khronos glTF attributes, covariance projection, depth ordering, and render models without depending on Apache Arrow, loaders.gl, glTF packages, or deck.gl.

The module is currently a private, unpublished luma.gl workspace. Install dependencies from the repository root and add `"@luma.gl/splats": "workspace:*"` to another workspace package when developing against it locally.

## Interactive Gaussian splat showcase[​](#interactive-gaussian-splat-showcase "Direct link to Interactive Gaussian splat showcase")

Explore a deterministic generated Gaussian scene without downloading a third-party capture. WebGPU projects, orders, and draws each progressively added batch through a GPU command graph.

### Gaussian Splats

Progressive HDR Gaussian splat rendering

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/gaussian-splats)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

[Open the full Gaussian splat showcase](https://luma.gl/next/examples/showcase/gaussian-splats).

## Choose a topic[​](#choose-a-topic "Direct link to Choose a topic")

| Topic                                                                                                     | Use it for                                                               |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Renderers](https://luma.gl/next/docs/api-reference/splats/renderers.md)                             | Prepared, command-graph, segmented, and paged rendering contracts.       |
| [Data and shading](https://luma.gl/next/docs/api-reference/splats/data-and-shading.md)               | Source columns, covariance, spherical harmonics, semantics, and updates. |
| [Picking and scenes](https://luma.gl/next/docs/api-reference/splats/picking-and-scenes.md)           | GPU picking and mixed mesh-and-splat scenes.                             |
| [Streaming and residency](https://luma.gl/next/docs/api-reference/splats/streaming-and-residency.md) | Bounded residency, hierarchy traversal, and foveated LOD.                |
| [Formats and loaders](https://luma.gl/next/docs/api-reference/splats/formats-and-loaders.md)         | Khronos glTF splats, 3D Tiles, SPZ, Arrow, and loaders.                  |

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

The graph renderer, GPU ordering, hierarchy traversal, and storage-backed features require WebGPU. Use the prepared SplatRenderer path when WebGL 2 compatibility or caller-provided source ordering is required. The package remains an experimental private workspace.

## Related modules[​](#related-modules "Direct link to Related modules")

* [glTF](https://luma.gl/next/docs/api-reference/gltf.md)
* [Arrow](https://luma.gl/next/docs/api-reference/arrow.md)
* [Experimental GPU primitives](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)
