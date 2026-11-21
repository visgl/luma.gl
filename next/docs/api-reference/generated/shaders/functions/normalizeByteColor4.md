# Function: normalizeByteColor4()

## Call Signature[​](#call-signature "Direct link to Call Signature")

> **normalizeByteColor4**(`color`, `useByteColors?`): `NumberArray4`

Defined in: [lib/color/normalize-byte-colors.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L86)

Converts an RGB or RGBA color to normalized RGBA components without modifying the input.

JavaScript arrays use `useByteColors` (bytes by default). Byte typed arrays always use 0–255 components; native Float16/Float32/Float64 arrays always use normalized components. Missing or non-finite alpha means opaque: 255 in byte space or 1 in normalized space, resulting in an output alpha of 1. Explicit zero alpha remains transparent. Components are not clamped, gamma-corrected, or premultiplied.

A floating-point typed array of exactly four components with finite alpha is returned unchanged, without allocation. The result aliases the caller's storage; do not mutate it unless that is intended. RGB inputs, byte inputs, untyped inputs, extra-long inputs, and inputs needing alpha repair produce a new four-component JavaScript array. No intermediate slices or mapped arrays are allocated. Native Float16 values are supported, but raw half-float bits in Uint16Array are not; GPU upload compatibility is the caller's responsibility.

### Parameters[​](#parameters "Direct link to Parameters")

#### color[​](#color "Direct link to color")

readonly \[`number`, `number`, `number`] | readonly \[`number`, `number`, `number`, `number`] | `ByteColor`

At least RGB components, optionally followed by alpha.

#### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

`boolean`

Range of JavaScript arrays only; ignored for typed inputs.

### Returns[​](#returns "Direct link to Returns")

`NumberArray4`

Normalized RGBA with opaque fallback alpha, borrowing eligible float inputs.

## Call Signature[​](#call-signature-1 "Direct link to Call Signature")

> **normalizeByteColor4**<`T`>(`color`, `useByteColors?`): `NumberArray4` | `T`

Defined in: [lib/color/normalize-byte-colors.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L90)

Converts an RGB or RGBA color to normalized RGBA components without modifying the input.

JavaScript arrays use `useByteColors` (bytes by default). Byte typed arrays always use 0–255 components; native Float16/Float32/Float64 arrays always use normalized components. Missing or non-finite alpha means opaque: 255 in byte space or 1 in normalized space, resulting in an output alpha of 1. Explicit zero alpha remains transparent. Components are not clamped, gamma-corrected, or premultiplied.

A floating-point typed array of exactly four components with finite alpha is returned unchanged, without allocation. The result aliases the caller's storage; do not mutate it unless that is intended. RGB inputs, byte inputs, untyped inputs, extra-long inputs, and inputs needing alpha repair produce a new four-component JavaScript array. No intermediate slices or mapped arrays are allocated. Native Float16 values are supported, but raw half-float bits in Uint16Array are not; GPU upload compatibility is the caller's responsibility.

### Type Parameters[​](#type-parameters "Direct link to Type Parameters")

#### T[​](#t "Direct link to T")

`T` *extends* `FloatColor`

### Parameters[​](#parameters-1 "Direct link to Parameters")

#### color[​](#color-1 "Direct link to color")

`T`

At least RGB components, optionally followed by alpha.

#### useByteColors?[​](#usebytecolors-1 "Direct link to useByteColors?")

`boolean`

Range of JavaScript arrays only; ignored for typed inputs.

### Returns[​](#returns-1 "Direct link to Returns")

`NumberArray4` | `T`

Normalized RGBA with opaque fallback alpha, borrowing eligible float inputs.

## Call Signature[​](#call-signature-2 "Direct link to Call Signature")

> **normalizeByteColor4**(`color`, `useByteColors?`): `NumberArray4` | `FloatColor`

Defined in: [lib/color/normalize-byte-colors.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L94)

Converts an RGB or RGBA color to normalized RGBA components without modifying the input.

JavaScript arrays use `useByteColors` (bytes by default). Byte typed arrays always use 0–255 components; native Float16/Float32/Float64 arrays always use normalized components. Missing or non-finite alpha means opaque: 255 in byte space or 1 in normalized space, resulting in an output alpha of 1. Explicit zero alpha remains transparent. Components are not clamped, gamma-corrected, or premultiplied.

A floating-point typed array of exactly four components with finite alpha is returned unchanged, without allocation. The result aliases the caller's storage; do not mutate it unless that is intended. RGB inputs, byte inputs, untyped inputs, extra-long inputs, and inputs needing alpha repair produce a new four-component JavaScript array. No intermediate slices or mapped arrays are allocated. Native Float16 values are supported, but raw half-float bits in Uint16Array are not; GPU upload compatibility is the caller's responsibility.

### Parameters[​](#parameters-2 "Direct link to Parameters")

#### color[​](#color-2 "Direct link to color")

`ColorInput`

At least RGB components, optionally followed by alpha.

#### useByteColors?[​](#usebytecolors-2 "Direct link to useByteColors?")

`boolean`

Range of JavaScript arrays only; ignored for typed inputs.

### Returns[​](#returns-2 "Direct link to Returns")

`NumberArray4` | `FloatColor`

Normalized RGBA with opaque fallback alpha, borrowing eligible float inputs.
