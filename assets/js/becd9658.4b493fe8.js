/*! For license information please see becd9658.4b493fe8.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[883],{3490:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>c,contentTitle:()=>i,default:()=>h,frontMatter:()=>s,metadata:()=>d,toc:()=>l});var a=r(4848),t=r(8453);const s={},i="How Rendering Works",d={id:"api-guide/gpu/gpu-rendering",title:"How Rendering Works",description:"Note that the luma.gl documentation includes a series of tutorials that explain how to render with the luma.gl API.",source:"@site/../docs/api-guide/gpu/gpu-rendering.md",sourceDirName:"api-guide/gpu",slug:"/api-guide/gpu/gpu-rendering",permalink:"/docs/api-guide/gpu/gpu-rendering",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-guide/gpu/gpu-rendering.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"Using GPU Textures",permalink:"/docs/api-guide/gpu/gpu-textures"},next:{title:"Using GPU Parameters",permalink:"/docs/api-guide/gpu/gpu-parameters"}},c={},l=[{value:"Setup",id:"setup",level:2},{value:"Creating a Texture",id:"creating-a-texture",level:3},{value:"Creating a Framebuffer",id:"creating-a-framebuffer",level:3},{value:"Creating a CanvasContext",id:"creating-a-canvascontext",level:3},{value:"Creating a RenderPipeline",id:"creating-a-renderpipeline",level:3},{value:"Creating a Model",id:"creating-a-model",level:3},{value:"Drawing",id:"drawing",level:2},{value:"Rendering into a canvas",id:"rendering-into-a-canvas",level:2},{value:"Clearing",id:"clearing",level:2},{value:"Offscreen rendering",id:"offscreen-rendering",level:2},{value:"Resizing Framebuffers",id:"resizing-framebuffers",level:2},{value:"Binding a framebuffer for multiple render calls",id:"binding-a-framebuffer-for-multiple-render-calls",level:3},{value:"Using Multiple Render Targets",id:"using-multiple-render-targets",level:3}];function o(e){const n={admonition:"admonition",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,t.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.h1,{id:"how-rendering-works",children:"How Rendering Works"}),"\n",(0,a.jsx)(n.admonition,{type:"info",children:(0,a.jsx)(n.p,{children:"Note that the luma.gl documentation includes a series of tutorials that explain how to render with the luma.gl API."})}),"\n",(0,a.jsx)(n.p,{children:"A major feature of any GPU API is the ability to issue GPU draw calls."}),"\n",(0,a.jsx)(n.p,{children:"GPUs can draw into textures, or to the screen. In luma.gl"}),"\n",(0,a.jsx)(n.h2,{id:"setup",children:"Setup"}),"\n",(0,a.jsx)(n.p,{children:"To draw into a texture, the application needs to create"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["A ",(0,a.jsx)(n.code,{children:"Texture"})," that is the target of the draw call"]}),"\n",(0,a.jsxs)(n.li,{children:["A ",(0,a.jsx)(n.code,{children:"Framebuffer"})," that references the texture being drawn into."]}),"\n",(0,a.jsxs)(n.li,{children:["A ",(0,a.jsx)(n.code,{children:"RenderPass"})," using the framebuffer."]}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:"If drawing to the screen, the application will instead need to create"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["A ",(0,a.jsx)(n.code,{children:"CanvasContext"})," connected to a canvas that the GPU should draw into"]}),"\n",(0,a.jsxs)(n.li,{children:["A ",(0,a.jsx)(n.code,{children:"Framebuffer"})," by calling ",(0,a.jsx)(n.code,{children:"canvasContext.getCurrentFramebuffer()"}),"."]}),"\n",(0,a.jsxs)(n.li,{children:["A ",(0,a.jsx)(n.code,{children:"RenderPass"})," using the framebuffer."]}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:"Finally, to perform that actual draw call, the application needs a"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["A ",(0,a.jsx)(n.code,{children:"RenderPipeline"})," using the shader code that will execute during the draw."]}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:(0,a.jsxs)(n.em,{children:['Note: setting up a "raw" ',(0,a.jsx)(n.code,{children:"Renderpipeline"})," requires a substantial amount of boilerplace and setup. Instead most applications will typically use the ",(0,a.jsx)(n.code,{children:"Model"})," class in ",(0,a.jsx)(n.code,{children:"@luma.gl/engine"})," module to issue draw calls."]})}),"\n",(0,a.jsx)(n.h3,{id:"creating-a-texture",children:"Creating a Texture"}),"\n",(0,a.jsxs)(n.p,{children:["To create a texture suitable as a simple render target, call ",(0,a.jsx)(n.code,{children:"device.createTexture()"})," with no mipmaps and following sampler parameters:"]}),"\n",(0,a.jsxs)(n.table,{children:[(0,a.jsx)(n.thead,{children:(0,a.jsxs)(n.tr,{children:[(0,a.jsx)(n.th,{children:"Texture parameter"}),(0,a.jsx)(n.th,{children:"Value"})]})}),(0,a.jsxs)(n.tbody,{children:[(0,a.jsxs)(n.tr,{children:[(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"minFilter"})}),(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"linear"})})]}),(0,a.jsxs)(n.tr,{children:[(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"magFilter"})}),(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"linear"})})]}),(0,a.jsxs)(n.tr,{children:[(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"addressModeU"})}),(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"clamp-to-edge"})})]}),(0,a.jsxs)(n.tr,{children:[(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"addressModeV"})}),(0,a.jsx)(n.td,{children:(0,a.jsx)(n.code,{children:"clamp-to-edge"})})]})]})]}),"\n",(0,a.jsx)(n.h3,{id:"creating-a-framebuffer",children:"Creating a Framebuffer"}),"\n",(0,a.jsxs)(n.p,{children:["To help organize the target texture(s), luma.gl provides a ",(0,a.jsx)(n.code,{children:"Framebuffer"})," class.\nA ",(0,a.jsx)(n.code,{children:"Framebuffer"})," is a simple container object that holds textures that will be used as render targets for a ",(0,a.jsx)(n.code,{children:"RenderPass"}),", containing"]}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsx)(n.li,{children:"one or more color attachments"}),"\n",(0,a.jsx)(n.li,{children:"optionally, a depth, stencil or depth-stencil attachment"}),"\n"]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.code,{children:"Framebuffer"})," also provides a ",(0,a.jsx)(n.code,{children:"resize"})," method makes it easy to efficiently resize all the attachments of a ",(0,a.jsx)(n.code,{children:"Framebuffer"})," with a single method call."]}),"\n",(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.code,{children:"device.createFramebuffer"})," constructor enables the creation of a framebuffer with all attachments in a single step."]}),"\n",(0,a.jsxs)(n.p,{children:["When no attachments are provided during ",(0,a.jsx)(n.code,{children:"Framebuffer"})," object creation, new resources are created and used as default attachments for enabled targets (color and depth)."]}),"\n",(0,a.jsxs)(n.p,{children:["An application can render into an (HTML or offscreen) canvas by obtaining a\n",(0,a.jsx)(n.code,{children:"Framebuffer"})," object from a ",(0,a.jsx)(n.code,{children:"CanvasContext"})," using ",(0,a.jsx)(n.code,{children:"canvasContext.getDefaultFramebuffer()"}),"."]}),"\n",(0,a.jsx)(n.p,{children:"Alternatively an application can create custom framebuffers for rendering directly into textures."}),"\n",(0,a.jsxs)(n.p,{children:["The application uses a ",(0,a.jsx)(n.code,{children:"Framebuffer"})," by providing it as a parameter to ",(0,a.jsx)(n.code,{children:"device.beginRenderPass()"}),".\nAll operations on that ",(0,a.jsx)(n.code,{children:"RenderPass"})," instance will render into that framebuffer."]}),"\n",(0,a.jsxs)(n.p,{children:["A ",(0,a.jsx)(n.code,{children:"Framebuffer"}),' is shallowly immutable (the list of attachments cannot be changed after creation),\nhowever a Framebuffer can be "resized".']}),"\n",(0,a.jsx)(n.h3,{id:"creating-a-canvascontext",children:"Creating a CanvasContext"}),"\n",(0,a.jsxs)(n.p,{children:["While a ",(0,a.jsx)(n.code,{children:"Device"})," can be used on its own to perform computations on the GPU,\nat least one ",(0,a.jsx)(n.code,{children:"CanvasContext"})," is required for rendering to the screen."]}),"\n",(0,a.jsxs)(n.p,{children:["A ",(0,a.jsx)(n.code,{children:"CanvasContext"})," holds a connection between the GPU ",(0,a.jsx)(n.code,{children:"Device"})," and an HTML or offscreen ",(0,a.jsx)(n.code,{children:"canvas"})," (",(0,a.jsx)(n.code,{children:"HTMLCanvasElement"})," (or ",(0,a.jsx)(n.code,{children:"OffscreenCanvas"}),")_ into which it can render."]}),"\n",(0,a.jsxs)(n.p,{children:["The most important method is ",(0,a.jsx)(n.code,{children:"CanvasContext.getCurrentFramebuffer()"})," that is used to obtain fresh ",(0,a.jsx)(n.code,{children:"Framebuffer"})," every render frame. This framebuffer contains a special texture ",(0,a.jsx)(n.code,{children:"colorAttachment"}),' that draws into to the canvas "drawing buffer" which will then be copied to the screen when then render pass ends.']}),"\n",(0,a.jsxs)(n.p,{children:["While there are ways to obtain multiple ",(0,a.jsx)(n.code,{children:"CanvasContext"}),' instances on WebGPU, the recommended portable way (that also works on WebGL) is to create a "default canvas context" by supplying the ',(0,a.jsx)(n.code,{children:"createCanvasContext"})," prop to your ",(0,a.jsx)(n.code,{children:"luma.createDevice({..., createCanvasContext: true})"})," call. The created canvas contest is available via ",(0,a.jsx)(n.code,{children:"device.getDefaultCanvasContext()"}),"."]}),"\n",(0,a.jsx)(n.h3,{id:"creating-a-renderpipeline",children:"Creating a RenderPipeline"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"const pipeline = device.createRenderPipeline({\n  id: 'my-pipeline',\n  vs: vertexShaderSourceString,\n  fs: fragmentShaderSourceString\n});\n"})}),"\n",(0,a.jsx)(n.p,{children:"Set or update bindings"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"pipeline.setBindings({...});\n"})}),"\n",(0,a.jsx)(n.h3,{id:"creating-a-model",children:"Creating a Model"}),"\n",(0,a.jsx)(n.p,{children:"See engine documentation."}),"\n",(0,a.jsx)(n.h2,{id:"drawing",children:"Drawing"}),"\n",(0,a.jsxs)(n.p,{children:["Once all bindings have been set up, call ",(0,a.jsx)(n.code,{children:"pipeline.draw()"})]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"const pipeline = device.createRenderPipeline({vs, fs});\n\n// Create a `VertexArray` to store buffer values for the vertices of a triangle and drawing\nconst vertexArray = device.createVertexArray();\n...\n\nconst success = pipeline.draw({vertexArray, ...});\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Create a ",(0,a.jsx)(n.code,{children:"VertexArray"})," to store buffer values for the vertices of a triangle and drawing"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"const pipeline = device.createRenderPipeline({vs, fs});\nconst vertexArray = new VertexArray(gl, {pipeline});\nvertexArray.setAttributes({\n  aVertexPosition: new Buffer(gl, {data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])})\n});\n\npipeline.draw({vertexArray, ...});\n"})}),"\n",(0,a.jsx)(n.p,{children:"Creating a pipeline for transform feedback, specifying which varyings to use"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"const pipeline = device.createRenderPipeline({vs, fs, varyings: ['gl_Position']});\n"})}),"\n",(0,a.jsx)(n.h2,{id:"rendering-into-a-canvas",children:"Rendering into a canvas"}),"\n",(0,a.jsxs)(n.p,{children:["To draw to the screen in luma.gl, simply create a ",(0,a.jsx)(n.code,{children:"RenderPass"})," by calling\n",(0,a.jsx)(n.code,{children:"device.beginRenderPass()"})," and start rendering. When done rendering, call\n",(0,a.jsx)(n.code,{children:"renderPass.end()"})]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"  // A renderpass without parameters uses the default framebuffer of the device's default CanvasContext \n  const renderPass = device.beginRenderPass();\n  model.draw();\n  renderPass.end();\n  device.submit(); \n"})}),"\n",(0,a.jsxs)(n.p,{children:["For more detail. ",(0,a.jsx)(n.code,{children:"device.canvasContext.getDefaultFramebuffer()"})," returns a special framebuffer that lets you render to screen (into the device's swap chain textures). This framebuffer is used by default when a ",(0,a.jsx)(n.code,{children:"device.beginRenderPass()"})," is called without providing a ",(0,a.jsx)(n.code,{children:"framebuffer"}),":"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"  const renderPass = device.beginRenderPass({framebuffer: device.canvasContext.getDefaultFramebuffer()});\n  ...\n"})}),"\n",(0,a.jsx)(n.h2,{id:"clearing",children:"Clearing"}),"\n",(0,a.jsxs)(n.p,{children:["Unless implementing special compositing techniques, applications usually want to clear the target texture before rendering.\nClearing is performed when a ",(0,a.jsx)(n.code,{children:"RenderPass"})," starts. ",(0,a.jsx)(n.code,{children:"Framebuffer"})," attachments are cleared according to the ",(0,a.jsx)(n.code,{children:"clearColor,clearDepth,clearStencil"})," ",(0,a.jsx)(n.code,{children:"RenderPassProps"}),".\n",(0,a.jsx)(n.code,{children:"props.clearColor"})," will clear the color attachment using the supplied color. The default clear color is a fully transparent black ",(0,a.jsx)(n.code,{children:"[0, 0, 0, 0]"}),"."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});\n  model.draw();\n  renderPass.end();\n  device.submit();\n"})}),"\n",(0,a.jsx)(n.p,{children:"Depth and stencil buffers should normally also be cleared to default values:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"  const renderPass = device.beginRenderPass({\n    clearColor: [0, 0, 0, 1],\n    depthClearValue: 1,\n    stencilClearValue: 0\n  });\n  renderPass.end();\n  device.submit();\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Clearing can be disabled by setting any of the clear properties to the string constant ",(0,a.jsx)(n.code,{children:"'false'"}),". Instead of clearing before rendering, this loads the previous contents of the framebuffer."]}),"\n",(0,a.jsx)(n.p,{children:(0,a.jsx)(n.em,{children:"Note: Clearing is normally be expected to be more performant than not clearing, as the latter requires the GPU to read in the previous content of texture while rendering."})}),"\n",(0,a.jsx)(n.h2,{id:"offscreen-rendering",children:"Offscreen rendering"}),"\n",(0,a.jsxs)(n.p,{children:["It is possible to render into an ",(0,a.jsx)(n.code,{children:"OffscreenCanvas"}),", enabling worker thread use cases etc."]}),"\n",(0,a.jsx)(n.p,{children:(0,a.jsxs)(n.em,{children:["Note: offscreen rendering sometimes refers to rendering into one or more application created ",(0,a.jsx)(n.code,{children:"Texture"}),"s."]})}),"\n",(0,a.jsx)(n.h2,{id:"resizing-framebuffers",children:"Resizing Framebuffers"}),"\n",(0,a.jsx)(n.p,{children:"Resizing a framebuffer effectively destroys all current textures and creates new\ntextures with otherwise similar properties. All data stored in the previous textures are lost.\nThis data loss is usually a non-issue as resizes are usually performed between render passes,\n(typically to match the size of an off screen render buffer with the new size of the output canvas)."}),"\n",(0,a.jsx)(n.p,{children:"A default Framebuffer should not be manually resized."}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"const framebuffer = device.createFramebuffer({\n  width: window.innerWidth,\n  height: window.innerHeight,\n  color: 'true',\n  depthStencil: true\n});\n"})}),"\n",(0,a.jsx)(n.p,{children:"Attaching textures and renderbuffers"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"device.createFramebuffer({\n  depthStencil: device.createRenderbuffer({...}),\n  color0: device.createTexture({...})\n});\nframebuffer.checkStatus(); // optional\n"})}),"\n",(0,a.jsx)(n.p,{children:"Resizing a framebuffer to the size of a window. Resizes (and possibly clears) all attachments."}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"framebuffer.resize(window.innerWidth, window.innerHeight);\n"})}),"\n",(0,a.jsx)(n.p,{children:"Specifying a framebuffer for rendering in each render calls"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"const offScreenBuffer = device.createFramebuffer(...);\nconst offScreenRenderPass = device.beginRenderPass({framebuffer: offScreenFramebuffer});\nmodel1.draw({\n  framebuffer: offScreenBuffer,\n  parameters: {}\n});\nmodel2.draw({\n  framebuffer: null, // the default drawing buffer\n  parameters: {}\n});\n"})}),"\n",(0,a.jsx)(n.h3,{id:"binding-a-framebuffer-for-multiple-render-calls",children:"Binding a framebuffer for multiple render calls"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"const framebuffer1 = device.createFramebuffer({...});\nconst framebuffer2 = device.createFramebuffer({...});\n\nconst renderPass1 = device.beginRenderPass({framebuffer: framebuffer1});\nprogram.draw(renderPass1);\nrenderPass1.endPass();\n\nconst renderPass2 = device.beginRenderPass({framebuffer: framebuffer1});\nprogram.draw(renderPass2);\nrenderPass2.endPass();\n"})}),"\n",(0,a.jsx)(n.h3,{id:"using-multiple-render-targets",children:"Using Multiple Render Targets"}),"\n",(0,a.jsx)(n.admonition,{type:"caution",children:(0,a.jsx)(n.p,{children:"Multiple render target support is still experimental"})}),"\n",(0,a.jsxs)(n.p,{children:["Multiple textures from the ",(0,a.jsx)(n.code,{children:"framebuffer.colorAttachments"})," array can be referenced in shaders"]}),"\n",(0,a.jsx)(n.p,{children:"Writing to multiple framebuffer attachments in GLSL fragment shader"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-typescript",children:"#extension GL_EXT_draw_buffers : require\nprecision highp float;\nvoid main(void) {\n  gl_FragData[0] = vec4(0.25);\n  gl_FragData[1] = vec4(0.5);\n  gl_FragData[2] = vec4(0.75);\n  gl_FragData[3] = vec4(1.0);\n}\n"})})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(o,{...e})}):o(e)}},1020:(e,n,r)=>{var a=r(6540),t=Symbol.for("react.element"),s=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,d=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function l(e,n,r){var a,s={},l=null,o=null;for(a in void 0!==r&&(l=""+r),void 0!==n.key&&(l=""+n.key),void 0!==n.ref&&(o=n.ref),n)i.call(n,a)&&!c.hasOwnProperty(a)&&(s[a]=n[a]);if(e&&e.defaultProps)for(a in n=e.defaultProps)void 0===s[a]&&(s[a]=n[a]);return{$$typeof:t,type:e,key:l,ref:o,props:s,_owner:d.current}}n.Fragment=s,n.jsx=l,n.jsxs=l},4848:(e,n,r)=>{e.exports=r(1020)},8453:(e,n,r)=>{r.d(n,{R:()=>i,x:()=>d});var a=r(6540);const t={},s=a.createContext(t);function i(e){const n=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),a.createElement(s.Provider,{value:n},e.children)}}}]);