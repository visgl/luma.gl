# Type Alias: SketchStrokeProps

> **SketchStrokeProps** = `object`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:7](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L7)

## Properties[​](#properties "Direct link to Properties")

### extension?[​](#extension "Direct link to extension?")

> `optional` **extension?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L19)

Endpoint overshoot in stroke units; geometry must reserve this space.

***

### grain?[​](#grain "Direct link to grain?")

> `optional` **grain?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L15)

Strength of pencil grain, from zero to one.

***

### jitter?[​](#jitter "Direct link to jitter?")

> `optional` **jitter?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L11)

Maximum centerline displacement in transverse-coordinate units.

***

### minimumAntialias?[​](#minimumantialias "Direct link to minimumAntialias?")

> `optional` **minimumAntialias?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L23)

Minimum edge smoothing in stroke units. Defaults to 0.7 for pixel-sized strokes.

***

### offset?[​](#offset "Direct link to offset?")

> `optional` **offset?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L17)

Transverse screen-space displacement for a secondary hand-drawn pass.

***

### sketch?[​](#sketch "Direct link to sketch?")

> `optional` **sketch?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L21)

Zero gives a solid stroke; one enables sketch shading.

***

### variation?[​](#variation "Direct link to variation?")

> `optional` **variation?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L13)

Fractional width variation, from zero to one.

***

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Defined in: [modules/geometry/sketch-stroke/sketch-stroke.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/sketch-stroke/sketch-stroke.ts#L9)

Full stroke width in the same units as the transverse coordinate.
