# Class: ScenegraphNode

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L26)

## Extended by[​](#extended-by "Direct link to Extended by")

* [`GroupNode`](https://luma.gl/docs/api-reference/generated/engine/classes/GroupNode.md)
* [`GeometryNode`](https://luma.gl/docs/api-reference/generated/engine/classes/GeometryNode.md)
* [`ModelNode`](https://luma.gl/docs/api-reference/generated/engine/classes/ModelNode.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ScenegraphNode**(`props?`): `ScenegraphNode`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L38)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

`ScenegraphNodeProps` = `{}`

#### Returns[​](#returns "Direct link to Returns")

`ScenegraphNode`

## Properties[​](#properties "Direct link to Properties")

### display[​](#display "Direct link to display")

> **display**: `boolean` = `true`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L30)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L27)

***

### matrix[​](#matrix "Direct link to matrix")

> **matrix**: `Matrix4`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L28)

***

### position[​](#position "Direct link to position")

> **position**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L31)

***

### props[​](#props-1 "Direct link to props")

> **props**: `ScenegraphNodeProps` = `{}`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L36)

***

### rotation[​](#rotation "Direct link to rotation")

> **rotation**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L32)

***

### scale[​](#scale "Direct link to scale")

> **scale**: `Vector3`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L33)

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L34)

## Methods[​](#methods "Direct link to Methods")

### \_setScenegraphNodeProps()[​](#_setscenegraphnodeprops "Direct link to _setScenegraphNodeProps()")

> **\_setScenegraphNodeProps**(`props`): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:195](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L195)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

`ScenegraphNodeProps`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L53)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

use .destroy()

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L50)

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

***

### getBounds()[​](#getbounds "Direct link to getBounds()")

> **getBounds**(): \[`number`\[], `number`\[]] | `null`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L46)

#### Returns[​](#returns-4 "Direct link to Returns")

\[`number`\[], `number`\[]] | `null`

***

### getCoordinateUniforms()[​](#getcoordinateuniforms "Direct link to getCoordinateUniforms()")

> **getCoordinateUniforms**(`viewMatrix`, `modelMatrix?`): `object`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L143)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### viewMatrix[​](#viewmatrix "Direct link to viewMatrix")

`any`

##### modelMatrix?[​](#modelmatrix "Direct link to modelMatrix?")

`any`

#### Returns[​](#returns-5 "Direct link to Returns")

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

***

### setMatrix()[​](#setmatrix "Direct link to setMatrix()")

> **setMatrix**(`matrix`, `copyMatrix?`): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L83)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### matrix[​](#matrix-1 "Direct link to matrix")

`any`

##### copyMatrix?[​](#copymatrix "Direct link to copyMatrix?")

`boolean` = `true`

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### setMatrixComponents()[​](#setmatrixcomponents "Direct link to setMatrixComponents()")

> **setMatrixComponents**(`components`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L91)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### components[​](#components "Direct link to components")

###### position?[​](#position-1 "Direct link to position?")

`any`

###### rotation?[​](#rotation-1 "Direct link to rotation?")

`any`

###### scale?[​](#scale-1 "Direct link to scale?")

`any`

###### update?[​](#update "Direct link to update?")

`boolean`

#### Returns[​](#returns-7 "Direct link to Returns")

`this`

***

### setPosition()[​](#setposition "Direct link to setPosition()")

> **setPosition**(`position`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L65)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### position[​](#position-2 "Direct link to position")

`any`

#### Returns[​](#returns-8 "Direct link to Returns")

`this`

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L56)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### props[​](#props-3 "Direct link to props")

`ScenegraphNodeProps`

#### Returns[​](#returns-9 "Direct link to Returns")

`this`

***

### setRotation()[​](#setrotation "Direct link to setRotation()")

> **setRotation**(`rotation`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L71)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### rotation[​](#rotation-2 "Direct link to rotation")

`any`

#### Returns[​](#returns-10 "Direct link to Returns")

`this`

***

### setScale()[​](#setscale "Direct link to setScale()")

> **setScale**(`scale`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L77)

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### scale[​](#scale-2 "Direct link to scale")

`any`

#### Returns[​](#returns-11 "Direct link to Returns")

`this`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L61)

#### Returns[​](#returns-12 "Direct link to Returns")

`string`

***

### update()[​](#update-1 "Direct link to update()")

> **update**(`__namedParameters?`): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L127)

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### \_\_namedParameters?[​](#__namedparameters "Direct link to __namedParameters?")

###### position?[​](#position-3 "Direct link to position?")

`any`

###### rotation?[​](#rotation-3 "Direct link to rotation?")

`any`

###### scale?[​](#scale-3 "Direct link to scale?")

`any`

#### Returns[​](#returns-13 "Direct link to Returns")

`this`

***

### updateMatrix()[​](#updatematrix "Direct link to updateMatrix()")

> **updateMatrix**(): `this`

Defined in: [modules/engine/src/scenegraph/scenegraph-node.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-node.ts#L113)

#### Returns[​](#returns-14 "Direct link to Returns")

`this`
