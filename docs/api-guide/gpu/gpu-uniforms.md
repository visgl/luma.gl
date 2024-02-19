# Uniforms

Uniforms are shader variables whose values can be set from JavaScript.

## Uniform Buffers

The recommended, portable method of providing uniform information to a program is 
through a set of uniform buffers.

Each uniform buffer can store multiple values.

Considerations when working with uniform buffers:
- While each uniform buffer can contain a large number of uniforms, there is a fairly low limit to the number of uniform buffers that can be bound simultaneously (usually `8`). 
- This means that composable shader code can quickly run out of uniform buffers, if each shader module assumes that it can use its own uniform buffer.
- The memory layout of the buffer needs to precisely match the uniform buffer declaration in the shader.

Performance
- Uniform buffers are superior from a performance perspective. Binding the buffer is a single operation that binds all the uniform values in that buffer.
- Importantly, the same uniform buffer can be bound for multiple shaders. If an application can organize shared uniforms (such as projection matrices) into a separate uniform buffer, that same buffer can just be bound for all pipelines. An update of the projection matrix in the buffer can be done without rebinding the buffer to the pipelines


## "Free" Uniforms

WebGL supports setting "free" uniforms on a program. While convenient, this is not supported in WebGPU and should be avoided.

| Feature | Uniform Buffers | Uniforms |
| ------- | --------------- | -------- |
| WebGL2  | ✅               | ✅        |
| WebGPU  | ✅               | ❌        |

Also note that both JavaScript code and shader code needs to be written differently based on whether uniforms or uniform buffers are used, so any solution would also require shader code generation or transformation to be implemented.
