# ScenegraphNode

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
