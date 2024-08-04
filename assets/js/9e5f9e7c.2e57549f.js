/*! For license information please see 9e5f9e7c.2e57549f.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[296],{2316:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>o,contentTitle:()=>t,default:()=>p,frontMatter:()=>c,metadata:()=>s,toc:()=>d});var a=i(4848),r=i(8453);const c={},t="GPU Initialization",s={id:"api-guide/gpu/gpu-initialization",title:"GPU Initialization",description:"Adapter",source:"@site/../docs/api-guide/gpu/gpu-initialization.md",sourceDirName:"api-guide/gpu",slug:"/api-guide/gpu/gpu-initialization",permalink:"/docs/api-guide/gpu/gpu-initialization",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-guide/gpu/gpu-initialization.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"WebGPU vs WebGL",permalink:"/docs/api-guide/background/webgpu-vs-webgl"},next:{title:"GPU Resources",permalink:"/docs/api-guide/gpu/gpu-resources"}},o={},d=[{value:"Adapter",id:"adapter",level:2},{value:"Device",id:"device",level:2},{value:"CanvasContext",id:"canvascontext",level:2},{value:"Registering Backend Adapters",id:"registering-backend-adapters",level:2}];function l(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.h1,{id:"gpu-initialization",children:"GPU Initialization"}),"\n",(0,a.jsx)(n.h2,{id:"adapter",children:"Adapter"}),"\n",(0,a.jsxs)(n.p,{children:["An ",(0,a.jsx)(n.code,{children:"Adapter"})," is a factory for ",(0,a.jsx)(n.code,{children:"Device"})," instances for a specific backend (e.g. WebGPU or WebGL)."]}),"\n",(0,a.jsx)(n.h2,{id:"device",children:"Device"}),"\n",(0,a.jsxs)(n.p,{children:["The ",(0,a.jsx)(n.a,{href:"/docs/api-reference/core/device",children:(0,a.jsx)(n.code,{children:"Device"})})," class provides luma.gl applications with access to the GPU.\nA luma.gl application first creates a ",(0,a.jsx)(n.code,{children:"Device"})," instance which in turn provides the\napplication with facilities for creating GPU resources (such as ",(0,a.jsx)(n.code,{children:"Buffer"})," and ",(0,a.jsx)(n.code,{children:"Texture"})," objects),\nquerying GPU capabilities, compiling and linking shaders into pipelines, setting parameters,\nand of course performing draw and compute calls."]}),"\n",(0,a.jsxs)(n.p,{children:["While a ",(0,a.jsx)(n.code,{children:"Device"})," can be used on its own to perform computations on the GPU,\nat least one ",(0,a.jsx)(n.code,{children:"CanvasContext"})," is required for rendering to the screen.\nEach ",(0,a.jsx)(n.code,{children:"CanvasContext"})," provides a connection between a ",(0,a.jsx)(n.code,{children:"Device"})," and an ",(0,a.jsx)(n.code,{children:"HTMLCanvasElement"})," (or ",(0,a.jsx)(n.code,{children:"OffscreenCanvas"}),")."]}),"\n",(0,a.jsx)(n.h2,{id:"canvascontext",children:"CanvasContext"}),"\n",(0,a.jsxs)(n.p,{children:["The ",(0,a.jsx)(n.a,{href:"/docs/api-reference/core/canvas-context",children:(0,a.jsx)(n.code,{children:"CanvasContext"})})," is an important companion to the ",(0,a.jsx)(n.code,{children:"Device"}),". A ",(0,a.jsx)(n.code,{children:"CanvasContext"})," holds a connection between the GPU ",(0,a.jsx)(n.code,{children:"Device"})," and an HTML or offscreen ",(0,a.jsx)(n.code,{children:"canvas"})," into which it can render."]}),"\n",(0,a.jsxs)(n.p,{children:["A ",(0,a.jsx)(n.code,{children:"CanvasContext"})," takes care of:"]}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["providing a fresh ",(0,a.jsx)(n.code,{children:"Framebuffer"})," every render frame, set up to render into the canvas' swap chain."]}),"\n",(0,a.jsx)(n.li,{children:"canvas resizing"}),"\n",(0,a.jsx)(n.li,{children:"device pixel ratio calculations"}),"\n"]}),"\n",(0,a.jsx)(n.h2,{id:"registering-backend-adapters",children:"Registering Backend Adapters"}),"\n",(0,a.jsxs)(n.p,{children:["The ",(0,a.jsx)(n.code,{children:"@luma.gl/core"})," module defines abstract API interfaces such as ",(0,a.jsx)(n.code,{children:"Device"}),", ",(0,a.jsx)(n.code,{children:"Buffer"})," etc and is not usable on its own."]}),"\n",(0,a.jsxs)(n.p,{children:["One or more GPU backend modules must be also be imported from a corresponding GPU API backend module (",(0,a.jsx)(n.code,{children:"@luma.gl/webgl"})," and/or ",(0,a.jsx)(n.code,{children:"@luma.gl/webgpu"}),") and then registered with luma.gl."]}),"\n",(0,a.jsx)(n.p,{children:"To create a WebGPU device:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-sh",children:"yarn add @luma.gl/core\nyarn add @luma.gl/webgl\nyarn add @luma.gl/webgpu\n"})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nimport {webgpuAdapter} from '@luma.gl/webgpu';\n\nluma.registerAdapters([webgpuAdapter]);\nconst device = await luma.createDevice({type: 'webgpu', canvas: ...});\n"})}),"\n",(0,a.jsxs)(n.p,{children:["It is possible to register more than one device adapter to create an application\nthat can work in both WebGL and WebGPU environments. To create a ",(0,a.jsx)(n.code,{children:"Device"})," using\nthe best available adapter (luma.gl favors WebGPU over WebGL devices, whenever WebGPU is available)."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-sh",children:"yarn add @luma.gl/core\nyarn add @luma.gl/webgl\nyarn add @luma.gl/webgpu\n"})}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nimport {WebGLDevice} from '@luma.gl/webgl';\nimport {WebGPUDevice} from '@luma.gl/webgpu';\n\nluma.registerAdapters([WebGLDevice, WebGPUDevice]);\n\nconst webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});\n"})})]})}function p(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(l,{...e})}):l(e)}},1020:(e,n,i)=>{var a=i(6540),r=Symbol.for("react.element"),c=Symbol.for("react.fragment"),t=Object.prototype.hasOwnProperty,s=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,o={key:!0,ref:!0,__self:!0,__source:!0};function d(e,n,i){var a,c={},d=null,l=null;for(a in void 0!==i&&(d=""+i),void 0!==n.key&&(d=""+n.key),void 0!==n.ref&&(l=n.ref),n)t.call(n,a)&&!o.hasOwnProperty(a)&&(c[a]=n[a]);if(e&&e.defaultProps)for(a in n=e.defaultProps)void 0===c[a]&&(c[a]=n[a]);return{$$typeof:r,type:e,key:d,ref:l,props:c,_owner:s.current}}n.Fragment=c,n.jsx=d,n.jsxs=d},4848:(e,n,i)=>{e.exports=i(1020)},8453:(e,n,i)=>{i.d(n,{R:()=>t,x:()=>s});var a=i(6540);const r={},c=a.createContext(r);function t(e){const n=a.useContext(c);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:t(e.components),a.createElement(c.Provider,{value:n},e.children)}}}]);