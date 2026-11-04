# Variable: random

> `const` **random**: `object`

Defined in: [modules/math/random/random.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/math/random/random.ts#L21)

Quick random generator for fragment shaders

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### fs[​](#fs "Direct link to fs")

> **fs**: "float random(vec3 scale, float seed) {\n /\* use the fragment position for a different seed per-pixel \*/\n return fract(sin(dot(gl\_FragCoord.xyz + seed, scale)) \* 43758.5453 + seed);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"random"` = `'random'`

### source[​](#source "Direct link to source")

> **source**: "fn random(scale: vec3f, seed: f32) -> f32 {\n return fract(sin(dot(scale + vec3f(seed), vec3f(12.9898, 78.233, 151.7182))) \* 43758.5453 + seed);\n}\n"
