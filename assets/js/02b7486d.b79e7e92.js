/*! For license information please see 02b7486d.b79e7e92.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[994],{9747:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>c,contentTitle:()=>a,default:()=>p,frontMatter:()=>l,metadata:()=>s,toc:()=>o});var r=i(4848),t=i(8453);const l={},a="PipelineFactory",s={id:"api-reference/engine/pipeline-factory",title:"PipelineFactory",description:"The PipelineFactory class provides a createRenderPipeline() method that caches and reuses render pipelines.",source:"@site/../docs/api-reference/engine/pipeline-factory.md",sourceDirName:"api-reference/engine",slug:"/api-reference/engine/pipeline-factory",permalink:"/docs/api-reference/engine/pipeline-factory",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-reference/engine/pipeline-factory.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"ScenegraphNode",permalink:"/docs/api-reference/engine/scenegraph/scenegraph-node"},next:{title:"ShaderFactory",permalink:"/docs/api-reference/engine/shader-factory"}},c={},o=[{value:"Usage",id:"usage",level:2},{value:"shadertools Integration",id:"shadertools-integration",level:2},{value:"Static Methods",id:"static-methods",level:2},{value:"PipelineFactory.getDefaultPipelineFactory()",id:"pipelinefactorygetdefaultpipelinefactory",level:3},{value:"Methods",id:"methods",level:2},{value:"createRenderPipeline()",id:"createrenderpipeline",level:3},{value:"release()",id:"release",level:3},{value:"getUniforms(program: Program): Object",id:"getuniformsprogram-program-object",level:3}];function d(e){const n={admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.h1,{id:"pipelinefactory",children:"PipelineFactory"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"PipelineFactory"})," class provides a ",(0,r.jsx)(n.code,{children:"createRenderPipeline()"})," method that caches and reuses render pipelines."]}),"\n",(0,r.jsxs)(n.p,{children:["The purpose of the pipeline factory is to speed up applications that tend to create multiple render pipelines with the same shaders and other properties. By returning the same cached pipeline, and when used alongside a ",(0,r.jsx)(n.code,{children:"ShaderFactory"}),", the pipeline factory minimizes the amount of time spent in shader compilation and linking."]}),"\n",(0,r.jsx)(n.admonition,{type:"info",children:(0,r.jsx)(n.p,{children:"Pipeline creation involves linking shaders. The linking stage is highly dependent on graphics drivers, and the time spent accumulates when creating many pipelines during application startup or during dynamic renderings. Also, on some graphics drivers, pipeline linking can grow non-linearly into the multi-second range for big shaders."})}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"PipelineFactory"})," will return the requested pipeline, creating it the first time, and then re-using a cached version if it is requested more than once. An application that tends to create multiple identical ",(0,r.jsx)(n.code,{children:"RenderPipeline"})," instances\nshould consider replacing normal pipeline creation."]}),"\n",(0,r.jsx)(n.p,{children:"It is possible to create multiple pipeline factories, but normally applications rely on the default pipeline factory that is created for each device."}),"\n",(0,r.jsx)(n.p,{children:"Limitations:"}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"ComputePipeline"})," caching is not currently supported."]}),"\n"]}),"\n",(0,r.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsxs)(n.p,{children:["An application that tends to create multiple identical ",(0,r.jsx)(n.code,{children:"RenderPipeline"})," instances\nshould consider replacing normal pipeline creation."]}),"\n",(0,r.jsxs)(n.p,{children:["To deduplicate ",(0,r.jsx)(n.code,{children:"RenderPipeline"})," instances, simply replace normal pipeline creation"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"const pipeline = device.createRenderPipeline({vs, fs, ...}));\n"})}),"\n",(0,r.jsx)(n.p,{children:"with similar calls to the default pipeline factory"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"import {PipelineFactory} from '@luma.gl/engine';\nconst pipelineFactory = PipelineFactory.getDefaultPipelineFactory(device);\nconst pipeline = pipelineFactory.createRenderPipeline({vs, fs, ...}));\n"})}),"\n",(0,r.jsxs)(n.p,{children:["To prevent the cache from growing too big, an optional ",(0,r.jsx)(n.code,{children:"release()"})," method is also available."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"pipelineFactory.release(pipeline);\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Pipelines are destroyed by the factory automatically after all users of the pipeline have released their references. To clean up unused pipelines and avoid memory leaks, every call to ",(0,r.jsx)(n.code,{children:"createRenderPipeline"})," must be paired with a corresponding call to ",(0,r.jsx)(n.code,{children:"release"})," at some later time."]}),"\n",(0,r.jsx)(n.h2,{id:"shadertools-integration",children:"shadertools Integration"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"import {PipelineFactory} from '@luma.gl/engine';\n\nconst pipelineFactory = new PipelineFactory(device);\n\nconst vs = device.createShader({\n  stage: 'vertex',\n  source: `\nattribute vec4 position;\n\nvoid main() {\n#ifdef MY_DEFINE\n  gl_Position = position;\n#else\n  gl_Position = position.wzyx;\n#endif\n}\n`\n});\n\nconst fs = device.createShader({\n  stage: 'fragment',\n  source: `\nvoid main() {\n  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n  MY_SHADER_HOOK(gl_FragColor);\n}\n`\n});\n\npipelineFactory.addShaderHook('fs:MY_SHADER_HOOK(inout vec4 color)');\n\npipelineFactory.addDefaultModule(dirlight); // Will be included in all following programs\n\nconst pipeline1 = pipelineFactory.createRenderPipeline({vs, fs}); // Basic, no defines, only default module\nconst program2 = pipelineFactory.createRenderPipeline({vs, fs}); // Cached, same as pipeline 1, use count 2\nconst program3 = pipelineFactory.createRenderPipeline({\n  // New pipeline, with different source based on define\n  vs,\n  fs,\n  defines: {\n    MY_DEFINE: true\n  }\n});\n\nconst program4 = pipelineFactory.createRenderPipeline({\n  // New pipeline, with different source based on module and its injection\n  vs,\n  fs,\n  defines: {\n    MY_DEFINE: true\n  },\n  modules: [picking]\n});\n\nconst program5 = pipelineFactory.createRenderPipeline({\n  // Cached, same as pipeline 4, use count 2\n  vs,\n  fs,\n  defines: {\n    MY_DEFINE: true\n  },\n  modules: [picking]\n});\n\npipelineFactory.release(program1); // Cached pipeline still available, use count 1\npipelineFactory.release(program2); // Cached pipeline deleted\npipelineFactory.release(program3); // Cached pipeline deleted\npipelineFactory.release(program4); // Cached pipeline still available, use count 1\npipelineFactory.release(program5); // Cached pipeline deleted\n"})}),"\n",(0,r.jsx)(n.h2,{id:"static-methods",children:"Static Methods"}),"\n",(0,r.jsx)(n.h3,{id:"pipelinefactorygetdefaultpipelinefactory",children:"PipelineFactory.getDefaultPipelineFactory()"}),"\n",(0,r.jsx)(n.p,{children:"Returns the default pipeline factory for a device."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"PipelineFactory.getDefaultPipelineFactory(device: Device): PipelineFactory\n"})}),"\n",(0,r.jsx)(n.p,{children:"While it is possible to create multiple factories, most applications will use the default factory."}),"\n",(0,r.jsx)(n.h2,{id:"methods",children:"Methods"}),"\n",(0,r.jsx)(n.h3,{id:"createrenderpipeline",children:"createRenderPipeline()"}),"\n",(0,r.jsx)(n.p,{children:"Get a program that fits the parameters provided."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"createRenderPipeline(props: RenderPipelineProps): RenderPipeline\n"})}),"\n",(0,r.jsxs)(n.p,{children:["If one is already cached, return it, otherwise create and cache a new one.\n",(0,r.jsx)(n.code,{children:"opts"})," can include the following (see ",(0,r.jsx)(n.code,{children:"assembleShaders"})," for details):"]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"vs"}),": Base vertex ",(0,r.jsx)(n.code,{children:"Shader"})," resource."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"fs"}),": Base fragment ",(0,r.jsx)(n.code,{children:"Shader"})," resource."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"defines"}),": Object indicating ",(0,r.jsx)(n.code,{children:"#define"})," constants to include in the shaders."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"modules"}),": Array of module objects to include in the shaders."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"inject"}),": Object of hook injections to include in the shaders."]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"release",children:"release()"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"release(pipeline: RenderPipeline): void\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Indicates that a pipeline is no longer in use. Each call to ",(0,r.jsx)(n.code,{children:"createRenderPipeline()"})," increments a reference count, and only when all references to a pipeline are released, the pipeline is destroyed and deleted from the cache."]}),"\n",(0,r.jsx)(n.h3,{id:"getuniformsprogram-program-object",children:"getUniforms(program: Program): Object"}),"\n",(0,r.jsxs)(n.p,{children:["Returns an object containing all the uniforms defined for the program. Returns ",(0,r.jsx)(n.code,{children:"null"})," if ",(0,r.jsx)(n.code,{children:"program"})," isn't managed by the ",(0,r.jsx)(n.code,{children:"PipelineFactory"}),"."]})]})}function p(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},1020:(e,n,i)=>{var r=i(6540),t=Symbol.for("react.element"),l=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,s=r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function o(e,n,i){var r,l={},o=null,d=null;for(r in void 0!==i&&(o=""+i),void 0!==n.key&&(o=""+n.key),void 0!==n.ref&&(d=n.ref),n)a.call(n,r)&&!c.hasOwnProperty(r)&&(l[r]=n[r]);if(e&&e.defaultProps)for(r in n=e.defaultProps)void 0===l[r]&&(l[r]=n[r]);return{$$typeof:t,type:e,key:o,ref:d,props:l,_owner:s.current}}n.Fragment=l,n.jsx=o,n.jsxs=o},4848:(e,n,i)=>{e.exports=i(1020)},8453:(e,n,i)=>{i.d(n,{R:()=>a,x:()=>s});var r=i(6540);const t={},l=r.createContext(t);function a(e){const n=r.useContext(l);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:a(e.components),r.createElement(l.Provider,{value:n},e.children)}}}]);