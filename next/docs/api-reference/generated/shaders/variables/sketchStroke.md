# Variable: sketchStroke

> `const` **sketchStroke**: `object`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L140)

Fragment coverage for geometry-anchored pencil strokes and solid architectural lines.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `3`; `name`: `"sketchStroke"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object` = `defaults`

#### defaultUniforms.extension[​](#defaultuniformsextension "Direct link to defaultUniforms.extension")

> **extension**: `number` = `3`

#### defaultUniforms.grain[​](#defaultuniformsgrain "Direct link to defaultUniforms.grain")

> **grain**: `number` = `0.45`

#### defaultUniforms.jitter[​](#defaultuniformsjitter "Direct link to defaultUniforms.jitter")

> **jitter**: `number` = `0.7`

#### defaultUniforms.minimumAntialias[​](#defaultuniformsminimumantialias "Direct link to defaultUniforms.minimumAntialias")

> **minimumAntialias**: `number` = `0.7`

#### defaultUniforms.offset[​](#defaultuniformsoffset "Direct link to defaultUniforms.offset")

> **offset**: `number` = `0`

#### defaultUniforms.sketch[​](#defaultuniformssketch "Direct link to defaultUniforms.sketch")

> **sketch**: `number` = `1`

#### defaultUniforms.variation[​](#defaultuniformsvariation "Direct link to defaultUniforms.variation")

> **variation**: `number` = `0.35`

#### defaultUniforms.width[​](#defaultuniformswidth "Direct link to defaultUniforms.width")

