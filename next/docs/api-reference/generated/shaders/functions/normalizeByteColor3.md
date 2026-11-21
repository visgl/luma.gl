# Function: normalizeByteColor3()

## Call Signature[​](#call-signature "Direct link to Call Signature")

> **normalizeByteColor3**(`color?`, `useByteColors?`): `NumberArray3`

Defined in: [lib/color/normalize-byte-colors.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L43)

Converts an RGB color to normalized numeric components without modifying the input.

JavaScript arrays use the legacy 0–255 convention unless `useByteColors` is false. `Uint8Array` and `Uint8ClampedArray` always contain bytes. Native `Float16Array`, `Float32Array`, and `Float64Array` always contain normalized values, regardless of the flag. This function changes numeric range only: it does not clamp values, convert color spaces, premultiply alpha, or decode half-float bit patterns stored in a `Uint16Array`.

A floating-point typed array of exactly three components is returned by reference, without allocation. Treat that result as borrowed: mutations are visible through the original array. Other inputs produce a new three-component JavaScript array; extra components are ignored. Float16 pass-through describes CPU values, not compatibility with every GPU upload API.

### Parameters[​](#parameters "Direct link to Parameters")

#### color?[​](#color "Direct link to color?")

readonly \[`number`, `number`, `number`] | `ByteColor`

At least three components; omitted input defaults to black.

#### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

`boolean`

Range of JavaScript arrays only; defaults to byte colors.

### Returns[​](#returns "Direct link to Returns")

`NumberArray3`

Normalized RGB components, borrowing an exactly sized floating-point input.

## Call Signature[​](#call-signature-1 "Direct link to Call Signature")

> **normalizeByteColor3**<`T`>(`color`, `useByteColors?`): `NumberArray3` | `T`

Defined in: [lib/color/normalize-byte-colors.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L47)

Converts an RGB color to normalized numeric components without modifying the input.

JavaScript arrays use the legacy 0–255 convention unless `useByteColors` is false. `Uint8Array` and `Uint8ClampedArray` always contain bytes. Native `Float16Array`, `Float32Array`, and `Float64Array` always contain normalized values, regardless of the flag. This function changes numeric range only: it does not clamp values, convert color spaces, premultiply alpha, or decode half-float bit patterns stored in a `Uint16Array`.

A floating-point typed array of exactly three components is returned by reference, without allocation. Treat that result as borrowed: mutations are visible through the original array. Other inputs produce a new three-component JavaScript array; extra components are ignored. Float16 pass-through describes CPU values, not compatibility with every GPU upload API.

### Type Parameters[​](#type-parameters "Direct link to Type Parameters")

#### T[​](#t "Direct link to T")

`T` *extends* `FloatColor`

### Parameters[​](#parameters-1 "Direct link to Parameters")

#### color[​](#color-1 "Direct link to color")

`T`

At least three components; omitted input defaults to black.

#### useByteColors?[​](#usebytecolors-1 "Direct link to useByteColors?")

`boolean`

Range of JavaScript arrays only; defaults to byte colors.

### Returns[​](#returns-1 "Direct link to Returns")

`NumberArray3` | `T`

Normalized RGB components, borrowing an exactly sized floating-point input.

## Call Signature[​](#call-signature-2 "Direct link to Call Signature")

> **normalizeByteColor3**(`color`, `useByteColors?`): `NumberArray3` | `FloatColor`

Defined in: [lib/color/normalize-byte-colors.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L51)

Converts an RGB color to normalized numeric components without modifying the input.

JavaScript arrays use the legacy 0–255 convention unless `useByteColors` is false. `Uint8Array` and `Uint8ClampedArray` always contain bytes. Native `Float16Array`, `Float32Array`, and `Float64Array` always contain normalized values, regardless of the flag. This function changes numeric range only: it does not clamp values, convert color spaces, premultiply alpha, or decode half-float bit patterns stored in a `Uint16Array`.

A floating-point typed array of exactly three components is returned by reference, without allocation. Treat that result as borrowed: mutations are visible through the original array. Other inputs produce a new three-component JavaScript array; extra components are ignored. Float16 pass-through describes CPU values, not compatibility with every GPU upload API.

### Parameters[​](#parameters-2 "Direct link to Parameters")

#### color[​](#color-2 "Direct link to color")

`ColorInput`

At least three components; omitted input defaults to black.

#### useByteColors?[​](#usebytecolors-2 "Direct link to useByteColors?")

`boolean`

Range of JavaScript arrays only; defaults to byte colors.

### Returns[​](#returns-2 "Direct link to Returns")

`NumberArray3` | `FloatColor`

Normalized RGB components, borrowing an exactly sized floating-point input.
