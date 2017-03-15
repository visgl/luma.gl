# Shader Module: Picking

Provides support for color based picking.

Color based picking lets the application draw a primitive with a fixed color,
and by reading the color from a pixel in the resulting Framebuffer it
can determine which primitive was drawn topmost at that point without
having to refer to geometry or raycasting etc.


## Parameters

`getUniforms` take the following parameters when the `picking` module is
included.

* `pickingEnable` (boolean, false) - Activates picking


## Vertex Shader Functions

### `void picking_setPickingColor(vec3)`

Sets the color that will be returned by the fragment shader if color
based picking is enabled. Typically set from a `pickingColor` uniform
or a `pickingColors` attribute (e.g. when using instanced rendering,
to identify the actual instance that was picked).


## Fragment Shader Functions

### `vec4 picking_filterColor(vec4 color)`

Returns the picking color set by `picking_setPickingColor`,
if is picking enabled. Otherwise returns its argument, unmodified.

Example:
```
gl_FragColor = picking_filterColor(gl_FragColor);
```

Remarks:
* It is recommended that `picking_filterColor` is called last in a
  fragment shader, as the picking color (returned when picking is
  enabled) typically must not be modified in any way (and alpha must remain 1).
