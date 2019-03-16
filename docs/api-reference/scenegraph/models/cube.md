# Cube

Create a white cube model. Inherits methods from [`Model`](/docs/api-reference/core/model.md)

## Usage

```js
import {Cube} from '@luma.gl/scenegraph';
const whiteCube = new Cube(gl, {
  colors: [1, 1, 1, 1]
});
```

## Inheritance

`Cube` extends [`ModelNode`](/docs/api-reference/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

Creates a new Cube.

Accepts the same properties and options as `ModelNode` constructor but has preset for `vertices`, `normals` and `indices`.
