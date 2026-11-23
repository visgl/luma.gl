import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# ScenegraphNode

<EngineDocsTabs group="scenegraph" active="scenegraph-node" />

`ScenegraphNode` is the base class for engine scenegraph objects.
It stores an id, transform state, a model matrix, and utility methods for updating that transform.

## Usage

```typescript
import {ScenegraphNode} from '@luma.gl/engine';

const node = new ScenegraphNode({position: [0, 1, 2]});
node.updateMatrix();
```

## Types

### `ScenegraphNodeProps`

```ts
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

## Properties

### `id`

Application-provided or auto-generated identifier.

### `matrix`

Current model matrix.

### `display`

Display flag stored on the node.

### `selectable`, `hoverable`

Local interaction eligibility flags, both defaulting to `true`. Any false value on a root-to-hit
path disables the corresponding action for that subtree. The flags are independent of `display`.

### `position`, `rotation`, `scale`

Transform components.

### `userData`

Application-owned metadata.

## Methods

### `constructor(props?: ScenegraphNodeProps)`

Creates a scenegraph node and initializes its transform state.

### `getBounds(): [number[], number[]] | null`

Base implementation returns `null`.

### `destroy(): void`

Base implementation is a no-op.

### `delete(): void`

Deprecated alias for `destroy()`.

### `setProps(props: ScenegraphNodeProps): this`

Applies node properties and updates the matrix.

### `setPosition(position): this`

Updates position.

### `setRotation(rotation): this`

Updates Euler or quaternion rotation.

### `setScale(scale): this`

Updates scale.

### `setMatrix(matrix, copyMatrix = true): void`

Replaces the model matrix directly.

### `setMatrixComponents({position, rotation, scale, update?}): this`

Updates transform components in one call.

### `updateMatrix(): this`

Recomputes the matrix from position, rotation, and scale.

### `update({position, rotation, scale} = {}): this`

Updates individual components and recomputes the matrix.

### `getCoordinateUniforms(viewMatrix, modelMatrix?): {...}`

Returns derived matrices useful for shaders.

## ScenegraphInteractionManager

`ScenegraphInteractionManager` consumes hit paths supplied by the application; it does not perform
ray casting or GPU picking. Each hit contains a root-to-target node path, and hits must be ordered
nearest first. A picker that returns only one hit must exclude ineligible objects before picking;
otherwise it cannot reveal a farther eligible hit. The manager skips paths disabled by ancestor flags
and reports bubbled selection and hover
entry/exit events. Hover state is tracked separately by controller index.

`select(hits, controllerIndex?)` returns the first eligible hit and emits selection events
from target to root. Events retain the original hit, including optional world-space point, ray origin
and application data. `updateHover(hits, controllerIndex?)` emits exits and entries only for the
parts of the old and new paths outside their shared ancestor prefix. `clearHover(controllerIndex?)`
emits exits and clears that controller. Call `updateHover` after changes to the pointer, camera,
geometry, or flags, supplying updated hits.

`isScenegraphInteractionEnabled(path, kind)` and `getFirstScenegraphInteractionHit(hits, kind)`
are available separately when an application manages its own events.
