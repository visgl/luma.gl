# Class: GroupNode

Defined in: [modules/engine/src/scenegraph/group-node.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L36)

## Extends[​](#extends "Direct link to Extends")

* [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new GroupNode**(`children`): `GroupNode`

Defined in: [modules/engine/src/scenegraph/group-node.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L41)

#### Parameters[​](#parameters "Direct link to Parameters")

##### children[​](#children "Direct link to children")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)\[]

#### Returns[​](#returns "Direct link to Returns")

`GroupNode`

#### Overrides[​](#overrides "Direct link to Overrides")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#constructor)

### Constructor[​](#constructor-1 "Direct link to Constructor")

> **new GroupNode**(`props?`): `GroupNode`

Defined in: [modules/engine/src/scenegraph/group-node.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L42)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`GroupNodeProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GroupNodeProps.md)

#### Returns[​](#returns-1 "Direct link to Returns")

`GroupNode`

#### Overrides[​](#overrides-1 "Direct link to Overrides")

`ScenegraphNode.constructor`

## Properties[​](#properties "Direct link to Properties")

### children[​](#children-1 "Direct link to children")

> **children**: [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)\[]

Defined in: [modules/engine/src/scenegraph/group-node.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L37)

***

### display[​](#display "Direct link to display")

> **display**: `boolean` = `true`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L34)

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`display`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#display)

***

### hoverable[​](#hoverable "Direct link to hoverable")

> **hoverable**: `boolean` = `true`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L38)

Local hover eligibility, independent of visibility.

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`hoverable`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#hoverable)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L31)

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`id`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#id)

***

### matrix[​](#matrix "Direct link to matrix")

> **matrix**: `Matrix4`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L32)

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`matrix`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#matrix)

***

### metadata[​](#metadata "Direct link to metadata")

> **metadata**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L43)

Structured metadata associated with this scene node.

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`metadata`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#metadata)

***

### position[​](#position "Direct link to position")

> **position**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L39)

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`position`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#position)

***

### props[​](#props-1 "Direct link to props")

> **props**: `ScenegraphNodeProps` = `{}`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L46)

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`props`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#props)

***

### rotation[​](#rotation "Direct link to rotation")

> **rotation**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L40)

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`rotation`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#rotation)

***

### scale[​](#scale "Direct link to scale")

> **scale**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L41)

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`scale`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#scale)

***

### selectable[​](#selectable "Direct link to selectable")

> **selectable**: `boolean` = `true`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L36)

Local selection eligibility, independent of visibility.

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`selectable`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#selectable)

***

### transformSource[​](#transformsource "Direct link to transformSource")

> **transformSource**: [`ScenegraphTransformSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/ScenegraphTransformSource.md) | `null`

Defined in: [modules/engine/src/scenegraph/group-node.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L39)

Optional evaluated GPU poses; authored matrices remain unchanged.

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L44)

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#userdata)

## Methods[​](#methods "Direct link to Methods")

### \_setScenegraphNodeProps()[​](#_setscenegraphnodeprops "Direct link to _setScenegraphNodeProps()")

> **\_setScenegraphNodeProps**(`props`): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:205](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L205)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

`ScenegraphNodeProps`

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`_setScenegraphNodeProps`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#_setscenegraphnodeprops)

***

### add()[​](#add "Direct link to add()")

> **add**(...`children`): `this`

Defined in: [modules/engine/src/scenegraph/group-node.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L77)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### children[​](#children-2 "Direct link to children")

