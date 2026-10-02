# @luma.gl/splats

[Overview](https://luma.gl/docs/api-reference/splats.md)[Renderers](https://luma.gl/docs/api-reference/splats/renderers.md)[Data & shading](https://luma.gl/docs/api-reference/splats/data-and-shading.md)[Streaming](https://luma.gl/docs/api-reference/splats/streaming-and-residency.md)[Picking & scenes](https://luma.gl/docs/api-reference/splats/picking-and-scenes.md)[Formats & loaders](https://luma.gl/docs/api-reference/splats/formats-and-loaders.md)

`@luma.gl/splats` provides experimental GPU-native Gaussian splat rendering. It owns prepared splat data, directional spherical harmonics, semantic filtering, GPU picking, hierarchy traversal, bounded residency, decoded Khronos glTF attributes, covariance projection, depth ordering, and render models without depending on Apache Arrow, loaders.gl, glTF packages, or deck.gl.

Install the published experimental module with `yarn add @luma.gl/splats`. Its APIs may evolve without a 9.4 semver compatibility promise.

## Interactive Gaussian splat viewer[​](#interactive-gaussian-splat-viewer "Direct link to Interactive Gaussian splat viewer")

Explore the complete 741,883-splat Train capture with progressive loading, GPU depth ordering, and WebGL2 fallback. The viewer also includes Truck, Dr Johnson, Playroom, and custom authorized source URLs.

[Open the Gaussian Splat Viewer](https://luma.gl/examples/showcase/gaussian-splat-viewer).

## Choose a topic[​](#choose-a-topic "Direct link to Choose a topic")

| Topic                                                                                           | Use it for                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Renderers](https://luma.gl/docs/api-reference/splats/renderers.md)                             | Prepared, command-graph, segmented, and paged rendering contracts.       |
| [Data and shading](https://luma.gl/docs/api-reference/splats/data-and-shading.md)               | Source columns, covariance, spherical harmonics, semantics, and updates. |
| [Picking and scenes](https://luma.gl/docs/api-reference/splats/picking-and-scenes.md)           | GPU picking and mixed mesh-and-splat scenes.                             |
| [Streaming and residency](https://luma.gl/docs/api-reference/splats/streaming-and-residency.md) | Bounded residency, hierarchy traversal, and foveated LOD.                |
| [Formats and loaders](https://luma.gl/docs/api-reference/splats/formats-and-loaders.md)         | Khronos glTF splats, 3D Tiles, SPZ, and loaders.                         |

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

The graph renderer, GPU ordering, hierarchy traversal, and storage-backed features require WebGPU. Use the prepared SplatRenderer path when WebGL 2 compatibility or caller-provided source ordering is required. The package is published with an experimental API.

## Related modules[​](#related-modules "Direct link to Related modules")

* [glTF](https://luma.gl/docs/api-reference/gltf.md)
* Experimental GPU primitives
