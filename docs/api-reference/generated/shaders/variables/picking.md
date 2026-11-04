# Variable: picking

> `const` **picking**: `object`

Defined in: [modules/engine/picking/picking.ts:196](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/picking/picking.ts#L196)

Deprecated legacy picking module retained for compatibility with existing shaders users such as deck.gl. Keep the shader contract stable.

Provides support for color-coding-based picking and highlighting. In particular, supports picking a specific instance in an instanced draw call and highlighting an instance based on its picking color, and correspondingly, supports picking and highlighting groups of primitives with the same picking color in non-instanced draw-calls

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.highlightColor[​](#defaultuniformshighlightcolor "Direct link to defaultUniforms.highlightColor")

> `readonly` **highlightColor**: `NumberArray4` = `DEFAULT_HIGHLIGHT_COLOR`

#### defaultUniforms.highlightedObjectColor[​](#defaultuniformshighlightedobjectcolor "Direct link to defaultUniforms.highlightedObjectColor")

> `readonly` **highlightedObjectColor**: \[`0`, `0`, `0`]

#### defaultUniforms.isActive[​](#defaultuniformsisactive "Direct link to defaultUniforms.isActive")

> `readonly` **isActive**: `false` = `false`

#### defaultUniforms.isAttribute[​](#defaultuniformsisattribute "Direct link to defaultUniforms.isAttribute")

> `readonly` **isAttribute**: `false` = `false`

#### defaultUniforms.isHighlightActive[​](#defaultuniformsishighlightactive "Direct link to defaultUniforms.isHighlightActive")

> `readonly` **isHighlightActive**: `false` = `false`

#### defaultUniforms.useByteColors[​](#defaultuniformsusebytecolors "Direct link to defaultUniforms.useByteColors")

> `readonly` **useByteColors**: `true` = `true`

### fs[​](#fs "Direct link to fs")

> **fs**: "layout(std140) uniform pickingUniforms {\n float isActive;\n float isAttribute;\n float isHighlightActive;\n float useByteColors;\n vec3 highlightedObjectColor;\n vec4 highlightColor;\n} picking;\n\nin vec4 picking\_vRGBcolor\_Avalid;\n\n/\*\n \* Returns highlight color if this item is selected.\n \*/\nvec4 picking\_filterHighlightColor(vec4 color) {\n // If we are still picking, we don't highlight\n if (picking.isActive > 0.5) {\n return color;\n }\n\n bool selected = bool(picking\_vRGBcolor\_Avalid.a);\n\n if (selected) {\n // Blend in highlight color based on its alpha value\n float highLightAlpha = picking.highlightColor.a;\n float blendedAlpha = highLightAlpha + color.a \* (1.0 - highLightAlpha);\n float highLightRatio = highLightAlpha / blendedAlpha;\n\n vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);\n return vec4(blendedRGB, blendedAlpha);\n } else {\n return color;\n }\n}\n\n/\*\n \* Returns picking color if picking enabled else unmodified argument.\n \*/\nvec4 picking\_filterPickingColor(vec4 color) {\n if (bool(picking.isActive)) {\n if (picking\_vRGBcolor\_Avalid.a == 0.0) {\n discard;\n }\n return picking\_vRGBcolor\_Avalid;\n }\n return color;\n}\n\n/\*\n \* Returns picking color if picking is enabled if not\n \* highlight color if this item is selected, otherwise unmodified argument.\n \*/\nvec4 picking\_filterColor(vec4 color) {\n vec4 highlightColor = picking\_filterHighlightColor(color);\n return picking\_filterPickingColor(highlightColor);\n}\n"

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> **getUniforms**: (`opts`, `prevUniforms?`) => [`PickingUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PickingUniforms.md)

#### Parameters[​](#parameters "Direct link to Parameters")

##### opts?[​](#opts "Direct link to opts?")

[`PickingProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PickingProps.md) = `{}`

##### prevUniforms?[​](#prevuniforms "Direct link to prevUniforms?")

[`PickingUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PickingUniforms.md)

#### Returns[​](#returns "Direct link to Returns")

[`PickingUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PickingUniforms.md)

### name[​](#name "Direct link to name")

> `readonly` **name**: `"picking"` = `'picking'`

### props[​](#props "Direct link to props")

> `readonly` **props**: [`PickingProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PickingProps.md)

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: [`PickingUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PickingUniforms.md)

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.highlightColor[​](#uniformtypeshighlightcolor "Direct link to uniformTypes.highlightColor")

> `readonly` **highlightColor**: `"vec4<f32>"` = `'vec4<f32>'`

#### uniformTypes.highlightedObjectColor[​](#uniformtypeshighlightedobjectcolor "Direct link to uniformTypes.highlightedObjectColor")

> `readonly` **highlightedObjectColor**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.isActive[​](#uniformtypesisactive "Direct link to uniformTypes.isActive")

> `readonly` **isActive**: `"f32"` = `'f32'`

#### uniformTypes.isAttribute[​](#uniformtypesisattribute "Direct link to uniformTypes.isAttribute")

> `readonly` **isAttribute**: `"f32"` = `'f32'`

#### uniformTypes.isHighlightActive[​](#uniformtypesishighlightactive "Direct link to uniformTypes.isHighlightActive")

> `readonly` **isHighlightActive**: `"f32"` = `'f32'`

#### uniformTypes.useByteColors[​](#uniformtypesusebytecolors "Direct link to uniformTypes.useByteColors")

> `readonly` **useByteColors**: `"f32"` = `'f32'`

### vs[​](#vs "Direct link to vs")

> **vs**: "layout(std140) uniform pickingUniforms {\n float isActive;\n float isAttribute;\n float isHighlightActive;\n float useByteColors;\n vec3 highlightedObjectColor;\n vec4 highlightColor;\n} picking;\n\nout vec4 picking\_vRGBcolor\_Avalid;\n\n// Normalize unsigned byte color to 0-1 range\nvec3 picking\_normalizeColor(vec3 color) {\n return picking.useByteColors > 0.5 ? color / 255.0 : color;\n}\n\n// Normalize unsigned byte color to 0-1 range\nvec4 picking\_normalizeColor(vec4 color) {\n return picking.useByteColors > 0.5 ? color / 255.0 : color;\n}\n\nbool picking\_isColorZero(vec3 color) {\n return dot(color, vec3(1.0)) < 0.00001;\n}\n\nbool picking\_isColorValid(vec3 color) {\n return dot(color, vec3(1.0)) > 0.00001;\n}\n\n// Check if this vertex is highlighted \nbool isVertexHighlighted(vec3 vertexColor) {\n vec3 highlightedObjectColor = picking\_normalizeColor(picking.highlightedObjectColor);\n return\n bool(picking.isHighlightActive) && picking\_isColorZero(abs(vertexColor - highlightedObjectColor));\n}\n\n// Set the current picking color\nvoid picking\_setPickingColor(vec3 pickingColor) {\n pickingColor = picking\_normalizeColor(pickingColor);\n\n if (bool(picking.isActive)) {\n // Use alpha as the validity flag. If pickingColor is \[0, 0, 0] fragment is non-pickable\n picking\_vRGBcolor\_Avalid.a = float(picking\_isColorValid(pickingColor));\n\n if (!bool(picking.isAttribute)) {\n // Stores the picking color so that the fragment shader can render it during picking\n picking\_vRGBcolor\_Avalid.rgb = pickingColor;\n }\n } else {\n // Do the comparison with selected item color in vertex shader as it should mean fewer compares\n picking\_vRGBcolor\_Avalid.a = float(isVertexHighlighted(pickingColor));\n }\n}\n\nvoid picking\_setPickingAttribute(float value) {\n if (bool(picking.isAttribute)) {\n picking\_vRGBcolor\_Avalid.r = value;\n }\n}\n\nvoid picking\_setPickingAttribute(vec2 value) {\n if (bool(picking.isAttribute)) {\n picking\_vRGBcolor\_Avalid.rg = value;\n }\n}\n\nvoid picking\_setPickingAttribute(vec3 value) {\n if (bool(picking.isAttribute)) {\n picking\_vRGBcolor\_Avalid.rgb = value;\n }\n}\n"
