"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[4662],{7340:(e,r,a)=>{a.r(r),a.d(r,{assets:()=>i,contentTitle:()=>d,default:()=>l,frontMatter:()=>c,metadata:()=>n,toc:()=>o});var t=a(4848),s=a(8453);const c={},d="ShaderFactory",n={id:"api-reference/engine/shader-factory",title:"ShaderFactory",description:"The ShaderFactory class provides a createShader() method that caches and reuses Shader resources.",source:"@site/../docs/api-reference/engine/shader-factory.md",sourceDirName:"api-reference/engine",slug:"/api-reference/engine/shader-factory",permalink:"/docs/api-reference/engine/shader-factory",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/master/docs/../docs/api-reference/engine/shader-factory.md",tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",previous:{title:"PipelineFactory",permalink:"/docs/api-reference/engine/pipeline-factory"},next:{title:"ShaderPassRenderer",permalink:"/docs/api-reference/engine/passes/shader-pass-renderer"}},i={},o=[{value:"Usage",id:"usage",level:2},{value:"Static Methods",id:"static-methods",level:2},{value:"ShaderFactory.getDefaultShaderFactory()",id:"shaderfactorygetdefaultshaderfactory",level:3},{value:"Methods",id:"methods",level:2},{value:"createShader()",id:"createshader",level:3},{value:"release()",id:"release",level:3}];function h(e){const r={code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.header,{children:(0,t.jsx)(r.h1,{id:"shaderfactory",children:"ShaderFactory"})}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"ShaderFactory"})," class provides a ",(0,t.jsx)(r.code,{children:"createShader()"})," method that caches and reuses ",(0,t.jsx)(r.code,{children:"Shader"})," resources."]}),"\n",(0,t.jsx)(r.p,{children:"Compiling shaders is costly, and may block the render pipeline on some devices. Using a shader factory allows applications to more easily consolidate shaders with identical properties, minimizing the amount of time spent compiling shaders."}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"ShaderFactory"})," will return the requested shader, creating it the first time, and then re-using a cached version if it is requested more than once. An application that tends to create multiple identical ",(0,t.jsx)(r.code,{children:"Shader"})," instances should consider replacing calls to ",(0,t.jsx)(r.code,{children:"device.createShader(...)"})," with calls to ",(0,t.jsx)(r.code,{children:"shaderFactory.createShader(...)"}),"."]}),"\n",(0,t.jsx)(r.p,{children:"It is possible to create multiple shader factories, but normally applications rely on the default factory that is created for each device."}),"\n",(0,t.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,t.jsxs)(r.p,{children:["An application that tends to create multiple identical ",(0,t.jsx)(r.code,{children:"Shader"})," instances\nshould consider replacing calls to ",(0,t.jsx)(r.code,{children:"device.createShader(...)"})," with calls to ",(0,t.jsx)(r.code,{children:"shaderFactory.createShader(...)"}),"."]}),"\n",(0,t.jsxs)(r.p,{children:["To deduplicate ",(0,t.jsx)(r.code,{children:"Shader"})," instances, simply replace existing shader creation"]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"const shader = device.createShader({stage: 'vertex', source: '...'}));\n"})}),"\n",(0,t.jsx)(r.p,{children:"with similar calls to the default shader factory"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"import {ShaderFactory} from '@luma.gl/engine';\nconst shaderFactory = ShaderFactory.getDefaultShaderFactory(device);\nconst shader = shaderFactory.createShader({stage: 'vertex', source: '...'});\n"})}),"\n",(0,t.jsxs)(r.p,{children:["To prevent the cache from growing too big, an optional ",(0,t.jsx)(r.code,{children:"release()"})," method is also available."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"shaderFactory.release(shader);\n"})}),"\n",(0,t.jsxs)(r.p,{children:["Shaders are destroyed by the factory automatically after all users of the shader have released their references. To clean up unused shaders and avoid memory leaks, every call to ",(0,t.jsx)(r.code,{children:"createShader"})," must be paired with a corresponding call to ",(0,t.jsx)(r.code,{children:"release"})," at some later time."]}),"\n",(0,t.jsx)(r.h2,{id:"static-methods",children:"Static Methods"}),"\n",(0,t.jsx)(r.h3,{id:"shaderfactorygetdefaultshaderfactory",children:"ShaderFactory.getDefaultShaderFactory()"}),"\n",(0,t.jsx)(r.p,{children:"Returns the default shader factory for a device."}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"ShaderFactory.getDefaultShaderFactory(device: Device): ShaderFactory\n"})}),"\n",(0,t.jsx)(r.p,{children:"While it is possible to create multiple factories, most applications will use the default factory."}),"\n",(0,t.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,t.jsx)(r.h3,{id:"createshader",children:"createShader()"}),"\n",(0,t.jsxs)(r.p,{children:["Returns a ",(0,t.jsx)(r.code,{children:"Shader"})," configured with the properties specified."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"createShader(props: ShaderProps): Shader\n"})}),"\n",(0,t.jsx)(r.p,{children:"If one is already cached, return it, otherwise create and cache a new one."}),"\n",(0,t.jsx)(r.h3,{id:"release",children:"release()"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-typescript",children:"release(shader: Shader): void\n"})}),"\n",(0,t.jsxs)(r.p,{children:["Indicates that a shader is no longer in use. Each call to ",(0,t.jsx)(r.code,{children:"createShader()"})," increments a reference count, and only when all references to a shader are released, the shader is destroyed and deleted from the cache."]})]})}function l(e={}){const{wrapper:r}={...(0,s.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},8453:(e,r,a)=>{a.d(r,{R:()=>d,x:()=>n});var t=a(6540);const s={},c=t.createContext(s);function d(e){const r=t.useContext(c);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function n(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:d(e.components),t.createElement(c.Provider,{value:r},e.children)}}}]);