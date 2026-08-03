# picking

![Deprecated in v9.1](https://img.shields.io/badge/Deprecated-from-v9.1-red.svg?style=flat-square)

caution

The `picking` shader module in `@luma.gl/shadertools` is deprecated. It is retained as a legacy compatibility path for existing applications such as deck.gl, but it is frozen and will not gain new engine picking features. Applications that need the new index/color backend model should use the picking modules in `@luma.gl/engine`.

Provides support for color-based picking.

The `picking` modules supports picking and highlighting for both instanced and non-instanced data:

* pick a specific *instance* in an instanced draw call
* highlight all fragments of an *instance* based on its picking color
* pick "group of primitives" with the same picking color in non-instanced draw-calls
* highlight "group of primitives" with the same picking color in non-instanced draw-calls

This module preserves the legacy color-picking contract:

* the application supplies the picking color
* the shader writes that picking color to the picking buffer
* highlighting is keyed by `highlightedObjectColor`

It does not adopt the newer engine `objectIndex` / `batchIndex` payload model.

Color based picking lets the application draw a primitive with a color that can later be used to index this specific primitive.

Highlighting allows application to specify a picking color corresponding to an object that need to be highlighted and the highlight color to be used.

## Usage[​](#usage "Direct link to Usage")

This page documents the legacy `@luma.gl/shadertools` module. For new applications, prefer the `@luma.gl/engine` `picking`, `colorPicking`, and `indexPicking` modules instead.

In your vertex shader, your inform the picking module what object we are currently rendering by supplying a picking color, perhaps from an attribute.

```
attribute vec3 aPickingColor;
main() {
  picking_setPickingColor(aPickingColor);
  ...
}
```

In your fragment shader, apply `picking_filterColor` or `picking_filterPickingColor` at the very end of the shader. The picking color written by this legacy module must not be modified after that point.

```
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterColor(gl_FragColor);
}
```

```
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

If highlighting is not needed, you simply apply (call) the `picking_filterPickingColor` filter function at the very end of the shader. This will return the normal color or the picking color, as appropriate.

```
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

If you would like to apply the highlight color to the currently selected element call `picking_filterHighlightColor` before calling `picking_filterPickingColor`. You can also apply other filters on the non-picking color (vertex or highlight color) by placing those instruction between these two function calls.

```
main() {
  gl_FragColor = ...
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);
   ... apply any filters on gl_FragColor ...
 gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
```

## JavaScript Functions[​](#javascript-functions "Direct link to JavaScript Functions")

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

`getUniforms()` takes an object with key/value pairs, returns an object with key/value pairs representing the uniforms that the `picking` module shaders need.

Uniforms for the picking module, which renders picking colors and highlighted item. When active, renders picking colors, assumed to be rendered to off-screen "picking" buffer. When inactive, renders normal colors, with the exception of selected object which is rendered with highlight

| Setting                                | Description                                                         |
| -------------------------------------- | ------------------------------------------------------------------- |
| `isActive`?: boolean                   | Whether in picking or normal rendering (+highlighting) mode         |
| `isAttribute`: boolean                 | Set to true when picking an attribute value instead of object index |
| `useByteColors`?: boolean              | Interprets highlight colors as byte-style `0..255` values           |
| `isHighlightActive`?: boolean          | Do we have a highlighted item?                                      |
| `highlightedObjectColor`?: NumberArray | Set to a picking color to visually highlight that item              |
| `highlightColor`?: NumberArray         | Color of visual highlight of "selected" item                        |

* `isActive` - When true, renders picking colors. Set when rendering to off-screen "picking" buffer. When false, renders normal colors, with the exception of selected object which is rendered with highlight
* `useByteColors` defaults to byte-compatible highlight color behavior in Phase 1.

## Vertex Shader Functions[​](#vertex-shader-functions "Direct link to Vertex Shader Functions")

### picking\_setPickingColor()[​](#picking_setpickingcolor "Direct link to picking_setPickingColor()")

```
void picking_setPickingColor(vec3 pickingColor)
```

Sets the color that will be returned by the fragment shader if color based picking is enabled. Typically set from a `pickingColor` uniform or a `pickingColors` attribute (e.g. when using instanced rendering, to identify the actual instance that was picked).

### picking\_setPickingAttribute[​](#picking_setpickingattribute "Direct link to picking_setPickingAttribute")

Sets the attribute value that needs to be picked.

`void picking_setPickingAttribute(float value)` `void picking_setPickingAttribute(vec2 value)` `void picking_setPickingAttribute(vec3 value)`

## Fragment Shader Functions[​](#fragment-shader-functions "Direct link to Fragment Shader Functions")

### picking\_filterColor[​](#picking_filtercolor "Direct link to picking_filterColor")

```
vec4 picking_filterColor(vec4 color)
```

| Picking Enabled | Item Highlighted | Returned color                                                        |
| --------------- | ---------------- | --------------------------------------------------------------------- |
| ✅              | –                | Returns picking color (representing index of this color)              |
| ❌              | ✅               | Returns the current highlight color (to show this item as "selected") |
| ❌              | ❌               | returns the original color (unmodified `color` argument)              |

### picking\_filterHighlightColor()[​](#picking_filterhighlightcolor "Direct link to picking_filterHighlightColor()")

```
vec4 picking_filterHighlightColor(vec4 color)
```

Returns the highlight color blend when the current fragment matches `highlightedObjectColor`, otherwise returns its argument unmodified.

### picking\_filterPickingColor()[​](#picking_filterpickingcolor "Direct link to picking_filterPickingColor()")

`vec4 picking_filterPickingColor(vec4 color)`

If picking active, returns the current vertex's picking color set by `picking_setPickingColor`, otherwise returns its argument unmodified.

## Remarks[​](#remarks "Direct link to Remarks")

* It is recommended that `picking_filterPickingColor()` is called last in a fragment shader, as the picking color (returned when picking is enabled) must not be modified in any way (and alpha must remain 1) or picking results will not be correct.
* This legacy module is kept stable for compatibility. New picking backends and framebuffer-management APIs are available in `@luma.gl/engine`, not here.
