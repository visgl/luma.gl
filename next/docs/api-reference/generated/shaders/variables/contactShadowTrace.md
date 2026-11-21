# Variable: contactShadowTrace

> `const` **contactShadowTrace**: `object`

Defined in: [modules/lighting/contact-shadow/contact-shadow.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/contact-shadow/contact-shadow.ts#L34)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"depthTexture"`; }, { `group`: `0`; `name`: `"normalTexture"`; }]

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: [`ContactShadowBindings`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactShadowBindings.md)<`unknown`>

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform contactShadowTraceUniforms {\n mat4 projectionMatrix;\n mat4 inverseProjectionMatrix;\n vec3 lightDirectionView;\n float maxDistance;\n float thickness;\n float stepCount;\n float frameIndex;\n float normalBias;\n} contactShadowTrace;\nuniform sampler2D depthTexture;\nuniform sampler2D normalTexture;\nvec3 contactShadow\_reconstructViewPosition(vec2 uv, float depth) {\n vec4 view = contactShadowTrace.inverseProjectionMatrix \* vec4(uv \* 2.0 - 1.0, depth \* 2.0 - 1.0, 1.0);\n return view\.xyz / max(abs(view\.w), 0.00001);\n}\nvec2 contactShadow\_projectViewPosition(vec3 position) {\n vec4 clip = contactShadowTrace.projectionMatrix \* vec4(position,1.0);\n return clip.xy / max(abs(clip.w),0.00001) \* 0.5 + 0.5;\n}\nvec4 contactShadowTrace\_sampleColor(sampler2D sourceTexture,vec2 texSize,vec2 texCoord) {\n float centerDepth = texture(depthTexture,texCoord).r;\n if(centerDepth >= 0.99999) return vec4(1.0);\n vec3 centerNormal = normalize(texture(normalTexture,texCoord).xyz \* 2.0 - 1.0);\n vec3 centerPosition = contactShadow\_reconstructViewPosition(texCoord,centerDepth) + centerNormal \* contactShadowTrace.normalBias;\n vec3 rayDirection = normalize(contactShadowTrace.lightDirectionView);\n float noise = fract(sin(dot(texCoord \* texSize + contactShadowTrace.frameIndex,vec2(12.9898,78.233))) \* 43758.5453);\n for(int index=0;index<40;index++) {\n if(float(index)>=contactShadowTrace.stepCount) break;\n float fraction=(float(index)+0.35+noise\*0.5)/max(contactShadowTrace.stepCount,1.0);\n float travel=contactShadowTrace.maxDistance\*fraction\*fraction;\n vec3 rayPosition=centerPosition+rayDirection\*travel;\n vec2 sampleUv=contactShadow\_projectViewPosition(rayPosition);\n if(any(lessThanEqual(sampleUv,vec2(0.0)))||any(greaterThanEqual(sampleUv,vec2(1.0))))break;\n float sampleDepth=texture(depthTexture,sampleUv).r;\n if(sampleDepth>=0.99999)continue;\n vec3 scenePosition=contactShadow\_reconstructViewPosition(sampleUv,sampleDepth);\n float depthDelta=(-rayPosition.z)-(-scenePosition.z);\n float hitThickness=contactShadowTrace.thickness+travel\*0.02;\n if(depthDelta>=0.0&\&depthDelta<=hitThickness) {\n float distanceFade=1.0-clamp(travel/contactShadowTrace.maxDistance,0.0,1.0);\n return vec4(vec3(1.0-distanceFade),1.0);\n }\n if(depthDelta>hitThickness\*8.0)break;\n }\n return vec4(1.0);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"contactShadowTrace"` = `'contactShadowTrace'`

### passes[​](#passes "Direct link to passes")

> `readonly` **passes**: \[{ `sampler`: `true`; }]

### props[​](#props "Direct link to props")

> `readonly` **props**: `Partial`<[`ContactTraceUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactTraceUniforms.md)> & [`ContactShadowBindings`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactShadowBindings.md)<`unknown`>

### propTypes[​](#proptypes "Direct link to propTypes")

> `readonly` **propTypes**: `object`

#### propTypes.frameIndex[​](#proptypesframeindex "Direct link to propTypes.frameIndex")

> `readonly` **frameIndex**: `object`

#### propTypes.frameIndex.private[​](#proptypesframeindexprivate "Direct link to propTypes.frameIndex.private")

> `readonly` **private**: `true` = `true`

#### propTypes.frameIndex.value[​](#proptypesframeindexvalue "Direct link to propTypes.frameIndex.value")

> `readonly` **value**: `0` = `0`

#### propTypes.inverseProjectionMatrix[​](#proptypesinverseprojectionmatrix "Direct link to propTypes.inverseProjectionMatrix")

> `readonly` **inverseProjectionMatrix**: `object`

#### propTypes.inverseProjectionMatrix.private[​](#proptypesinverseprojectionmatrixprivate "Direct link to propTypes.inverseProjectionMatrix.private")

> `readonly` **private**: `true` = `true`

#### propTypes.inverseProjectionMatrix.value[​](#proptypesinverseprojectionmatrixvalue "Direct link to propTypes.inverseProjectionMatrix.value")

> `readonly` **value**: `NumberArray16` = `IDENTITY_MATRIX`

#### propTypes.lightDirectionView[​](#proptypeslightdirectionview "Direct link to propTypes.lightDirectionView")

> `readonly` **lightDirectionView**: `object`

#### propTypes.lightDirectionView\.private[​](#proptypeslightdirectionviewprivate "Direct link to propTypes.lightDirectionView.private")

> `readonly` **private**: `true` = `true`

#### propTypes.lightDirectionView\.value[​](#proptypeslightdirectionviewvalue "Direct link to propTypes.lightDirectionView.value")

> `readonly` **value**: readonly \[`0`, `1`, `0`]

#### propTypes.maxDistance[​](#proptypesmaxdistance "Direct link to propTypes.maxDistance")

> `readonly` **maxDistance**: `object`

#### propTypes.maxDistance.min[​](#proptypesmaxdistancemin "Direct link to propTypes.maxDistance.min")

> `readonly` **min**: `0.1` = `0.1`

#### propTypes.maxDistance.softMax[​](#proptypesmaxdistancesoftmax "Direct link to propTypes.maxDistance.softMax")

> `readonly` **softMax**: `16` = `16`

#### propTypes.maxDistance.value[​](#proptypesmaxdistancevalue "Direct link to propTypes.maxDistance.value")

> `readonly` **value**: `4` = `4`

#### propTypes.normalBias[​](#proptypesnormalbias "Direct link to propTypes.normalBias")

> `readonly` **normalBias**: `object`

#### propTypes.normalBias.min[​](#proptypesnormalbiasmin "Direct link to propTypes.normalBias.min")

> `readonly` **min**: `0` = `0`

#### propTypes.normalBias.softMax[​](#proptypesnormalbiassoftmax "Direct link to propTypes.normalBias.softMax")

> `readonly` **softMax**: `0.2` = `0.2`

#### propTypes.normalBias.value[​](#proptypesnormalbiasvalue "Direct link to propTypes.normalBias.value")

> `readonly` **value**: `0.035` = `0.035`

#### propTypes.projectionMatrix[​](#proptypesprojectionmatrix "Direct link to propTypes.projectionMatrix")

> `readonly` **projectionMatrix**: `object`

#### propTypes.projectionMatrix.private[​](#proptypesprojectionmatrixprivate "Direct link to propTypes.projectionMatrix.private")

> `readonly` **private**: `true` = `true`

#### propTypes.projectionMatrix.value[​](#proptypesprojectionmatrixvalue "Direct link to propTypes.projectionMatrix.value")

> `readonly` **value**: `NumberArray16` = `IDENTITY_MATRIX`

#### propTypes.stepCount[​](#proptypesstepcount "Direct link to propTypes.stepCount")

> `readonly` **stepCount**: `object`

#### propTypes.stepCount.max[​](#proptypesstepcountmax "Direct link to propTypes.stepCount.max")

> `readonly` **max**: `40` = `40`

#### propTypes.stepCount.min[​](#proptypesstepcountmin "Direct link to propTypes.stepCount.min")

> `readonly` **min**: `1` = `1`

#### propTypes.stepCount.value[​](#proptypesstepcountvalue "Direct link to propTypes.stepCount.value")

> `readonly` **value**: `24` = `24`

#### propTypes.thickness[​](#proptypesthickness "Direct link to propTypes.thickness")

> `readonly` **thickness**: `object`

#### propTypes.thickness.min[​](#proptypesthicknessmin "Direct link to propTypes.thickness.min")

> `readonly` **min**: `0.005` = `0.005`

#### propTypes.thickness.softMax[​](#proptypesthicknesssoftmax "Direct link to propTypes.thickness.softMax")

> `readonly` **softMax**: `1` = `1`

#### propTypes.thickness.value[​](#proptypesthicknessvalue "Direct link to propTypes.thickness.value")

> `readonly` **value**: `0.12` = `0.12`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct contactShadowTraceUniforms {\n projectionMatrix: mat4x4f,\n inverseProjectionMatrix: mat4x4f,\n lightDirectionView: vec3f,\n maxDistance: f32,\n thickness: f32,\n stepCount: f32,\n frameIndex: f32,\n normalBias: f32,\n};\n\@group(0) @binding(auto) var\<uniform> contactShadowTrace: contactShadowTraceUniforms;\n\@group(0) @binding(auto) var depthTexture: texture\_depth\_2d;\n\@group(0) @binding(auto) var depthTextureSampler: sampler;\n\@group(0) @binding(auto) var normalTexture: texture\_2d\<f32>;\n\@group(0) @binding(auto) var normalTextureSampler: sampler;\n\nfn contactShadow\_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {\n let clip = vec4f(uv.x \* 2.0 - 1.0, 1.0 - uv.y \* 2.0, depth, 1.0);\n let view = contactShadowTrace.inverseProjectionMatrix \* clip;\n return view\.xyz / max(abs(view\.w), 0.00001);\n}\n\nfn contactShadow\_projectViewPosition(position: vec3f) -> vec2f {\n let clip = contactShadowTrace.projectionMatrix \* vec4f(position, 1.0);\n let ndc = clip.xy / max(abs(clip.w), 0.00001);\n return vec2f(ndc.x \* 0.5 + 0.5, 0.5 - ndc.y \* 0.5);\n}\n\nfn contactShadowTrace\_sampleColor(\n sourceTexture: texture\_2d\<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f\n) -> vec4f {\n let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);\n if (centerDepth >= 0.99999) { return vec4f(1.0); }\n let centerNormal = normalize(textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0.0).xyz \* 2.0 - 1.0);\n let centerPosition = contactShadow\_reconstructViewPosition(texCoord, centerDepth) + centerNormal \* contactShadowTrace.normalBias;\n let rayDirection = normalize(contactShadowTrace.lightDirectionView);\n let noise = fract(sin(dot(texCoord \* texSize + contactShadowTrace.frameIndex, vec2f(12.9898, 78.233))) \* 43758.5453);\n for (var index: i32 = 0; index < 40; index++) {\n if (f32(index) >= contactShadowTrace.stepCount) { break; }\n let fraction = (f32(index) + 0.35 + noise \* 0.5) / max(contactShadowTrace.stepCount, 1.0);\n let travel = contactShadowTrace.maxDistance \* fraction \* fraction;\n let rayPosition = centerPosition + rayDirection \* travel;\n let sampleUv = contactShadow\_projectViewPosition(rayPosition);\n if (any(sampleUv <= vec2f(0.0)) || any(sampleUv >= vec2f(1.0))) { break; }\n let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleUv, 0);\n if (sampleDepth >= 0.99999) { continue; }\n let scenePosition = contactShadow\_reconstructViewPosition(sampleUv, sampleDepth);\n let depthDelta = (-rayPosition.z) - (-scenePosition.z);\n let hitThickness = contactShadowTrace.thickness + travel \* 0.02;\n if (depthDelta >= 0.0 && depthDelta <= hitThickness) {\n let distanceFade = 1.0 - clamp(travel / contactShadowTrace.maxDistance, 0.0, 1.0);\n return vec4f(vec3f(1.0 - distanceFade), 1.0);\n }\n if (depthDelta > hitThickness \* 8.0) { break; }\n }\n return vec4f(1.0);\n}"

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: [`ContactTraceUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactTraceUniforms.md)

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.frameIndex[​](#uniformtypesframeindex "Direct link to uniformTypes.frameIndex")

> `readonly` **frameIndex**: `"f32"` = `'f32'`

#### uniformTypes.inverseProjectionMatrix[​](#uniformtypesinverseprojectionmatrix "Direct link to uniformTypes.inverseProjectionMatrix")

> `readonly` **inverseProjectionMatrix**: `"mat4x4<f32>"` = `'mat4x4<f32>'`

#### uniformTypes.lightDirectionView[​](#uniformtypeslightdirectionview "Direct link to uniformTypes.lightDirectionView")

> `readonly` **lightDirectionView**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.maxDistance[​](#uniformtypesmaxdistance "Direct link to uniformTypes.maxDistance")

> `readonly` **maxDistance**: `"f32"` = `'f32'`

#### uniformTypes.normalBias[​](#uniformtypesnormalbias "Direct link to uniformTypes.normalBias")

> `readonly` **normalBias**: `"f32"` = `'f32'`

#### uniformTypes.projectionMatrix[​](#uniformtypesprojectionmatrix "Direct link to uniformTypes.projectionMatrix")

> `readonly` **projectionMatrix**: `"mat4x4<f32>"` = `'mat4x4<f32>'`

#### uniformTypes.stepCount[​](#uniformtypesstepcount "Direct link to uniformTypes.stepCount")

> `readonly` **stepCount**: `"f32"` = `'f32'`

#### uniformTypes.thickness[​](#uniformtypesthickness "Direct link to uniformTypes.thickness")

> `readonly` **thickness**: `"f32"` = `'f32'`
