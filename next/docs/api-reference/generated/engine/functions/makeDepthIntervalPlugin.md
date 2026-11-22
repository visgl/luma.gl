# Function: makeDepthIntervalPlugin()

> **makeDepthIntervalPlugin**(`sampleCount`, `bindGroup?`): `ShaderPlugin`

Defined in: [modules/engine/src/shader-plugins/depth-interval.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-plugins/depth-interval.ts#L14)

WebGPU depth-bound filtering for a caller-owned texture matching the render target. Bind `depthIntervalBound` and a `vec4<u32>` uniform named `depthIntervalCompare`. A nonzero first component selects greater; zero selects less-equal. Pass framebuffer pixel coordinates, stored depth, and the host coverage mask. For MSAA, write the result to the fragment's `sample_mask` output.

## Parameters[​](#parameters "Direct link to Parameters")

### sampleCount[​](#samplecount "Direct link to sampleCount")

`number`

### bindGroup?[​](#bindgroup "Direct link to bindGroup?")

`number` = `1`

## Returns[​](#returns "Direct link to Returns")

`ShaderPlugin`
