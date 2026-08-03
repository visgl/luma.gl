# Type Alias: SamplerProps

> **SamplerProps** = [`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/sampler.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/sampler.ts#L18)

Properties for initializing a sampler

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### addressModeU?[​](#addressmodeu "Direct link to addressModeU?")

> `optional` **addressModeU?**: `"clamp-to-edge"` | `"repeat"` | `"mirror-repeat"`

Edge value sampling in X direction

### addressModeV?[​](#addressmodev "Direct link to addressModeV?")

> `optional` **addressModeV?**: `"clamp-to-edge"` | `"repeat"` | `"mirror-repeat"`

Edge value sampling in Y direction

### addressModeW?[​](#addressmodew "Direct link to addressModeW?")

> `optional` **addressModeW?**: `"clamp-to-edge"` | `"repeat"` | `"mirror-repeat"`

Edge value sampling in Z direction

### compare?[​](#compare "Direct link to compare?")

> `optional` **compare?**: [`CompareFunction`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompareFunction.md)

How to compare reference values provided in shader shadow sampler calls with those pulled from the texture

### lodMaxClamp?[​](#lodmaxclamp "Direct link to lodMaxClamp?")

> `optional` **lodMaxClamp?**: `number`

Affects the mipmap image selection

### lodMinClamp?[​](#lodminclamp "Direct link to lodMinClamp?")

> `optional` **lodMinClamp?**: `number`

Affects the mipmap image selection

### magFilter?[​](#magfilter "Direct link to magFilter?")

> `optional` **magFilter?**: `"nearest"` | `"linear"`

Magnification: the area of the fragment in texture space is smaller than a texel

### maxAnisotropy?[​](#maxanisotropy "Direct link to maxAnisotropy?")

> `optional` **maxAnisotropy?**: `number`

Maximum number of samples that can be taken of the texture during any one texture fetch

### minFilter?[​](#minfilter "Direct link to minFilter?")

> `optional` **minFilter?**: `"nearest"` | `"linear"`

Minification: the area of the fragment in texture space is larger than a texel

### mipmapFilter?[​](#mipmapfilter "Direct link to mipmapFilter?")

> `optional` **mipmapFilter?**: `"none"` | `"nearest"` | `"linear"`

mipmapping: select between multiple mipmaps based on angle and size of the texture relative to the screen.

### type?[​](#type "Direct link to type?")

> `optional` **type?**: `"color-sampler"` | `"comparison-sampler"`

Comparison / shadow samplers are used with depth textures. See the `Sampler.compare` field
