/*! For license information please see cfa22294.ba1a4f4b.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[4006],{3763:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>c,contentTitle:()=>i,default:()=>h,frontMatter:()=>t,metadata:()=>l,toc:()=>o});var n=s(4848),d=s(8453);const t={},i="Upgrade Guide",l={id:"upgrade-guide",title:"Upgrade Guide",description:"The upgrade guide lists breaking changes in each major and minor version of the luma.gl API, and provides information on how to update applications.",source:"@site/../docs/upgrade-guide.md",sourceDirName:".",slug:"/upgrade-guide",permalink:"/docs/upgrade-guide",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/upgrade-guide.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"What's New",permalink:"/docs/whats-new"},next:{title:"Setup",permalink:"/docs/tutorials/"}},c={},o=[{value:"Upgrading to v9.1",id:"upgrading-to-v91",level:2},{value:"Upgrading to v9.0",id:"upgrading-to-v90",level:2},{value:"Upgrading to v8 and earlier releases",id:"upgrading-to-v8-and-earlier-releases",level:2}];function a(e){const r={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",li:"li",p:"p",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,d.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.h1,{id:"upgrade-guide",children:"Upgrade Guide"}),"\n",(0,n.jsx)(r.p,{children:"The upgrade guide lists breaking changes in each major and minor version of the luma.gl API, and provides information on how to update applications."}),"\n",(0,n.jsx)(r.p,{children:"Upgrade instructions assume that you are upgrading from the immediately previous release.\nIf you are upgrading across multiple releases you will want to consider the release notes for all\nintermediary releases."}),"\n",(0,n.jsxs)(r.p,{children:["luma.gl largely follows ",(0,n.jsx)(r.a,{href:"https://semver.org",children:"SEMVER"})," conventions. Breaking changes are typically only done in major versions, minor version bumps bring new functionality but few breaking changes, and patch releases typically contain only low-risk fixes."]}),"\n",(0,n.jsx)(r.p,{children:(0,n.jsxs)(r.em,{children:["For detailed commit level logs that include alpha and beta releases, see the ",(0,n.jsx)(r.a,{href:"https://github.com/visgl/luma.gl/blob/master/CHANGELOG.md",children:"CHANGELOG"})," in the github repository."]})}),"\n",(0,n.jsx)(r.h2,{id:"upgrading-to-v91",children:"Upgrading to v9.1"}),"\n",(0,n.jsx)(r.p,{children:"v9.1 continues to build out WebGPU support. Some additional deprecations and breaking changes have been necessary, but impact on most applications should be minimal."}),"\n",(0,n.jsx)(r.p,{children:(0,n.jsx)(r.strong,{children:"Notable change: Adapters"})}),"\n",(0,n.jsxs)(r.p,{children:["When initializing luma.gl, applications now import an ",(0,n.jsx)(r.code,{children:"Adapter"})," singleton from either the WebGPU or the WebGL module, and pass the adapter object to ",(0,n.jsx)(r.code,{children:"luma.createDevice()"}),", ",(0,n.jsx)(r.code,{children:"makeAnimationLoop"})," etc."]}),"\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"luma.registerDevices()"})," is replaced with ",(0,n.jsx)(r.code,{children:"luma.registerAdapters()"})," if global registration work best."]}),"\n",(0,n.jsx)(r.p,{children:(0,n.jsx)(r.strong,{children:"Notable change: Textures"})}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsx)(r.li,{children:"The texture API is being streamlined to work symmetrically across WebGPU and WebGL."}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"Texture.copyExternalImage()"})," replaces ",(0,n.jsx)(r.code,{children:"Texture.setImageData()"})," when initializing textures with image data."]}),"\n"]}),"\n",(0,n.jsx)(r.p,{children:(0,n.jsx)(r.strong,{children:"Notable change: AsyncTextures"})}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"Textures"})," no longer accept promises when setting data (e.g. from ",(0,n.jsx)(r.code,{children:"loadImageBitmap(url)"}),"."]}),"\n",(0,n.jsxs)(r.li,{children:["Instead, a new ",(0,n.jsx)(r.code,{children:"AsyncTexture"})," class does accept promises and creates actual ",(0,n.jsx)(r.code,{children:"Textures"})," once the promise resolves and data is available."]}),"\n",(0,n.jsxs)(r.li,{children:["The ",(0,n.jsx)(r.code,{children:"Model"})," class now accepts ",(0,n.jsx)(r.code,{children:"AsyncTextures"})," as bindings and defers rendering until the underlying texture has been created."]}),"\n"]}),"\n",(0,n.jsx)(r.p,{children:(0,n.jsx)(r.strong,{children:"@luma.gl/core"})}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Updated API"}),(0,n.jsx)(r.th,{children:"Status"}),(0,n.jsx)(r.th,{children:"Replacement"}),(0,n.jsx)(r.th,{children:"Comment"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"luma.registerDevices()"})}),(0,n.jsx)(r.td,{children:"Deprecated"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.a,{href:"/docs/api-reference/core/luma#lumaregisteradapters",children:(0,n.jsx)(r.code,{children:"luma.registerAdapters()"})}),"."]}),(0,n.jsx)(r.td,{children:"Adapters provide a cleaner way to work with GPU backends."})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"DeviceProps"})," for canvas"]}),(0,n.jsx)(r.td,{children:"Moved"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.a,{href:"/docs/api-reference/core/canvas-context#canvascontextprops",children:(0,n.jsx)(r.code,{children:"DeviceProps.createCanvasContext"})}),"."]}),(0,n.jsxs)(r.td,{children:["Move canvas related props to ",(0,n.jsx)(r.code,{children:"props.createCanvasContext: {}"}),"."]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"DeviceProps"})," for webgl"]}),(0,n.jsx)(r.td,{children:"Moved"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.a,{href:"https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#contextattributes",children:(0,n.jsx)(r.code,{children:"DeviceProps.webgl"})}),"."]}),(0,n.jsxs)(r.td,{children:["Move canvas related props to ",(0,n.jsx)(r.code,{children:"props.webgl: {}"}),"."]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"DeviceProps.break"})}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsx)(r.td,{}),(0,n.jsxs)(r.td,{children:["Use an alterative ",(0,n.jsx)(r.a,{href:"/docs/developer-guide/debugging",children:"debugger"})]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"TextureProps.data"})," (Promise)"]}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"AsyncTexture"})," class"]}),(0,n.jsx)(r.td,{children:"Textures no longer accept promises."})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"Parameters.blend"})}),(0,n.jsx)(r.td,{children:"New"}),(0,n.jsx)(r.td,{}),(0,n.jsx)(r.td,{children:"Explicit activation of color blending"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"triangle-fan-webgl"})," topology"]}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"triangle-strip"}),"."]}),(0,n.jsx)(r.td,{children:"Reorganize your geometries"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"line-loop-webgl"})," topology"]}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"line-list"}),"."]}),(0,n.jsx)(r.td,{children:"Reorganize your geometries"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"glsl"})," shader template string"]}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"/* glsl */"})," comment"]}),(0,n.jsx)(r.td,{children:"Enable syntax highlighting in vscode using before shader string"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"depth24unorm-stencil8"})}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"depth24plus-stencil8"})}),(0,n.jsxs)(r.td,{children:["The ",(0,n.jsx)(r.code,{children:"TextureFormat"})," was removed from the WebGPU spec"]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"rgb8unorm-unsized"})}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"rgb8unorm"})}),(0,n.jsxs)(r.td,{children:["No longer support unsized WebGL1 ",(0,n.jsx)(r.code,{children:"TextureFormat"})]})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"rgba8unorm-unsized"})}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"rgb8aunorm"})}),(0,n.jsxs)(r.td,{children:["No longer support unsized WebGL1 ",(0,n.jsx)(r.code,{children:"TextureFormat"})]})]})]})]}),"\n",(0,n.jsx)(r.p,{children:(0,n.jsx)(r.strong,{children:"@luma.gl/shadertools"})}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Updated API"}),(0,n.jsx)(r.th,{children:"Status"}),(0,n.jsx)(r.th,{children:"Replacement"}),(0,n.jsx)(r.th,{children:"Comment"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"ShaderModuleInstance"})}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:["Use ",(0,n.jsx)(r.code,{children:"ShaderModule"})," instead."]}),(0,n.jsx)(r.td,{children:"Type has been removed."})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"initializeShaderModule()"})}),(0,n.jsx)(r.td,{children:"Changed"}),(0,n.jsx)(r.td,{}),(0,n.jsx)(r.td,{children:"Initializes the original shader module object"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"ShaderModuleInstance.getUniforms()"})}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"getShaderModuleUniforms(module, ...)"}),"."]}),(0,n.jsx)(r.td,{children:"Interact directly with the shader module"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"getDependencyGraph()"})}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"getShaderModuleDependencies(module)"})," ."]}),(0,n.jsx)(r.td,{children:"Interact directly with the shader module"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"glsl"})," template string"]}),(0,n.jsx)(r.td,{children:"Removed"}),(0,n.jsxs)(r.td,{children:[(0,n.jsx)(r.code,{children:"/* glsl */"})," comment"]}),(0,n.jsx)(r.td,{children:"Enable syntax highlighting in vscode using comment"})]})]})]}),"\n",(0,n.jsx)(r.p,{children:(0,n.jsx)(r.strong,{children:"@luma.gl/webgl"})}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"WebGLDeviceContext"})," - Note that luma.gl v9.1 and onwards set ",(0,n.jsx)(r.code,{children:"DeviceProps.webgl.preserveDrawingBuffers"})," to ",(0,n.jsx)(r.code,{children:"true"})," by default. This can be disabled for some memory savings and a minor performance boost on resource limited devices, such as mobile phones, at the cost of not being able to take screenshots or rendering to screen without clearing it."]}),"\n"]}),"\n",(0,n.jsx)(r.h2,{id:"upgrading-to-v90",children:"Upgrading to v9.0"}),"\n",(0,n.jsxs)(r.p,{children:["luma.gl v9 is a major modernization of the luma.gl API, with many breaking changes, so the upgrade notes for this release are unusually long. To facilitate porting to the v9 release we have also provided a\n",(0,n.jsx)(r.a,{href:"/docs/legacy/porting-guide",children:"Porting Guide"})," that also provides more background information and discusses porting strategies."]}),"\n",(0,n.jsx)(r.h2,{id:"upgrading-to-v8-and-earlier-releases",children:"Upgrading to v8 and earlier releases"}),"\n",(0,n.jsxs)(r.p,{children:["This page only covers luma.gl v9 and later releases.\nFor information on upgrading to from v8 and earlier releases, see the ",(0,n.jsx)(r.a,{href:"/docs/legacy/legacy-upgrade-guide",children:"Legacy Upgrade Guide"}),"."]})]})}function h(e={}){const{wrapper:r}={...(0,d.R)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(a,{...e})}):a(e)}},1020:(e,r,s)=>{var n=s(6540),d=Symbol.for("react.element"),t=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,l=n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function o(e,r,s){var n,t={},o=null,a=null;for(n in void 0!==s&&(o=""+s),void 0!==r.key&&(o=""+r.key),void 0!==r.ref&&(a=r.ref),r)i.call(r,n)&&!c.hasOwnProperty(n)&&(t[n]=r[n]);if(e&&e.defaultProps)for(n in r=e.defaultProps)void 0===t[n]&&(t[n]=r[n]);return{$$typeof:d,type:e,key:o,ref:a,props:t,_owner:l.current}}r.Fragment=t,r.jsx=o,r.jsxs=o},4848:(e,r,s)=>{e.exports=s(1020)},8453:(e,r,s)=>{s.d(r,{R:()=>i,x:()=>l});var n=s(6540);const d={},t=n.createContext(d);function i(e){const r=n.useContext(t);return n.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function l(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(d):e.components||d:i(e.components),n.createElement(t.Provider,{value:r},e.children)}}}]);