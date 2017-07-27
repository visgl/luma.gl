# isWebGL2

This function checks if an existing WebGL context is a WebGL2RenderingContext

## Method

### isWebGL2

A major check that can be done is whether you are working with a `WebGL2RenderingContext`. An advantage of using this method is that it can correctly identify a luma.gl debug context (which is not a subclass of a `WebGL2RendringContext`).

`isWebGL2(gl)`

* `gl` (WebGLRenderingContext) - gl context
Returns true if the context is a WebGL2RenderingContext.

See also: `isWebGLRenderingContext`.

