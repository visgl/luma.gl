import {BufferAtlas} from '@site/src/components/docs/buffer-atlas';
import {GpuGuideDocsTabs} from '@site/src/components/docs/gpu-guide-docs-tabs';

# Stencil buffers

<GpuGuideDocsTabs group="rendering" active="stencil-buffers" />

A stencil attachment stores a small unsigned integer at each framebuffer sample. Draws can
label samples, test those labels, and update them. Use the labels to clip one draw to the
shape of another, reserve bits for independent effects, or count coverage.

## The River Remembers

Drag the survey lenses across the city. One traces the old riverbed and the other exposes the culverts. Overlap them to see where water follows its old course.

<BufferAtlas kind="river" />

## Clip a draw to a shape

Imagine a blue image and a red rectangle that should show only through a circular opening.
First draw the circle into stencil, replacing the initial zero with one wherever the circle
covers a sample. Then draw the rectangle with a comparison that accepts only samples marked
one. The circle draw leaves the blue image intact.

The example assumes two prepared draws. `maskShaders` and `contentShaders` supply the
backend-appropriate `vs` and `fs`, and each draw has a compatible vertex setup. The snippets
use shaders that generate vertices from the vertex index.

```ts
const format = 'depth24plus-stencil8';
const framebuffer = device.createFramebuffer({
  width: 1024,
  height: 768,
  colorAttachments: ['rgba8unorm'],
  depthStencilAttachment: format
});

const maskPipeline = device.createRenderPipeline({
  ...maskShaders,
  colorAttachmentFormats: ['rgba8unorm'],
  depthStencilAttachmentFormat: format,
  parameters: {
    colorMask: 0,
    stencilCompare: 'always',
    stencilPassOperation: 'replace'
  }
});

const clippedPipeline = device.createRenderPipeline({
  ...contentShaders,
  colorAttachmentFormats: ['rgba8unorm'],
  depthStencilAttachmentFormat: format,
  parameters: {
    stencilCompare: 'equal',
    stencilWriteMask: 0
  }
});

const pass = device.beginRenderPass({
  framebuffer,
  clearColor: [0, 0, 1, 1],
  clearStencil: 0
});
pass.setPipeline(maskPipeline);
pass.setParameters({stencilReference: 1});
pass.draw({vertexCount: circleVertexCount});

pass.setPipeline(clippedPipeline);
pass.setParameters({stencilReference: 1});
pass.draw({vertexCount: rectangleVertexCount});
pass.end();
device.submit();
```

The framebuffer allocates stencil storage. Each pipeline can declare the matching format and
describes how a draw uses it. A standalone pipeline with an active stencil comparison or operation defaults to
`depth24plus-stencil8`. Specify the format when targeting a different stencil attachment.
The pass supplies the initial clear value and the current
reference. Reuse the framebuffer and pipelines across frames, and destroy owned resources
when finished.

## Follow a sample through the tests

The stencil comparison uses the masked reference as its left operand and the masked stored
value as its right operand. With `'less'`, for example, the draw passes when the masked
reference is less than the masked stored value.

| Result | Pipeline parameter | Effect |
| --- | --- | --- |
| Stencil fails | `stencilFailOperation` | Apply the selected stencil operation and reject the fragment. |
| Stencil passes and depth fails | `stencilDepthFailOperation` | Apply the selected operation and reject the fragment. |
| Both pass | `stencilPassOperation` | Apply the selected operation and allow enabled depth and color writes. |

All three operations default to `'keep'`. Choose `'replace'` to use the reference as the new
value, `'zero'` to clear selected bits, or `'invert'` to toggle them. Increment and decrement
operations come in clamp and wrap variants. On an eight-bit value, increment-clamp leaves
255 at 255 and increment-wrap takes it to zero. The GPU computes the operation before applying
the write mask.

The depth defaults of `depthCompare: 'always'` and disabled depth writes suit a screen-space
mask. For a mask that respects scene occlusion, use the same depth convention as the scene and
choose the depth comparison accordingly. See [Depth buffers](/docs/api-guide/gpu/depth-buffers).

## Reserve bits for independent effects

Partition the eight bits when several effects share one attachment. For example, reserve bit
zero for a clip and bit seven for selection. To set the selection bit, use `stencilReference:
0x80`, `stencilWriteMask: 0x80`, and `stencilPassOperation: 'replace'` with an always-passing
test. The remaining seven bits retain their previous values.

To read just the selection bit, use `stencilReference: 0x80`, `stencilReadMask: 0x80`, and
`stencilCompare: 'equal'`. A stored sample of `0x81` passes, even though its clip bit is also
set. Use a draw with `'zero'` and a write mask of `0x80` to clear only the selection bit. A
pass-start clear initializes the whole stencil aspect.

Set masks independently. The read mask controls which bits enter the comparison. The write
mask controls which bits an operation may update. A read mask of zero makes both comparison
operands zero. A write mask of zero preserves all stored bits. For simple labels, keep the reference and
values in the range 0–255.

## Preserve a mask across passes

Use the same framebuffer and set `clearStencil: false` on later passes to load the existing
mask. Set `clearDepth` independently. For instance, you can preserve stencil while clearing
depth for a new draw sequence. Stencil contents are stored by default. Set
`stencilStoreOp: 'discard'` when no later pass needs the contents, and clear before reusing
the discarded stencil aspect.

