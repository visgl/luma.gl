# Roadmap for Shadertools

## Shader Programming Improvements

### GLSL 3.00 es support improvements

- GLSL language reference page with clear information on what has changed between GLSL 3.00 ES and GLSL 1.00 ES.
- Developer Guide for Shadertools
- All shader modules now written in GLSL 3.00 syntax
- Shader compiler automatically adapts GLSL 3.00 es to GLSL 1.00 es (and vice versa)
- Guidelines for writing shaders that work in both environments
- Unit tests for shader modules under both GLSL 1.00 and GLSL 3.00

### Shader Module system improvements

- App can add its uniforms to the shader module system.
- Shader module system can now accept function valued uniforms, allowing animation of uniforms.
- Compute shaders

### Support for Uniform Buffers

- 

### Unconditional support for Vertex Array Objects

`VertexArrayObjects` are now emulated under WebGL1, meaning that they can always be used.
