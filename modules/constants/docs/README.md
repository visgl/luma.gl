# @luma.gl/constants

> Through v8, the luma.gl API was utilizing GL constants to specify parameters, formats etc.
> However starting from v9, the API will accept WebGPU-style strings instead, reducing the need
> for importing the `@luma.gl/constants` module

Provides a (big) enum `GL` that contains all static WebGL constants (aka OpenGL constants).

- While these constants are exposed on the `WebGLRenderingContext` instance, it is often convenient
to be able to reference them in code that does not have access to a WebGL context.
- Also, a range of constants provided by this module are not available on the WebGL context itself,
but most be retrieved from dynamically queried extension objects.

## Usage

```typescript
import GL from '@luma.gl/constants';
const type = GL.POINTS;
```

## Bundle Size Considerations

Including a big set of constants does add to your applications bundle size.
luma.gl offers a babel plugin that can inline the constants,
typically resulting in smaller bundle size
than if you used built-in `gl.<constants>` directly.
