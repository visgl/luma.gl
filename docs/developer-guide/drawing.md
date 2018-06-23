# Drawing


## Draw Calls

Draw calls run a program's shaders on staged GPU data.

luma.gl provides `Model.draw()`, `Program.draw()` etc.

Note that in WebGL2 it is possible to disable the rasterization stage, preventing draw calls from actually drawing anything. This mainly is used in combination with transform feedback.


## Clearing

You can use `model.clear()` to clear the default framebuffer, or `framebuffer.clear()` to clear a specific framebuffer, or just call `gl.clear()` directly.


## Framebuffers

Framebuffers are container objects that hold one or more textures and/or renderbuffers, representing color buffers, depth buffers, stencil buffers etc.


## Renderbuffers vs Textures vs Framebuffers

Framebuffers hold one or more textures and/or renderbuffers. Renderbuffers are optimized for rendering performance, whereas textures (when used as render targets) support readback of rendered pixels.


## Parameters

Rendering is affected by WebGL parameters, such as blending, depth testing, culling, etc.


### Viewports

A viewport specifies how clip space will be mapped to pixels on the WebGL canvas.


### Scissor Rects

A scissor rect limits rendering on the current viewport.


### Blending






