/*! For license information please see 89912527.7c392e51.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[2206],{2280:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>o,contentTitle:()=>a,default:()=>h,frontMatter:()=>t,metadata:()=>l,toc:()=>c});var s=i(4848),r=i(8453);const t={},a="API Design Philosophy",l={id:"api-guide/background/api-design",title:"API Design Philosophy",description:"This article provides some background on luma.gl's API design philosophy.",source:"@site/../docs/api-guide/background/api-design.md",sourceDirName:"api-guide/background",slug:"/api-guide/background/api-design",permalink:"/docs/api-guide/background/api-design",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-guide/background/api-design.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"API Overview",permalink:"/docs/api-guide/"},next:{title:"Learning Resources",permalink:"/docs/api-guide/background/learning-resources"}},o={},c=[{value:"Design Goals",id:"design-goals",level:2},{value:"A WebGPU-style API",id:"a-webgpu-style-api",level:2}];function d(e){const n={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...(0,r.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"api-design-philosophy",children:"API Design Philosophy"}),"\n",(0,s.jsx)(n.p,{children:"This article provides some background on luma.gl's API design philosophy."}),"\n",(0,s.jsx)(n.h2,{id:"design-goals",children:"Design Goals"}),"\n",(0,s.jsx)(n.p,{children:"Goals:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"The luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications."}),"\n",(0,s.jsx)(n.li,{children:"Avoid creating a thick abstraction layer hiding the underlying API."}),"\n",(0,s.jsx)(n.li,{children:"Big data processing (thinking about the GPU as a parallel binary columnar table processor rather than a scenegraph rendering engine)."}),"\n",(0,s.jsx)(n.li,{children:"Cross platform support: backwards compatibility with WebGL 2."}),"\n"]}),"\n",(0,s.jsx)(n.p,{children:"Non-goals:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Comprehensive 3D Game Engine functionality"}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"a-webgpu-style-api",children:"A WebGPU-style API"}),"\n",(0,s.jsx)(n.p,{children:"The luma.gl v9 API design launched in 2023 stays fairly close to the WebGPU API, just as the earlier luma.gl v8 API followed the WebGL 2 API. The idea is to let users build their knowledge of WebGPU and the luma.gl API in tandem, rather than asking them to learn an abstraction and perhaps never get to work directly with WebGPU."}),"\n",(0,s.jsxs)(n.p,{children:["Accordingly the luma.gl ",(0,s.jsx)(n.code,{children:"Device"})," API is designed to be similar to the WebGPU ",(0,s.jsx)(n.code,{children:"Device"})," API. for example:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["The application must first obtain a ",(0,s.jsx)(n.code,{children:"Device"})," instance"]}),"\n",(0,s.jsx)(n.li,{children:"It then uses methods on this device to create GPU resource classes such as buffers, textures, shaders and pipelines."}),"\n",(0,s.jsx)(n.li,{children:"The name of the resource classes mirror those in the WebGPU API."}),"\n",(0,s.jsx)(n.li,{children:"the luma.gl API uses string constants and parameter option names that mirror those in the WebGPU API."}),"\n"]}),"\n",(0,s.jsx)(n.p,{children:"These similarities are intentional:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"The avoids creating a new abstraction layer that developers must learn."}),"\n",(0,s.jsx)(n.li,{children:"Knowledge of the WebGPU API carries over to the luma.gl API and vice versa."}),"\n",(0,s.jsx)(n.li,{children:"They allow the luma.gl WebGPU Device implementation to remain thin, ensuring optimal performance and minimal overhead."}),"\n"]}),"\n",(0,s.jsx)(n.p,{children:"While the luma.gl Device API has many similarities to WebGPU API, it is not a trivial wrapper. The luma.gl API is:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"streamlined to be significantly less cumbersome to use."}),"\n",(0,s.jsxs)(n.li,{children:["makes the necessary allowances to also enable a reasonable WebGL ",(0,s.jsx)(n.code,{children:"Device"})," implementation."]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},1020:(e,n,i)=>{var s=i(6540),r=Symbol.for("react.element"),t=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,l=s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,o={key:!0,ref:!0,__self:!0,__source:!0};function c(e,n,i){var s,t={},c=null,d=null;for(s in void 0!==i&&(c=""+i),void 0!==n.key&&(c=""+n.key),void 0!==n.ref&&(d=n.ref),n)a.call(n,s)&&!o.hasOwnProperty(s)&&(t[s]=n[s]);if(e&&e.defaultProps)for(s in n=e.defaultProps)void 0===t[s]&&(t[s]=n[s]);return{$$typeof:r,type:e,key:c,ref:d,props:t,_owner:l.current}}n.Fragment=t,n.jsx=c,n.jsxs=c},4848:(e,n,i)=>{e.exports=i(1020)},8453:(e,n,i)=>{i.d(n,{R:()=>a,x:()=>l});var s=i(6540);const r={},t=s.createContext(r);function a(e){const n=s.useContext(t);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:a(e.components),s.createElement(t.Provider,{value:n},e.children)}}}]);