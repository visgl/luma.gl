# GBuffer

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GPU Traces](https://luma.gl/next/docs/api-reference/experimental/lutrace.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`GBuffer` is an experimental WebGPU-only owner for the multiple render targets (MRTs) used by scene-aware fullscreen effects. It gives geometry shaders one stable attachment contract and gives `ShaderPassRenderer` the depth, normal, and velocity bindings expected by SSAO, SSR, outlines, TAA, motion blur, depth-aware blur, and related pipelines.

`GBuffer` owns render targets and semantic bindings. It is not a scene renderer: applications still draw geometry, choose clear values, and decide whether additional attachments carry lighting, material, picking, or debug data. The separate [`deferredLighting`](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md) shader-pass pipeline provides one reusable material-lighting resolve without coupling target ownership to scene traversal.

## Attachment contract[​](#attachment-contract "Direct link to Attachment contract")

The first three color attachments are always present and keep this fragment-output order:

| Fragment output  | Texture                  | Meaning                                                               |
| ---------------- | ------------------------ | --------------------------------------------------------------------- |
| `@location(0)`   | `colorTexture`           | Shaded scene color passed to `ShaderPassRenderer` as `sourceTexture`. |
| `@location(1)`   | `normalRoughnessTexture` | View-space normal encoded into RGB plus roughness in A.               |
| `@location(2)`   | `velocityTexture`        | Current-minus-previous screen UV velocity in RG.                      |
| depth attachment | `depthTexture`           | Sampleable scene depth for reconstruction and depth-aware effects.    |

Named `extraColorAttachments` are appended after location 2 in declaration order. Their names are caller-defined, while `color`, `normalRoughness`, `velocity`, and `depth` are reserved.

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createSSRShaderPassPipeline, createTAAShaderPassPipeline} from '@luma.gl/effects';

import {GBuffer} from '@luma.gl/experimental';



const gBuffer = new GBuffer(device, {

  id: 'scene',

  width,

  height,

  extraColorAttachments: [{name: 'emissive', format: 'rgba16float'}]

});



const scenePass = device.beginRenderPass({

  framebuffer: gBuffer.framebuffer,

  clearColors: [

    new Float32Array([0, 0, 0, 1]),

    new Float32Array([0.5, 0.5, 1, 1]),

    new Float32Array([0, 0, 0, 0]),

    new Float32Array([0, 0, 0, 0])

  ],

  clearDepth: 1

});

sceneModel.draw(scenePass);

scenePass.end();



const effects = new ShaderPassRenderer(device, {

  shaderPasses: [createSSRShaderPassPipeline(), createTAAShaderPassPipeline()]

});



effects.renderToScreen({

  sourceTexture: gBuffer.colorTexture,

  bindings: {

    ...gBuffer.getShaderPassBindings(),

    emissiveTexture: gBuffer.getExtraColorTexture('emissive')

  }

});
```

The geometry fragment shader must write outputs that match the contract:

```
struct FragmentOutputs {

  @location(0) color: vec4f,

  @location(1) normalRoughness: vec4f,

  @location(2) velocity: vec2f,

};
```

The [Advanced Effects example](https://luma.gl/next/examples/experimental/advanced-effects) uses `GBuffer` with three extra channels for unshadowed color, directional direct light, and shadow debugging.

The [Deferred Illumination Lab](https://luma.gl/next/examples/experimental/deferred-rendering) uses two extra channels, `baseColorMetallic` and `emissiveOcclusion`, then resolves them with 64-capacity storage-buffer point lighting:

```
const gBuffer = new GBuffer(device, {

  width,

  height,

  colorFormat: 'rgba16float',

  extraColorAttachments: [

    {name: 'baseColorMetallic', format: 'rgba8unorm'},

    {name: 'emissiveOcclusion', format: 'rgba8uint'}

  ]

});
```

That five-target layout uses exactly 32 color-attachment bytes per sample: HDR scene color stays `rgba16float`, while normalized emissive/AO is explicitly packed into the four-byte `rgba8uint` target for WebGPU CORE devices.

## Props[​](#props "Direct link to Props")

| Prop                    | Default       | Meaning                                                               |
| ----------------------- | ------------- | --------------------------------------------------------------------- |
| `id`                    | generated     | Debug-resource prefix.                                                |
| `width`, `height`       | required      | Positive integer target size.                                         |
| `colorFormat`           | `rgba8unorm`  | Scene-color attachment format.                                        |
| `normalRoughnessFormat` | `rgba8unorm`  | Normal and roughness attachment format.                               |
| `velocityFormat`        | `rg16float`   | Motion-vector attachment format.                                      |
| `depthStencilFormat`    | `depth24plus` | Sampleable depth attachment format.                                   |
| `extraColorAttachments` | `[]`          | Named renderable color channels appended after the standard channels. |

Construction rejects non-WebGPU devices, unsupported formats, dimensions outside the supported domain, duplicate or reserved extra names, and color-attachment counts above `device.limits.maxColorAttachments`.

## Methods[​](#methods "Direct link to Methods")

### `getShaderPassBindings(): GBufferShaderPassBindings`[​](#getshaderpassbindings-gbuffershaderpassbindings "Direct link to getshaderpassbindings-gbuffershaderpassbindings")

Returns:

```
{

  depthTexture: gBuffer.depthTexture,

  normalTexture: gBuffer.normalRoughnessTexture,

  velocityTexture: gBuffer.velocityTexture

}
```

Spread this object into `ShaderPassRenderer.renderToTexture()` or `renderToScreen()` bindings.

### `getExtraColorTexture(name: string): Texture`[​](#getextracolortexturename-string-texture "Direct link to getextracolortexturename-string-texture")

Returns one declared extra channel. It throws when `name` was not declared.

### `resize({width, height}): boolean`[​](#resizewidth-height-boolean "Direct link to resizewidth-height-boolean")

Recreates every owned attachment when size changes and returns `true`. It returns `false` when the size is unchanged. Resizing does not preserve texture contents; reset temporal effect history at the same time.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the framebuffer and every owned texture.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Shader Passes](https://luma.gl/next/docs/api-guide/shaders/shader-passes.md) explains the composable render-stack model and effect ordering.
* [Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md) defines the material attachment convention and fullscreen lighting resolve.
* [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md) documents routing, named targets, runtime bindings, and temporal history.
* [`WBOITRenderer`](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md) and [`ABufferRenderer`](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md) add transparent geometry capture and resolve pipelines.
