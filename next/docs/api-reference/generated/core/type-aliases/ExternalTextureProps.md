# Type Alias: ExternalTextureProps

> **ExternalTextureProps** = [`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/external-texture.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/external-texture.ts#L10)

Properties for one concrete backend external texture binding snapshot.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### colorSpace?[​](#colorspace "Direct link to colorSpace?")

> `optional` **colorSpace?**: `"srgb"`

Color space requested when importing the browser-owned source.

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Height for handle-backed external textures when it cannot be inferred from source.

### sampler?[​](#sampler "Direct link to sampler?")

> `optional` **sampler?**: [`Sampler`](https://luma.gl/next/docs/api-reference/generated/core/classes/Sampler.md) | [`SamplerProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/SamplerProps.md)

Default sampler used when a shader exposes a paired `${name}Sampler` binding.

### source?[​](#source "Direct link to source?")

> `optional` **source?**: `HTMLVideoElement` | `VideoFrame`

Browser video source imported into this concrete WebGPU external binding.

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Width for handle-backed external textures when it cannot be inferred from source.
