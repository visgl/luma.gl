# ScenegraphNode

[Workflow](https://luma.gl/next/docs/api-guide/engine/scenegraph.md)[Controllers](https://luma.gl/next/docs/api-guide/engine/scene-controllers.md)[Physics](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md)[ScenegraphNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/scenegraph-node.md)[GroupNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/group-node.md)[ModelNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/model-node.md)

`ScenegraphNode` is the base class for engine scenegraph objects. It stores an id, transform state, a model matrix, and utility methods for updating that transform.

## Usage[​](#usage "Direct link to Usage")

```
import {ScenegraphNode} from '@luma.gl/engine';



const node = new ScenegraphNode({position: [0, 1, 2]});

node.updateMatrix();
```

## Types[​](#types "Direct link to Types")

### `ScenegraphNodeProps`[​](#scenegraphnodeprops "Direct link to scenegraphnodeprops")

```
export type ScenegraphNodeProps = {

  id?: string;

  display?: boolean;

  selectable?: boolean;

  hoverable?: boolean;

  matrix?: NumericArray;

  position?: NumericArray;

  rotation?: NumericArray;

  scale?: NumericArray;

  update?: boolean;

};
```

## Properties[​](#properties "Direct link to Properties")

### `id`[​](#id "Direct link to id")

Application-provided or auto-generated identifier.

### `matrix`[​](#matrix "Direct link to matrix")

Current model matrix.

### `display`[​](#display "Direct link to display")

Display flag stored on the node.

### `selectable`, `hoverable`[​](#selectable-hoverable "Direct link to selectable-hoverable")

Local interaction eligibility flags, both defaulting to `true`. Any false value on a root-to-hit path disables the corresponding action for that subtree. The flags are independent of `display`.

### `position`, `rotation`, `scale`[​](#position-rotation-scale "Direct link to position-rotation-scale")

Transform components.

### `userData`[​](#userdata "Direct link to userdata")

Application-owned metadata.

## Methods[​](#methods "Direct link to Methods")

### `constructor(props?: ScenegraphNodeProps)`[​](#constructorprops-scenegraphnodeprops "Direct link to constructorprops-scenegraphnodeprops")

Creates a scenegraph node and initializes its transform state.

### `getBounds(): [number[], number[]] | null`[​](#getbounds-number-number--null "Direct link to getbounds-number-number--null")

Base implementation returns `null`.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Base implementation is a no-op.

### `delete(): void`[​](#delete-void "Direct link to delete-void")

Deprecated alias for `destroy()`.

### `setProps(props: ScenegraphNodeProps): this`[​](#setpropsprops-scenegraphnodeprops-this "Direct link to setpropsprops-scenegraphnodeprops-this")

Applies node properties and updates the matrix.

### `setPosition(position): this`[​](#setpositionposition-this "Direct link to setpositionposition-this")

Updates position.

### `setRotation(rotation): this`[​](#setrotationrotation-this "Direct link to setrotationrotation-this")

Updates Euler or quaternion rotation.

### `setScale(scale): this`[​](#setscalescale-this "Direct link to setscalescale-this")

Updates scale.

### `setMatrix(matrix, copyMatrix = true): void`[​](#setmatrixmatrix-copymatrix--true-void "Direct link to setmatrixmatrix-copymatrix--true-void")

Replaces the model matrix directly.

### `setMatrixComponents({position, rotation, scale, update?}): this`[​](#setmatrixcomponentsposition-rotation-scale-update-this "Direct link to setmatrixcomponentsposition-rotation-scale-update-this")

Updates transform components in one call.

### `updateMatrix(): this`[​](#updatematrix-this "Direct link to updatematrix-this")

Recomputes the matrix from position, rotation, and scale.

### `update({position, rotation, scale} = {}): this`[​](#updateposition-rotation-scale---this "Direct link to updateposition-rotation-scale---this")

Updates individual components and recomputes the matrix.

### `getCoordinateUniforms(viewMatrix, modelMatrix?): {...}`[​](#getcoordinateuniformsviewmatrix-modelmatrix- "Direct link to getcoordinateuniformsviewmatrix-modelmatrix-")

Returns derived matrices useful for shaders.

## ScenegraphInteractionManager[​](#scenegraphinteractionmanager "Direct link to ScenegraphInteractionManager")

`ScenegraphInteractionManager` consumes hit paths supplied by the application; it does not perform ray casting or GPU picking. Each hit contains a root-to-target node path, and hits must be ordered nearest first. A picker that returns only one hit must exclude ineligible objects before picking; otherwise it cannot reveal a farther eligible hit. The manager skips paths disabled by ancestor flags and reports bubbled selection and hover entry/exit events. Hover state is tracked separately by controller index.

`select(hits, controllerIndex?)` returns the first eligible hit and emits selection events from target to root. Events retain the original hit, including optional world-space point, ray origin and application data. `updateHover(hits, controllerIndex?)` emits exits and entries only for the parts of the old and new paths outside their shared ancestor prefix. `clearHover(controllerIndex?)` emits exits and clears that controller. Call `updateHover` after changes to the pointer, camera, geometry, or flags, supplying updated hits.

`isScenegraphInteractionEnabled(path, kind)` and `getFirstScenegraphInteractionHit(hits, kind)` are available separately when an application manages its own events.
