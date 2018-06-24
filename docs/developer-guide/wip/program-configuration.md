
### uniformBlockBinding

* `blockIndex` (`GLuint`) - uniform block index
* `blockBinding` (`GLuint`) - binding point

Binds a uniform block (`blockIndex`) to a specific binding point (`blockBinding`)


### varyings

* `program` (`WebGLProgram?`) - program
* `varyings` (`sequence<DOMString>`) -
* `bufferMode` (`GLenum`) -
returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [gl.transformFeedbackVaryings](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/transformFeedbackVaryings)


### getVarying(program, index)

* `program` (`WebGLProgram?`) - program
* `index` (`GLuint`) - index
returns (`WebGLActiveInfo`) - object with {`name`, `size`, `type`} fields.

WebGL APIs [gl.getTransformFeedbackVarying](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getTransformFeedbackVarying)


### getUniformCount

Gets number of active uniforms

### getUniformInfo

Gets {name, type, size} for uniform at index

### getUniformLocation

Gets uniform's location (`WebGLUniformLocation`)

### getUniformValue

Gets the value of a uniform variable at a given location

### getActiveUniforms

Gets the requested information (size, offset etc) of uniforms

### getVarying (WebGL2)

Gets the information {name, size, type} of a varying

### getUniformBlockIndex (WebGL2)

Gets the index of a uniform block

### getActiveUniformBlockParameter (WebGL2)

Gets the information about an active uniform block

### getFragDataLocation (WebGL2)

Gets the binding of color numbers to user-defined varying out variables