...([`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md) | [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)\[])\[]

#### Returns[​](#returns-3 "Direct link to Returns")

`this`

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L63)

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

use .destroy()

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`delete`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/scenegraph/group-node.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L70)

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#destroy)

***

### findNode()[​](#findnode "Direct link to findNode()")

> **findNode**(`path`): [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md) | `undefined`

Defined in: [modules/engine/src/scenegraph/group-node.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L103)

Resolve one exact ID or path. Missing nodes return undefined; ambiguous paths throw.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### path[​](#path "Direct link to path")

`string`

#### Returns[​](#returns-6 "Direct link to Returns")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md) | `undefined`

***

### findNodes()[​](#findnodes "Direct link to findNodes()")

> **findNodes**(`path`): [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)\[]

Defined in: [modules/engine/src/scenegraph/group-node.ts:112](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L112)

Find structural matches in preorder, including hidden nodes and the search root.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### path[​](#path-1 "Direct link to path")

`string`

#### Returns[​](#returns-7 "Direct link to Returns")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)\[]

***

### getBounds()[​](#getbounds "Direct link to getBounds()")

> **getBounds**(): [`ScenegraphBounds`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphBounds.md) | `null`

Defined in: [modules/engine/src/scenegraph/group-node.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L56)

#### Returns[​](#returns-8 "Direct link to Returns")

[`ScenegraphBounds`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphBounds.md) | `null`

#### Overrides[​](#overrides-3 "Direct link to Overrides")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`getBounds`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#getbounds)

***

### getCoordinateUniforms()[​](#getcoordinateuniforms "Direct link to getCoordinateUniforms()")

> **getCoordinateUniforms**(`viewMatrix`, `modelMatrix?`): `object`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:153](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L153)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### viewMatrix[​](#viewmatrix "Direct link to viewMatrix")

`any`

##### modelMatrix?[​](#modelmatrix "Direct link to modelMatrix?")

`any`

#### Returns[​](#returns-9 "Direct link to Returns")

`object`

##### modelMatrix[​](#modelmatrix-1 "Direct link to modelMatrix")

> **modelMatrix**: `any`

##### objectMatrix[​](#objectmatrix "Direct link to objectMatrix")

> **objectMatrix**: `any`

##### viewMatrix[​](#viewmatrix-1 "Direct link to viewMatrix")

> **viewMatrix**: `any`

##### worldInverseMatrix[​](#worldinversematrix "Direct link to worldInverseMatrix")

> **worldInverseMatrix**: `any`

##### worldInverseTransposeMatrix[​](#worldinversetransposematrix "Direct link to worldInverseTransposeMatrix")

> **worldInverseTransposeMatrix**: `any`

##### worldMatrix[​](#worldmatrix "Direct link to worldMatrix")

> **worldMatrix**: `any`

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`getCoordinateUniforms`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#getcoordinateuniforms)

***

### preorderTraversal()[​](#preordertraversal "Direct link to preorderTraversal()")

> **preorderTraversal**(`visitor`, `__namedParameters?`): `void`

Defined in: [modules/engine/src/scenegraph/group-node.ts:209](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L209)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### visitor[​](#visitor "Direct link to visitor")

(`node`, `context`) => `void`

##### \_\_namedParameters?[​](#__namedparameters "Direct link to __namedParameters?")

###### worldMatrix?[​](#worldmatrix-1 "Direct link to worldMatrix?")

`Matrix4` = `...`

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

***

### remove()[​](#remove "Direct link to remove()")

> **remove**(`child`): `this`

Defined in: [modules/engine/src/scenegraph/group-node.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L88)

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### child[​](#child "Direct link to child")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)

#### Returns[​](#returns-11 "Direct link to Returns")

`this`

***

### removeAll()[​](#removeall "Direct link to removeAll()")

> **removeAll**(): `this`

Defined in: [modules/engine/src/scenegraph/group-node.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L97)

#### Returns[​](#returns-12 "Direct link to Returns")

`this`

***

### setMatrix()[​](#setmatrix "Direct link to setMatrix()")

> **setMatrix**(`matrix`, `copyMatrix?`): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L93)

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### matrix[​](#matrix-1 "Direct link to matrix")

`any`

##### copyMatrix?[​](#copymatrix "Direct link to copyMatrix?")

`boolean` = `true`

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setMatrix`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setmatrix)

***

### setMatrixComponents()[​](#setmatrixcomponents "Direct link to setMatrixComponents()")

> **setMatrixComponents**(`components`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L101)

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### components[​](#components "Direct link to components")

###### position?[​](#position-1 "Direct link to position?")

`any`

###### rotation?[​](#rotation-1 "Direct link to rotation?")

`any`

###### scale?[​](#scale-1 "Direct link to scale?")

`any`

###### update?[​](#update "Direct link to update?")

`boolean`

#### Returns[​](#returns-14 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setMatrixComponents`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setmatrixcomponents)

***

### setPosition()[​](#setposition "Direct link to setPosition()")

> **setPosition**(`position`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L75)

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### position[​](#position-2 "Direct link to position")

`any`

#### Returns[​](#returns-15 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setPosition`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setposition)

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L66)

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### props[​](#props-3 "Direct link to props")

