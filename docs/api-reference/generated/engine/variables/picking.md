# Variable: picking

> `const` **picking**: `object`

Defined in: [modules/engine/src/modules/picking/picking.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking.ts#L19)

Unified object-picking shader module. Uses color picking on GLSL/WebGL paths and index picking on WGSL/WebGPU paths.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.batchIndex[​](#defaultuniformsbatchindex "Direct link to defaultUniforms.batchIndex")

> `readonly` **batchIndex**: `0` = `0`

#### defaultUniforms.highlightColor[​](#defaultuniformshighlightcolor "Direct link to defaultUniforms.highlightColor")

> `readonly` **highlightColor**: `NumberArray4` = `DEFAULT_HIGHLIGHT_COLOR`

#### defaultUniforms.highlightedBatchIndex[​](#defaultuniformshighlightedbatchindex "Direct link to defaultUniforms.highlightedBatchIndex")

> `readonly` **highlightedBatchIndex**: `-1` = `INVALID_INDEX`

#### defaultUniforms.highlightedObjectIndex[​](#defaultuniformshighlightedobjectindex "Direct link to defaultUniforms.highlightedObjectIndex")

> `readonly` **highlightedObjectIndex**: `-1` = `INVALID_INDEX`

#### defaultUniforms.indexMode[​](#defaultuniformsindexmode "Direct link to defaultUniforms.indexMode")

> `readonly` **indexMode**: `0` = `0`

#### defaultUniforms.isActive[​](#defaultuniformsisactive "Direct link to defaultUniforms.isActive")

> `readonly` **isActive**: `false` = `false`

#### defaultUniforms.isHighlightActive[​](#defaultuniformsishighlightactive "Direct link to defaultUniforms.isHighlightActive")

> `readonly` **isHighlightActive**: `false` = `false`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "precision highp float;\nprecision highp int;\n\nlayout(std140) uniform pickingUniforms {\n int isActive;\n int indexMode;\n int batchIndex;\n\n int isHighlightActive;\n int highlightedBatchIndex;\n int highlightedObjectIndex;\n vec4 highlightColor;\n} picking;\n\n\nconst int COLOR\_PICKING\_INVALID\_INDEX = -1;\nconst int COLOR\_PICKING\_MAX\_OBJECT\_INDEX = 16777214;\nconst int COLOR\_PICKING\_MAX\_BATCH\_INDEX = 254;\n\nflat in int picking\_objectIndex;\n\nbool picking\_isFragmentHighlighted() {\n return\n bool(picking.isHighlightActive) &&\n picking.highlightedBatchIndex == picking.batchIndex &&\n picking.highlightedObjectIndex == picking\_objectIndex\n ;\n}\n\nvec4 picking\_filterHighlightColor(vec4 color) {\n if (bool(picking.isActive)) {\n return color;\n }\n\n if (!picking\_isFragmentHighlighted()) {\n return color;\n }\n\n float highLightAlpha = picking.highlightColor.a;\n float blendedAlpha = highLightAlpha + color.a \* (1.0 - highLightAlpha);\n float highLightRatio = highLightAlpha / blendedAlpha;\n\n vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);\n return vec4(blendedRGB, blendedAlpha);\n}\n\nbool picking\_canEncodePickInfo(int objectIndex) {\n return\n objectIndex != COLOR\_PICKING\_INVALID\_INDEX &&\n objectIndex >= 0 &&\n objectIndex <= COLOR\_PICKING\_MAX\_OBJECT\_INDEX &&\n picking.batchIndex >= 0 &&\n picking.batchIndex <= COLOR\_PICKING\_MAX\_BATCH\_INDEX;\n}\n\nvec4 picking\_getPickingColor() {\n if (!picking\_canEncodePickInfo(picking\_objectIndex)) {\n return vec4(0.0);\n }\n\n int encodedObjectIndex = picking\_objectIndex + 1;\n int red = encodedObjectIndex % 256;\n int green = (encodedObjectIndex / 256) % 256;\n int blue = (encodedObjectIndex / 65536) % 256;\n int alpha = picking.batchIndex + 1;\n\n return vec4(float(red), float(green), float(blue), float(alpha)) / 255.0;\n}\n\nvec4 picking\_filterPickingColor(vec4 color) {\n if (bool(picking.isActive)) {\n if (!picking\_canEncodePickInfo(picking\_objectIndex)) {\n discard;\n }\n return picking\_getPickingColor();\n }\n\n return color;\n}\n\nvec4 picking\_filterColor(vec4 color) {\n vec4 outColor = color;\n outColor = picking\_filterHighlightColor(outColor);\n outColor = picking\_filterPickingColor(outColor);\n return outColor;\n}\n" = `colorPicking.fs`

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> **getUniforms**: (`props`, `prevUniforms?`) => `PickingUniforms`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

`PickingProps` = `{}`

##### prevUniforms?[​](#prevuniforms "Direct link to prevUniforms?")

`PickingUniforms`

#### Returns[​](#returns "Direct link to Returns")

`PickingUniforms`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"picking"` = `'picking'`

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `PickingProps`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct pickingUniforms {\n isActive: i32,\n indexMode: i32,\n batchIndex: i32,\n\n isHighlightActive: i32,\n highlightedBatchIndex: i32,\n highlightedObjectIndex: i32,\n highlightColor: vec4\<f32>,\n};\n\n\@group(0) @binding(auto) var\<uniform> picking: pickingUniforms;\n\n\nconst INDEX\_PICKING\_MODE\_INSTANCE = 0;\nconst INDEX\_PICKING\_MODE\_ATTRIBUTE = 1;\nconst INDEX\_PICKING\_MODE\_VERTEX = 2;\nconst INDEX\_PICKING\_INVALID\_INDEX = -1; // 2^32 - 1\n\n/\*\*\n \* WGSL shaders need to carry the returned object index through their own stage outputs.\n \*/\nfn picking\_getInstanceObjectIndex(instanceIndex: u32) -> i32 {\n return i32(instanceIndex);\n}\n\nfn picking\_getVertexObjectIndex(vertexIndex: u32) -> i32 {\n return i32(vertexIndex);\n}\n\nfn picking\_getAttributeObjectIndex(objectIndex: i32) -> i32 {\n return objectIndex;\n}\n\nfn picking\_setObjectIndex(objectIndex: i32) -> i32 {\n return picking\_getAttributeObjectIndex(objectIndex);\n}\n\nfn picking\_isObjectHighlighted(objectIndex: i32) -> bool {\n return\n picking.isHighlightActive != 0 &&\n picking.highlightedBatchIndex == picking.batchIndex &&\n picking.highlightedObjectIndex == objectIndex;\n}\n\nfn picking\_filterHighlightColor(color: vec4\<f32>, objectIndex: i32) -> vec4\<f32> {\n if (picking.isActive != 0 || !picking\_isObjectHighlighted(objectIndex)) {\n return color;\n }\n\n let highLightAlpha = picking.highlightColor.a;\n let blendedAlpha = highLightAlpha + color.a \* (1.0 - highLightAlpha);\n if (blendedAlpha == 0.0) {\n return vec4\<f32>(color.rgb, 0.0);\n }\n\n let highLightRatio = highLightAlpha / blendedAlpha;\n let blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);\n return vec4\<f32>(blendedRGB, blendedAlpha);\n}\n\nfn picking\_filterPickingColor(color: vec4\<f32>, objectIndex: i32) -> vec4\<f32> {\n if (picking.isActive != 0 && objectIndex == INDEX\_PICKING\_INVALID\_INDEX) {\n discard;\n }\n return color;\n}\n\nfn picking\_getPickingColor(objectIndex: i32) -> vec2\<i32> {\n return vec2\<i32>(objectIndex, picking.batchIndex);\n}\n\n" = `indexPicking.source`

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: `PickingUniforms`

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> **uniformTypes**: `Required`<`UniformTypes`<`PickingUniforms`>>

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "precision highp float;\nprecision highp int;\n\nlayout(std140) uniform pickingUniforms {\n int isActive;\n int indexMode;\n int batchIndex;\n\n int isHighlightActive;\n int highlightedBatchIndex;\n int highlightedObjectIndex;\n vec4 highlightColor;\n} picking;\n\n\nconst int INDEX\_PICKING\_MODE\_INSTANCE = 0;\nconst int INDEX\_PICKING\_MODE\_CUSTOM = 1;\n\nconst int COLOR\_PICKING\_INVALID\_INDEX = -1;\n\nflat out int picking\_objectIndex;\n\nvoid picking\_setObjectIndex(int objectIndex) {\n switch (picking.indexMode) {\n case INDEX\_PICKING\_MODE\_INSTANCE:\n picking\_objectIndex = gl\_InstanceID;\n break;\n case INDEX\_PICKING\_MODE\_CUSTOM:\n picking\_objectIndex = objectIndex;\n break;\n }\n}\n" = `colorPicking.vs`