> **width**: `number` = `2`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: `string`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"sketchStroke"` = `'sketchStroke'`

### source[​](#source "Direct link to source")

> **source**: "\nstruct sketchStrokeUniforms {\n width: f32,\n jitter: f32,\n variation: f32,\n grain: f32,\n offset: f32,\n extension: f32,\n sketch: f32,\n minimumAntialias: f32,\n};\n\@group(3) @binding(auto) var\<uniform> sketchStroke: sketchStrokeUniforms;\nfn sketchStroke\_noise(coordinate: f32) -> f32 {\n let cell = floor(coordinate);\n let fraction = fract(coordinate);\n let first = fract(sin(cell \* 127.1) \* 43758.5453);\n let second = fract(sin((cell + 1.0) \* 127.1) \* 43758.5453);\n return mix(first, second, fraction \* fraction \* (3.0 - 2.0 \* fraction));\n}\nfn sketchStroke\_noise2(coordinate: vec2\<f32>) -> f32 {\n let cell = floor(coordinate);\n var fraction = fract(coordinate);\n fraction = fraction \* fraction \* (vec2\<f32>(3.0) - 2.0 \* fraction);\n let first = fract(sin(dot(cell, vec2\<f32>(127.1, 311.7))) \* 43758.5453);\n let second = fract(sin(dot(cell + vec2\<f32>(1.0, 0.0), vec2\<f32>(127.1, 311.7))) \* 43758.5453);\n let third = fract(sin(dot(cell + vec2\<f32>(0.0, 1.0), vec2\<f32>(127.1, 311.7))) \* 43758.5453);\n let fourth = fract(sin(dot(cell + vec2\<f32>(1.0, 1.0), vec2\<f32>(127.1, 311.7))) \* 43758.5453);\n return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);\n}\nfn sketchStroke\_getCoverage(coordinates: vec2\<f32>, strokeLength: f32, seed: f32) -> f32 {\n let along = coordinates.x;\n let side = select(1.0, -1.0, sketchStroke\_noise(seed \* 29.0) < 0.5);\n let center = (sketchStroke\_noise(along \* strokeLength / 36.0 + seed \* 19.0) \* 2.0 - 1.0) \* sketchStroke.jitter \* sketchStroke.sketch + side \* sketchStroke.offset \* sketchStroke.sketch;\n let variation = mix(1.0, 0.55 + sketchStroke\_noise(along \* 31.0 + seed \* 7.0) \* 0.75, sketchStroke.variation \* sketchStroke.sketch);\n let grainCoordinates = vec2\<f32>(along \* strokeLength, coordinates.y) + vec2\<f32>(seed \* 17.0, seed \* 53.0);\n let coarseGrain = sketchStroke\_noise2(grainCoordinates \* 0.55);\n let fineGrain = sketchStroke\_noise2(grainCoordinates \* 2.8);\n let toothGrain = sketchStroke\_noise2(grainCoordinates \* 6.5);\n let grainTexture = coarseGrain \* 0.35 + fineGrain \* 0.4 + toothGrain \* 0.25;\n let edgeRoughness = (grainTexture - 0.5) \* sketchStroke.grain \* sketchStroke.sketch \* 0.7;\n let radius = sketchStroke.width \* 0.5 \* variation + edgeRoughness;\n let endDistance = max(-along, along - 1.0) \* strokeLength - sketchStroke.extension;\n let distance = max(abs(coordinates.y - center) - radius, endDistance);\n let antialias = max(fwidth(distance), max(sketchStroke.minimumAntialias, 0.0001));\n let coverage = 1.0 - smoothstep(-antialias \* 0.5, antialias \* 0.5, distance);\n // Keep the pigment opaque; grain changes the stroke edge so the paper does not show through as white flecks.\n return coverage;\n}\n"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.extension[​](#uniformtypesextension "Direct link to uniformTypes.extension")

> `readonly` **extension**: `"f32"` = `'f32'`

#### uniformTypes.grain[​](#uniformtypesgrain "Direct link to uniformTypes.grain")

> `readonly` **grain**: `"f32"` = `'f32'`

#### uniformTypes.jitter[​](#uniformtypesjitter "Direct link to uniformTypes.jitter")

> `readonly` **jitter**: `"f32"` = `'f32'`

#### uniformTypes.minimumAntialias[​](#uniformtypesminimumantialias "Direct link to uniformTypes.minimumAntialias")

> `readonly` **minimumAntialias**: `"f32"` = `'f32'`

#### uniformTypes.offset[​](#uniformtypesoffset "Direct link to uniformTypes.offset")

> `readonly` **offset**: `"f32"` = `'f32'`

#### uniformTypes.sketch[​](#uniformtypessketch "Direct link to uniformTypes.sketch")

> `readonly` **sketch**: `"f32"` = `'f32'`

#### uniformTypes.variation[​](#uniformtypesvariation "Direct link to uniformTypes.variation")

> `readonly` **variation**: `"f32"` = `'f32'`

#### uniformTypes.width[​](#uniformtypeswidth "Direct link to uniformTypes.width")

> `readonly` **width**: `"f32"` = `'f32'`

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "\nlayout(std140) uniform sketchStrokeUniforms {\n float width;\n float jitter;\n float variation;\n float grain;\n float offset;\n float extension;\n float sketch;\n float minimumAntialias;\n} sketchStroke;\n" = `uniformBlock`

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`): `object`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`SketchStrokeProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/SketchStrokeProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

##### extension[​](#extension "Direct link to extension")

> **extension**: `number` = `3`

Endpoint overshoot in stroke units; geometry must reserve this space.

##### grain[​](#grain "Direct link to grain")

> **grain**: `number` = `0.45`

Strength of pencil grain, from zero to one.

##### jitter[​](#jitter "Direct link to jitter")

> **jitter**: `number` = `0.7`

Maximum centerline displacement in transverse-coordinate units.

##### minimumAntialias[​](#minimumantialias "Direct link to minimumAntialias")

> **minimumAntialias**: `number` = `0.7`

Minimum edge smoothing in stroke units. Defaults to 0.7 for pixel-sized strokes.

##### offset[​](#offset "Direct link to offset")

> **offset**: `number` = `0`

Transverse screen-space displacement for a secondary hand-drawn pass.

##### sketch[​](#sketch "Direct link to sketch")

> **sketch**: `number` = `1`

Zero gives a solid stroke; one enables sketch shading.

##### variation[​](#variation "Direct link to variation")

> **variation**: `number` = `0.35`

Fractional width variation, from zero to one.

##### width[​](#width "Direct link to width")

> **width**: `number` = `2`

Full stroke width in the same units as the transverse coordinate.
