# Variable: contactShadowComposite

> `const` **contactShadowComposite**: `object`

Defined in: [modules/lighting/contact-shadow/contact-shadow.ts:292](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/contact-shadow/contact-shadow.ts#L292)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"contactShadowTexture"`; }, { `group`: `0`; `name`: `"directionalDirectTexture"`; }, { `group`: `0`; `name`: `"shadowDebugTexture"`; }]

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: `ContactCompositeBindings`<`unknown`>

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform contactShadowCompositeUniforms {\n float strength;\n float debugMode;\n} contactShadowComposite;\nuniform sampler2D contactShadowTexture;\nuniform sampler2D directionalDirectTexture;\nuniform sampler2D shadowDebugTexture;\nvec4 contactShadowComposite\_sampleColor(sampler2D sourceTexture,vec2 texSize,vec2 texCoord) {\n vec4 color=texture(sourceTexture,texCoord);\n float contact=texture(contactShadowTexture,texCoord).r;\n float appliedContact=mix(1.0,contact,contactShadowComposite.strength);\n if(contactShadowComposite.debugMode>0.5&\&contactShadowComposite.debugMode<1.5)return vec4(vec3(contact),1.0);\n if(contactShadowComposite.debugMode>=1.5){vec3 factors=texture(shadowDebugTexture,texCoord).rgb;return vec4(vec3(factors.x\*factors.y\*factors.z\*contact),1.0);}\n vec3 directionalDirect=texture(directionalDirectTexture,texCoord).rgb;\n return vec4(max(color.rgb-directionalDirect\*(1.0-appliedContact),vec3(0.0)),color.a);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"contactShadowComposite"` = `'contactShadowComposite'`

### passes[​](#passes "Direct link to passes")

> `readonly` **passes**: \[{ `sampler`: `true`; }]

### props[​](#props "Direct link to props")

> `readonly` **props**: `Partial`<`ContactCompositeUniforms`> & `ContactCompositeBindings`<`unknown`>

### propTypes[​](#proptypes "Direct link to propTypes")

> `readonly` **propTypes**: `object`

#### propTypes.debugMode[​](#proptypesdebugmode "Direct link to propTypes.debugMode")

> `readonly` **debugMode**: `object`

#### propTypes.debugMode.max[​](#proptypesdebugmodemax "Direct link to propTypes.debugMode.max")

> `readonly` **max**: `2` = `2`

#### propTypes.debugMode.min[​](#proptypesdebugmodemin "Direct link to propTypes.debugMode.min")

> `readonly` **min**: `0` = `0`

#### propTypes.debugMode.private[​](#proptypesdebugmodeprivate "Direct link to propTypes.debugMode.private")

> `readonly` **private**: `true` = `true`

#### propTypes.debugMode.value[​](#proptypesdebugmodevalue "Direct link to propTypes.debugMode.value")

> `readonly` **value**: `0` = `0`

#### propTypes.strength[​](#proptypesstrength "Direct link to propTypes.strength")

> `readonly` **strength**: `object`

#### propTypes.strength.max[​](#proptypesstrengthmax "Direct link to propTypes.strength.max")

> `readonly` **max**: `1` = `1`

#### propTypes.strength.min[​](#proptypesstrengthmin "Direct link to propTypes.strength.min")

> `readonly` **min**: `0` = `0`

#### propTypes.strength.value[​](#proptypesstrengthvalue "Direct link to propTypes.strength.value")

> `readonly` **value**: `1` = `1`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct contactShadowCompositeUniforms {\n strength: f32,\n debugMode: f32,\n};\n\@group(0) @binding(auto) var\<uniform> contactShadowComposite: contactShadowCompositeUniforms;\n\@group(0) @binding(auto) var contactShadowTexture: texture\_2d\<f32>;\n\@group(0) @binding(auto) var contactShadowTextureSampler: sampler;\n\@group(0) @binding(auto) var directionalDirectTexture: texture\_2d\<f32>;\n\@group(0) @binding(auto) var directionalDirectTextureSampler: sampler;\n\@group(0) @binding(auto) var shadowDebugTexture: texture\_2d\<f32>;\n\@group(0) @binding(auto) var shadowDebugTextureSampler: sampler;\n\nfn contactShadowComposite\_sampleColor(\n sourceTexture: texture\_2d\<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f\n) -> vec4f {\n let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0.0);\n let contact = textureSampleLevel(contactShadowTexture, contactShadowTextureSampler, texCoord, 0.0).r;\n let appliedContact = mix(1.0, contact, contactShadowComposite.strength);\n if (contactShadowComposite.debugMode > 0.5 && contactShadowComposite.debugMode < 1.5) {\n return vec4f(vec3f(contact), 1.0);\n }\n if (contactShadowComposite.debugMode >= 1.5) {\n let factors = textureSampleLevel(shadowDebugTexture, shadowDebugTextureSampler, texCoord, 0.0).rgb;\n return vec4f(vec3f(factors.x \* factors.y \* factors.z \* contact), 1.0);\n }\n let directionalDirect = textureSampleLevel(\n directionalDirectTexture,\n directionalDirectTextureSampler,\n texCoord,\n 0.0\n ).rgb;\n return vec4f(max(color.rgb - directionalDirect \* (1.0 - appliedContact), vec3f(0.0)), color.a);\n}"

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: `ContactCompositeUniforms`

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.debugMode[​](#uniformtypesdebugmode "Direct link to uniformTypes.debugMode")

> `readonly` **debugMode**: `"f32"` = `'f32'`

#### uniformTypes.strength[​](#uniformtypesstrength "Direct link to uniformTypes.strength")

> `readonly` **strength**: `"f32"` = `'f32'`
