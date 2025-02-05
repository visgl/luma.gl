/*! For license information please see 59164069.e57aea48.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[4991],{6733:(e,d,n)=>{n.r(d),n.d(d,{assets:()=>l,contentTitle:()=>i,default:()=>x,frontMatter:()=>t,metadata:()=>c,toc:()=>h});var r=n(4848),s=n(8453);const t={},i="Attributes",c={id:"api-guide/gpu/gpu-attributes",title:"Attributes",description:"In traditional 3D graphics, the purpose of GPU attributes* is to",source:"@site/../docs/api-guide/gpu/gpu-attributes.md",sourceDirName:"api-guide/gpu",slug:"/api-guide/gpu/gpu-attributes",permalink:"/docs/api-guide/gpu/gpu-attributes",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-guide/gpu/gpu-attributes.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"Understanding Bindings",permalink:"/docs/api-guide/gpu/gpu-bindings"},next:{title:"Uniforms",permalink:"/docs/api-guide/gpu/gpu-uniforms"}},l={},h=[{value:"Structure",id:"structure",level:2},{value:"Data Formats",id:"data-formats",level:2},{value:"Interleaved Data",id:"interleaved-data",level:2},{value:"Binding Buffers",id:"binding-buffers",level:2},{value:"VertexFormat",id:"vertexformat",level:2},{value:"Backend Notes",id:"backend-notes",level:2}];function o(e){const d={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(d.h1,{id:"attributes",children:"Attributes"}),"\n",(0,r.jsxs)(d.p,{children:["In traditional 3D graphics, the purpose of GPU *",(0,r.jsx)(d.em,{children:"attributes"})," is to\nprovide arrays of vertex data (containing positions, normals, texture coordinates for each vertex)\ndescribing the 3D models that are to be rendered."]}),"\n",(0,r.jsx)(d.p,{children:'More generally, a GPU can be thought of as operating on "binary columnar tables". In this a mental model:'}),"\n",(0,r.jsxs)(d.ul,{children:["\n",(0,r.jsx)(d.li,{children:'attributes are "columnar binary arrays" with the same number of elements that each contain one value for each row.'}),"\n",(0,r.jsx)(d.li,{children:"Each column is an array of either floating point values, or signed or unsigned integers."}),"\n",(0,r.jsx)(d.li,{children:"A row can use up either a single value, or represent a vector of 2, 3 or 4 elements."}),"\n",(0,r.jsx)(d.li,{children:"All rows in a column must be of the same format (single value or vector)"}),"\n"]}),"\n",(0,r.jsx)(d.h2,{id:"structure",children:"Structure"}),"\n",(0,r.jsx)(d.p,{children:"In luma.gl attribute structure is described by two complementary concepts:"}),"\n",(0,r.jsxs)(d.p,{children:["A ",(0,r.jsx)(d.code,{children:"ShaderLayout"})," describes the static structure of attributes\ndeclared in the shader source code. This includes:"]}),"\n",(0,r.jsxs)(d.ul,{children:["\n",(0,r.jsx)(d.li,{children:'the "location" (the index of the attribute in the GPU\'s attribute bank)'}),"\n",(0,r.jsx)(d.li,{children:"the type of the attribute declared in the shader (f32, i32, u32), and number of components."}),"\n",(0,r.jsx)(d.li,{children:"a step mode ('vertex' or 'instance')."}),"\n",(0,r.jsx)(d.li,{children:"whether calculations will be performed in integer or floating point arithmetic."}),"\n"]}),"\n",(0,r.jsxs)(d.p,{children:["A ",(0,r.jsx)(d.code,{children:"BufferLayout"})," describes the dynamic structure of one buffer (the actual GPU memory)\nthat is expected be bound to the pipeline before ",(0,r.jsx)(d.code,{children:"draw()"})," or ",(0,r.jsx)(d.code,{children:"run()"})," is called.\nSpecifically it"]}),"\n",(0,r.jsx)(d.h2,{id:"data-formats",children:"Data Formats"}),"\n",(0,r.jsxs)(d.p,{children:["A ",(0,r.jsx)(d.code,{children:"BufferLayout"})," enumerates the attributes that will be read from the memory in each bound buffer."]}),"\n",(0,r.jsxs)(d.ul,{children:["\n",(0,r.jsx)(d.li,{children:"the data format of the memory in the buffer, i.e: the primitive data type (float, int, short, byte etc)"}),"\n",(0,r.jsx)(d.li,{children:'and the number of components per "row" or "vertex"'}),"\n",(0,r.jsx)(d.li,{children:"the data format also describes if the memory represents normalized integers."}),"\n"]}),"\n",(0,r.jsx)(d.p,{children:"Note that data formats are allowed to differ between attributes even when they are stored in the same GPU buffer."}),"\n",(0,r.jsx)(d.h2,{id:"interleaved-data",children:"Interleaved Data"}),"\n",(0,r.jsx)(d.p,{children:"While buffers supplied by applications to define attribute values often contain\nonly a contiguous block of memory for a single attribute, a buffer can also be set up to\ncontain the memory for multiple attributes, either in sequence, or interleaved."}),"\n",(0,r.jsx)(d.h2,{id:"binding-buffers",children:"Binding Buffers"}),"\n",(0,r.jsxs)(d.p,{children:["Attributes define binding points for memory arrays in the form of ",(0,r.jsx)(d.code,{children:"Buffer"}),"s."]}),"\n",(0,r.jsx)(d.p,{children:"The structure (memory layout and format) of these memory contained in these buffers.\nmust match the constraints imposed by the shader source code,\nand the structure of the data in the buffers must also be communicated to the GPU."}),"\n",(0,r.jsx)(d.h2,{id:"vertexformat",children:"VertexFormat"}),"\n",(0,r.jsxs)(d.p,{children:["The format of a vertex attribute indicates how data from a vertex buffer\nwill be interpreted and exposed to the shader. Each format has a name that encodes\nthe order of components, bits per component, and vertex data type for the component.\nThe ",(0,r.jsx)(d.code,{children:"VertexFormat"})," type is a string union of all the defined vertex formats."]}),"\n",(0,r.jsx)(d.p,{children:"Each vertex data type can map to any WGSL scalar type of the same base type, regardless of the bits per component:"}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Vertex format prefix"}),(0,r.jsx)(d.th,{children:"Vertex data type"}),(0,r.jsx)(d.th,{children:"Compatible WGSL types"}),(0,r.jsx)(d.th,{children:"Compatible GLSL types"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unsigned int"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"uint"}),", ",(0,r.jsx)(d.code,{children:"uvec2"}),", ",(0,r.jsx)(d.code,{children:"uvec3"}),", ",(0,r.jsx)(d.code,{children:"uvec4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"signed int"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ",(0,r.jsx)(d.code,{children:"ivec2"}),", ",(0,r.jsx)(d.code,{children:"ivec3"}),", ",(0,r.jsx)(d.code,{children:"ivec4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unsigned normalized"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"float"}),", ",(0,r.jsx)(d.code,{children:"vec2"}),", ",(0,r.jsx)(d.code,{children:"vec3"}),", ",(0,r.jsx)(d.code,{children:"vec4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"signed normalized"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"float"}),", ",(0,r.jsx)(d.code,{children:"vec2"}),", ",(0,r.jsx)(d.code,{children:"vec3"}),", ",(0,r.jsx)(d.code,{children:"vec4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"floating point"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"float"}),", ",(0,r.jsx)(d.code,{children:"vec2"}),", ",(0,r.jsx)(d.code,{children:"vec3"}),", ",(0,r.jsx)(d.code,{children:"vec4"})]})]})]})]}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Vertex Format"}),(0,r.jsx)(d.th,{children:"Data Type"}),(0,r.jsx)(d.th,{children:"WGSL types"}),(0,r.jsx)(d.th,{children:"GLSL Types"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint8x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint8"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"uint"}),", ",(0,r.jsx)(d.code,{children:"uvec2-4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint8x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint8"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"uint"}),", ",(0,r.jsx)(d.code,{children:"uvec2-4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint8x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint8"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ",(0,r.jsx)(d.code,{children:"ivec2-4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint8x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint8"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ",(0,r.jsx)(d.code,{children:"ivec2-4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm8x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm8"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"float"}),", ",(0,r.jsx)(d.code,{children:"vec2"}),", ",(0,r.jsx)(d.code,{children:"vec3"}),", ",(0,r.jsx)(d.code,{children:"vec4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm8x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm8"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"float"}),", ..."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm8x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm8"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"float"}),", ..."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm8x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm8"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"float"}),", ..."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint16x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint16x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint16x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ",(0,r.jsx)(d.code,{children:"ivec2-4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint16x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ",(0,r.jsx)(d.code,{children:"ivec2-4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm16x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm16"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm16x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"unorm16"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm16x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm16"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm16x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"snorm16"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"f16"}),", ",(0,r.jsx)(d.code,{children:"f32"})]}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float16x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"f16"})}),(0,r.jsx)(d.td,{children:"?"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float16x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float16"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"f16"})}),(0,r.jsx)(d.td,{children:"?"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"f32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"f32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32x3"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"f32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"float32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"f32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint32x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint32x3"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint32x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"uint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"u32"})}),(0,r.jsx)(d.td,{})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ",(0,r.jsx)(d.code,{children:"ivec2"}),", ",(0,r.jsx)(d.code,{children:"ivec3"}),", ",(0,r.jsx)(d.code,{children:"ivec4"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint32x2"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ..."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint32x3"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ..."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint32x4"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"sint32"})}),(0,r.jsx)(d.td,{children:(0,r.jsx)(d.code,{children:"i32"})}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"int"}),", ..."]})]})]})]}),"\n",(0,r.jsx)(d.h2,{id:"backend-notes",children:"Backend Notes"}),"\n",(0,r.jsxs)(d.p,{children:["When it comes to attributes, ",(0,r.jsx)(d.a,{href:"https://www.w3.org/TR/webgpu/#vertex-state",children:"WebGPU"})," is significantly more restrictive than WebGL:"]}),"\n",(0,r.jsxs)(d.table,{children:[(0,r.jsx)(d.thead,{children:(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.th,{children:"Feature"}),(0,r.jsx)(d.th,{children:"WebGL"}),(0,r.jsx)(d.th,{children:"WebGPU"}),(0,r.jsx)(d.th,{children:"Comment"})]})}),(0,r.jsxs)(d.tbody,{children:[(0,r.jsxs)(d.tr,{children:[(0,r.jsxs)(d.td,{children:["Dynamic ",(0,r.jsx)(d.code,{children:"VertexFormat"})]}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:["Buffers with different structure (different ",(0,r.jsx)(d.code,{children:"BufferLayout"}),") can be provided without relinking the ",(0,r.jsx)(d.code,{children:"RenderPipeline"})]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:"Constant attributes"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsx)(d.td,{children:"(attribute locations can be disabled in which case a constant value is read from the WebGLRenderingContext)"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:"Component mismatch"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:["Use buffers with more or fewer components than expected by the shader (missing values will be filled with ",(0,r.jsx)(d.code,{children:"[0, 0, 0, 1]"}),")."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:"Non-normalized integers"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:["Non-normalized integer attributes can be assigned to floating point GLSL shader variables (e.g. ",(0,r.jsx)(d.code,{children:"vec4"}),")."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:"Alignment free 8-bit formats"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:["WebGPU 8 bit integers must be aligned to 16 bits (",(0,r.jsx)(d.code,{children:"uint8x1"}),", ",(0,r.jsx)(d.code,{children:"uint8x3"}),", ",(0,r.jsx)(d.code,{children:"unorm8x1"}),", ",(0,r.jsx)(d.code,{children:"unorm8x3"})," etc` are not supported)"]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:"Alignment free 16-bit formats"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:["WebGPU 16 bit integers must be aligned to 32 bits (",(0,r.jsx)(d.code,{children:"uint16x1"}),", ",(0,r.jsx)(d.code,{children:"uint16x3"}),", ",(0,r.jsx)(d.code,{children:"unorm16x1"}),", ",(0,r.jsx)(d.code,{children:"unorm16x3"})," etc` are not supported)"]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsx)(d.td,{children:"Normalized 32-bit integers"}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsx)(d.td,{children:"WebGPU 32 bit integer formats cannot be normalized"})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsxs)(d.td,{children:["Per-attribute",(0,r.jsx)(d.code,{children:"stepMode"})]}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"stepMode"})," (WebGL: ",(0,r.jsx)(d.code,{children:"divisor"}),", controls whether an attribute is instanced) can be set per-attribute, even when multiple attributes bind to the same buffer."]})]}),(0,r.jsxs)(d.tr,{children:[(0,r.jsxs)(d.td,{children:["Per-attribute",(0,r.jsx)(d.code,{children:"byteStride"})]}),(0,r.jsx)(d.td,{children:"\u2705"}),(0,r.jsx)(d.td,{children:"\u274c"}),(0,r.jsxs)(d.td,{children:[(0,r.jsx)(d.code,{children:"byteStride"})," (controls byte distance between two successive values in memory) can be set per-attribute, even when multiple attributes bind to the same buffer."]})]})]})]}),"\n",(0,r.jsx)(d.p,{children:"Presumably, the heavy restrictions in WebGPU support reduced run-time validation overhead, additional optimizations during shader compilation and/or portability across Vulkan/Metal/D3D12."}),"\n",(0,r.jsx)(d.p,{children:"Note:"}),"\n",(0,r.jsxs)(d.ul,{children:["\n",(0,r.jsx)(d.li,{children:"8 and 16 bit values only support 2 or 4 components. This is a WebGPU specific limitation that does not exist on WebGL."}),"\n",(0,r.jsxs)(d.li,{children:["WebGL: GLSL supports ",(0,r.jsx)(d.code,{children:"bool"})," and ",(0,r.jsx)(d.code,{children:"bvec*"})," but these are not portable to WebGPU and not included here."]}),"\n",(0,r.jsxs)(d.li,{children:["WebGL: GLSL types ",(0,r.jsx)(d.code,{children:"double"})," and ",(0,r.jsx)(d.code,{children:"dvec*"})," are not supported in any WebGL version (nor is ",(0,r.jsx)(d.code,{children:"f64"})," supported in WebGPU)."]}),"\n"]})]})}function x(e={}){const{wrapper:d}={...(0,s.R)(),...e.components};return d?(0,r.jsx)(d,{...e,children:(0,r.jsx)(o,{...e})}):o(e)}},1020:(e,d,n)=>{var r=n(6540),s=Symbol.for("react.element"),t=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,c=r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,l={key:!0,ref:!0,__self:!0,__source:!0};function h(e,d,n){var r,t={},h=null,o=null;for(r in void 0!==n&&(h=""+n),void 0!==d.key&&(h=""+d.key),void 0!==d.ref&&(o=d.ref),d)i.call(d,r)&&!l.hasOwnProperty(r)&&(t[r]=d[r]);if(e&&e.defaultProps)for(r in d=e.defaultProps)void 0===t[r]&&(t[r]=d[r]);return{$$typeof:s,type:e,key:h,ref:o,props:t,_owner:c.current}}d.Fragment=t,d.jsx=h,d.jsxs=h},4848:(e,d,n)=>{e.exports=n(1020)},8453:(e,d,n)=>{n.d(d,{R:()=>i,x:()=>c});var r=n(6540);const s={},t=r.createContext(s);function i(e){const d=r.useContext(t);return r.useMemo((function(){return"function"==typeof e?e(d):{...d,...e}}),[d,e])}function c(e){let d;return d=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),r.createElement(t.Provider,{value:d},e.children)}}}]);