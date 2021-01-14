# High, Medium, Low

luma.gl is designed to provide support for development at whatever level the user requires. This can roughly be split into three levels of abstraction:

- Low-level: Program directly with the WebGL API with some lightweight tools for managing the gl context, shaders and debugging. This will primarily involve using the `shadertools`, `gltools` and `debug` modules.
- Mid-level: Program with convenient wrapper classes around the WebGL API. This involves using the `webgl` module.
- High-level: Program using 3D engine constructs like models or resource managers. This primarily involves using the `engine` and `webgl` modules.

To demonstrate how luma.gl functions at these three levels, we'll implement the same scene, 4 instanced colored triangles, three times, once at each level of abstraction.
