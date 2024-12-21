"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[458],{9815:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>i,contentTitle:()=>c,default:()=>l,frontMatter:()=>o,metadata:()=>a,toc:()=>d});var s=n(4848),t=n(8453);const o={},c="Swap",a={id:"api-reference/engine/compute/swap",title:"Swap",description:"Swap is a helper class to support buffer and texture management when doing repeated transformations or computations on a block of data (memory). Swap enables a sequence of repeated / successive data transformations to be run by reusing just two resources (two buffers or two textures), effectively supporting a simple double buffering techniques.",source:"@site/../docs/api-reference/engine/compute/swap.md",sourceDirName:"api-reference/engine/compute",slug:"/api-reference/engine/compute/swap",permalink:"/docs/api-reference/engine/compute/swap",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/master/docs/../docs/api-reference/engine/compute/swap.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"ShaderPassRenderer",permalink:"/docs/api-reference/engine/passes/shader-pass-renderer"},next:{title:"Computation",permalink:"/docs/api-reference/engine/compute/computation"}},i={},d=[{value:"Usage",id:"usage",level:2},{value:"<code>next</code>",id:"next",level:3},{value:"Methods",id:"methods",level:2},{value:"<code>constructor</code>",id:"constructor",level:3},{value:"<code>destroy()</code>",id:"destroy",level:3},{value:"<code>swap()</code>",id:"swap-1",level:3}];function u(e){const r={code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.header,{children:(0,s.jsx)(r.h1,{id:"swap",children:"Swap"})}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.code,{children:"Swap"})," is a helper class to support buffer and texture management when doing repeated transformations or computations on a block of data (memory). ",(0,s.jsx)(r.code,{children:"Swap"})," enables a sequence of repeated / successive data transformations to be run by reusing just two resources (two buffers or two textures), effectively supporting a simple double buffering techniques."]}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.code,{children:"Swap"})," is primarily intended to manage pairs of GPU memory resources, such as"]}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:["a pair of GPU buffers (",(0,s.jsx)(r.code,{children:"Swap<Buffer>"}),")"]}),"\n",(0,s.jsxs)(r.li,{children:["a pair of GPU textures (",(0,s.jsx)(r.code,{children:"Swap<Texture>"}),")."]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"The two resources are expected to be structurally identical (same size, length, format, etc)."}),"\n",(0,s.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"const swapBuffers = new Swap({\n  current: \n})\n\n## Members\n\n### `current`\n\n```ts\nswap.current: T \n"})}),"\n",(0,s.jsx)(r.p,{children:"Get the current resource - usually the source for renders or computations."}),"\n",(0,s.jsx)(r.h3,{id:"next",children:(0,s.jsx)(r.code,{children:"next"})}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"swap.next: T\n"})}),"\n",(0,s.jsx)(r.p,{children:"Get the next resource - usually the target/destination for transforms / computations."}),"\n",(0,s.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,s.jsx)(r.h3,{id:"constructor",children:(0,s.jsx)(r.code,{children:"constructor"})}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"new Swap<T>(props: {current: T, next: T})\n"})}),"\n",(0,s.jsx)(r.h3,{id:"destroy",children:(0,s.jsx)(r.code,{children:"destroy()"})}),"\n",(0,s.jsx)(r.p,{children:"Destroys the two managed resources."}),"\n",(0,s.jsx)(r.h3,{id:"swap-1",children:(0,s.jsx)(r.code,{children:"swap()"})}),"\n",(0,s.jsx)(r.p,{children:'Make the next resource into the "current" resource, and the current resource becomes the "next" resource'}),"\n",(0,s.jsx)(r.p,{children:"Typically this reuses the previously current resource as the next resource."})]})}function l(e={}){const{wrapper:r}={...(0,t.R)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(u,{...e})}):u(e)}},8453:(e,r,n)=>{n.d(r,{R:()=>c,x:()=>a});var s=n(6540);const t={},o=s.createContext(t);function c(e){const r=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:c(e.components),s.createElement(o.Provider,{value:r},e.children)}}}]);