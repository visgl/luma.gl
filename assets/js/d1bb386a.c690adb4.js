"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[6924],{9557:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>h,frontMatter:()=>n,metadata:()=>d,toc:()=>l});var s=r(4848),i=r(8453);const n={},o="Geometry",d={id:"api-reference/engine/geometry/geometry",title:"Geometry",description:"The Geometry class holds a collection of vertex array attributes representing a geometric primitive.",source:"@site/../docs/api-reference/engine/geometry/geometry.md",sourceDirName:"api-reference/engine/geometry",slug:"/api-reference/engine/geometry/",permalink:"/docs/api-reference/engine/geometry/",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/master/docs/../docs/api-reference/engine/geometry/geometry.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"Built-in Geometries",permalink:"/docs/api-reference/engine/geometry/geometries"},next:{title:"KeyFrames",permalink:"/docs/api-reference/engine/animation/key-frames"}},c={},l=[{value:"Usage",id:"usage",level:2},{value:"Properties",id:"properties",level:2},{value:"<code>id: string</code>",id:"id-string",level:3},{value:"topology",id:"topology",level:3},{value:"<code>attributes</code>",id:"attributes",level:3},{value:"<code>indices</code>",id:"indices",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor(props : Object)",id:"constructorprops--object",level:3},{value:"setProps(props : Object)",id:"setpropsprops--object",level:3},{value:"Types and Enumerations",id:"types-and-enumerations",level:2},{value:"topology",id:"topology-1",level:3},{value:"Typical Attributes",id:"typical-attributes",level:3},{value:"Remarks",id:"remarks",level:2}];function a(e){const t={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.header,{children:(0,s.jsx)(t.h1,{id:"geometry",children:"Geometry"})}),"\n",(0,s.jsx)(t.p,{children:"The Geometry class holds a collection of vertex array attributes representing a geometric primitive."}),"\n",(0,s.jsxs)(t.p,{children:['A geometry is considered a "primitive" when it can be rendered with a single GPU draw call. Multiple geometry primitives can be composed into a composite geometry using the ',(0,s.jsx)(t.code,{children:"Mesh"})," and ",(0,s.jsx)(t.code,{children:"Model"})," classes."]}),"\n",(0,s.jsxs)(t.p,{children:["To learn more about attributes refer to the ",(0,s.jsx)(t.code,{children:"Accessor"})," class that holds metadata for each attributes."]}),"\n",(0,s.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(t.p,{children:"Create a pyramid geometry (used in lesson 4 of learning WebGL examples)."}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"const pyramidGeometry= new Geometry({\n  attributes: {\n    positions: new Float32Array([ ... ]),\n    colors: {\n      size: 4,\n      value: new Float32Array([ ... ])\n    }\n  }\n});\n"})}),"\n",(0,s.jsx)(t.h2,{id:"properties",children:"Properties"}),"\n",(0,s.jsx)(t.h3,{id:"id-string",children:(0,s.jsx)(t.code,{children:"id: string"})}),"\n",(0,s.jsx)(t.p,{children:"An id for the model. If not provided, a random unique identifier will be created."}),"\n",(0,s.jsx)(t.h3,{id:"topology",children:"topology"}),"\n",(0,s.jsx)(t.p,{children:"The draw mode, or primitive type."}),"\n",(0,s.jsxs)(t.p,{children:["Some options are ",(0,s.jsx)(t.code,{children:"triangle-list"})," (default), ",(0,s.jsx)(t.code,{children:"triangle-strip"}),", ",(0,s.jsx)(t.code,{children:"point-list"}),", ",(0,s.jsx)(t.code,{children:"line-list"}),"."]}),"\n",(0,s.jsx)(t.h3,{id:"attributes",children:(0,s.jsx)(t.code,{children:"attributes"})}),"\n",(0,s.jsx)(t.p,{children:"An object with buffer/attribute names and buffer/attribute descriptors to be set before rendering the model."}),"\n",(0,s.jsx)(t.h3,{id:"indices",children:(0,s.jsx)(t.code,{children:"indices"})}),"\n",(0,s.jsxs)(t.p,{children:["An optional ",(0,s.jsx)(t.code,{children:"Accessor"})," instance that contains the indices (aka elements) for this geometry. Can be ",(0,s.jsx)(t.code,{children:"null"})," or ",(0,s.jsx)(t.code,{children:"undefined"})," if this primitive doesn't use indices. Note that indices can also be stored inside ",(0,s.jsx)(t.code,{children:"attributes"}),"."]}),"\n",(0,s.jsx)(t.h2,{id:"methods",children:"Methods"}),"\n",(0,s.jsx)(t.h3,{id:"constructorprops--object",children:"constructor(props : Object)"}),"\n",(0,s.jsxs)(t.p,{children:["The constructor for the ",(0,s.jsx)(t.code,{children:"Geometry"})," class. Use this to create a new ",(0,s.jsx)(t.code,{children:"Geometry"}),"."]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"const geometry = new Geometry(props);\n"})}),"\n",(0,s.jsx)(t.h3,{id:"setpropsprops--object",children:"setProps(props : Object)"}),"\n",(0,s.jsx)(t.p,{children:"Update properties"}),"\n",(0,s.jsx)(t.h2,{id:"types-and-enumerations",children:"Types and Enumerations"}),"\n",(0,s.jsx)(t.h3,{id:"topology-1",children:"topology"}),"\n",(0,s.jsx)(t.p,{children:"Follows glTF/OpenGL/WebGL conventions:"}),"\n",(0,s.jsx)(t.h3,{id:"typical-attributes",children:"Typical Attributes"}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Attribute"}),(0,s.jsx)(t.th,{children:"Description"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"indices"})}),(0,s.jsxs)(t.td,{children:["(",(0,s.jsx)(t.em,{children:"array"}),", optional) An array of numbers describing the vertex indices for each face."]})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"positions"})}),(0,s.jsxs)(t.td,{children:["(",(0,s.jsx)(t.em,{children:"array"}),", optional) An array of floats that describe the vertices of the model."]})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"normals"})}),(0,s.jsxs)(t.td,{children:["(",(0,s.jsx)(t.em,{children:"array"}),", optional) An array of floats that describe the normals of the model."]})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"texCoords"})}),(0,s.jsxs)(t.td,{children:["(",(0,s.jsx)(t.em,{children:"mixed"}),", optional) Can be an array of floats indicating the texture coordinates for the texture to be used or an object that has texture ids as"]})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"colors"})}),(0,s.jsxs)(t.td,{children:["(",(0,s.jsx)(t.em,{children:"array"}),", optional) An array of colors in RGBA. If just one color is specified that color will be used for all faces."]})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.code,{children:"pickingColors"})}),(0,s.jsxs)(t.td,{children:["(",(0,s.jsx)(t.em,{children:"array"}),", optional) A custom set of colors to render the object to texture when performing the color picking algorithm."]})]})]})]}),"\n",(0,s.jsx)(t.h2,{id:"remarks",children:"Remarks"}),"\n",(0,s.jsxs)(t.ul,{children:["\n",(0,s.jsxs)(t.li,{children:["The Geometry class does not take a ",(0,s.jsx)(t.code,{children:"WebGLRenderingContext"})," and is intentionally"]}),"\n",(0,s.jsxs)(t.li,{children:["The ",(0,s.jsx)(t.code,{children:"Geometry"})," class holds the ",(0,s.jsx)(t.a,{href:"https://github.com/KhronosGroup/glTF/tree/master/specification/2.0",children:'glTF2 "primitive" specification'}),", although morph ",(0,s.jsx)(t.code,{children:"targets"})," are not yet supported."]}),"\n"]})]})}function h(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},8453:(e,t,r)=>{r.d(t,{R:()=>o,x:()=>d});var s=r(6540);const i={},n=s.createContext(i);function o(e){const t=s.useContext(n);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function d(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),s.createElement(n.Provider,{value:t},e.children)}}}]);