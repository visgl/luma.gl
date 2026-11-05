# Class: SceneMetadata

Defined in: [modules/engine/src/scenegraph/scene-metadata.ts:6](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scene-metadata.ts#L6)

A collection of source metadata associated with indexed scene resources.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new SceneMetadata**(): `SceneMetadata`

#### Returns[​](#returns "Direct link to Returns")

`SceneMetadata`

## Methods[​](#methods "Direct link to Methods")

### get()[​](#get "Direct link to get()")

> **get**(`category`, `index?`): `Readonly`<`Record`<`string`, `unknown`>> | `undefined`

Defined in: [modules/engine/src/scenegraph/scene-metadata.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scene-metadata.ts#L20)

Returns metadata for a resource, or undefined when none was supplied.

#### Parameters[​](#parameters "Direct link to Parameters")

##### category[​](#category "Direct link to category")

`string`

##### index?[​](#index "Direct link to index?")

`number` = `0`

#### Returns[​](#returns-1 "Direct link to Returns")

`Readonly`<`Record`<`string`, `unknown`>> | `undefined`

***

### set()[​](#set "Direct link to set()")

> **set**(`category`, `index`, `metadata`): `void`

Defined in: [modules/engine/src/scenegraph/scene-metadata.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scene-metadata.ts#L10)

Associates metadata with a resource category and its source index.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### category[​](#category-1 "Direct link to category")

`string`

##### index[​](#index-1 "Direct link to index")

`number`

##### metadata[​](#metadata "Direct link to metadata")

`Readonly`<`Record`<`string`, `unknown`>>

#### Returns[​](#returns-2 "Direct link to Returns")

`void`
