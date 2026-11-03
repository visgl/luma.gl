# Variable: valueNoise

> `const` **valueNoise**: `object`

Defined in: [modules/math/value-noise/value-noise.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/math/value-noise/value-noise.ts#L8)

Smooth, deterministic value noise shared by atmospheric shader modules.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nfloat valueNoise\_hash(vec2 cell) {\n vec3 value = fract(vec3(cell.x, cell.y, cell.x) \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise(vec2 position) {\n vec2 cell = floor(position);\n vec2 fraction = fract(position);\n vec2 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2(0.0, 1.0)), valueNoise\_hash(cell + vec2(1.0)), blend.x), blend.y);\n}\n\nfloat valueNoise\_hash3(vec3 cell) {\n vec3 value = fract(cell \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise3(vec3 position) {\n vec3 cell = floor(position);\n vec3 fraction = fract(position);\n vec3 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n float bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3(1.0, 1.0, 0.0)), blend.x), blend.y);\n float top = mix(mix(valueNoise\_hash3(cell + vec3(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"valueNoise"` = `'valueNoise'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nfn valueNoise\_hash(cell: vec2f) -> f32 {\n var value = fract(vec3f(cell.x, cell.y, cell.x) \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise(position: vec2f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec2f(3.0) - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2f(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2f(0.0, 1.0)), valueNoise\_hash(cell + vec2f(1.0)), blend.x), blend.y);\n}\n\nfn valueNoise\_hash3(cell: vec3f) -> f32 {\n var value = fract(cell \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise3(position: vec3f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec3f(3.0) - 2.0 \* fraction);\n let bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3f(1.0, 1.0, 0.0)), blend.x), blend.y);\n let top = mix(mix(valueNoise\_hash3(cell + vec3f(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"
