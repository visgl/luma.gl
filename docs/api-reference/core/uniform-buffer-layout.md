# UniformBufferLayout

`UniformBufferLayout` was renamed to
[`ShaderBlockLayout`](/docs/api-reference/core/shader-block-layout).

Use:

- [`makeShaderBlockLayout()`](/docs/api-reference/core/shader-block-layout)
- `ShaderBlockWriter`
- [`UniformStore`](/docs/api-reference/core/uniform-store)

The new API separates immutable layout metadata from runtime serialization.
