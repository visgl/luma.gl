"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[9430],{6876:(e,i,n)=>{n.r(i),n.d(i,{assets:()=>o,contentTitle:()=>t,default:()=>h,frontMatter:()=>a,metadata:()=>d,toc:()=>l});var r=n(4848),s=n(8453);const a={},t="API Overview",d={id:"api-guide/README",title:"API Overview",description:"The luma.gl API enables the creation of portable GPU applications that can run on top of either WebGPU, or WebGL 2.",source:"@site/../docs/api-guide/README.md",sourceDirName:"api-guide",slug:"/api-guide/",permalink:"/docs/api-guide/",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/master/docs/../docs/api-guide/README.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"What's Next?",permalink:"/docs/tutorials/whats-next"},next:{title:"API Design Philosophy",permalink:"/docs/api-guide/background/api-design"}},o={},l=[{value:"Core API",id:"core-api",level:2},{value:"Shader API",id:"shader-api",level:2},{value:"Engine API",id:"engine-api",level:2}];function c(e){const i={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",ol:"ol",p:"p",ul:"ul",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(i.header,{children:(0,r.jsx)(i.h1,{id:"api-overview",children:"API Overview"})}),"\n",(0,r.jsx)(i.p,{children:"The luma.gl API enables the creation of portable GPU applications that can run on top of either WebGPU, or WebGL 2.\nluma.gl is divided into different sub-APIs: the core GPU API, the shader API and the engine API."}),"\n",(0,r.jsxs)(i.p,{children:["Most applications work with the engine API (",(0,r.jsx)(i.code,{children:"Model"}),", ",(0,r.jsx)(i.code,{children:"AnimationLoop"})," and related classes), leveraging the core GPU API as necessary to obtain a ",(0,r.jsx)(i.code,{children:"Device"})," and use it to create GPU resources such as ",(0,r.jsx)(i.code,{children:"Buffer"})," and ",(0,r.jsx)(i.code,{children:"Texture"}),".\nThe shader API is used to assemble shaders and define shader modules."]}),"\n",(0,r.jsx)(i.p,{children:"Most luma.gl applications will:"}),"\n",(0,r.jsxs)(i.ol,{children:["\n",(0,r.jsxs)(i.li,{children:["Use the core API to create a ",(0,r.jsx)(i.code,{children:"Device"})," class to access the GPU (either using WebGPU or WebGL)."]}),"\n",(0,r.jsxs)(i.li,{children:["Upload data to the GPU via methods on the ",(0,r.jsx)(i.code,{children:"Device"}),", using ",(0,r.jsx)(i.code,{children:"Buffer"})," and ",(0,r.jsx)(i.code,{children:"Texture"})," objects."]}),"\n",(0,r.jsxs)(i.li,{children:["Use the engine API to create one or more ",(0,r.jsx)(i.code,{children:"Model"})," instances from GLSL or WGSL shader code."]}),"\n",(0,r.jsx)(i.li,{children:"Bind attribute buffers and bindings (textures, uniform buffers or uniforms)."}),"\n",(0,r.jsxs)(i.li,{children:["Start an engine API ",(0,r.jsx)(i.code,{children:"AnimationLoop"})," loop, and draw each frame into a ",(0,r.jsx)(i.code,{children:"RenderPass"}),"."]}),"\n"]}),"\n",(0,r.jsx)(i.h2,{id:"core-api",children:"Core API"}),"\n",(0,r.jsxs)(i.p,{children:["The core luma.gl API is designed to expose the capabilities of the GPU and shader programming to web applications.\nIt is a portable API, in the sense that the ",(0,r.jsx)(i.code,{children:"@luma.gl/core"})," module provides an abstract API for writing application code\nthat works with both WebGPU and/or WebGL depending on which adapter modules are installed\n)",(0,r.jsx)(i.code,{children:"@luma.gl/webgl"})," and/or ",(0,r.jsx)(i.code,{children:"@luma.gl/webgpu"}),")."]}),"\n",(0,r.jsx)(i.p,{children:"Core responsibilities for any GPU library are to enable applications to perform:"}),"\n",(0,r.jsxs)(i.ul,{children:["\n",(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-initialization",children:"GPU initialization"})," - Open a GPU device and query its capabilities"]}),"\n",(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-memory",children:"GPU memory management"})," - Create, upload memory to and read from ",(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-buffers",children:"Buffers"}),", ",(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-textures",children:"Textures"})," etc."]}),"\n",(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-resources",children:"GPU resource management"})," - Create ",(0,r.jsx)(i.code,{children:"Shader"}),", ",(0,r.jsx)(i.code,{children:"Renderpipeline"}),", ",(0,r.jsx)(i.code,{children:"RenderPass"})," etc objects."]}),"\n",(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-bindings",children:"GPU binding management"})," - Make attribute buffers, uniforms, textures, samplers available to GPU shaders."]}),"\n",(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-rendering",children:"Shader execution / rendering"})," - Drawing into textures, running compute shaders."]}),"\n",(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.a,{href:"/docs/api-guide/gpu/gpu-parameters",children:"GPU parameter management"})," - Configuring blending, clipping, depth tests etc."]}),"\n"]}),"\n",(0,r.jsx)(i.h2,{id:"shader-api",children:"Shader API"}),"\n",(0,r.jsx)(i.p,{children:"The Shader API lets the application use a library of existing shader modules to create new customer shaders.\nIt is also possible for developers to create new reusable shader modules."}),"\n",(0,r.jsx)(i.h2,{id:"engine-api",children:"Engine API"}),"\n",(0,r.jsxs)(i.p,{children:["The engine API provides higher level classes like ",(0,r.jsx)(i.code,{children:"Model"}),", ",(0,r.jsx)(i.code,{children:"AnimationLoop"})," and ",(0,r.jsx)(i.code,{children:"Transform"}),"s.\nglTF support is available through ",(0,r.jsx)(i.code,{children:"@luma.gl/gltxf"}),"."]})]})}function h(e={}){const{wrapper:i}={...(0,s.R)(),...e.components};return i?(0,r.jsx)(i,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},8453:(e,i,n)=>{n.d(i,{R:()=>t,x:()=>d});var r=n(6540);const s={},a=r.createContext(s);function t(e){const i=r.useContext(a);return r.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function d(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:t(e.components),r.createElement(a.Provider,{value:i},e.children)}}}]);