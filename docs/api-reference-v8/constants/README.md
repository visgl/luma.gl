# Overview

> Starting from v9, the luma.gl API uses strings instead of GL constants
> to specify parameters, formats etc, effectively
> eliminating the need for importing the `@luma.gl/constants` module

The `@luma.gl/constants` module has a single export: 
a (big) enum `GL` that contains all WebGL constants (i.e. the OpenGL API constants).

## Usage

```typescript
import GL from '@luma.gl/constants';
const type = GL.POINTS;
```

## Remarks

- While `GL` constants are exposed on the `WebGLRenderingContext` instance, it is often convenient
to be able to reference them in code that does not have access to a WebGL context.
- A range of constants provided by this module are not available on the WebGL context itself,
but would otherwise have to be retrieved from WebGL extension objects.
- Using the GL module ensures that WebGL 2 constants are defined even when working with a WebGL 1 context.

## Bundle Size Considerations

Including a big enumeration containing many constants your application might not even be using
does add to your applications bundle size. luma.gl offers a babel plugin that can inline the 
`GL` constants, typically resulting in smaller bundle size than if you used built-in `gl.<constants>`
on your `WebGLRenderingContext` directly.
