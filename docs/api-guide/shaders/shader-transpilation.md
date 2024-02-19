# Shader Transpilation

> From v9 luma.gl requires GLSL shaders to be written in GLSL 3.00 ES syntax. 

If `platformInfo` specifies that GLSL 1.0 is required by the `Device`, `assembleShaders` will attempt to transpile GLSL 3.0 shaders to GLSL ES 1.0. 

This transpilation is a limited text replacement and requires that certain conventions be followed:

- Statements are written one per line.
- Only one fragment shader output is supported.
- GLSL 3.0-only features, such as 3D textures are not supported.

Text transformations are performed according to the following tables:

Vertex Shaders

| 3.00 ES | 1.00 ES     | Comment |
| ------- | ----------- | ------- |
| `in`    | `attribute` |         |
| `out`   | `varying`   |         |

Fragment Shaders

| 3.00 ES              | 1.00 ES        | Comment                                                                                                                                                                                                                                                           |
| -------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `in`                 | `varying`      |                                                                                                                                                                                                                                                                   |
| `out vec4 <varName>` | `gl_FragColor` | `<varName>` declaration is removed and usage in the code are replaced with `gl_FragColor`                                                                                                                                                                         |
| `texture`            | `texture2D`    | `texture` will be replaced with `texture2D` to ensure 1.00 code is correct. See note on `textureCube` below.                                                                                                                                                      |
| `textureCube` \*     | `textureCube`  | `textureCube` is not valid 3.00 syntax, but must be used to ensure 1.00 code is correct, because `texture` will be substituted with `texture2D` when transpiled to 100. Also `textureCube` will be replaced with correct `texture` syntax when transpiled to 300. |
