/*! For license information please see addafd5e.2a2e0373.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[1941],{5068:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>a,contentTitle:()=>i,default:()=>o,frontMatter:()=>c,metadata:()=>d,toc:()=>l});var t=n(4848),s=n(8453);const c={},i="Framebuffer",d={id:"api-reference/core/resources/framebuffer",title:"Framebuffer",description:"A Framebuffer holds textures that will be used as render targets for RenderPipelines",source:"@site/../docs/api-reference/core/resources/framebuffer.md",sourceDirName:"api-reference/core/resources",slug:"/api-reference/core/resources/framebuffer",permalink:"/docs/api-reference/core/resources/framebuffer",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-reference/core/resources/framebuffer.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"ComputePipeline",permalink:"/docs/api-reference/core/resources/compute-pipeline"},next:{title:"RenderPass",permalink:"/docs/api-reference/core/resources/render-pass"}},a={},l=[{value:"Usage",id:"usage",level:2},{value:"Overview",id:"overview",level:2},{value:"Framebuffer Attachment Values",id:"framebuffer-attachment-values",level:3},{value:"Framebuffer Attachments",id:"framebuffer-attachments",level:2},{value:"Resizing Framebuffers",id:"resizing-framebuffers",level:2},{value:"Types",id:"types",level:2},{value:"<code>FramebufferProps</code>",id:"framebufferprops",level:3},{value:"Members",id:"members",level:2},{value:"<code>colorAttachments</code>",id:"colorattachments",level:3},{value:"<code>DepthStencilAttachment</code>",id:"depthstencilattachment",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor",id:"constructor",level:3},{value:"destroy(): void",id:"destroy-void",level:3},{value:"resize(width: number, height: number): void",id:"resizewidth-number-height-number-void",level:3},{value:"Remarks",id:"remarks",level:2}];function h(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,s.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.h1,{id:"framebuffer",children:"Framebuffer"}),"\n",(0,t.jsxs)(r.p,{children:["A ",(0,t.jsx)(r.code,{children:"Framebuffer"})," holds textures that will be used as render targets for ",(0,t.jsx)(r.code,{children:"RenderPipeline"}),"s\ntogether with additional information on how the ",(0,t.jsx)(r.code,{children:"RenderPipeline"})," should use the various attached textures:"]}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"one or more color textures"}),"\n",(0,t.jsx)(r.li,{children:"optionally a depth / stencil buffer"}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"clearColor"}),", ",(0,t.jsx)(r.code,{children:"clearDepth"})," and ",(0,t.jsx)(r.code,{children:"clearStencil"})," etc fields on the various attachments."]}),"\n"]}),"\n",(0,t.jsx)(r.p,{children:'The list of attachments cannot be changed after creation, however a Framebuffer can be "resized" causing the attachments to be resized.'}),"\n",(0,t.jsxs)(r.p,{children:["Special ",(0,t.jsx)(r.code,{children:"Framebuffer"}),"s can be obtained from ",(0,t.jsx)(r.code,{children:"CanvasContext"}),"s that enabled rendering directly into HTML canvases (i.e. onto the screen)."]}),"\n",(0,t.jsxs)(r.p,{children:["The use of framebuffers is described in detail in the ",(0,t.jsx)(r.a,{href:"/docs/api-guide/gpu/gpu-rendering",children:"Rendering Guide"}),"."]}),"\n",(0,t.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,t.jsx)(r.p,{children:"Creating a framebuffer and have it auto-create color and depth attachments"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"const framebuffer = device.createFramebuffer({\n  width: window.innerWidth,\n  height: window.innerHeight,\n  colorAttachments: [{format: 'rgb8unorm'}],\n  depthStencilAttachment: {format: 'depth24plus-stencil8'}\n});\n"})}),"\n",(0,t.jsx)(r.p,{children:"Creating a framebuffer with supplied color and depth attachments"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"const size = {\n  width: window.innerWidth,\n  height: window.innerHeight\n};\nconst framebuffer = device.createFramebuffer({\n  ...size,\n  colorAttachments: [device.createTexture({format: 'rgb8unorm', ...size})],\n  depthStencilAttachment: device.createTexture({format: 'depth24plus-stencil8', ...size})\n});\n"})}),"\n",(0,t.jsx)(r.p,{children:"Resizing a framebuffer to the size of the browser's window by resizing all attachments."}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"framebuffer.resize(window.innerWidth, window.innerHeight);\n"})}),"\n",(0,t.jsxs)(r.p,{children:["To render into a canvas make sure you have a ",(0,t.jsx)(r.code,{children:"CanvasContext"})," for that HTML or offscreen canvas.\nYou can the obtain a ",(0,t.jsx)(r.code,{children:"Framebuffer"})," object from the ",(0,t.jsx)(r.code,{children:"CanvasContext"})," using ",(0,t.jsx)(r.code,{children:"canvasContext.getDefaultFramebuffer()"}),"."]}),"\n",(0,t.jsx)(r.p,{children:"For the"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"const canvasFramebuffer = canvasContext.getDefaultFramebuffer();\nconst canvasRenderPass = device.beginRenderPass({framebuffer: canvasFramebuffer});\nmodel2.draw({renderPass: screenRenderPass, ...});\n"})}),"\n",(0,t.jsx)(r.p,{children:"Alternatively can create texture based framebuffers for off-screen rendering.\nSpecifying a separate offscreen framebuffer for rendering:"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"const offScreenFramebuffer = device.createFramebuffer(...);\n\nconst offScreenRenderPass = device.beginRenderPass({framebuffer: offScreenFramebuffer});\nmodel1.draw({renderPass: offScreenRenderPass, ...});\noffScreenRenderPass.endPass();\n\n// Textures attached offscreenFramebuffer now contain the results of the first renderpass, \n// and those textures can be used as input for a second to-screen render pass\n\nconst screenRenderPass = device.beginRenderPass();\nmodel2.draw({renderPass: screenRenderPass, ...});\n"})}),"\n",(0,t.jsx)(r.h2,{id:"overview",children:"Overview"}),"\n",(0,t.jsx)(r.h3,{id:"framebuffer-attachment-values",children:"Framebuffer Attachment Values"}),"\n",(0,t.jsx)(r.p,{children:"The following values can be provided for each attachment point"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"Texture"})," - attaches at mipmapLevel 0 (the the supplied ",(0,t.jsx)(r.code,{children:"Texture"}),"'s default ",(0,t.jsx)(r.code,{children:"TextureView"}),"."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"TextureView"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"2d"}),": attaches the specified mipmapLevel from the supplied ",(0,t.jsx)(r.code,{children:"Texture"}),", or cubemap face. The second element in the array must be ",(0,t.jsx)(r.code,{children:"0"}),"."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"cube"}),": face (depth), mipmapLevel=0 - attaches the specifed cubemap face from the ",(0,t.jsx)(r.code,{children:"Texture"}),", at the specified mipmap level."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"2d-array"}),", layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the ",(0,t.jsx)(r.code,{children:"Texture"}),", at the specified mipmap level."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"3d"}),", layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the ",(0,t.jsx)(r.code,{children:"Texture3D"}),", at the specified mipmap level."]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(r.h2,{id:"framebuffer-attachments",children:"Framebuffer Attachments"}),"\n",(0,t.jsxs)(r.p,{children:["A ",(0,t.jsx)(r.code,{children:"Framebuffer"})," holds:"]}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:['an array of "color attachments" (often just one) that store data (one or more color ',(0,t.jsx)(r.code,{children:"Texture"}),"s)"]}),"\n",(0,t.jsxs)(r.li,{children:["an optional depth, stencil or combined depth-stencil ",(0,t.jsx)(r.code,{children:"Texture"}),")."]}),"\n"]}),"\n",(0,t.jsxs)(r.p,{children:["All attachments must be in the form of ",(0,t.jsx)(r.code,{children:"Texture"}),"s."]}),"\n",(0,t.jsx)(r.h2,{id:"resizing-framebuffers",children:"Resizing Framebuffers"}),"\n",(0,t.jsx)(r.p,{children:"Resizing a framebuffer effectively destroys all current textures and creates new\ntextures with otherwise similar properties. All data stored in the previous textures are lost.\nThis data loss is usually a non-issue as resizes are usually performed between render passes,\n(typically to match the size of an off screen render buffer with the new size of the output canvas)."}),"\n",(0,t.jsx)(r.h2,{id:"types",children:"Types"}),"\n",(0,t.jsx)(r.h3,{id:"framebufferprops",children:(0,t.jsx)(r.code,{children:"FramebufferProps"})}),"\n",(0,t.jsxs)(r.table,{children:[(0,t.jsx)(r.thead,{children:(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.th,{children:"Property"}),(0,t.jsx)(r.th,{children:"Type"}),(0,t.jsx)(r.th,{children:"Description"})]})}),(0,t.jsxs)(r.tbody,{children:[(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"id?"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"string"})}),(0,t.jsx)(r.td,{children:"An optional name (id) of the buffer."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"width? = 1"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"number"})}),(0,t.jsx)(r.td,{children:"The width of the framebuffer."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"height? = 1"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"number"})}),(0,t.jsx)(r.td,{children:"The height of the framebuffer."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"colorAttachments"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"ColorAttachment|Texture[]"})}),(0,t.jsx)(r.td,{children:"Array of render target textures."})]}),(0,t.jsxs)(r.tr,{children:[(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"depthStencilAttachment?"})}),(0,t.jsx)(r.td,{children:(0,t.jsx)(r.code,{children:"DepthStencilAttachment|Texture[]"})}),(0,t.jsx)(r.td,{children:"Depth/stencil texture."})]})]})]}),"\n",(0,t.jsx)(r.h2,{id:"members",children:"Members"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"device"}),": ",(0,t.jsx)(r.code,{children:"Device"})," - holds a reference to the ",(0,t.jsx)(r.code,{children:"Device"})," that created this ",(0,t.jsx)(r.code,{children:"Framebuffer"}),"."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"handle"}),": ",(0,t.jsx)(r.code,{children:"unknown"})," - WebGL: holds the underlying ",(0,t.jsx)(r.code,{children:"WebGLFramebuffer"}),". No underlying object on WebGPU."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"props"}),": ",(0,t.jsx)(r.code,{children:"FramebufferProps"})," - holds a copy of the ",(0,t.jsx)(r.code,{children:"FramebufferProps"})," used to create this ",(0,t.jsx)(r.code,{children:"Buffer"}),"."]}),"\n"]}),"\n",(0,t.jsx)(r.h3,{id:"colorattachments",children:(0,t.jsx)(r.code,{children:"colorAttachments"})}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"colorAttachments: TextureView)[]\n"})}),"\n",(0,t.jsx)(r.p,{children:"Framebuffer attachments lets the user specify the textures that will be used for a RenderPass,\ntogether with some additional options for how to clear color textures."}),"\n",(0,t.jsx)(r.h3,{id:"depthstencilattachment",children:(0,t.jsx)(r.code,{children:"DepthStencilAttachment"})}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"depthStencilAttachments: TextureView[]\n"})}),"\n",(0,t.jsx)(r.p,{children:"Framebuffer attachments lets the user specify the depth stencil texture that will be used for a RenderPass,\ntogether with some additional options for how to clear depth and stencil buffers."}),"\n",(0,t.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,t.jsx)(r.h3,{id:"constructor",children:"constructor"}),"\n",(0,t.jsxs)(r.p,{children:["Create with ",(0,t.jsx)(r.code,{children:"device.createFramebuffer(...)"}),". (",(0,t.jsx)(r.code,{children:"Framebuffer"})," is an abstract class and cannot be instantiated directly with ",(0,t.jsx)(r.code,{children:"new Framebuffer()"}),".)"]}),"\n",(0,t.jsxs)(r.p,{children:["An application can render into an (HTML or offscreen) canvas by obtaining a\n",(0,t.jsx)(r.code,{children:"Framebuffer"})," object from a ",(0,t.jsx)(r.code,{children:"CanvasContext"})," using ",(0,t.jsx)(r.code,{children:"canvasContext.getDefaultFramebuffer()"}),". Alternatively can create texture based framebuffers for off-screen rendering."]}),"\n",(0,t.jsx)(r.h3,{id:"destroy-void",children:"destroy(): void"}),"\n",(0,t.jsx)(r.p,{children:"Free up any GPU resources associated with this buffer immediately (instead of waiting for garbage collection)."}),"\n",(0,t.jsxs)(r.p,{children:["TBD - When destroying ",(0,t.jsx)(r.code,{children:"Framebuffer"})," will also destroy any ",(0,t.jsx)(r.code,{children:"Texture"})," that was created automatically during Framebuffer creation. Supplied textures will not be destroyed (but will eventually be garbage collected and destroyed)."]}),"\n",(0,t.jsx)(r.h3,{id:"resizewidth-number-height-number-void",children:"resize(width: number, height: number): void"}),"\n",(0,t.jsx)(r.p,{children:(0,t.jsx)(r.code,{children:"Framebuffer.resize(width, height)"})}),"\n",(0,t.jsxs)(r.p,{children:["Resizes all the ",(0,t.jsx)(r.code,{children:"Framebuffer"}),"'s current attachments to the new ",(0,t.jsx)(r.code,{children:"width"})," and ",(0,t.jsx)(r.code,{children:"height"})," by calling ",(0,t.jsx)(r.code,{children:"resize"})," on those attachments."]}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"width"})," - the new width of ",(0,t.jsx)(r.code,{children:"Framebuffer"})," in pixels"]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"height"})," - the new height of ",(0,t.jsx)(r.code,{children:"Framebuffer"})," in pixels"]}),"\n"]}),"\n",(0,t.jsxs)(r.p,{children:["Note the ",(0,t.jsx)(r.code,{children:"framebuffer.resize()"})," method has been designed so that it can be called every frame without performance concerns. While the actual resizing of attachments can be expensive, the ",(0,t.jsx)(r.code,{children:"resize()"})," methods checks if ",(0,t.jsx)(r.code,{children:"width"})," or ",(0,t.jsx)(r.code,{children:"height"})," have changed before actually resizing any attachments."]}),"\n",(0,t.jsx)(r.h2,{id:"remarks",children:"Remarks"}),"\n",(0,t.jsx)(r.p,{children:(0,t.jsx)(r.strong,{children:"WebGPU"})}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["The ",(0,t.jsx)(r.code,{children:"Framebuffer"})," class is a pure luma.gl class as this concept does not exist natively in WebGPU (attachment information has to be provided through the ",(0,t.jsx)(r.code,{children:"GPURenderPassDescriptor"})," ",(0,t.jsx)(r.code,{children:"colorAttachments"})," and the ",(0,t.jsx)(r.code,{children:"depthStencilAttachment"})," fields every frame when a render pass is created).`."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"resize()"})," will destroy and recreate textures (meaning the the underlying ",(0,t.jsx)(r.code,{children:"GPUTexture"})," / ",(0,t.jsx)(r.code,{children:"GPUTextureView"})," handles are no longer the same after a ",(0,t.jsx)(r.code,{children:"resize()"})]}),"\n"]}),"\n",(0,t.jsx)(r.p,{children:(0,t.jsx)(r.strong,{children:"WebGL"})}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["The ",(0,t.jsx)(r.code,{children:"Framebuffer"})," class wraps the ",(0,t.jsx)(r.code,{children:"WebGLFramebuffer"})," object, see e.g. ",(0,t.jsx)(r.a,{href:"https://www.khronos.org/opengl/wiki/Framebuffer",children:"Framebuffer"}),"\nand ",(0,t.jsx)(r.a,{href:"https://www.khronos.org/opengl/wiki/Framebuffer_Object",children:"Framebuffer Object"})," in the OpenGL Wiki."]}),"\n",(0,t.jsxs)(r.li,{children:[(0,t.jsx)(r.code,{children:"resize()"})," will erase the current content of any attachments, but not actually recreate them (The underlying",(0,t.jsx)(r.code,{children:"WebGLTexture"})," handles are not changed)."]}),"\n"]})]})}function o(e={}){const{wrapper:r}={...(0,s.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},1020:(e,r,n)=>{var t=n(6540),s=Symbol.for("react.element"),c=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,d=t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,a={key:!0,ref:!0,__self:!0,__source:!0};function l(e,r,n){var t,c={},l=null,h=null;for(t in void 0!==n&&(l=""+n),void 0!==r.key&&(l=""+r.key),void 0!==r.ref&&(h=r.ref),r)i.call(r,t)&&!a.hasOwnProperty(t)&&(c[t]=r[t]);if(e&&e.defaultProps)for(t in r=e.defaultProps)void 0===c[t]&&(c[t]=r[t]);return{$$typeof:s,type:e,key:l,ref:h,props:c,_owner:d.current}}r.Fragment=c,r.jsx=l,r.jsxs=l},4848:(e,r,n)=>{e.exports=n(1020)},8453:(e,r,n)=>{n.d(r,{R:()=>i,x:()=>d});var t=n(6540);const s={},c=t.createContext(s);function i(e){const r=t.useContext(c);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function d(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),t.createElement(c.Provider,{value:r},e.children)}}}]);