# DeviceFeatures

[luma](https://luma.gl/next/docs/api-reference/core/luma.md)[Adapter](https://luma.gl/next/docs/api-reference/core/adapter.md)[Device](https://luma.gl/next/docs/api-reference/core/device.md)[DeviceInfo](https://luma.gl/next/docs/api-reference/core/device-info.md)[DeviceLimits](https://luma.gl/next/docs/api-reference/core/device-limits.md)[DeviceFeatures](https://luma.gl/next/docs/api-reference/core/device-features.md)

The luma.gl `Device` provides a device "feature" system that allows applications to check whether specific advanced capabilities are present on the current browser or GPU.

## Background[​](#background "Direct link to Background")

Both WebGL 2 and WebGPU provide extension mechanisms that allow implementations to expose additional capabilities that may not be supported on all browsers and GPUs. This allows new GPU features to be provided without waiting for new official versions of the WebGL or WebGPU standards to be approved and published.

### Device.features[​](#devicefeatures-1 "Direct link to Device.features")

luma.gl provides a unified feature detection system across WebGPU, WebGL, WGLSL and GLSL. Each device has a `device.features` field that holds a `DeviceFeatures` object with an API similar to `Set<DeviceFeature>`.

| Feature Name                               | WebGPU<br />max | WebGPU<br />core | WebGPU<br />compat | WebGL2 | Description                                  | WebGL counterpart                                                                                                                    |
| ------------------------------------------ | --------------- | ---------------- | ------------------ | ------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Browser APIs**                           |                 |                  |                    |        |                                              |                                                                                                                                      |
| `html-in-canvas`                           | N/A             | N/A              | N/A                | N/A    | DOM subtree rasterization into textures      | `texElementImage2D`                                                                                                                  |
| **WebGPU Extensions**                      |                 |                  |                    |        |                                              |                                                                                                                                      |
| `core-features-and-limits`                 | N/A             | N/A              | N/A                | N/A    | Core WebGPU feature and limit profile        | N/A                                                                                                                                  |
| `depth-clip-control`                       | N/A             | N/A              | N/A                | N/A    | Disable depth clipping via `unclippedDepth`  | `WEBGL_depth_texture`                                                                                                                |
| `indirect-first-instance`                  | N/A             | N/A              | N/A                | N/A    | Specify instance index via GPU buffer        | N/A                                                                                                                                  |
| `timestamp-query`                          | N/A             | N/A              | N/A                | N/A    | GPU timer query support                      | `EXT_disjoint_timer_query_webgl2`                                                                                                    |
| **WebGL Extensions**                       |                 |                  |                    |        |                                              |                                                                                                                                      |
| `compilation-status-async-webgl`           | N/A             | N/A              | N/A                | N/A    | Non-blocking compile/link status             | `KHR_parallel_shader_compile`                                                                                                        |
| `polygon-mode-webgl`                       | N/A             | N/A              | N/A                | N/A    | Wireframe rendering parameters (debug only)  | `WEBGL_polygon_mode`                                                                                                                 |
| `provoking-vertex-webgl`                   | N/A             | N/A              | N/A                | N/A    | Primitive vertex used for flat shading       | `WEBGL_provoking_vertex`                                                                                                             |
| **Shader Extensions**                      |                 |                  |                    |        |                                              |                                                                                                                                      |
| `shader-f16`                               | N/A             | N/A              | N/A                | N/A    | WGSL supports `f16`                          | N/A                                                                                                                                  |
| `shader-noperspective-interpolation-webgl` | N/A             | N/A              | N/A                | N/A    | GLSL `noperspective` interpolation qualifier | `NV_shader_noperspective_interpolation`                                                                                              |
| `shader-conservative-depth-webgl`          | N/A             | N/A              | N/A                | N/A    | GLSL enable early depth test optimizations   | `EXT_conservative_depth`                                                                                                             |
| `shader-clip-cull-distance-webgl`          | N/A             | N/A              | N/A                | N/A    | GLSL `gl_ClipDistance[]/gl_CullDistance[]`   | `WEBGL_clip_cull_distance`                                                                                                           |
| **Texture Extensions**                     |                 |                  |                    |        |                                              |                                                                                                                                      |
| `depth32float-stencil8`                    | N/A             | N/A              | N/A                | N/A    |                                              | N/A                                                                                                                                  |
| `rg11b10ufloat-renderable`                 | N/A             | N/A              | N/A                | N/A    | rg11b10ufloat textures renderable            | N/A                                                                                                                                  |
| `float32-renderable-webgl`                 | N/A             | N/A              | N/A                | N/A    | float32 textures renderable                  | `EXT_color_buffer_float`                                                                                                             |
| `float16-renderable-webgl`                 | N/A             | N/A              | N/A                | N/A    | float16 textures renderable                  | `EXT_color_buffer_half_float`                                                                                                        |
| `rgb9e5ufloat-renderable-webgl`            | N/A             | N/A              | N/A                | N/A    | `rgb9e5ufloat` renderable                    | ['WEBGL\_render\_shared\_exponent'](https://www.khronos.org/registry/webgl/extensions/WEBGL_render_shared_exponent/)                 |
| `snorm8-renderable-webgl`                  | N/A             | N/A              | N/A                | N/A    | `r,rg,rgba8snorm` renderable                 | [EXT\_render\_snorm](https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/)                                                 |
| `norm16-renderable-webgl`                  | N/A             | N/A              | N/A                | N/A    | `r,rg,rgba16norm` renderable                 | \[EXT\_texture\_norm16]\[EXT\_texture\_norm16]                                                                                       |
| `snorm16-renderable-webgl`                 | N/A             | N/A              | N/A                | N/A    | `r,rg,rgba16snorm` renderable                | \[EXT\_texture\_norm16]\[EXT\_texture\_norm16], [EXT\_render\_snorm](https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/) |
| `float32-filterable`                       | N/A             | N/A              | N/A                | N/A    | float32 textures are filterable              | `OES_texture_float_linear`                                                                                                           |
| `float16-filterable-webgl`                 | N/A             | N/A              | N/A                | N/A    | float16 textures are filterable              | `OES_texture_half_float_linear`                                                                                                      |
| `texture-filterable-anisotropic-webgl`     | N/A             | N/A              | N/A                | N/A    | anisotropic filtering, common                | `EXT_texture_filter_anisotropic`                                                                                                     |
| `bgra8unorm-storage`                       | N/A             | N/A              | N/A                | N/A    | can be used as storage binding.              |                                                                                                                                      |
| `texture-blend-float-webgl`                | N/A             | N/A              | N/A                | N/A    | float texture blending                       | `EXT_float_blend`                                                                                                                    |
| **Compressed Texture Support**             |                 |                  |                    |        |                                              |                                                                                                                                      |
| `texture-compression-bc`                   | N/A             | N/A              | N/A                | N/A    | DXT (BC1-BC7). Desktops.                     |                                                                                                                                      |
| `texture-compression-bc5-webgl`            | N/A             | N/A              | N/A                | N/A    | DXT (BC1-BC5). Desktops.                     |                                                                                                                                      |
| `texture-compression-etc2`                 | N/A             | N/A              | N/A                | N/A    | Performance caveats.                         |                                                                                                                                      |
| `texture-compression-astc`                 | N/A             | N/A              | N/A                | N/A    | ASTC.                                        |                                                                                                                                      |
| `texture-compression-etc1-webgl`           | N/A             | N/A              | N/A                | N/A    | Qualcomm Snapdragon. Android.                |                                                                                                                                      |
| `texture-compression-pvrtc-webgl`          | N/A             | N/A              | N/A                | N/A    | PowerVR GPUs, iOS devices.                   |                                                                                                                                      |
| `texture-compression-atc-webgl`            | N/A             | N/A              | N/A                | N/A    | Qualcomm Adreno GPUs. Android.               |                                                                                                                                      |

The table above uses the luma.gl `Device.feature` field to check the capabilities of your current browser. You can open this page in different browsers and on different machines to compare capabilities.

## Remarks[​](#remarks "Direct link to Remarks")

* On WebGL, extensions will not be enabled until they have been queried.
* Given that queries to driver and GPU are typically expensive in WebGL, the Device will cache any queried extensions.
* A substantial set of features are devoted to texture capabilities, however these can also be queried on a per-texture basis.
* Both WebGL2 and WebGPU are continuously developing new extensions. The feature list will be updated as new extensions are added to the standards.

## Usage[​](#usage "Direct link to Usage")

An example of feature detection

```
// Checks if `QuerySet` objects can do GPU timing

if (device.features.has('timestamp-query')) {

   ...

}

// Checks whether the active browser and backend can rasterize DOM children into textures

if (device.features.has('html-in-canvas')) {

   ...

}

// Alternatively - do the same query using raw WebGL extensions

if (webglDevice.gl.getExtension('EXT_disjoint_timer_query_webgl2')) {

   ...

}
```

## Check native extensions[​](#check-native-extensions "Direct link to Check native extensions")

* [WebGL Report](https://webglreport.com/?v=2)
* [WebGPU Report](https://webgpureport.org/)
