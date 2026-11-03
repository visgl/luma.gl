# Type Alias: VideoTextureProps

> **VideoTextureProps** = `Pick`<`ResourceProps`, `"id"`> & `object`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L11)

Properties for a live video binding source.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### colorSpace?[​](#colorspace "Direct link to colorSpace?")

> `optional` **colorSpace?**: `"srgb"`

Color space requested for copied or imported video data.

### sampler?[​](#sampler "Direct link to sampler?")

> `optional` **sampler?**: `Sampler` | `SamplerProps`

Default sampler used by copied and native external bindings.

### source[​](#source "Direct link to source")

> **source**: `HTMLVideoElement` | `VideoFrame`

Caller-owned live video source followed by this binding source.
