# Class: ModelNode

Defined in: [modules/engine/src/scenegraph/model-node.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L25)

## Extends[​](#extends "Direct link to Extends")

* [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ModelNode**(`props`): `ModelNode`

Defined in: [modules/engine/src/scenegraph/model-node.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L36)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`ModelNodeProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ModelNodeProps.md)

#### Returns[​](#returns "Direct link to Returns")

`ModelNode`

#### Overrides[​](#overrides "Direct link to Overrides")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### bounds[​](#bounds "Direct link to bounds")

> **bounds**: [`ScenegraphBounds`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphBounds.md) | `null` = `null`

Defined in: [modules/engine/src/scenegraph/model-node.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L28)

***

### display[​](#display "Direct link to display")

> **display**: `boolean` = `true`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L30)

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`display`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#display)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L27)

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`id`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#id)

***

### instanceMatrices[​](#instancematrices "Direct link to instanceMatrices")

> `readonly` **instanceMatrices**: readonly `NumericArray`\[] | `null`

Defined in: [modules/engine/src/scenegraph/model-node.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L27)

***

### managedResources[​](#managedresources "Direct link to managedResources")

> **managedResources**: `any`\[]

Defined in: [modules/engine/src/scenegraph/model-node.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L29)

***

### matrix[​](#matrix "Direct link to matrix")

> **matrix**: `Matrix4`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L28)

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`matrix`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#matrix)

***

### model[​](#model "Direct link to model")

> `readonly` **model**: [`Model`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Model.md)

Defined in: [modules/engine/src/scenegraph/model-node.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L26)

***

### position[​](#position "Direct link to position")

> **position**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L31)

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`position`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#position)

***

### props[​](#props-1 "Direct link to props")

> **props**: `ScenegraphNodeProps` = `{}`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L36)

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`props`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#props)

***

### rotation[​](#rotation "Direct link to rotation")

> **rotation**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L32)

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`rotation`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#rotation)

***

### scale[​](#scale "Direct link to scale")

> **scale**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L33)

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`scale`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#scale)

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L34)

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#userdata)

## Methods[​](#methods "Direct link to Methods")

### \_setScenegraphNodeProps()[​](#_setscenegraphnodeprops "Direct link to _setScenegraphNodeProps()")

> **\_setScenegraphNodeProps**(`props`): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:195](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L195)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

`ScenegraphNodeProps`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`_setScenegraphNodeProps`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#_setscenegraphnodeprops)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L53)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

use .destroy()

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`delete`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/scenegraph/model-node.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L51)

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#destroy)

***

### draw()[​](#draw "Direct link to draw()")

> **draw**(`renderPass`): `boolean`

Defined in: [modules/engine/src/scenegraph/model-node.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L66)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### renderPass[​](#renderpass "Direct link to renderPass")

`RenderPass`

#### Returns[​](#returns-4 "Direct link to Returns")

`boolean`

***

### getBounds()[​](#getbounds "Direct link to getBounds()")

> **getBounds**(): \[`number`\[], `number`\[]] | `null`

Defined in: [modules/engine/src/scenegraph/model-node.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L61)

#### Returns[​](#returns-5 "Direct link to Returns")

\[`number`\[], `number`\[]] | `null`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`getBounds`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#getbounds)

***

### getCoordinateUniforms()[​](#getcoordinateuniforms "Direct link to getCoordinateUniforms()")

> **getCoordinateUniforms**(`viewMatrix`, `modelMatrix?`): `object`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L143)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### viewMatrix[​](#viewmatrix "Direct link to viewMatrix")

`any`

##### modelMatrix?[​](#modelmatrix "Direct link to modelMatrix?")

`any`

#### Returns[​](#returns-6 "Direct link to Returns")

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

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`getCoordinateUniforms`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#getcoordinateuniforms)

***

### setMatrix()[​](#setmatrix "Direct link to setMatrix()")

> **setMatrix**(`matrix`, `copyMatrix?`): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L83)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### matrix[​](#matrix-1 "Direct link to matrix")

`any`

##### copyMatrix?[​](#copymatrix "Direct link to copyMatrix?")

`boolean` = `true`

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setMatrix`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setmatrix)

***

### setMatrixComponents()[​](#setmatrixcomponents "Direct link to setMatrixComponents()")

> **setMatrixComponents**(`components`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L91)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### components[​](#components "Direct link to components")

###### position?[​](#position-1 "Direct link to position?")

`any`

###### rotation?[​](#rotation-1 "Direct link to rotation?")

`any`

###### scale?[​](#scale-1 "Direct link to scale?")

`any`

###### update?[​](#update "Direct link to update?")

`boolean`

#### Returns[​](#returns-8 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setMatrixComponents`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setmatrixcomponents)

***

### setPosition()[​](#setposition "Direct link to setPosition()")

> **setPosition**(`position`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L65)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### position[​](#position-2 "Direct link to position")

`any`

#### Returns[​](#returns-9 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setPosition`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setposition)

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L56)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### props[​](#props-3 "Direct link to props")

`ScenegraphNodeProps`

#### Returns[​](#returns-10 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setProps`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setprops)

***

### setRotation()[​](#setrotation "Direct link to setRotation()")

> **setRotation**(`rotation`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L71)

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### rotation[​](#rotation-2 "Direct link to rotation")

`any`

#### Returns[​](#returns-11 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setRotation`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setrotation)

***

### setScale()[​](#setscale "Direct link to setScale()")

> **setScale**(`scale`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L77)

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### scale[​](#scale-2 "Direct link to scale")

`any`

#### Returns[​](#returns-12 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`setScale`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#setscale)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L61)

#### Returns[​](#returns-13 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#tostring)

***

### update()[​](#update-1 "Direct link to update()")

> **update**(`__namedParameters?`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L127)

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### \_\_namedParameters?[​](#__namedparameters "Direct link to __namedParameters?")

###### position?[​](#position-3 "Direct link to position?")

`any`

###### rotation?[​](#rotation-3 "Direct link to rotation?")

`any`

###### scale?[​](#scale-3 "Direct link to scale?")

`any`

#### Returns[​](#returns-14 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`update`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#update)

***

### updateMatrix()[​](#updatematrix "Direct link to updateMatrix()")

> **updateMatrix**(): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L113)

#### Returns[​](#returns-15 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md).[`updateMatrix`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md#updatematrix)
