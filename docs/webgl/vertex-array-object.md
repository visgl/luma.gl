# VertexArrayObject


* `VertexArrayObject`s are not available in basic WebGL1 environments. They are available by default in WebGL2 and via a commonly supported extension under WebGL1.

## Usage

Creating a VertexArrayObject
```js
import {VertexArrayObject} from 'luma.gl';
if (VertexArrayObject.isSupported(gl)) {
  return new VertexArrayObject(gl)
}
```

Adding attributes to a VertexArrayObject
```js
const vertexArrayObject = new VertexArrayObject(gl);
vertexArrayObject.bind();
vertexArrayObject.unbind();
```

Deleting a VertexArrayObject
```js
vertexArrayObject.delete();
```

## Methods

`VertexArrayObject` inherits from `Resource` and has all the methods

### `VertexArrayObject.isSupported`

Parameters:
* gl (WebGLRenderingContext) - gl context
Returns:
* Boolean - true if VertexArrayObjects are supported on the environment

### `VertexArrayObject` constructor

Creates a new VertexArrayObject

Parameters:
* gl (WebGLRenderingContext) - gl context


## Remarks
* The raw WebGL APIs for are working with `WebGLVertexArrayObject`s are exposed differently in the WebGL1 extension and WebGL2. The luma.gl `VertexArrayObject` class transparently handles the necessary API detection and selection.


