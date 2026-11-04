# Interface: TextureBindingSource

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-binding-source.d.ts:9

Engine-level source that resolves into a concrete core texture binding for one shader slot.

## Properties[​](#properties "Direct link to Properties")

### generation[​](#generation "Direct link to generation")

> `readonly` **generation**: `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-binding-source.d.ts:15

Monotonic binding generation advanced when concrete draw bindings may need recreation.

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-binding-source.d.ts:11

Stable resource identifier used in loading and debug messages.

***

### isReady[​](#isready "Direct link to isReady")

> `readonly` **isReady**: `boolean`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-binding-source.d.ts:13

Whether the source can resolve a concrete binding for the current draw.

***

### updateTimestamp[​](#updatetimestamp "Direct link to updateTimestamp")

> `readonly` **updateTimestamp**: `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-binding-source.d.ts:17

Device timestamp of the most recent source content or binding identity update.

## Methods[​](#methods "Direct link to Methods")

### resolveTextureBinding()[​](#resolvetexturebinding "Direct link to resolveTextureBinding()")

> **resolveTextureBinding**(`bindingLayout`): `Binding` | `null`

Defined in: modules/core/dist/dynamic/dynamic-texture/texture-binding-source.d.ts:23

Resolves this source for one reflected texture binding declaration.

#### Parameters[​](#parameters "Direct link to Parameters")

##### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

[`TextureBindingLayout`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TextureBindingLayout.md)

Reflected `texture` or `external-texture` shader slot.

#### Returns[​](#returns "Direct link to Returns")

`Binding` | `null`

A concrete core binding, or `null` while the source is not ready.
