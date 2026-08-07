# Depth of Field

Keep a selected camera-space distance sharp while softening nearer and farther geometry. `dofShaderPassPipeline` reconstructs depth from the scene attachment and applies separable horizontal and vertical lens blur.

### Depth of Field

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/dof)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property             | Value                                      |
| -------------------- | ------------------------------------------ |
| Exports              | `dof` and `dofShaderPassPipeline`          |
| Backends             | WebGPU and WebGL2                          |
| Render passes        | Two separable depth-driven sampling passes |
| Required binding     | `depthTexture`                             |
| Intermediate storage | One renderer-owned scratch texture         |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {dofShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  shaderPasses: [dofShaderPassPipeline]

});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  bindings: {depthTexture: sceneDepthTexture},

  uniforms: {

    dof: {

      depthRange: [0.1, 100],

      focusDistance: 8,

      blurCoefficient: 1.4,

      pixelsPerMillimeter: 1.2

    }

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter             | Default      | Description                                                               |
| --------------------- | ------------ | ------------------------------------------------------------------------- |
| `depthRange`          | `[0.1, 100]` | Camera near and far clip distances used to reconstruct linear view depth. |
| `focusDistance`       | `1`          | View-space distance of the focal plane that remains sharp.                |
| `blurCoefficient`     | `1`          | Lens blur strength derived from the chosen focal length and aperture.     |
| `pixelsPerMillimeter` | `1`          | Conversion factor from lens-space blur size to image-space pixels.        |

The implementation caps the blur radius at 20 source samples per direction. The internal `texelOffset` uniform is selected by the pipeline and is intentionally excluded from the public `DofUniforms` interface.

## Required Inputs and Composition[​](#required-inputs-and-composition "Direct link to Required Inputs and Composition")

The supplied `depthTexture` must correspond to the same camera, viewport, and scene as the input color texture. Apply depth of field before screen-coordinate warps and after opaque scene rendering. Keep it before the final tone-map step when preserving HDR highlight intensity matters.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Tilt Shift](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/tilt-shift.md) approximates selective focus without a depth attachment.
* [Depth-Aware Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md) smooths intermediate data while preserving depth edges.
* [Bloom](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/bloom.md) spreads bright highlights through a separate multiscale optical pipeline.
