# Overview

**luma.gl** is split into several modules that are each responsible for a particular part of the rendering stack:

- `engine`: High-level constructs such as `Model`, `AnimationLoop` and `Geometry` that allow a developer to work without worrying about rendering pipeline details.
- `webgl`: Wrapper classes around WebGL objects such as `Program`, `Buffer`, `VertexArray` that allow a developer to manager the rendering pipeline directly but with a more convenient API.
- `shadertools`: A system for modularizing and composing GLSL shader code.
- `debug`: Tooling to aid in debugging.

**luma.gl** also exposes a `core` module that simply re-exports key parts of the other modules. This can be helpful to just get started without worrying too much about fine-grained control of dependencies. The `core` module re-exports the following functions and classes from other modules:

| Module      | Exports                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@luma.gl/engine`      | `AnimationLoop`, `Model`, `Transform`, `ProgramManager`, Timeline, Geometry, ClipSpace, ConeGeometry, CubeGeometry, CylinderGeometry, IcoSphereGeometry, PlaneGeometry, SphereGeometry, TruncatedConeGeometry                         |
| `@luma.gl/api`       | lumaStats, FEATURES, hasFeature, hasFeatures, Buffer, Program, Framebuffer, Renderbuffer, Texture2D, TextureCube, clear, readPixelsToArray, readPixelsToBuffer, cloneTextureFrom, copyToTexture, Texture3D, TransformFeedback |
| `@luma.gl/webgl`       |
| `@luma.gl/webgpu`       |
| `@luma.gl/gltools`     | createGLContext, instrumentGLContext, isWebGL, isWebGL2, getParameters, setParameters, withParameters, resetParameters, cssToDeviceRatio, cssToDevicePixels                                                                   | `@luma.gl/shadertools` | `normalizeShaderModule`, `fp32`, `fp64`, `project`, `dirlight`, `picking`, `gouraudLighting`, `phongLighting`, `pbr`                                                                                                                           |
| `@luma.gl/experimental`       |
