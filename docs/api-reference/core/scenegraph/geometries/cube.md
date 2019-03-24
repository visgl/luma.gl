# Cube

A scenegraph model node with a [`CubeGeometry`](/docs/api-reference/core/geometries/cube-geometry).

## Usage

Create a `Cube`:

```js
import {Cube} from '@luma.gl/core';
const cube = new Cube(gl);
```

## Inheritance

`Cube` extends [`ModelNode`](/docs/api-reference/core/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/core/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

Creates a new Cube.

Accepts the same properties and options as `ModelNode` constructor but has preset for `vertices`, `normals` and `indices`.
