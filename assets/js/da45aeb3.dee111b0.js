"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[4092],{7157:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>d,contentTitle:()=>c,default:()=>u,frontMatter:()=>i,metadata:()=>a,toc:()=>o});var n=t(4848),s=t(8453);const i={},c="VertexArray",a={id:"api-reference/core/resources/vertex-array",title:"VertexArray",description:"A VertexArray stores a set of vertex attribute bindings, including the index buffer.",source:"@site/../docs/api-reference/core/resources/vertex-array.md",sourceDirName:"api-reference/core/resources",slug:"/api-reference/core/resources/vertex-array",permalink:"/docs/api-reference/core/resources/vertex-array",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/master/docs/../docs/api-reference/core/resources/vertex-array.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"QuerySet",permalink:"/docs/api-reference/core/resources/query-set"},next:{title:"Model",permalink:"/docs/api-reference/engine/model"}},d={},o=[{value:"Usage",id:"usage",level:2},{value:"Types",id:"types",level:2},{value:"<code>VertexArrayProps</code>",id:"vertexarrayprops",level:3},{value:"Members",id:"members",level:2},{value:"Methods",id:"methods",level:2},{value:"<code>constructor(props: VertexArrayProps)</code>",id:"constructorprops-vertexarrayprops",level:3},{value:"setIndexBuffer",id:"setindexbuffer",level:3},{value:"setBuffer(location: number): void",id:"setbufferlocation-number-void",level:3},{value:"setConstant(location: number: Float32Array | Int32Array | Uint32Array): void",id:"setconstantlocation-number-float32array--int32array--uint32array-void",level:3}];function l(e){const r={code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,s.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.header,{children:(0,n.jsx)(r.h1,{id:"vertexarray",children:"VertexArray"})}),"\n",(0,n.jsxs)(r.p,{children:["A ",(0,n.jsx)(r.code,{children:"VertexArray"})," stores a set of vertex attribute bindings, including the index buffer."]}),"\n",(0,n.jsx)(r.p,{children:"On WebGL, attribute can be bound to constants,"}),"\n",(0,n.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"const renderPipeline = device.createRenderPipeline({bufferLayout, ...});\nconst vertexArray = device.createVertexArray({renderPipeline});\n\nvertexArray.setIndexBuffer(device.createBuffer({usage: Buffer.INDEX, ...));\nvertexArray.setBuffer(0, device.createBuffer({usage: Buffer.VERTEX, ...));\nvertexArray.setConstant(1, new Float32Array([1, 2, 3]));\n\nconst renderPipeline.setVertexArray(vertexArray);\n"})}),"\n",(0,n.jsx)(r.h2,{id:"types",children:"Types"}),"\n",(0,n.jsx)(r.h3,{id:"vertexarrayprops",children:(0,n.jsx)(r.code,{children:"VertexArrayProps"})}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{children:"Property"}),(0,n.jsx)(r.th,{children:"Type"}),(0,n.jsx)(r.th,{children:"Description"})]})}),(0,n.jsx)(r.tbody,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"renderPipeline"})}),(0,n.jsx)(r.td,{children:(0,n.jsx)(r.code,{children:"RenderPipeline"})}),(0,n.jsx)(r.td,{children:"Layout of attributes (type, size, step mode etc) will match the pipeline's shaderLayout/bufferLayouts."})]})})]}),"\n",(0,n.jsx)(r.h2,{id:"members",children:"Members"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"device"}),": ",(0,n.jsx)(r.code,{children:"Device"})," - holds a reference to the ",(0,n.jsx)(r.code,{children:"Device"})," that created this ",(0,n.jsx)(r.code,{children:"VertexArray"}),"."]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"handle"}),": ",(0,n.jsx)(r.code,{children:"unknown"})," - holds the underlying WebGL or WebGPU shader object"]}),"\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"props"}),": ",(0,n.jsx)(r.code,{children:"VertexArrayProps"})," - holds a copy of the ",(0,n.jsx)(r.code,{children:"VertexArrayProps"})," used to create this ",(0,n.jsx)(r.code,{children:"VertexArray"}),"."]}),"\n"]}),"\n",(0,n.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,n.jsx)(r.h3,{id:"constructorprops-vertexarrayprops",children:(0,n.jsx)(r.code,{children:"constructor(props: VertexArrayProps)"})}),"\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"VertexArray"})," is an abstract class and cannot be instantiated directly. Create with ",(0,n.jsx)(r.code,{children:"device.beginVertexArray(...)"}),"."]}),"\n",(0,n.jsx)(r.h3,{id:"setindexbuffer",children:"setIndexBuffer"}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"vertexArray.setIndexBuffer(location: number, buffer | null): void\n"})}),"\n",(0,n.jsx)(r.p,{children:"Note that the index buffer can be unbound by calling `vertexArray.setUb"}),"\n",(0,n.jsx)(r.h3,{id:"setbufferlocation-number-void",children:"setBuffer(location: number): void"}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"vertexArray.setBuffer(location: number, buffer | null): void\n"})}),"\n",(0,n.jsx)(r.h3,{id:"setconstantlocation-number-float32array--int32array--uint32array-void",children:"setConstant(location: number: Float32Array | Int32Array | Uint32Array): void"}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-typescript",children:"vertexArray.setConstant(location: number, buffer | null): void\n"})}),"\n",(0,n.jsx)(r.p,{children:"Note:"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsx)(r.li,{children:"Under WebGL, a WebGL VertexArrayObject will be created."}),"\n",(0,n.jsx)(r.li,{children:"Under WebGPU, this is a simply an API class that holds attributes."}),"\n"]})]})}function u(e={}){const{wrapper:r}={...(0,s.R)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}},8453:(e,r,t)=>{t.d(r,{R:()=>c,x:()=>a});var n=t(6540);const s={},i=n.createContext(s);function c(e){const r=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:c(e.components),n.createElement(i.Provider,{value:r},e.children)}}}]);