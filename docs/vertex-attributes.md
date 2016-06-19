---
layout: docs
title: Vertex Attributes
categories: [Documentation]
---

WebGL provides an API to manipulate the global "vertex attributes array",
which is where vertex data is staged for vertex shader execution. This API is
somewhat hard to learn for OpenGL newcomers so luma.gl provides this thin
wrapper module to simplify its use.


Module: VertexAttributes {#VertexAttributes}
============================================

This module offers set of functions for manipulating WebGL's global
"vertex attributes array". Essentially, this module collects all
WebGL `gl.vertexAttrib*` methods and `gl.VERTEX_ATTRIB_ARRAY_*` queries
in a small JavaScript friendly package.

**Note** It is usually not necessary to manipulate the vertex attributes array
directly in luma.gl applications. It is often simpler to just supply
named attribute buffers to the [`Model`](model.html) class, and rely on
that class to automatically manage the vertex attributes array before
running a program (e.g. when rendering, picking etc).


### Overview of Vertex Attributes

In WebGL, **vertex attributes** (often just called **attributes**)
are input data to the Vertex Shader, the first shader stage in the
GPU rendering pipeline.

These vertex attributes are stored in a conceptual global array with indices
from 0 and up. At the start of shader execution, these indices (or 'locations')
are matched to small integer indices assigned to shader attributes during shader
compilation and program linking. This makes the data the application has
set up in the vertex attributes available during shader execution.
Vertex attributes thus represent one of the primary mechanisms for
communication between JavaScript code and GLSL shader code.


### Vertex Attribute Values and Properties

Each vertex attribute has these properties:

- A value (constant or a buffered array with one set of values per vertex)
  that is accessible in shaders
- Enabled status: Can be enabled or disabled
- Data layout information:
  size (1-4 values per vertex), type, offset, stride
- **WebGL2/Extension** An instance `divisor` (which enables/disables instancing)
- An integer normalization policy (see below)
- **WebGL2** An integer conversion policy (see below)

Normally attributes are set to a [`WebGLBuffer`](buffer.html)
that stores unique values for each vertex/instance, combined with
information about the layout of data in the memory managed by the buffer.

Attributes can also be set to what WebGL calls a "generic" value.
This single value will then be passed to every invocation of the vertex shader
effectively representing a constant attribute value. A typical example could
be to specify a single color for all vertices, instead of providing a buffer
with unique colors per vertex (assuming a vertex shader expecting an attribute
containing color information).


### Integer to Float Conversion and Normalization

Integer values in attributes (e.g in an `Int32Array`) are converted
to floats before being passed to the shader.

In addition, normalization, maps values stored in an integer format to
a normalized floating point range before they are passed to the shader:

* `[-1,1]` (SNORM, for signed integers)
* `[0,1]` (UNORM, for unsigned integers)

In WebGL2, it is possible to disable automatic conversion of integers to
integers, enabling shaders to work directly with integer values.
This works with all the integer types: `gl.BYTE`, `gl.UNSIGNED_BYTE`,
`gl.SHORT`, `gl.UNSIGNED_SHORT`, `gl.INT` and `gl.UNSIGNED_INT`.


### Instancing (Divisors)

Instancing requires a WebGL extension or WebGL2.

* The divisor modifies the rate at which generic vertex attributes advance
  when rendering multiple instances of primitives in a single draw call.
* If divisor is zero, the attribute at slot index advances once per vertex.
* If divisor is non-zero, the attribute advances once per divisor instances
  of the set(s) of vertices being rendered.
* An attribute is referred to as **instanced** if its divisor value is non-zero.


## Functions

|========|========|========|
| **Function** | **WebGL Counterpart** | **Description** |
|========|========|========|
| [`setBuffer`](#setBuffer) | `vertexAttrib{I}Pointer` | Set to ['WebGLBuffer'](buffer.html) |
| [`setGeneric`](#setGeneric) | `vertexAttrib4[u]{f,i}v` | Set value to a constant |
| `enable` | `enableVertexAttribArray` | attribute visible to shader |
| `disable` | `disableVertexAttribArray` | not visible to shader |
| `setDivisor` <sub>**WebGL2/ext**</sub> | `vertexAttribDivisor` | (un)marks as instanced |
|========|========|========|
| `getMaxAttributes` | `MAX_VERTEX_ATTRIBS` | Length of array (>=8) |
| `hasDivisor` | `ANGLE_instanced_arrays` | Instancing supported? |
| `isEnabled` | `..._ARRAY_ENABLED` | Is attribute enabled? |
| `getBuffer` | `..._ARRAY_BUFFER_BINDING` | Get buffer value |
| `getGeneric` | `..._CURRENT_VERTEX_ATTRIB` | Get generic value |
| `getSize` | `..._ARRAY_SIZE` | Elements/vertex (1-4) |
| `getType` | `..._ARRAY_TYPE` | element type (GLenum)|
| `isNormalized` | `..._ARRAY_NORMALIZED` | are integers normalized? |
| `isInteger` <sub>**WebGL2**</sub> | `..._ARRAY_INTEGER` | integer-to-float disabled? |
| `getStride` | `..._ARRAY_STRIDE` | bytes between elements |
| `getOffset` | `getVertexAttribOffset` | index of first element |

The query functions all take the same two parameters,
so no further documentation is provided.

* **gl** (*WebGLRenderingContext*) - WebGL context
* **location** (*Number*) - index of attributes


### Remarks

* All methods in this class take a `location` index to specify which
  vertex attribute in the array they are operating on. This location needs to
  be matched with the location (i.e. index) selected by the compiler when
  compiling a Shader. Therefore it is usually better to work with symbolic
  names for vertex attributes, which is supported by other luma.gl classes.
* It is strongly recommended to only enable attributes that are actually used
  by a program. Other attributes can be left unchanged but disabled.
* Attribute 0 can sometimes be treated specially by the driver,
  so to be safe this module avoids disabling it.


### WebGL Extension Remarks

* **`ANGLE_instanced_arrays` Extension** Allows instance divisors to be set,
  enabling instanced rendering.
* **`OES_VertexArrayObject` Extension** Enables the application to create and
  "VertexArrayObject"s to save and restore the entire global vertex attribute
  array with a single operation. luma.gl provides a class wrapper for
  `VertexArrayObjects`.


### WebGL2 Remarks

* Setting instance divisors no longer requires a WebGL extension.
* `VertexArrayObjects` no longer require using a WebGL extension.
* Adds support for exposing integer attribute values directly to shaders
  (without those values first being auto-converted to floats).
  The improvements cover both generic and buffered attributes.


Function: VertexAttributes.setBuffer {#setBuffer}
--------------------------------------------------

Assigns a buffer a vertex attribute. Vertex Shader will be invoked once
(not considering indexing and instancing) with each value in the buffer's
array.

### Syntax

	VertexAttributes.setBuffer({gl, location, buffer, ...});

### Arguments

1. **gl** (*WebGLRenderingContext) - gl context
2. **location** (*GLuint*) - index of the attribute
3. **buffer** (*WebGLBuffer*|*Buffer*)
4. **target** (*GLuint*, gl.ARRAY_BUFFER) - which target to bind to
4. **size** (*GLuint*)  - number of values per element (1-4)
4. **type** (*GLuint*)  - type of values (e.g. gl.FLOAT)
4. **normalized** (*boolean*, false) - normalize integers to [-1,1] or [0,1]
4. **integer** (*boolean*, false) - **WebGL2 only** disable int-to-float conversion
4. **stride** (*GLuint*, 0) - supports strided arrays
4. **offset** (*GLuint*, 0) - supports strided arrays

### Remarks

* The application can enable normalization by setting the `normalized`
  flag to `true` in the `setBuffer` call.
* **WebGL2** The application can disable integer to float conversion
  when running under WebGL2, by setting the `integer` flag to `true`.


Function: VertexAttributes.setGeneric {#setGeneric}
--------------------------------------------------

Sets a constant (i.e. generic) value for a vertex attribute. All Vertex
Shader invocations will get the same value.

### Syntax:

	VertexAttributes.setGeneric({gl, location, array});

### Arguments

1. **gl** (*WebGLRenderingContext) - gl context
2. **location** (*GLuint*) - index of the attribute

{% highlight js %}
  import {VertexAttributes} from 'luma.gl';
  VertexAttributes.setGeneric(gl, 0, ...);
{% endhighlight %}


Function: VertexAttributes.setDivisor {#setDivisor}
--------------------------------------------------

Sets the instance divisor. 0 disables instancing, >=1 enables it.

See description of instancing in the overview above.

### Syntax:

	VertexAttributes.setGeneric({gl, location, array});

### Arguments

1. **gl** (*WebGLRenderingContext) - gl context
2. **location** (*GLuint*) - index of the attribute

{% highlight js %}
  import {VertexAttributes} from 'luma.gl';
  VertexAttributes.setGeneric(gl, 0, ...);
{% endhighlight %}

### Remarks

* This method will look use WebGL2 or the `array_instanced_ANGLE` extension,
  in that order, if available. To avoid exceptions on unsupported platforms,
  the app can call `VertexAttributes.hasDivisor` to determine whether
  instancing is supported before invoking `VertexAttributes.setDivisor`.



