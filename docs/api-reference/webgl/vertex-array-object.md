# VertexArrayObject (EXT)

A vertex array object is a WebGL object that stores all of the state needed to supply vertex data. While `VertexArrayObject`s are not available in basic WebGL1 environments, they are available by default in WebGL2 and via a commonly supported extension under WebGL1.

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Array_Object).


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

`VertexArrayObject` inherits from `Resource`.


### isSupported (static method)

Parameters:
* gl (WebGLRenderingContext) - gl context
Returns:
* Boolean - true if VertexArrayObjects are supported in the current environment.


### constructor

Creates a new VertexArrayObject

Parameters:
* gl (WebGLRenderingContext) - gl context


## Remarks
* The raw WebGL APIs for are working with `WebGLVertexArrayObject`s are exposed differently in the WebGL1 extension and WebGL2. As always, the luma.gl `VertexArrayObject` class transparently handles the necessary API detection and selection.
