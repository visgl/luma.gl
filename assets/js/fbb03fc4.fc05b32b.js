/*! For license information please see fbb03fc4.fc05b32b.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[39],{4827:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>c,contentTitle:()=>i,default:()=>h,frontMatter:()=>d,metadata:()=>l,toc:()=>a});var n=s(4848),t=s(8453);const d={},i="Sampler",l={id:"api-reference/core/resources/sampler",title:"Sampler",description:"A Sampler is an immutable object that holds a set of sampling parameters for texture access.",source:"@site/../docs/api-reference/core/resources/sampler.md",sourceDirName:"api-reference/core/resources",slug:"/api-reference/core/resources/sampler",permalink:"/docs/api-reference/core/resources/sampler",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-reference/core/resources/sampler.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"RenderPipeline",permalink:"/docs/api-reference/core/resources/render-pipeline"},next:{title:"Shader",permalink:"/docs/api-reference/core/resources/shader"}},c={},a=[{value:"Usage",id:"usage",level:2},{value:"Types",id:"types",level:2},{value:"SamplerProps",id:"samplerprops",level:3},{value:"Texture Wrapping",id:"texture-wrapping",level:4},{value:"Texture Magnification Filter",id:"texture-magnification-filter",level:4},{value:"Texture Minification Filter",id:"texture-minification-filter",level:4},{value:"Texture Mipmap Filter",id:"texture-mipmap-filter",level:4},{value:"Texture Max Anisotropy",id:"texture-max-anisotropy",level:4},{value:"Texture Comparison Function",id:"texture-comparison-function",level:4},{value:"Members",id:"members",level:2},{value:"Methods",id:"methods",level:2},{value:"<code>constructor(props: SamplerProps)</code>",id:"constructorprops-samplerprops",level:3},{value:"<code>destroy(): void</code>",id:"destroy-void",level:3},{value:"Remarks",id:"remarks",level:2}];function o(e){const r={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,t.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.h1,{id:"sampler",children:"Sampler"}),"\n",(0,n.jsxs)(r.p,{children:["A ",(0,n.jsx)(r.code,{children:"Sampler"}),' is an immutable object that holds a set of sampling parameters for texture access.\nSampling parameters are applied during shader execution and control how values ("texels")\nare read from textures.']}),"\n",(0,n.jsxs)(r.p,{children:["Note that luma.gl automatically creates a default ",(0,n.jsx)(r.code,{children:"Sampler"})," for each ",(0,n.jsx)(r.code,{children:"Texture"}),".\nA texture's default sampler parameters can be specified creating the texture via ",(0,n.jsx)(r.code,{children:"device.createTexture({sampler: SamplerProps}))"}),".\nUnless an application needs to render the same texture with different sampling parameters,\nan application typically does not need to explicitly instantiate samplers."]}),"\n",(0,n.jsxs)(r.p,{children:["Note that a ",(0,n.jsx)(r.strong,{children:"Comparison sampler"})," is a special type of ",(0,n.jsx)(r.code,{children:"Sampler"})," that compares against the depth buffer.\nDuring comparison sampling, the interpolated and clamped ",(0,n.jsx)(r.code,{children:"r"})," texture coordinate is compared to currently bound depth texture,\nand the result of the comparison (",(0,n.jsx)(r.code,{children:"0"})," or ",(0,n.jsx)(r.code,{children:"1"}),") is assigned to the red channel.\nSpecifying the ",(0,n.jsx)(r.code,{children:"type: 'comparison-sampler'"})," sampler property creates a comparison sampler."]}),"\n",(0,n.jsxs)(r.p,{children:["For more information, see ",(0,n.jsx)(r.a,{href:"/docs/api-guide/gpu/gpu-textures#sampling",children:"Sampling"})," in the API Guide."]}),"\n",(0,n.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsxs)(r.p,{children:["Create a new ",(0,n.jsx)(r.code,{children:"Sampler"})]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nconst device = await luma.createDevice();\nconst sampler = device.createSampler(gl, {\n  addressModeU: 'clamp-to-edge'\n});\n"})}),"\n",(0,n.jsxs)(r.p,{children:["Note that a default ",(0,n.jsx)(r.code,{children:"Sampler"})," is automatically created for each texture:"]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"// Create a texture\nconst texture = device.createTexture({\n  sampler: {\n    minFilter: 'linear',\n    maxFilter: 'linear'\n  }\n});\nconsole.log(texture.sampler);\n"})}),"\n",(0,n.jsxs)(r.p,{children:["Create a new ",(0,n.jsx)(r.strong,{children:"comparison sampler"}),", by specifying the ",(0,n.jsx)(r.code,{children:"compare"})," sampler property creates a comparison sampler."]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"const sampler = device.createSampler(gl, {\n  compare: 'lequal'\n});\n"})}),"\n",(0,n.jsx)(r.h2,{id:"types",children:"Types"}),"\n",(0,n.jsx)(r.h3,{id:"samplerprops",children:"SamplerProps"}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Sampler Parameter"}),(0,n.jsx)(r.th,{children:"Values"}),(0,n.jsx)(r.th,{children:"Description"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"type"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"'color-sampler'"})," * | ",(0,n.jsx)(r.code,{children:"'comparison-sampler'"})]}),(0,n.jsxs)(r.td,{children:["Specify ",(0,n.jsx)(r.code,{children:"'comparison-sampler'"})," to create a depth comparison sampler"]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"addressModeU?"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"'clamp-to-edge'"})," * | ",(0,n.jsx)(r.code,{children:"'repeat'"})," | ",(0,n.jsx)(r.code,{children:"'mirror-repeat'"})]}),(0,n.jsxs)(r.td,{children:["Texture wrapping for texture coordinate ",(0,n.jsx)(r.code,{children:"u"})," (",(0,n.jsx)(r.code,{children:"s"}),")"]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"addressModeV?"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"'clamp-to-edge'"})," * | ",(0,n.jsx)(r.code,{children:"'repeat'"})," | ",(0,n.jsx)(r.code,{children:"'mirror-repeat'"})]}),(0,n.jsxs)(r.td,{children:["Texture wrapping for texture coordinate ",(0,n.jsx)(r.code,{children:"v"})," (",(0,n.jsx)(r.code,{children:"t"}),")"]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"addressModeW?"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"'clamp-to-edge'"})," * | ",(0,n.jsx)(r.code,{children:"'repeat'"})," | ",(0,n.jsx)(r.code,{children:"'mirror-repeat'"})]}),(0,n.jsxs)(r.td,{children:["Texture wrapping for texture coordinate ",(0,n.jsx)(r.code,{children:"w"})," (",(0,n.jsx)(r.code,{children:"r"}),")"]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"magFilter?"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"'nearest'"})," * | ",(0,n.jsx)(r.code,{children:"'linear'"})]}),(0,n.jsx)(r.td,{children:"Sample nearest texel, or interpolate closest texels"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"minFilter?"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"'nearest'"})," * | ",(0,n.jsx)(r.code,{children:"'linear'"})]}),(0,n.jsx)(r.td,{children:"Sample nearest texel, or interpolate closest texels"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"mipmapFilter?"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"'none'"})," * | ",(0,n.jsx)(r.code,{children:"'nearest'"})," | ",(0,n.jsx)(r.code,{children:"'linear'"})]}),(0,n.jsx)(r.td,{children:"Sample closest mipmap, or interpolate two closest mipmaps"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"maxAnisotropy?"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"number"})}),(0,n.jsx)(r.td,{children:"Combine samples from multiple mipmap levels when appropriate"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"lodMinClamp?"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"number"})}),(0,n.jsx)(r.td,{children:"Minimum level of detail to use when sampling"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"lodMaxClamp?"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"number"})}),(0,n.jsx)(r.td,{children:"Maximum level of detail to use when sampling"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"compare?"})}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"less-equal"})," etc (see below)"]}),(0,n.jsx)(r.td,{children:'Specifies compare function for a depth "comparison sampler"'})]})]})]}),"\n",(0,n.jsx)(r.h4,{id:"texture-wrapping",children:"Texture Wrapping"}),"\n",(0,n.jsx)(r.p,{children:"Controls how texture coordinates outside of the [0, 1] range are sampled."}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:["Parameters: ",(0,n.jsx)(r.code,{children:"addressModeU"}),", ",(0,n.jsx)(r.code,{children:"addressModeV"}),", ",(0,n.jsx)(r.code,{children:"addressModeW"})]}),"\n"]}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Value"}),(0,n.jsx)(r.th,{children:"Description"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"repeat"})," (default)"]}),(0,n.jsx)(r.td,{children:"use fractional part of texture coordinates"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"clamp-to-edge"})}),(0,n.jsx)(r.td,{children:"clamp texture coordinates"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"mirrored-repeat"})}),(0,n.jsxs)(r.td,{children:["use fractional part of texture coordinate if integer part is odd, otherwise ",(0,n.jsx)(r.code,{children:"1 - frac"})]})]})]})]}),"\n",(0,n.jsx)(r.h4,{id:"texture-magnification-filter",children:"Texture Magnification Filter"}),"\n",(0,n.jsx)(r.p,{children:"Controls how a pixel is textured when it maps to less than one texel."}),"\n",(0,n.jsxs)(r.p,{children:["Parameter: ",(0,n.jsx)(r.code,{children:"magFilter"})]}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Value"}),(0,n.jsx)(r.th,{children:"Description"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"nearest"})," (default)"]}),(0,n.jsx)(r.td,{children:"nearest texel"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"linear"})}),(0,n.jsx)(r.td,{children:"interpolated texel"})]})]})]}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"nearest"})," is faster than ",(0,n.jsx)(r.code,{children:"linear"}),", but is not as smooth."]}),"\n"]}),"\n",(0,n.jsx)(r.h4,{id:"texture-minification-filter",children:"Texture Minification Filter"}),"\n",(0,n.jsx)(r.p,{children:"Controls how a pixel is textured when it maps to more than one texel."}),"\n",(0,n.jsxs)(r.p,{children:["Parameter: ",(0,n.jsx)(r.code,{children:"minFilter"})]}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Value"}),(0,n.jsx)(r.th,{children:"Description"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"nearest"})," (default)"]}),(0,n.jsx)(r.td,{children:"nearest texel"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"linear"})}),(0,n.jsx)(r.td,{children:"interpolated texel"})]})]})]}),"\n",(0,n.jsx)(r.h4,{id:"texture-mipmap-filter",children:"Texture Mipmap Filter"}),"\n",(0,n.jsx)(r.p,{children:"Controls if a pixel is textured by referencing more than one mipmap level."}),"\n",(0,n.jsxs)(r.p,{children:["Parameter: ",(0,n.jsx)(r.code,{children:"mipmapFilter"})]}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Value"}),(0,n.jsx)(r.th,{children:"Description"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"nearest"})," (default)"]}),(0,n.jsx)(r.td,{children:"nearest mipmap"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"linear"})}),(0,n.jsx)(r.td,{children:"interpolate between mipmaps"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"none"})}),(0,n.jsx)(r.td,{children:"no mipmaps"})]})]})]}),"\n",(0,n.jsxs)(r.p,{children:["For more information, see ",(0,n.jsx)(r.a,{href:"/docs/api-guide/gpu/gpu-textures#mipmaps",children:"GPU Textures"}),"."]}),"\n",(0,n.jsx)(r.h4,{id:"texture-max-anisotropy",children:"Texture Max Anisotropy"}),"\n",(0,n.jsx)(r.p,{children:"Controls multiple mipmap level can be consulted when texturing a pixel."}),"\n",(0,n.jsx)(r.h4,{id:"texture-comparison-function",children:"Texture Comparison Function"}),"\n",(0,n.jsxs)(r.blockquote,{children:["\n",(0,n.jsxs)(r.p,{children:["Specifying the ",(0,n.jsx)(r.code,{children:"compare"})," sampler property creates a comparison sampler.\nComparison samplers are special samplers that compare a value against the depth buffer."]}),"\n"]}),"\n",(0,n.jsxs)(r.p,{children:["Parameter: ",(0,n.jsx)(r.code,{children:"compare"})]}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"`Value"}),(0,n.jsx)(r.th,{children:"Computed result"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"less-equal"})," (default)"]}),(0,n.jsx)(r.td,{children:"result = 1.0 0.0, r <= D t r > D t"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"greater-equal"})}),(0,n.jsx)(r.td,{children:"result = 1.0 0.0, r >= D t r < D t"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"less"})}),(0,n.jsx)(r.td,{children:"result = 1.0 0.0, r < D t r >= D t"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"greater"})}),(0,n.jsx)(r.td,{children:"result = 1.0 0.0, r > D t r <= D t"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"equal"})}),(0,n.jsx)(r.td,{children:"result = 1.0 0.0, r = D t r \u2260 D t"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"not-equal"})}),(0,n.jsx)(r.td,{children:"result = 1.0 0.0, r \u2260 D t r = D t"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"always"})}),(0,n.jsx)(r.td,{children:"result = 1.0"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"never"})}),(0,n.jsx)(r.td,{children:"result = 0.0"})]})]})]}),"\n",(0,n.jsxs)(r.p,{children:["During sampling, the interpolated and clamped ",(0,n.jsx)(r.code,{children:"r"})," texture coordinate is compared to currently bound depth texture,\nand the result of the comparison (",(0,n.jsx)(r.code,{children:"0"})," or ",(0,n.jsx)(r.code,{children:"1"}),") is assigned to the red channel."]}),"\n",(0,n.jsx)(r.h2,{id:"members",children:"Members"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"device"}),": ",(0,n.jsx)(r.code,{children:"Device"})," - holds a reference to the ",(0,n.jsx)(r.code,{children:"Device"})," that created this ",(0,n.jsx)(r.code,{children:"Sampler"}),"."]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"handle"}),": ",(0,n.jsx)(r.code,{children:"unknown"})," - holds the underlying WebGL or WebGPU shader object"]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"props"}),": ",(0,n.jsx)(r.code,{children:"SamplerProps"})," - holds a copy of the ",(0,n.jsx)(r.code,{children:"SamplerProps"})," used to create this ",(0,n.jsx)(r.code,{children:"Sampler"}),"."]}),"\n"]}),"\n",(0,n.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,n.jsx)(r.h3,{id:"constructorprops-samplerprops",children:(0,n.jsx)(r.code,{children:"constructor(props: SamplerProps)"})}),"\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"Sampler"})," is an abstract class and cannot be instantiated directly. Create with ",(0,n.jsx)(r.code,{children:"device.createSampler(...)"}),"."]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"device.createSampler({...})\n"})}),"\n",(0,n.jsx)(r.h3,{id:"destroy-void",children:(0,n.jsx)(r.code,{children:"destroy(): void"})}),"\n",(0,n.jsx)(r.p,{children:"Free up any GPU resources associated with this sampler immediately (instead of waiting for garbage collection)."}),"\n",(0,n.jsx)(r.h2,{id:"remarks",children:"Remarks"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:["WebGL: More information about ",(0,n.jsx)(r.code,{children:"WebGLSampler"})," can be found in the ",(0,n.jsx)(r.a,{href:"https://www.khronos.org/opengl/wiki/Sampler_Object",children:"OpenGL Wiki"}),"."]}),"\n"]})]})}function h(e={}){const{wrapper:r}={...(0,t.R)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}},1020:(e,r,s)=>{var n=s(6540),t=Symbol.for("react.element"),d=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,l=n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function a(e,r,s){var n,d={},a=null,o=null;for(n in void 0!==s&&(a=""+s),void 0!==r.key&&(a=""+r.key),void 0!==r.ref&&(o=r.ref),r)i.call(r,n)&&!c.hasOwnProperty(n)&&(d[n]=r[n]);if(e&&e.defaultProps)for(n in r=e.defaultProps)void 0===d[n]&&(d[n]=r[n]);return{$$typeof:t,type:e,key:a,ref:o,props:d,_owner:l.current}}r.Fragment=d,r.jsx=a,r.jsxs=a},4848:(e,r,s)=>{e.exports=s(1020)},8453:(e,r,s)=>{s.d(r,{R:()=>i,x:()=>l});var n=s(6540);const t={},d=n.createContext(t);function i(e){const r=n.useContext(d);return n.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function l(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),n.createElement(d.Provider,{value:r},e.children)}}}]);