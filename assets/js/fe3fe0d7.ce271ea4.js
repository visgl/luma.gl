/*! For license information please see fe3fe0d7.ce271ea4.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[9223],{1336:(e,a,r)=>{r.r(a),r.d(a,{assets:()=>l,contentTitle:()=>s,default:()=>p,frontMatter:()=>c,metadata:()=>i,toc:()=>d});var n=r(4848),t=r(8453);const c={},s="luma",i={id:"api-reference/core/luma",title:"luma",description:"The luma namespace provides luma.gl applications",source:"@site/../docs/api-reference/core/luma.md",sourceDirName:"api-reference/core",slug:"/api-reference/core/luma",permalink:"/docs/api-reference/core/luma",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-reference/core/luma.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"Overview",permalink:"/docs/api-reference/core/"},next:{title:"Adapter",permalink:"/docs/api-reference/core/adapter"}},l={},d=[{value:"Device Registration",id:"device-registration",level:2},{value:"Usage",id:"usage",level:2},{value:"Registering Adapters",id:"registering-adapters",level:2},{value:"Types",id:"types",level:2},{value:"<code>CreateDeviceProps</code>",id:"createdeviceprops",level:3},{value:"<code>AttachDeviceProps</code>",id:"attachdeviceprops",level:3},{value:"Methods",id:"methods",level:2},{value:"<code>luma.createDevice()</code>",id:"lumacreatedevice",level:3},{value:"<code>luma.attachDevice()</code>",id:"lumaattachdevice",level:3},{value:"<code>luma.registerAdapters()</code>",id:"lumaregisteradapters",level:3},{value:"<code>luma.enforceWebGL2()</code>",id:"lumaenforcewebgl2",level:3},{value:"Remarks",id:"remarks",level:2}];function o(e){const a={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",ul:"ul",...(0,t.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(a.h1,{id:"luma",children:"luma"}),"\n",(0,n.jsxs)(a.p,{children:["The ",(0,n.jsx)(a.a,{href:"/docs/api-reference/core/luma",children:(0,n.jsx)(a.code,{children:"luma"})})," namespace provides luma.gl applications\nwith the ability to create ",(0,n.jsx)(a.code,{children:"Device"})," class instances against GPU ",(0,n.jsx)(a.code,{children:"Adapters"})," that bring\nsupport for different GPU backends such as WebGPU and WebGL."]}),"\n",(0,n.jsxs)(a.p,{children:["The returned ",(0,n.jsx)(a.a,{href:"/docs/api-reference/core/device",children:(0,n.jsx)(a.code,{children:"Device"})})," instances provide\nluma.gl applications with a complete GPU API."]}),"\n",(0,n.jsx)(a.h2,{id:"device-registration",children:"Device Registration"}),"\n",(0,n.jsxs)(a.p,{children:["The ",(0,n.jsx)(a.code,{children:"@luma.gl/core"})," module defines abstract API interfaces such as ",(0,n.jsx)(a.code,{children:"Device"}),", ",(0,n.jsx)(a.code,{children:"Buffer"})," etc and is not usable on its own."]}),"\n",(0,n.jsxs)(a.p,{children:["One or more GPU backend modules must be imported from a corresponding\nGPU API backend module (",(0,n.jsx)(a.code,{children:"@luma.gl/webgl"})," and/or ",(0,n.jsx)(a.code,{children:"@luma.gl/webgpu"}),") and then registered with luma.gl."]}),"\n",(0,n.jsx)(a.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(a.p,{children:"Create a WebGL 2 context (throws if WebGL2 not supported)"}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nimport {webgl2Adapter} from '@luma.gl/webgl';\n\nconst webgpuDevice = luma.createDevice({type: 'webgl', adapters: [webgl2Adapter], canvas: ...});\n"})}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"const webgpuDevice = luma.createDevice({\n  type: 'best-available', \n  canvas: ..., \n  adapters: [webgl2Adapter, WebGPUDevice]\n});\n"})}),"\n",(0,n.jsxs)(a.p,{children:["To pre-register a device backend, import the corresponding device backend module and then call ",(0,n.jsx)(a.code,{children:"luma.registerAdapters()"})]}),"\n",(0,n.jsx)(a.p,{children:"Register the WebGL backend, then create a WebGL2 context, auto creating a canvas"}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nimport {webgl2Adapter} from '@luma.gl/webgl';\nluma.registerAdapters([webgl2Adapter]);\nconst webglDevice = luma.createDevice({type: 'webgl', canvas: ...});\n"})}),"\n",(0,n.jsx)(a.p,{children:"It is possible to register more than one device to create an application\nthat can work in both WebGL and WebGPU environments."}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nimport {webgl2Adapter} from '@luma.gl/webgl';\nimport {webgpuDevice} from '@luma.gl/webgl';\nluma.registerAdapters([webgl2Adapter, webgpuDevice]);\nconst device = luma.createDevice({type: 'best-available', canvas: ...});\n"})}),"\n",(0,n.jsx)(a.h2,{id:"registering-adapters",children:"Registering Adapters"}),"\n",(0,n.jsx)(a.p,{children:"Install device modules and register adapters to access backends"}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-sh",children:"yarn add @luma.gl/core\nyarn add @luma.gl/webgl\nyarn add @luma.gl/webgpu\n"})}),"\n",(0,n.jsx)(a.p,{children:"To create a WebGPU device:"}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nimport {webgpuAdapter} from '@luma.gl/webgpu';\n\nluma.registerAdapters([webgpuAdapter]);\nconst device = await luma.createDevice({type: 'webgpu', canvas: ...});\n"})}),"\n",(0,n.jsx)(a.p,{children:"Pre-register devices"}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"import {luma} from '@luma.gl/core';\nimport {webgl2Adapter} from '@luma.gl/webgl';\nimport {webgpuAdapter} from '@luma.gl/webgpu';\n\nluma.registerAdapters([webgl2Adapter, webgpuAdapter]);\nconst webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});\n"})}),"\n",(0,n.jsx)(a.h2,{id:"types",children:"Types"}),"\n",(0,n.jsx)(a.h3,{id:"createdeviceprops",children:(0,n.jsx)(a.code,{children:"CreateDeviceProps"})}),"\n",(0,n.jsx)(a.p,{children:"Properties for creating a new device"}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-ts",children:"type CreateDeviceProps = DeviceProps & {\n  /** Selects the type of device. `best-available` uses webgpu if available, then webgl. */\n  type?: 'webgl' | 'webgpu' | 'unknown' | 'best-available';\n  /** List of device types. Will also search any pre-registered device backends */\n  adapters?: Adapter[];\n}\n"})}),"\n",(0,n.jsx)(a.h3,{id:"attachdeviceprops",children:(0,n.jsx)(a.code,{children:"AttachDeviceProps"})}),"\n",(0,n.jsx)(a.p,{children:"Properties for attaching an existing WebGL context or WebGPU device to a new luma Device."}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-ts",children:"export type AttachDeviceProps = DeviceProps & {\n  /** Externally created WebGL context or WebGPU device */\n  handle: WebGL2RenderingContext | GPUDevice | null;\n  /** List of device types. Will also search any pre-registered device backends */\n  adapters?: Adapter[];\n};\n"})}),"\n",(0,n.jsx)(a.h2,{id:"methods",children:"Methods"}),"\n",(0,n.jsx)(a.h3,{id:"lumacreatedevice",children:(0,n.jsx)(a.code,{children:"luma.createDevice()"})}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"luma.createDevice({type, adapters, ...deviceProps}: CreateDeviceProps);\n"})}),"\n",(0,n.jsxs)(a.p,{children:["To create a Device instance, the application calls ",(0,n.jsx)(a.code,{children:"luma.createDevice()"}),"."]}),"\n",(0,n.jsxs)(a.ul,{children:["\n",(0,n.jsxs)(a.li,{children:[(0,n.jsx)(a.code,{children:"type"}),": ",(0,n.jsx)(a.code,{children:"'webgl' \\| 'webgpu' \\| 'best-available'"})]}),"\n",(0,n.jsxs)(a.li,{children:[(0,n.jsx)(a.code,{children:"adapters"}),": list of ",(0,n.jsx)(a.code,{children:"Adapter"})," instances providing support for different GPU backends. Can be omitted if ",(0,n.jsx)(a.code,{children:"luma.registerAdapters()"})," has been called."]}),"\n"]}),"\n",(0,n.jsxs)(a.p,{children:["Unless a device ",(0,n.jsx)(a.code,{children:"type"})," is specified a ",(0,n.jsx)(a.code,{children:"Device"})," will be created using the ",(0,n.jsx)(a.code,{children:"'best-available'"})," adapter.\nluma.gl favors WebGPU over WebGL adapters, whenever WebGPU is available."]}),"\n",(0,n.jsx)(a.p,{children:"Note: A specific device type is available and supported if both of the following are true:"}),"\n",(0,n.jsxs)(a.ol,{children:["\n",(0,n.jsx)(a.li,{children:"The backend module has been registered"}),"\n",(0,n.jsx)(a.li,{children:"The browser supports that GPU API"}),"\n"]}),"\n",(0,n.jsx)(a.h3,{id:"lumaattachdevice",children:(0,n.jsx)(a.code,{children:"luma.attachDevice()"})}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-ts",children:"luma.attachDevice({handle: WebGL2RenderingContext | GPUDevice, adapters, ...}: AttachDeviceProps);\n"})}),"\n",(0,n.jsxs)(a.p,{children:["A luma.gl Device can be attached to an externally created ",(0,n.jsx)(a.code,{children:"WebGL2RenderingContext"})," or ",(0,n.jsx)(a.code,{children:"GPUDevice"}),'.\nThis allows applications to use the luma.gl API to "interleave" rendering with other GPU libraries.']}),"\n",(0,n.jsxs)(a.ul,{children:["\n",(0,n.jsxs)(a.li,{children:[(0,n.jsx)(a.code,{children:"handle"})," - The externally created ",(0,n.jsx)(a.code,{children:"WebGL2RenderingContext"})," or ",(0,n.jsx)(a.code,{children:"GPUDevice"})," that should be attached to a luma ",(0,n.jsx)(a.code,{children:"Device"}),"."]}),"\n",(0,n.jsxs)(a.li,{children:[(0,n.jsx)(a.code,{children:"adapters"})," - list of ",(0,n.jsx)(a.code,{children:"Device"})," backend classes. Can be omitted if ",(0,n.jsx)(a.code,{children:"luma.registerAdapters()"})," has been called."]}),"\n"]}),"\n",(0,n.jsxs)(a.p,{children:["Note that while you cannot directly attach a luma.gl ",(0,n.jsx)(a.code,{children:"Device"})," to a WebGL 1 ",(0,n.jsx)(a.code,{children:"WebGLRenderingContext"}),", you may be able to work around it using ",(0,n.jsx)(a.code,{children:"luma.enforceWebGL2()"}),"."]}),"\n",(0,n.jsx)(a.h3,{id:"lumaregisteradapters",children:(0,n.jsx)(a.code,{children:"luma.registerAdapters()"})}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-typescript",children:"luma.registerAdapters(adapters?: Adapter[]): void;\n"})}),"\n",(0,n.jsxs)(a.p,{children:["Pre-registers one or more adapters so that they can be used\nto create ",(0,n.jsx)(a.code,{children:"Device"})," instances against those GPU backends. The registered adapters types\nwill be available to ",(0,n.jsx)(a.code,{children:"luma.createDevice()"})," and ",(0,n.jsx)(a.code,{children:"luma.attachDevice()"})," calls."]}),"\n",(0,n.jsxs)(a.p,{children:[(0,n.jsx)(a.code,{children:"luma.registerAdapters()"})," enables separation of the application code that\nregisters GPU backends from the application code that creates adapters,\nso that device types do not have to be provided at ",(0,n.jsx)(a.code,{children:"Device"})," create or attach time."]}),"\n",(0,n.jsx)(a.h3,{id:"lumaenforcewebgl2",children:(0,n.jsx)(a.code,{children:"luma.enforceWebGL2()"})}),"\n",(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:"language-ts",children:"luma.enforceWebGL2(enforce: boolean = true, adapters: Adapter[]);\n"})}),"\n",(0,n.jsxs)(a.p,{children:["Overrides ",(0,n.jsx)(a.code,{children:"HTMLCanvasElement.prototype.getContext()"})," to return WebGL2 contexts even when WebGL1 context are requested. Reversible with ",(0,n.jsx)(a.code,{children:"luma.enforceWebGL2(false);"})]}),"\n",(0,n.jsxs)(a.p,{children:["Since luma.gl only supports WebGL2 contexts (",(0,n.jsx)(a.code,{children:"WebGL2RenderingContext"}),"), it is not possible to call",(0,n.jsx)(a.code,{children:"luma.attachDevice()"})," on a WebGL1 context (",(0,n.jsx)(a.code,{children:"WebGLRenderingContext"}),")."]}),"\n",(0,n.jsxs)(a.p,{children:["This becomes a problem when using luma.gl with a WebGL library that always creates WebGL1 contexts (such as Mapbox GL JS v1).\nCalling ",(0,n.jsx)(a.code,{children:"luma.enforceWebGL2()"})," before initializing the external library makes that library create a WebGL2 context, that luma.gl can then attach a Device to."]}),"\n",(0,n.jsxs)(a.p,{children:["Note that the ",(0,n.jsx)(a.code,{children:"webgl2Adapter"})," must either be pre-registered or supplied to the ",(0,n.jsx)(a.code,{children:"luma.enforceWebGL2()"})," call."]}),"\n",(0,n.jsx)(a.admonition,{type:"caution",children:(0,n.jsx)(a.p,{children:"Since WebGL2 is a essentially a superset of WebGL1, a library written for WebGL 1 will often still work with a WebGL 2 context. However there may be issues if the external library relies on WebGL1 extensions that are not available in WebGL2. To make a WebGL 2 context support WebGL1-only extensions, those extensions would also need to be emulated on top of the WebGL 2 API, and this is not currently done."})}),"\n",(0,n.jsx)(a.h2,{id:"remarks",children:"Remarks"}),"\n",(0,n.jsxs)(a.ul,{children:["\n",(0,n.jsxs)(a.li,{children:["At least one backend must be imported and registered with ",(0,n.jsx)(a.code,{children:"luma.registerAdapters()"})," for ",(0,n.jsx)(a.code,{children:"luma.createDevice()"})," or ",(0,n.jsx)(a.code,{children:"luma.attachDevice()"})," calls to succeed (unless ",(0,n.jsx)(a.code,{children:"Device"})," implementations are supplied to those calls)."]}),"\n"]})]})}function p(e={}){const{wrapper:a}={...(0,t.R)(),...e.components};return a?(0,n.jsx)(a,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}},1020:(e,a,r)=>{var n=r(6540),t=Symbol.for("react.element"),c=Symbol.for("react.fragment"),s=Object.prototype.hasOwnProperty,i=n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,l={key:!0,ref:!0,__self:!0,__source:!0};function d(e,a,r){var n,c={},d=null,o=null;for(n in void 0!==r&&(d=""+r),void 0!==a.key&&(d=""+a.key),void 0!==a.ref&&(o=a.ref),a)s.call(a,n)&&!l.hasOwnProperty(n)&&(c[n]=a[n]);if(e&&e.defaultProps)for(n in a=e.defaultProps)void 0===c[n]&&(c[n]=a[n]);return{$$typeof:t,type:e,key:d,ref:o,props:c,_owner:i.current}}a.Fragment=c,a.jsx=d,a.jsxs=d},4848:(e,a,r)=>{e.exports=r(1020)},8453:(e,a,r)=>{r.d(a,{R:()=>s,x:()=>i});var n=r(6540);const t={},c=n.createContext(t);function s(e){const a=n.useContext(c);return n.useMemo((function(){return"function"==typeof e?e(a):{...a,...e}}),[a,e])}function i(e){let a;return a=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:s(e.components),n.createElement(c.Provider,{value:a},e.children)}}}]);