For a pass that only compares stencil, use `stencilReadOnly: true` with a pipeline that keeps
stencil values or has a zero write mask, and leave depth writable if the pass needs it. A numeric stencil clear fills the entire writable stencil attachment, regardless of the
draw scissor, comparison, or write mask. Set `clearDepth: false` when clearing stencil alone
on a packed depth/stencil attachment. To clear a region or a subset of bits portably, draw the region with
color and depth writes disabled and the appropriate stencil operation and write mask.

The reference is dynamic pass state. Set it before draws that depend on it,
including when returning to zero. You can reuse one pipeline for many reference values.

## Choose the portable path

| Topic | WebGL2 | WebGPU |
| --- | --- | --- |
| Offscreen storage | Use a packed `depth24plus-stencil8` attachment. | Use the same packed format and declare the matching pipeline attachment format. |
| Canvas storage | The browser context must provide stencil in its default framebuffer. For a supplied context, check its actual attributes. | Stencil comes from a depth/stencil attachment used alongside the canvas color target. |
| Faces | Native WebGL exposes face-specific comparisons and operations, with restrictions on different effective masks and references. | Native WebGPU exposes face-specific comparisons and operations with shared masks and reference. |
| Shader reads | Optional [WEBGL_stencil_texturing](https://registry.khronos.org/webgl/extensions/WEBGL_stencil_texturing/) selects the sampled aspect on the texture object. | Native WebGPU has stencil-only views with unsigned-integer shader access. |

## Count winding with both faces

A single draw can add to stencil on front faces and subtract on back faces. For example, draw
triangulated contours with culling disabled and leave color writes off during counting.

```ts
const windingParameters = {
  cullMode: 'none',
  colorMask: 0,
  stencilFront: {passOp: 'increment-wrap'},
  stencilBack: {passOp: 'decrement-wrap'}
} satisfies RenderPipelineParameters;
```

Clear stencil to zero before counting. Draw a cover with `stencilCompare: 'not-equal'` and
a reference of zero to shade samples with nonzero winding. Opposite contributions cancel,
so an inner contour with opposite winding cuts a hole. Face overrides apply field by field.
Unspecified fields inherit the corresponding flat parameters and then the backend defaults.
The masks and dynamic reference are shared by both faces. An override such as
`stencilBack: {passOp: 'decrement-wrap'}` combines with a flat `stencilCompare` on both faces.
For this recipe, declare `depthStencilAttachmentFormat: 'depth24plus-stencil8'` when creating
the pipeline and use a framebuffer with the matching attachment.

Use a single color attachment for portable color write masks. With multiple color attachments,
the WebGL mask applies to all draw buffers and the WebGPU pipeline parameter applies to target
zero. Color mask bits 0 through 3 select red, green, blue, and alpha respectively.

## Diagnose an empty or unmasked draw

- Confirm the active framebuffer has stencil storage and that the pipeline declares the same format.
- Clear to a known value and verify the writing draw covers the region with the expected depth comparison.
- Check that the writing pipeline uses a modifying operation and a mask that includes the intended bits.
- When changing passes, verify the reader loads stencil and uses the reference and read mask you expect.
- Visualize a mask by drawing a solid color through the stencil comparison. For a regression test, read back the resulting color pixels.

See also [GPU parameters](/docs/api-guide/gpu/gpu-parameters), the
[RenderPass API](/docs/api-reference/core/resources/render-pass), and the
[WebGPU depth/stencil state specification](https://www.w3.org/TR/webgpu/#depth-stencil-state).

## Read stencil in a shader

On WebGL2, check `device.features.has('stencil-texturing-webgl')`. Create a stencil-only texture view with
`texture.createView({aspect: 'stencil-only'})` from an attachment created with sampling
usage. Bind it as `texture_2d<u32>` in WGSL or `usampler2D` in GLSL and use integer texel
loads. WebGPU provides stencil aspect views in core. WebGL2 requires
[WEBGL_stencil_texturing](https://registry.khronos.org/webgl/extensions/WEBGL_stencil_texturing/).
On WebGL2 the selected aspect belongs to the texture object. Use separate draws when
reading depth and stencil from the same packed texture.

## Allocate stencil without depth

Set `depthStencilAttachment: 'stencil8'` when a framebuffer only needs stencil. WebGPU
allocates a texture. WebGL2 allocates a framebuffer-owned renderbuffer and keeps the
`depthStencilAttachment` texture view null. The WebGL2 texture capability queries still
report `stencil8` as unsupported because they describe texture storage.

## Use multisampled stencil

Start with [the offscreen multisampling workflow](/docs/api-guide/gpu/gpu-antialiasing#explicit-multisampling).

For offscreen rendering, create a framebuffer with `samples: 4` and a packed
`depthStencilAttachment: 'depth24plus-stencil8'`. Set `sampleCount: 4` on each pipeline
drawing into it. The pass resolves color into the public single-sample color attachments.
Depth and stencil remain in multisampled storage for subsequent passes on the same
framebuffer. Only the resolved color attachments are portable sampling targets. Clear either aspect independently with the usual render-pass properties.
