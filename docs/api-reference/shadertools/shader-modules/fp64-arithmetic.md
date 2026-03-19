# fp64arithmetic

The `fp64arithmetic` shader module provides the low-level double-single
arithmetic used by [`fp64`](/docs/api-reference/shadertools/shader-modules/fp64).
Use it directly when you only need the arithmetic primitives and want to avoid
including the full `fp64` function library.

## Uniforms

```ts
{
  ONE: 'f32',
  SPLIT: 'f32'
}
```

These uniforms are supplied automatically by the module's `defaultUniforms`.

## Usage

```ts
import {fp64arithmetic} from '@luma.gl/shadertools';

const modules = [fp64arithmetic];
```

## Remarks

- `fp64` depends on `fp64arithmetic`, so applications that import `fp64` do not
  usually need to add this module separately.
- The helper uniforms are part of the module's implementation and should not
  normally need to be overridden by applications.
