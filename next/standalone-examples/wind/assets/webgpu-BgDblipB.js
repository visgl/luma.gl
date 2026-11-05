import{a as e,c as t,i as n,l as r,n as i,o as a,r as o,s,t as c}from"./wgsl-binding-scan-Bkh5So86.js";import{C as l,D as u,E as d,F as f,I as p,L as m,M as h,N as g,O as _,P as v,R as y,S as ee,T as te,_ as b,a as x,b as ne,g as S,h as C,l as w,n as T,r as E,t as D,v as O,y as re}from"./expression-Bp1rJ1wS.js";import{t as k}from"./wgsl-interface-scan-DJPTfait.js";var A=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${i}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${i}\\s*:\\s*([^;]+);`,`g`)];function j(e,n=[]){let r=t(e),i=new Map;for(let e of n)i.set(ie(e.name,e.group,e.location),e.moduleName);let a=[];for(let e of A){e.lastIndex=0;let t;for(t=e.exec(r);t;){let n=e===A[0],o=Number(t[n?1:2]),s=Number(t[n?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=i.get(ie(l,s,o));a.push(M({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(r)}}return a.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function M(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:P(e.resourceType),viewDimension:N(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:N(e.resourceType),sampleType:ae(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function ie(e,t,n){return`${t}:${n}:${e}`}function N(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function ae(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function P(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}function F(e,n=``){let r=new Map,i=Object.values(e).flatMap(e=>Object.entries(e).map(([e,t])=>`${e.slice(3)}\n${t.signature}\n${t.header||``}\n${t.footer||``}`)),a=new Set(t(`${n}\n${i.join(`
`)}`).match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let t of Object.keys(e.vertex)){let n=t.slice(3);e.fragment[`fs:${n}`]&&r.set(n,{vertex:I(`_luma_vertex_target_${n}`,a),fragment:I(`_luma_fragment_target_${n}`,a)})}return r}function oe(e,n,r=F(n)){if(!r.size)return e;let i=t(e),a=new Map,o=/((?:@\w+(?:\([^)]*\))?\s*)*)\bfn\s+([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu;for(let e=o.exec(i);e;e=o.exec(i)){let t=i.indexOf(`{`,o.lastIndex),n=t+1,r=1;for(;n<i.length&&r;n++)i[n]===`{`&&r++,i[n]===`}`&&r--;p(t>=0&&r===0);let s=e[2],c=e.index+e[0].lastIndexOf(s),l=Array.from(i.slice(t+1,n-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu),e=>e[1]);a.set(s,{name:s,start:e.index,end:n,nameStart:c,bodyStart:t,calls:l,stages:new Set,entryStage:/@vertex\b/.test(e[1])?`vertex`:/@fragment\b/.test(e[1])?`fragment`:void 0}),o.lastIndex=n}function s(e,t){let n=a.get(e);if(!(!n||n.stages.has(t))){n.stages.add(t);for(let e of n.calls)s(r.get(e)?.[t]||e,t)}}for(let e of a.values())e.entryStage&&s(e.name,e.entryStage);for(let e of[`vertex`,`fragment`])for(let t of Object.keys(n[e])){let n=t.slice(3);s(r.get(n)?.[e]||n,e)}let c=new Set,l=!0;for(;l;){l=!1;for(let e of a.values())!c.has(e.name)&&e.calls.some(e=>r.has(e)||c.has(e))&&(c.add(e.name),l=!0)}let u=new Map,d=new Set(i.match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let e of c)a.get(e)?.stages.size===2&&u.set(e,{vertex:I(`_luma_vertex_helper_${e}`,d),fragment:I(`_luma_fragment_helper_${e}`,d)});function f(e,t){return r.get(e)?.[t]||u.get(e)?.[t]||e}for(let t of[...a.values()].reverse()){if(!c.has(t.name))continue;if(!t.stages.size)throw Error(`Cannot infer WGSL target stage in ${t.name}`);let n=[],r=t.start;for(let a of t.stages){let o=e.slice(r,t.end),s=[...i.slice(t.bodyStart+1,t.end-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu)];for(let e of s.reverse()){let n=t.bodyStart+1+e.index-r,i=f(e[1],a);o=o.slice(0,n)+i+o.slice(n+e[1].length)}let c=t.nameStart-r;o=o.slice(0,c)+f(t.name,a)+o.slice(c+t.name.length),n.push(o)}e=e.slice(0,r)+n.join(`
`)+e.slice(t.end)}return e}function I(e,t){let n=e,r=0;for(;t.has(n);)n=`${e}_${++r}`;return t.add(n),n}var L=`([a-zA-Z_][a-zA-Z0-9_]*)`,se=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,ce=RegExp(`^\\s*\\#\\s*ifdef\\s*${L}\\s*$`),le=RegExp(`^\\s*\\#\\s*ifndef\\s*${L}\\s*(?:\\/\\/.*)?$`),ue=/^\s*\#\s*else\s*(?:\/\/.*)?$/,de=/^\s*\#\s*endif\s*$/,fe=RegExp(`^\\s*\\#\\s*ifdef\\s*${L}\\s*(?:\\/\\/.*)?$`),pe=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function R(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(se),o=e.match(fe)||e.match(ce),s=e.match(le),c=e.match(ue),l=e.match(pe)||e.match(de);if(n){let e=me(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function me(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=`(?:[A-Za-z_][A-Za-z0-9_]*|[+-]?\\d+(?:\\.\\d+)?)`,i=n.match(RegExp(`^(${r})\\s*(==|!=|<=|>=|<|>)\\s*(${r})$`));if(i){let e=e=>/^[A-Za-z_]/.test(e)?Number(t[e]??0):Number(e),n=e(i[1]),r=e(i[3]);switch(i[2]){case`==`:return n===r;case`!=`:return n!==r;case`<=`:return n<=r;case`>=`:return n>=r;case`<`:return n<r;case`>`:return n>r}}let a=n.match(RegExp(`^!\\s*${L}$`));if(a)return!t[a[1]];let o=n.match(RegExp(`^${L}$`));if(o)return!!t[o[1]];let s=n.match(RegExp(`^defined\\s*\\(\\s*${L}\\s*\\)$`));if(s)return t[s[1]]!==void 0;let c=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${L}\\s*\\)$`));if(c)return t[c[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function he(e){let t=v(e.modules||[]),{source:n,bindingAssignments:r}=ge(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:u(t),bindingAssignments:r}}function ge(e,t){let{source:n,stage:r,modules:i,defines:a={},injectionTargets:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:u={},pluginInterStageVariables:m={},vertexEntryPoint:v=`vertexMain`,fragmentEntryPoint:y=`fragmentMain`,log:b}=t;p(typeof n==`string`,`shader source must be a string`);let x=l(R(n,{defines:a}),v,u),S=ee(x.source,v,y,m),C=S.source,w=``,T=re(o,t.pluginInjectionTargets,`wgsl`),E={},D={},O={};d(c,E,D,O),d(Array.isArray(s)?g(s,`wgsl`):{},E,D,O);let k=Array.isArray(s)?{}:s;for(let e in k){let t=typeof k[e]==`string`?{injection:k[e],order:0}:k[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?D[e]=[...D[e]||[],t]:O[e]=[...O[e]||[],t]:E[e]=[...E[e]||[],t]}else O[e]=[...O[e]||[],t]}_e(x.declarations,x.initialization,D,O),ve(S,D,O),ne(T,E);let A=i.map(e=>({module:e,source:R(_(e,`wgsl`,b),{defines:a})})),j=Se(C),M=xe(j.source),ie=Ee(A,t._bindingRegistry,M),N=[],ae=A.map(({module:e,source:n})=>{let r=Ce(n,e,{usedBindingsByGroup:M,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:ie});return N.push(...r.bindingAssignments),{module:e,source:r.source}});for(let{module:e,source:t}of ae)b&&f(e,C,b),w+=t;w+=te,w=h(w,r,ye(D),!1,`wgsl`,{vertex:v,fragment:y});let P=F(T,[w,j.source,...Object.values(E).flat().map(e=>e.injection),...Object.values(O).flat().map(e=>e.injection)].join(`
`));return w+=be(T,E,P),w+=je(N),w+=j.source,w=h(w,r,O,!1,`wgsl`,{vertex:v,fragment:y}),w=oe(w,T,P),Ae(w),{source:w,bindingAssignments:N}}function _e(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function ve(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function ye(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function be(e,t,n=F(e)){return[`vertex`,`fragment`].map(r=>O(Object.fromEntries(Object.entries(e[r]).map(([e,t])=>{let i=e.slice(3),a=n.get(i)?.[r]||i;return[e,{...t,signature:a+t.signature.slice(i.length)}]})),t,`wgsl`)).join(``)}function xe(e){let t=new Map;for(let r of a(e,n)){let e=Number(r.bindingToken),n=Number(r.groupToken);z(n,e,r.name),V(t,n,e,`application binding "${r.name}"`)}return t}function Se(e){let t=a(e,o),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);z(r,t,e.name),V(n,r,t,`application binding "${e.name}"`)}let i={sawSupportedBindingDeclaration:t.length>0},c=r(e,o,e=>Te(e,n,i));if(s(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:c}}function Ce(e,t,n){let i=[],o={sawSupportedBindingDeclaration:a(e,c).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},l=r(e,c,e=>we(e,{module:t,context:n,bindingAssignments:i,relocationState:o}));if(s(e)&&!o.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:l,bindingAssignments:i}}function we(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=H(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?Oe(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return B(n.name,u,s,l),t!==void 0&&De(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(V(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);B(n.name,u,d,l);let f=H(u,n.name,l);return De(r.reservedBindingKeysByGroup,u,d,f)||V(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function Te(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=ke(s,t);return z(s,e,o),V(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function Ee(e,t,n){let r=new Map,i=[];function o(e,t,i,a){V(n,e,t,a);let o=r.get(e)||new Map;o.set(t,i),r.set(e,o)}for(let{module:t,source:n}of e)for(let e of a(n,c)){let n=Number(e.groupToken);if(e.bindingToken===`auto`){i.push({module:t,name:e.name,group:n});continue}let r=Number(e.bindingToken);B(t.name,n,r,e.name),o(n,r,H(n,t.name,e.name),`module "${t.name}" binding "${e.name}"`)}for(let{module:e,name:n,group:r}of i){let i=H(r,e.name,n),a=t?.get(i);a!==void 0&&o(r,a,i,`registered module binding "${i}"`)}return r}function De(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return i.delete(n),!0}function z(e,t,n){if(e===0&&t>=100)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function B(e,t,n,r){if(t===0&&n<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function V(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function Oe(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?100:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function ke(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function Ae(t){let n=e(t,c);if(!n)return;let r=Me(t,n.index);throw r?Error(`Unresolved @binding(auto) for module "${r}" binding "${n.name}" remained in assembled WGSL source.`):Ne(t,n.index)?Error(`Unresolved @binding(auto) for application binding "${n.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${Pe(n.match)}".`)}function je(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function H(e,t,n){return`${e}:${t}:${n}`}function Me(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function Ne(e,t){let n=e.indexOf(te);return n>=0?t>n:!0}function Pe(e){return e.replace(/\s+/g,` `).trim()}var Fe=class e extends b{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=[...this._injectionTargets,...t.injectionTargets||[]],i=this._transpileShader(t,n,t.source,t.shaderStage??(t.computeEntryPoint?`compute`:void 0)),a={vertex:i.entryPoints?.vertex??t.vertexEntryPoint,fragment:i.entryPoints?.fragment??t.fragmentEntryPoint,compute:i.entryPoints?.compute??t.computeEntryPoint},o=e.getShaderPreprocessorDefines(t,n),s=t.platformInfo.shaderLanguage===`wgsl`&&i.code?R(i.code,{defines:o}):i.code,{source:c,getUniforms:l,bindingAssignments:u}=he({...t,source:s,vertexEntryPoint:a.vertex,fragmentEntryPoint:a.fragment,defines:o,_bindingRegistry:this._wgslBindingRegistry,modules:i.modules,injectionTargets:r}),d=t.platformInfo.shaderLanguage===`wgsl`?R(c,{defines:o}):c;return{source:d,entryPoints:a,getUniforms:l,modules:n,bindingAssignments:u,bindingTable:j(d,u),shaderLayout:k(d,{vertexEntryPoint:a.vertex,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}},U=class e{static async createAsync(t,n){let r=!y.getAsyncCompilation(t),i=r?y.beginAsyncCompilation(t):y.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&y.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if(e.type!==`webgpu`)throw Error(`Kernel is only supported in WebGPU`);let{source:n,pipelineFactory:r,shaderFactory:i,debugShaders:a,...o}=t;this.device=e,this.id=t.id??`kernel`,this.source=n,this.pipelineFactory=r??y.getDefaultPipelineFactory(e),this.shaderFactory=i??m.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:`compute`,source:this.source,debugShaders:a});let s={...o,shader:this.shader},c=y.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(s);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(s)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}},Ie=65535;function W(e,t){let n=Re(t),r=Math.max(1,Math.ceil(e)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`WebGPU dispatch requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function Le(e,t=`workgroupId`){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function G(e,t,n=`workgroupId`,r=`localId`){return`(${Le(e,n)} * ${t}u + ${r}.x)`}function Re(e){return Number.isFinite(e)&&e>0?Math.floor(e):Ie}function K(e,t){switch(e){case`u32`:return`${t}u`;case`f32`:return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function ze(e,t){switch(e){case`uint32`:return K(`u32`,Math.trunc(t));case`sint32`:return`${Math.trunc(t)}`;case`float32`:return K(`f32`,t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function q(e){switch(e){case`uint32`:return`0u`;case`sint32`:return`0`;case`float32`:return`0.0`;default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function J(e){switch(e){case`uint32`:return`u32`;case`sint32`:return`i32`;case`float32`:return`f32`;default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}var Y=64,Be=`GPGPU Operation Counts`,Ve=`Computation Runs`,He=new Fe;function X(e){return!e.isConstant||!e.value}function Z({scope:e,module:t,elementWise:n=!1,expression:r,inputs:i,output:a,operationType:o=a.type,outputBuffer:s}){if(!t.source)throw Error(`WebGPU kernel ${t.name} requires WGSL source`);let c=Je(i),l=c.map(([e,t])=>({name:e,input:t})),u=l.filter(({input:e})=>X(e)).map((e,t)=>({...e,index:t})),d=J(o),f=J(a.type),p={TYPE:d,RESULT_LEN:a.size.toString()},m=W(Math.ceil(a.length/Y),s.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of c)p[`${e.toUpperCase()}_LEN`]=t.size.toString();let h=`
${Xe(t.source,p)}
${u.map(({name:e,input:t,index:n})=>Ue(e,t,n)).join(`
`)}
${l.map(({name:e,input:t})=>We(e,t,o)).join(`
`)}
${Ge(a,u.length)}
${Ke(a)}

@compute @workgroup_size(${Y}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${G(m,Y)};
  if (rowIndex >= ${a.length}u) {
    return;
  }

${l.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join(`
`)}
  var result: array<${f}, ${a.size}>;
${qe(t.name,c,a,n,r)}
  write_result(rowIndex, result);
}
`,g=He.assembleWGSLShader({platformInfo:C(s.device),source:h,modules:t.dependencies,shaderStage:`compute`,scanVertexAttributes:!1}),_=new U(s.device,{source:g.source,shaderLayout:{bindings:[...u.map(({name:e},t)=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:u.length}]}});e&&e.retain(()=>_.destroy());let v=Object.fromEntries(u.map(({name:e,input:t})=>[e,t.buffer]));v.result=s;let y=e?e.commandEncoder.beginComputePass({}):s.device.beginComputePass({});s.device.statsManager.getStats(Be).get(Ve).incrementCount(),_.dispatch(y,{bindings:v,...m}),y.end(),e||(s.device.submit(),_.destroy())}function Ue(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${J(t.type)}>;`}function We(e,t,n){let r=J(n),i=t.type===n?``:r,a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT;return X(t)?`fn read_${e}(rowIndex: u32) -> array<${r}, ${t.size}> {
  var value: array<${r}, ${t.size}>;
  let rowOffset = ${o}u + ${t.isConstant?`0u`:`rowIndex`} * ${a}u;
${Array.from({length:t.size},(t,n)=>i?`  value[${n}] = ${i}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`:`fn read_${e}(_rowIndex: u32) -> array<${r}, ${t.size}> {
  return array<${r}, ${t.size}>(${Ye(t,i)});
}`}function Ge(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${J(e.type)}>;`}function Ke(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${J(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function qe(e,t,n,r,i){let a=``;if(i)for(let e=0;e<n.size;e++)a+=`  result[${e}] = ${i(e)};\n`;else if(r){let r=q(n.type),i=J(n.type);for(let o=0;o<n.size;o++){let n=t.map(([e,t])=>o<t.size?J(t.type)===i?`${e}[${o}]`:`${i}(${e}[${o}])`:r);a+=`  result[${o}] = ${e}(${n.join(`, `)});\n`}}else a+=`result = ${e}(${t.map(([e])=>e).join(`, `)});`;return a.trimEnd()}function Je(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function Ye(e,t){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>K(t,n[r]??0)).join(`, `)}function Xe(e,t){for(let n in t)e=e.replaceAll(`{${n}}`,t[n]);return e}var Ze=`fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x + y;
}

fn arithmetic_subtract(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x - y;
}

fn arithmetic_multiply(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x * y;
}

fn arithmetic_divide(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x / y;
}

fn arithmetic_tan(x: f32) -> f32 {
  return tan_fp32(x);
}
`,Qe=({inputs:e,output:t,target:n,scope:r})=>{let i=t.type,a=J(i),o=q(i),s=e.namedInputs;return Z({scope:r,module:{name:`arithmetic`,source:Ze,dependencies:[S]},inputs:s,output:t,operationType:i,outputBuffer:n,expression:t=>D(e.expression,{operations:T,inputs:s,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>s[e].size===1?`${e}[0]`:o,formatLiteral:e=>`${a}(${ze(i,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}};Qe.supportsEvaluationScope=!0;var $e=64,et=`GPGPU Operation Counts`,tt=`Computation Runs`,nt=async({inputs:e,output:t,target:n})=>{let r=Math.ceil(t.byteLength/4),i=new U(n.device,{source:rt(e,t.length),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}}),a={source:e.source.buffer,result:n};if(r>0){let e=n.device.beginComputePass({});n.device.statsManager.getStats(et).get(tt).incrementCount(),i.dispatch(e,{bindings:a,x:Math.ceil(r/$e)}),e.end(),n.device.submit()}return i.destroy(),{success:!0}};function rt(e,t){let n=w(e.inputFormat),r=w(e.outputFormat),i=n.components,a=t*i,o=r.elementByteLength/r.components,s=4/o;return`\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  return (word >> ((byteIndex % 4u) * 8u)) & 0xffu;
}

fn readUint16(byteIndex: u32) -> u32 {
  return readByte(byteIndex) | (readByte(byteIndex + 1u) << 8u);
}

fn readSourceValue(scalarIndex: u32) -> f32 {
  let rowIndex = scalarIndex / ${i}u;
  let componentIndex = scalarIndex % ${i}u;
  let byteIndex = ${e.source.offset}u + rowIndex * ${e.source.stride}u +
    componentIndex * ${n.elementByteLength/i}u;
  ${it(n.signedDataType,n.normalized)}
}

${at(e.outputFormat)}

@compute @workgroup_size(${$e}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let wordIndex = id.x;
  let firstScalarIndex = wordIndex * ${s}u;
  if (firstScalarIndex >= ${a}u) {
    return;
  }
  ${ot(r.signedDataType,o,a)}
}
`}function it(e,t){switch(e){case`float32`:return`return bitcast<f32>(source[byteIndex / 4u]);`;case`float16`:return`let values = unpack2x16float(source[byteIndex / 4u]);
  return select(values.x, values.y, byteIndex % 4u == 2u);`;case`uint8`:return t?`return f32(readByte(byteIndex)) / 255.0;`:`return f32(readByte(byteIndex));`;case`sint8`:return t?`return max(f32(i32(readByte(byteIndex) << 24u) >> 24) / 127.0, -1.0);`:`return f32(i32(readByte(byteIndex) << 24u) >> 24);`;case`uint16`:return t?`return f32(readUint16(byteIndex)) / 65535.0;`:`return f32(readUint16(byteIndex));`;case`sint16`:return t?`return max(f32(i32(readUint16(byteIndex) << 16u) >> 16) / 32767.0, -1.0);`:`return f32(i32(readUint16(byteIndex) << 16u) >> 16);`;case`uint32`:return t?`return f32(source[byteIndex / 4u]) / 4294967295.0;`:`return f32(source[byteIndex / 4u]);`;case`sint32`:return t?`return max(f32(bitcast<i32>(source[byteIndex / 4u])) / 2147483647.0, -1.0);`:`return f32(bitcast<i32>(source[byteIndex / 4u]));`;default:throw Error(`castData WebGPU input does not support ${e}`)}}function at(e){let{signedDataType:t,normalized:n}=w(e);if(t===`float32`||t===`float16`)return`fn encodeValue(value: f32) -> f32 { return value; }`;let r=st(t),i=t.startsWith(`sint`)?-r:0;return`fn encodeValue(value: f32) -> f32 { return ${n?`round(clamp(value, ${i<0?`-1.0`:`0.0`}, 1.0) * ${r}.0)`:`round(clamp(value, ${i}.0, ${r}.0))`}; }`}function ot(e,t,n){if(t===4){let t=`encodeValue(readSourceValue(firstScalarIndex))`;return e===`float32`?`result[wordIndex] = bitcast<u32>(${t});`:e===`sint32`?`result[wordIndex] = bitcast<u32>(i32(${t}));`:`result[wordIndex] = u32(${t});`}if(t===2&&e===`float16`)return`let second = select(0.0, readSourceValue(firstScalarIndex + 1u), firstScalarIndex + 1u < ${n}u);
  result[wordIndex] = pack2x16float(vec2<f32>(
    encodeValue(readSourceValue(firstScalarIndex)),
    encodeValue(second)
  ));`;let r=4/t,i=t*8,a=i===8?`0xffu`:`0xffffu`;return`result[wordIndex] = ${Array.from({length:r},(t,r)=>{let o=`firstScalarIndex + ${r}u`;return`(select(0u, (${e.startsWith(`sint`)?`bitcast<u32>(i32(encodeValue(readSourceValue(${o}))))`:`u32(encodeValue(readSourceValue(${o})))`}) & ${a}, ${o} < ${n}u) << ${r*i}u)`}).join(` |
    `)};`}function st(e){switch(e){case`sint8`:return 127;case`uint8`:return 255;case`sint16`:return 32767;case`uint16`:return 65535;case`sint32`:return 2147483647;case`uint32`:return 4294967295;default:throw Error(`castData WebGPU output does not support ${e}`)}}var ct=64,lt=`GPGPU Operation Counts`,ut=`Computation Runs`,dt=async({inputs:e,output:t,target:n})=>{let{source:r,inputFormat:i}=e,a=new U(n.device,{source:ft(i,r.offset,r.stride,t.length),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}}),o={source:r.buffer,result:n},s=n.device.beginComputePass({});return n.device.statsManager.getStats(lt).get(ut).incrementCount(),a.dispatch(s,{bindings:o,x:Math.ceil(t.length/ct)}),s.end(),n.device.submit(),a.destroy(),{success:!0}};function ft(e,t,n,r){return`\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

// Treat the storage binding as raw 32-bit words so one shader can address packed Uint8, Float16,
// and Float32 rows with arbitrary supported strides. The float readers decode IEEE bit patterns;
// they do not numerically convert integer values to floats.

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  let shift = (byteIndex % 4u) * 8u;
  return (word >> shift) & 0xffu;
}

fn readUint8(byteIndex: u32) -> f32 {
  return f32(readByte(byteIndex)) / 255.0;
}

fn readFloat16Bits(byteIndex: u32) -> f32 {
  let word = source[byteIndex / 4u];
  let values = unpack2x16float(word);
  return select(values.x, values.y, byteIndex % 4u == 2u);
}

fn readFloat32Bits(byteIndex: u32) -> f32 {
  return bitcast<f32>(source[byteIndex / 4u]);
}

fn readColor(rowIndex: u32) -> vec4<f32> {
  let rowByteOffset = ${t}u + rowIndex * ${n}u;
${pt(e)}
}

@compute @workgroup_size(${ct}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${r}u) {
    return;
  }

  result[rowIndex] = pack4x8unorm(readColor(rowIndex));
}
`}function pt(e){switch(e){case`uint8x3`:return`  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    1.0
  );`;case`uint8x4`:return`  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    readUint8(rowByteOffset + 3u)
  );`;case`float16x3`:return`  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    1.0
  );`;case`float16x4`:return`  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    readFloat16Bits(rowByteOffset + 6u)
  );`;case`float32x3`:return`  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    1.0
  );`;case`float32x4`:return`  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    readFloat32Bits(rowByteOffset + 12u)
  );`;default:{let t=e;throw Error(`Unsupported color input format ${t}`)}}}var mt=`fn row_dot(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(y[i]);
  }
  return array<f32, 1>(sum);
}
`,ht=({inputs:e,output:t,target:n,scope:r})=>(Z({scope:r,module:{name:`row_dot`,source:mt},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0});ht.supportsEvaluationScope=!0;var gt=`fn equalAll(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<u32, 1> {
  var allEqual = 1u;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    if (x[i] != y[i]) {
      allEqual = 0u;
      break;
    }
  }
  return array<u32, 1>(allEqual);
}
`,_t=({inputs:e,output:t,target:n,scope:r})=>(Z({scope:r,module:{name:`equalAll`,source:gt},inputs:e,output:t,operationType:e.x.type,outputBuffer:n}),{success:!0});_t.supportsEvaluationScope=!0;function Q(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${J(t.type)}>;`}function vt(e,t,n,r=e){let i=J(n);if(t.isConstant){let e=t.value;if(!e)throw Error(`Constant input ${t} is missing CPU values`);return`fn read_${r}(_sourceIndex: u32) -> array<${i}, ${t.size}> {
  return array<${i}, ${t.size}>(${Array.from({length:t.size},(t,n)=>K(i,e[n]??0)).join(`, `)});
}`}let a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT,s=J(t.type)===i?``:`${i}`;return`fn read_${r}(sourceIndex: u32) -> array<${i}, ${t.size}> {
  var value: array<${i}, ${t.size}>;
  let rowOffset = ${o}u + sourceIndex * ${a}u;
${Array.from({length:t.size},(t,n)=>s?`  value[${n}] = ${s}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`}function yt(e,t){return vt(`sourceValues`,e,t,`source_values`)}function $(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${J(e.type)}>;`}function bt(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${J(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function xt(e,t){let n=q(e);return`fn zero_result() -> array<${J(e)}, ${t}> {
  var result: array<${J(e)}, ${t}>;
${Array.from({length:t},(e,t)=>`  result[${t}] = ${n};`).join(`
`)}
  return result;
}`}var St=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(r.length===0){let e=new t.ValueType(t.length*t.size);return n.write(e),{success:!0,value:e}}if(r.isConstant){let e=r.value;if(!e)throw Error(`Constant input ${r} is missing CPU values`);let i=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let t=e[n];i[n*2]=t,i[n*2+1]=t}return n.write(i),{success:!0,value:i}}let i=[],a=r,o=`raw`,s=r.length;try{for(;;){let e=Math.ceil(s/64),r=t.length*e,c=e===1?n:x.createOrReuse(n.device,r*t.stride);if(e>1&&i.push(c),Ct({input:a,inputMode:o,inputGroupCount:s,channelCount:t.length,outputType:t.type,outputBuffer:c,outputLength:r,outputStride:t.stride,outputOffset:t.offset}),e===1)break;a=new E({buffer:c,type:t.type,size:2,length:r}),o=`partial`,s=e}return{success:!0}}finally{for(let e of i)x.recycle(e)}};function Ct({input:e,inputMode:t,inputGroupCount:n,channelCount:r,outputType:i,outputBuffer:a,outputLength:o,outputStride:s,outputOffset:c}){let l=J(i),u=W(o,a.device.limits.maxComputeWorkgroupsPerDimension),d=new E({buffer:a,type:i,size:2,length:o,stride:s,offset:c}),f=`
${e.isConstant?``:Q(`sourceValues`,e,0)}
${yt(e,i)}
${$(d,e.isConstant?0:1)}
${bt(d)}
${wt(t,i,r,n)}

var<workgroup> sharedMin: array<${l}, 64>;
var<workgroup> sharedMax: array<${l}, 64>;

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let outputRowIndex = ${Le(u)};
  if (outputRowIndex >= ${o}u) {
    return;
  }

  let channelIndex = outputRowIndex % ${r}u;
  let outputGroupIndex = outputRowIndex / ${r}u;
  let inputGroupIndex = outputGroupIndex * 64u + localId.x;

  let result = extent_pass(channelIndex, inputGroupIndex);
  sharedMin[localId.x] = result[0];
  sharedMax[localId.x] = result[1];
  workgroupBarrier();

  var stride = 32u;
  loop {
    if (stride == 0u) {
      break;
    }
    if (localId.x < stride) {
      let compareIndex = localId.x + stride;
      if (sharedMin[compareIndex] < sharedMin[localId.x]) {
        sharedMin[localId.x] = sharedMin[compareIndex];
      }
      if (sharedMax[compareIndex] > sharedMax[localId.x]) {
        sharedMax[localId.x] = sharedMax[compareIndex];
      }
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  if (localId.x == 0u) {
    write_result(outputRowIndex, array<${l}, 2>(sharedMin[0], sharedMax[0]));
  }
}
`,p=new U(a.device,{source:f,shaderLayout:{bindings:[...e.isConstant?[]:[{name:`sourceValues`,type:`storage`,group:0,location:0}],{name:`result`,type:`storage`,group:0,location:e.isConstant?0:1}]}}),m={result:a};e.isConstant||(m.sourceValues=e.buffer);let h=m,g=a.device.beginComputePass({});p.dispatch(g,{bindings:h,x:u.x,y:u.y,z:u.z}),g.end(),a.device.submit(),p.destroy()}function wt(e,t,n,r){let i=J(t),[a,o]=Tt(t);return e===`raw`?`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${o};

  if (inputGroupIndex < ${r}u) {
    let value = read_source_values(inputGroupIndex);
    result[0] = value[channelIndex];
    result[1] = value[channelIndex];
  }

  return result;
}`:`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${o};

  if (inputGroupIndex < ${r}u) {
    let rowIndex = inputGroupIndex * ${n}u + channelIndex;
    let value = read_source_values(rowIndex);
    result[0] = value[0];
    result[1] = value[1];
  }

  return result;
}`}function Tt(e){switch(e){case`uint32`:return[`0xffffffffu`,`0u`];case`sint32`:return[`2147483647`,`-2147483648`];case`float32`:return[`3.402823e38`,`-3.402823e38`];default:throw Error(`Unsupported WebGPU extent type for ${e}`)}}function Et(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var Dt=`\
const LE: bool = ${Et()?`true`:`false`};
const F32_NAN: u32 = 0xffffffffu;
const F32_INF: u32 = 0x7f800000u;

fn roundShiftRight(value: u32, shift: i32) -> u32 {
  if (shift <= 0) {
    return value << u32(-shift);
  }

  if (shift >= 32) {
    if (shift == 32 && value > 0x80000000u) {
      return 1u;
    }
    return 0u;
  }

  let shiftU32 = u32(shift);
  let truncated = value >> shiftU32;
  let halfShift = 1u << u32(shift - 1);
  let remainder = value & ((1u << shiftU32) - 1u);
  if (remainder > halfShift || (remainder == halfShift && (truncated & 1u) == 1u)) {
    return truncated + 1u;
  }
  return truncated;
}

fn makeFloatImmediate(sign: u32, exponent: i32, mantissa: u32) -> u32 {
  return (sign << 31u) | (u32(exponent + 127) << 23u) | (mantissa & 0x7fffffu);
}

fn makeFloat(sign: u32, exponent: i32, significand: u32) -> u32 {
  if (significand == 0u) {
    return sign << 31u;
  }

  let leadingZeros = i32(countLeadingZeros(significand));
  var normalizedExponent = exponent + 31 - leadingZeros;

  if (normalizedExponent > 127) {
    return (sign << 31u) | F32_INF;
  }

  var mantissa: u32;
  if (normalizedExponent >= -126) {
    mantissa = roundShiftRight(significand, 8 - leadingZeros);
    if (mantissa >= 0x1000000u) {
      mantissa = mantissa >> 1u;
      normalizedExponent += 1;
      if (normalizedExponent > 127) {
        return (sign << 31u) | F32_INF;
      }
    }
    return makeFloatImmediate(sign, normalizedExponent, mantissa);
  }

  let subnormalShift = -149 - exponent;
  mantissa = roundShiftRight(significand, subnormalShift);
  if (mantissa >= 0x800000u) {
    return (sign << 31u) | (1u << 23u);
  }
  return (sign << 31u) | mantissa;
}

fn parseAsDouble(words: vec2<u32>) -> vec2<u32> {
  var d = words;
  if (LE) {
    d = d.yx;
  }

  let sign = (d.x >> 31u) & 1u;
  let exponentBits = (d.x >> 20u) & 0x7ffu;
  let exponent = i32(exponentBits) - 1023;
  let fractionHigh = d.x & 0xfffffu;
  let fractionLow = d.y;

  if (exponentBits == 0x7ffu) {
    if (fractionHigh == 0u && fractionLow == 0u) {
      return vec2<u32>((sign << 31u) | F32_INF, F32_NAN);
    }
    return vec2<u32>(F32_NAN);
  }

  if (exponentBits == 0u) {
    return vec2<u32>(sign << 31u);
  }

  if (exponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highSignificand = 0x800000u | (fractionHigh << 3u) | (fractionLow >> 29u);
  let lowSignificand = fractionLow & 0x1fffffffu;

  if (exponent < -126) {
    let highPart = makeFloat(sign, exponent - 23, highSignificand);
    let lowPart = makeFloat(sign, exponent - 52, lowSignificand);
    return vec2<u32>(highPart, lowPart);
  }

  let roundUp = lowSignificand > 0x10000000u ||
    (lowSignificand == 0x10000000u && (highSignificand & 1u) == 1u);

  var roundedSignificand = highSignificand + select(0u, 1u, roundUp);
  var highExponent = exponent;
  if (roundedSignificand == 0x1000000u) {
    roundedSignificand = 0x800000u;
    highExponent += 1;
  }

  if (highExponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highPart = makeFloatImmediate(sign, highExponent, roundedSignificand);

  var remainder = i32(lowSignificand);
  var lowSign = sign;
  if (roundUp) {
    remainder -= 0x20000000;
  }
  if (remainder < 0) {
    lowSign = 1u - sign;
    remainder = -remainder;
  }

  let lowPart = makeFloat(lowSign, exponent - 52, u32(remainder));
  return vec2<u32>(highPart, lowPart);
}

fn fround(x: array<u32, {X_LEN}>) -> array<f32, {RESULT_LEN}> {
  var result: array<f32, {RESULT_LEN}>;
  let n = {X_LEN}u / 2u;
  for (var i = 0u; i < n; i = i + 1u) {
    let parts = parseAsDouble(vec2<u32>(x[i * 2u], x[i * 2u + 1u]));
    result[i] = bitcast<f32>(parts.x);
    result[i + n] = bitcast<f32>(parts.y);
  }
  return result;
}
`,Ot=({inputs:e,output:t,target:n,scope:r})=>(Z({scope:r,module:{name:`fround`,source:Dt},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0});Ot.supportsEvaluationScope=!0;var kt=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=J(r.type),o=[];r.isConstant||o.push({name:`ids`,input:r,index:o.length}),i.isConstant||o.push({name:`sourceValues`,input:i,index:o.length});let s=W(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),c=`
${o.map(({name:e,input:t,index:n})=>Q(e,t,n)).join(`
`)}
${At(r,a)}
${yt(i,t.type)}
${$(t,o.length)}
${bt(t)}
${xt(t.type,t.size)}
${jt(r.type,t.type,t.size,i.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${G(s,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let idsValue = read_ids(rowIndex);
  let result = gather(idsValue);
  write_result(rowIndex, result);
}
`,l=new U(n.device,{source:c,shaderLayout:{bindings:[...o.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:o.length}]}}),u={};r.isConstant||(u.ids=r.buffer),i.isConstant||(u.sourceValues=i.buffer),u.result=n;let d=u,f=n.device.beginComputePass({});return l.dispatch(f,{bindings:d,x:s.x,y:s.y,z:s.z}),f.end(),n.device.submit(),l.destroy(),{success:!0}};function At(e,t){if(e.isConstant){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return`fn read_ids(_rowIndex: u32) -> ${t} {
  return ${K(t,n[0]??0)};
}`}let n=e.stride/e.ValueType.BYTES_PER_ELEMENT;return`fn read_ids(rowIndex: u32) -> ${t} {
  let rowOffset = ${e.offset/e.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${n}u;
  return ids[rowOffset];
}`}function jt(e,t,n,r){let i=J(e);return`fn gather(idsValue: ${i}) -> array<${J(t)}, ${n}> {
  let sourceIndex = ${i===`u32`?`i32(idsValue)`:i===`i32`?`idsValue`:`i32(idsValue)`};
  if (sourceIndex < 0 || sourceIndex >= ${r}) {
    return zero_result();
  }
  return read_source_values(u32(sourceIndex));
}`}var Mt=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=r.isConstant?[]:[{name:`segments`,input:r,index:0}],a=W(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),o=`
${i.map(({name:e,input:t,index:n})=>Q(e,t,n)).join(`
`)}
${vt(`segments`,r,`uint32`)}
${$(t,i.length)}
${bt(t)}
${Nt(r.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${G(a,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let result = segmented_map(rowIndex);
  write_result(rowIndex, result);
}
`,s=new U(n.device,{source:o,shaderLayout:{bindings:[...i.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:i.length}]}}),c=Object.fromEntries(i.map(({name:e,input:t})=>[e,t.buffer]));c.result=n;let l=c,u=n.device.beginComputePass({});return s.dispatch(u,{bindings:l,x:a.x,y:a.y,z:a.z}),u.end(),n.device.submit(),s.destroy(),{success:!0}};function Nt(e){return`fn segmented_map(vertexIndex: u32) -> array<u32, 2> {
  var low = 0i;
  var high = ${e}i;
  while (low < high) {
    let mid = low + (high - low) / 2i;
    let midStart = read_segments(u32(mid))[0];
    if (midStart <= vertexIndex) {
      low = mid + 1i;
    } else {
      high = mid;
    }
  }

  let segmentIndex = u32(max(low - 1i, 0i));
  let segmentStart = read_segments(segmentIndex)[0];
  return array<u32, 2>(segmentIndex, vertexIndex - segmentStart);
}`}var Pt=({inputs:e,output:t,target:n,scope:r})=>{let i=e.map((e,t)=>[`x${t}`,e]);Ft(n.device.limits,i);let a=i.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(`, `),o=0;return Z({scope:r,module:{name:`interleave`,source:`\
fn interleave(${a}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${i.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  out[${o+n}] = ${e}[${n}];`).join(`
`);return o+=t.size,n}).join(`
`)}
  return out;
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function Ft(e,t){let n=t.filter(([,e])=>X(e)).length+1;if(n>e.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${n} storage buffers, exceeding device limit ${e.maxStorageBuffersPerShaderStage}`);if(n>e.maxBindingsPerBindGroup)throw Error(`interleave() requires ${n} bindings, exceeding bind group limit ${e.maxBindingsPerBindGroup}`)}Pt.supportsEvaluationScope=!0;var It=`fn row_length(x: array<{TYPE}, {X_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(x[i]);
  }
  return array<f32, 1>(sqrt(sum));
}
`,Lt=({inputs:e,output:t,target:n,scope:r})=>(Z({scope:r,module:{name:`row_length`,source:It},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0});Lt.supportsEvaluationScope=!0;var Rt=async({inputs:e,output:t,target:n,scope:r})=>{let i=q(t.type);return Z({scope:r,module:{name:`select`,source:`// inline expression select
`},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>{let n=zt(`condition`,e.condition,t,i),r=zt(`whenTrue`,e.whenTrue,t,i);return`select(${zt(`whenFalse`,e.whenFalse,t,i)}, ${r}, ${n} != ${i})`}}),{success:!0}};function zt(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}Rt.supportsEvaluationScope=!0;var Bt=64,Vt=({inputs:e,output:t,target:n})=>{let r=W(Math.ceil(t.length/Bt),n.device.limits.maxComputeWorkgroupsPerDimension),i=`\
@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${Bt}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${G(r,Bt)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let rowOffset = ${t.offset/t.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${t.stride/t.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${e.start} + i32(rowIndex) * ${e.step};
}
`,a=new U(n.device,{source:i,shaderLayout:{bindings:[{name:`result`,type:`storage`,group:0,location:0}]}}),o={result:n},s=n.device.beginComputePass({});return a.dispatch(s,{bindings:o,x:r.x,y:r.y,z:r.z}),s.end(),n.device.submit(),a.destroy(),{success:!0}},Ht=({inputs:e,output:t,target:n,scope:r})=>{let{columns:i}=e;return Z({scope:r,module:{name:`swizzle`,source:`// swizzle expression handled inline`},expression:e=>`x[${i[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};Ht.supportsEvaluationScope=!0;export{Pt as a,Ot as c,ht as d,dt as f,Fe as g,U as h,Lt as i,St as l,Qe as m,Vt as n,Mt as o,nt as p,Rt as r,kt as s,Ht as t,_t as u};