`ScenegraphNodeProps`

#### Returns[​](#returns-16 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setProps`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setprops)

***

### setRotation()[​](#setrotation "Direct link to setRotation()")

> **setRotation**(`rotation`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L81)

#### Parameters[​](#parameters-13 "Direct link to Parameters")

##### rotation[​](#rotation-2 "Direct link to rotation")

`any`

#### Returns[​](#returns-17 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setRotation`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setrotation)

***

### setScale()[​](#setscale "Direct link to setScale()")

> **setScale**(`scale`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L87)

#### Parameters[​](#parameters-14 "Direct link to Parameters")

##### scale[​](#scale-2 "Direct link to scale")

`any`

#### Returns[​](#returns-18 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setScale`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setscale)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L71)

#### Returns[​](#returns-19 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-20 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#tostring)

***

### traverse()[​](#traverse "Direct link to traverse()")

> **traverse**(`visitor`, `__namedParameters?`): `void`

Defined in: [modules/engine/src/scenegraph/group-node.ts:150](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L150)

#### Parameters[​](#parameters-15 "Direct link to Parameters")

##### visitor[​](#visitor-1 "Direct link to visitor")

(`node`, `context`) => `void`

##### \_\_namedParameters?[​](#__namedparameters-1 "Direct link to __namedParameters?")

###### worldMatrix?[​](#worldmatrix-2 "Direct link to worldMatrix?")

`Matrix4` = `...`

#### Returns[​](#returns-20 "Direct link to Returns")

`void`

***

### traverseDepthSorted()[​](#traversedepthsorted "Direct link to traverseDepthSorted()")

> **traverseDepthSorted**(`visitor`, `__namedParameters`): `void`

Defined in: [modules/engine/src/scenegraph/group-node.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/group-node.ts#L173)

Visits leaf nodes ordered by the camera-space centers of their aggregate bounds.

#### Parameters[​](#parameters-16 "Direct link to Parameters")

##### visitor[​](#visitor-2 "Direct link to visitor")

(`node`, `context`) => `void`

##### \_\_namedParameters[​](#__namedparameters-2 "Direct link to __namedParameters")

[`DepthSortedTraversalOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/DepthSortedTraversalOptions.md)

#### Returns[​](#returns-21 "Direct link to Returns")

`void`

***

### update()[​](#update-1 "Direct link to update()")

> **update**(`__namedParameters?`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L137)

#### Parameters[​](#parameters-17 "Direct link to Parameters")

##### \_\_namedParameters?[​](#__namedparameters-3 "Direct link to __namedParameters?")

###### position?[​](#position-3 "Direct link to position?")

`any`

###### rotation?[​](#rotation-3 "Direct link to rotation?")

`any`

###### scale?[​](#scale-3 "Direct link to scale?")

`any`

#### Returns[​](#returns-22 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-21 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`update`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#update)

***

### updateMatrix()[​](#updatematrix "Direct link to updateMatrix()")

> **updateMatrix**(): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L123)

#### Returns[​](#returns-23 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-22 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`updateMatrix`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#updatematrix)
