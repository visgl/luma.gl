import{S as e,_ as t,a as n,b as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,m as d,n as f,o as p,p as m,r as h,s as g,t as _,u as v,v as y,x as b,y as x}from"./style-HDdtRPt7.js";import{T as S,_ as C,b as w,g as T,h as E,n as D,s as O,v as k}from"./compute-pipeline-gk6qmn_l.js";import{S as A,_ as j,a as M,b as ee,c as N,d as P,g as te,h as F,i as I,l as L,m as ne,n as R,o as re,p as ie,r as ae,s as oe,t as se,u as ce,v as le,x as ue,y as de}from"./wgsl-interface-scan-BM9APOj9.js";function fe(e,t={}){let n={...e},r=t.layout??`std140`,i={},a=0;for(let[e,t]of Object.entries(n))a=he(i,e,t,a,r);return a=C(a,z(n,r)),{layout:r,byteLength:a*4,uniformTypes:n,fields:i}}function pe(e,t){let n=ue(e),r=ee(n),i=/^mat(\d)x(\d)<.+>$/.exec(n);if(i){let e=Number(i[1]),a=Number(i[2]),o=_e(a,n,r.type,t),s=be(o.size,o.alignment,t);return{alignment:o.alignment,size:e*s,components:e*a,columns:e,rows:a,columnStride:s,shaderType:n,type:r.type}}let a=/^vec(\d)<.+>$/.exec(n);return a?_e(Number(a[1]),n,r.type,t):{alignment:1,size:1,components:1,columns:1,rows:1,columnStride:1,shaderType:n,type:r.type}}function me(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function he(e,t,n,r,i){if(typeof n==`string`){let a=pe(n,i),o=C(r,a.alignment);return e[t]={offset:o,...a},o+a.size}if(Array.isArray(n)){if(Array.isArray(n[0]))throw Error(`Nested arrays are not supported for ${t}`);let a=n[0],o=n[1],s=ve(a,i),c=C(r,z(n,i));for(let n=0;n<o;n++)he(e,`${t}[${n}]`,a,c+n*s,i);return c+s*o}if(me(n)){let a=z(n,i),o=C(r,a);for(let[r,a]of Object.entries(n))o=he(e,`${t}.${r}`,a,o,i);return C(o,a)}throw Error(`Unsupported CompositeShaderType for ${t}`)}function ge(e,t){if(typeof e==`string`)return pe(e,t).size;if(Array.isArray(e)){let n=e[0],r=e[1];if(Array.isArray(n))throw Error(`Nested arrays are not supported`);return ve(n,t)*r}let n=0;for(let r of Object.values(e)){let e=r;n=C(n,z(e,t)),n+=ge(e,t)}return C(n,z(e,t))}function z(e,t){if(typeof e==`string`)return pe(e,t).alignment;if(Array.isArray(e)){let n=e[0],r=z(n,t);return xe(t)?Math.max(r,4):r}let n=1;for(let r of Object.values(e)){let e=z(r,t);n=Math.max(n,e)}return Se(t)?Math.max(n,4):n}function _e(e,t,n,r){return{alignment:e===2?2:4,size:e===3?3:e,components:e,columns:1,rows:e,columnStride:e===3?3:e,shaderType:t,type:n}}function ve(e,t){return ye(ge(e,t),z(e,t),t)}function ye(e,t,n){return C(e,xe(n)?4:t)}function be(e,t,n){return n===`std140`?4:C(e,t)}function xe(e){return e===`std140`||e===`wgsl-uniform`}function Se(e){return e===`std140`||e===`wgsl-uniform`}var Ce;function we(e){return(!Ce||Ce.byteLength<e)&&(Ce=new ArrayBuffer(e)),Ce}function Te(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Ee(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:Te(e)}var De=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=we(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let i=n[0],a=n[1];if(Array.isArray(i))throw Error(`Nested arrays are not supported for ${t}`);if(typeof i==`string`&&Ee(r)){this._flattenPackedArray(e,t,i,a,r);return}if(!Array.isArray(r)){S.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,a);n++){let a=r[n];a!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,i,a)}return}if(me(n)&&Oe(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}S.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=pe(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=ke(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){S.warn(`Uniform ${t} not found in layout`)();return}let{type:i,components:a,columns:o,rows:s,offset:c,columnStride:l}=r,u=e[i];if(a===1){u[c]=Number(n);return}let d=n;if(o===1){for(let e=0;e<a;e++)u[c+e]=Number(d[e]??0);return}let f=0;for(let e=0;e<o;e++){let t=c+e*l;for(let e=0;e<s;e++)u[t+e]=Number(d[f++]??0)}}};function Oe(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function ke(e,t,n){return Array.prototype.slice.call(e,t,n)}var Ae=128;function je(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!Ee(r)||!Ee(i)||r.length!==i.length)return!1;let a=Math.min(n,Ae);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function Me(e){return Ee(e)?e.slice():e}var Ne=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return je(this.uniforms[e],t)?!1:(this.uniforms[e]=Me(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},Pe=1024,Fe=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=fe(r.uniformTypes??{},{layout:r.layout??Ie(e)}),a=new De(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new Ne({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,Pe)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let n=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:k.UNIFORM|k.COPY_DST,byteLength:n}),i=this.getUniformBufferData(e);return r.write(i),r}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),n=this.device.createBuffer({usage:k.UNIFORM|k.COPY_DST,byteLength:t});this.uniformBuffers.set(e,n)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&S.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),i=!1;if(r&&n?.needsRedraw){i||=n.needsRedraw;let a=this.getUniformBufferData(e);if(r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,a):r.write(a)),S.level>=4){let t=this.uniformBlocks.get(e)?.getAllUniforms();S.log(4,`Writing to uniform buffer ${String(e)}`,a,t)()}}return i}};function Ie(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function Le(e,t){let n={},r=F(e,t,{warnOnMissingBufferLayout:!0});for(let t of r){let r=Re(e,t);n[t.attributeName]=r}return n}function Re(e,t){let n=ze(e,t.attributeName),r=A.getAttributeShaderTypeInfo(n.type),i=t.vertexFormat,a=E.getVertexFormatInfo(i);return{attributeName:t.attributeName,bufferName:t.bufferName,location:n.location,shaderType:n.type,primitiveType:r.primitiveType,shaderComponents:r.components,vertexFormat:i,bufferDataType:a.type,bufferComponents:a.components,normalized:a.normalized,integer:r.integer,stepMode:t.stepMode,byteOffset:t.byteOffset,byteStride:t.byteStride}}function ze(e,t){let n=e.attributes.find(e=>e.name===t);return n||S.warn(`shader layout attribute "${t}" not present in shader`)(),n||null}function B(e,t){if(!e){let e=Error(t||`shaders: assertion failed.`);throw Error.captureStackTrace?.(e,B),e}}var Be={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function Ve(e){let t={};for(let[n,r]of Object.entries(e))t[n]=He(r);return t}function He(e){let t=Ue(e);if(t!==`object`)return{value:e,...Be[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=Ue(e.value),{...e,...Be[t],type:t}):{...e,...Be[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function Ue(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}function We(e){e.map(e=>Ge(e))}function Ge(e){if(e.instance)return;We(e.dependencies||[]);let{propTypes:t={},deprecations:n=[]}=e,r={parsedDeprecations:qe(n),normalizedInjections:{vertex:{},fragment:{}}};t&&(r.propValidators=Ve(t)),e.instance=r;let i={};t&&(i=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...i}}function Ke(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function qe(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function V(e){let t=new Set,n=new Set,r=[],i=new Map;function a(e){let t=i.get(e.name);if(t&&t!==e)throw Error(`Shader module name collision: Multiple different module objects share the name "${e.name}". Each module object must have a unique name.`);i.set(e.name,e)}function o(e,i){if(n.has(e)){let t=[...i,e.name].join(` -> `);throw Error(`Shader module dependency cycle detected: ${t}`)}if(t.has(e))return;a(e),n.add(e);let s=[...i,e.name];if(e.dependencies)for(let t of e.dependencies)o(t,s);n.delete(e),t.add(e),r.push(e)}for(let t of e)o(t,[]);let s=new Set;for(let e of r)e.implements!==void 0&&(B(!s.has(e.implements)),s.add(e.implements));return We(r),r}var Je=class{_shaderTranspilers=new Map;_injectionTargets=[];_defaultModules=[];addShaderTranspiler(e){this._shaderTranspilers.set(e.sourceLanguage,e)}removeShaderTranspiler(e){this._shaderTranspilers.delete(e)}_transpileShader(e,t,n,r){let i=e.sourceLanguage||this.shaderLanguage;if(i===this.shaderLanguage)return B(!V(t).some(e=>e.sourceLanguage&&e.sourceLanguage!==this.shaderLanguage)),{code:n||``,modules:t};let a=this._shaderTranspilers.get(i);B(a);let o=V(t);B(!o.some(e=>e.sourceLanguage&&e.sourceLanguage!==i&&e.sourceLanguage!==this.shaderLanguage));let s=o.filter(e=>e.sourceLanguage===i).map(e=>e.source||``).join(`
`),c={vertex:e.vertexEntryPoint,fragment:e.fragmentEntryPoint,compute:e.computeEntryPoint},l=n==null?{code:``}:a.transpile({source:[s,n].filter(Boolean).join(`
`),target:this.shaderLanguage,stage:r,entryPoints:c,platformInfo:e.platformInfo}),u=o.map(e=>({...e,dependencies:void 0,...e.sourceLanguage===i?{source:void 0,vs:void 0,fs:void 0}:{}}));return{...l,modules:u}}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderInjectionTarget(e){this._injectionTargets.push(e)}resetShaderInjectionTargets(){this._injectionTargets.length=0}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,We(t),t}},Ye=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${ae}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${ae}\\s*:\\s*([^;]+);`,`g`)];function Xe(e,t=[]){let n=L(e),r=new Map;for(let e of t)r.set(Qe(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of Ye){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===Ye[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(Qe(l,s,o));i.push(Ze({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function Ze(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:tt(e.resourceType),viewDimension:$e(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:$e(e.resourceType),sampleType:et(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function Qe(e,t,n){return`${t}:${n}:${e}`}function $e(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function et(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function tt(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}function nt(e,t=``){let n=new Map,r=Object.values(e).flatMap(e=>Object.entries(e).map(([e,t])=>`${e.slice(3)}\n${t.signature}\n${t.header||``}\n${t.footer||``}`)),i=new Set(L(`${t}\n${r.join(`
`)}`).match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let t of Object.keys(e.vertex)){let r=t.slice(3);e.fragment[`fs:${r}`]&&n.set(r,{vertex:it(`_luma_vertex_target_${r}`,i),fragment:it(`_luma_fragment_target_${r}`,i)})}return n}function rt(e,t,n=nt(t)){if(!n.size)return e;let r=L(e),i=new Map,a=/((?:@\w+(?:\([^)]*\))?\s*)*)\bfn\s+([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu;for(let e=a.exec(r);e;e=a.exec(r)){let t=r.indexOf(`{`,a.lastIndex),n=t+1,o=1;for(;n<r.length&&o;n++)r[n]===`{`&&o++,r[n]===`}`&&o--;B(t>=0&&o===0);let s=e[2],c=e.index+e[0].lastIndexOf(s),l=Array.from(r.slice(t+1,n-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu),e=>e[1]);i.set(s,{name:s,start:e.index,end:n,nameStart:c,bodyStart:t,calls:l,stages:new Set,entryStage:/@vertex\b/.test(e[1])?`vertex`:/@fragment\b/.test(e[1])?`fragment`:void 0}),a.lastIndex=n}function o(e,t){let r=i.get(e);if(!(!r||r.stages.has(t))){r.stages.add(t);for(let e of r.calls)o(n.get(e)?.[t]||e,t)}}for(let e of i.values())e.entryStage&&o(e.name,e.entryStage);for(let e of[`vertex`,`fragment`])for(let r of Object.keys(t[e])){let t=r.slice(3);o(n.get(t)?.[e]||t,e)}let s=new Set,c=!0;for(;c;){c=!1;for(let e of i.values())!s.has(e.name)&&e.calls.some(e=>n.has(e)||s.has(e))&&(s.add(e.name),c=!0)}let l=new Map,u=new Set(r.match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let e of s)i.get(e)?.stages.size===2&&l.set(e,{vertex:it(`_luma_vertex_helper_${e}`,u),fragment:it(`_luma_fragment_helper_${e}`,u)});function d(e,t){return n.get(e)?.[t]||l.get(e)?.[t]||e}for(let t of[...i.values()].reverse()){if(!s.has(t.name))continue;if(!t.stages.size)throw Error(`Cannot infer WGSL target stage in ${t.name}`);let n=[],i=t.start;for(let a of t.stages){let o=e.slice(i,t.end),s=[...r.slice(t.bodyStart+1,t.end-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu)];for(let e of s.reverse()){let n=t.bodyStart+1+e.index-i,r=d(e[1],a);o=o.slice(0,n)+r+o.slice(n+e[1].length)}let c=t.nameStart-i;o=o.slice(0,c)+d(t.name,a)+o.slice(c+t.name.length),n.push(o)}e=e.slice(0,i)+n.join(`
`)+e.slice(t.end)}return e}function it(e,t){let n=e,r=0;for(;t.has(n);)n=`${e}_${++r}`;return t.add(n),n}var at={vertex:`#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`,fragment:`#ifdef MODULE_MATERIAL
  fragColor = material_filterColor(fragColor);
#endif

#ifdef MODULE_LIGHTING
  fragColor = lighting_filterColor(fragColor);
#endif

#ifdef MODULE_FOG
  fragColor = fog_filterColor(fragColor);
#endif

#ifdef MODULE_PICKING
  fragColor = picking_filterHighlightColor(fragColor);
  fragColor = picking_filterPickingColor(fragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`},ot=/void\s+main\s*\([^)]*\)\s*\{\n?/,st=/}\n?[^{}]*$/,ct=[],lt=`__LUMA_INJECT_DECLARATIONS__`;function ut(e,t,n){let r={};for(let i of e){let e=i[t];if(e===void 0)continue;if(i.stage!==`vertex`&&i.stage!==`fragment`||i.target.includes(`:`))throw Error(`Shader injection targets require an explicit stage and unqualified target`);let a=`${i.stage===`vertex`?`vs`:`fs`}:${i.target}`;if(!/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][A-Za-z0-9_]*)$/.test(a))throw Error(`Shader injection target "${a}" must be a named shader injection target`);r[a]||=[],r[a].push({injection:e,order:i.order??0,...n?{pluginName:n}:{}})}return r}function dt(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),ct.length=r.length;for(let e=0,t=r.length;e<t;++e)ct[e]=r[e].injection;let s=`${ct.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(lt,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?ft(e,`vertex`,s,`start`,a.vertex):e.replace(ot,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?ft(e,`vertex`,s,`end`,a.vertex):e.replace(st,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(lt,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?ft(e,`fragment`,s,`start`,a.fragment):e.replace(ot,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?ft(e,`fragment`,s,`end`,a.fragment):e.replace(st,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(lt,``),r&&(e=e.replace(/\}\s*$/,e=>e+at[t])),e}function ft(e,t,n,r,i){let a=pt(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function pt(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${mt(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function mt(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var ht=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,gt=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function _t(e){return`${e.name}Uniforms`}function vt(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=_t(e);return Ct(n,t===`wgsl`?`wgsl`:`glsl`,r)}function yt(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=vt(e,t);return r?{moduleName:e.name,uniformBlockName:_t(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:Et(n,r)}:null}function bt(e,t,n={}){let r=yt(e,t);if(!r||r.matches)return r;let i=Dt(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&B(!1,i),r}function xt(e){let t=[],n=Ot(e);for(let e of n.matchAll(gt)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function St(e,t,n,r){let i=xt(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${kt(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function Ct(e,t,n){let r=t===`wgsl`?wt(e,n):Tt(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(ht);r&&i.push(r[1])}return i}function wt(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function Tt(e,t){return xt(e).find(e=>e.blockName===t)?.body||null}function Et(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Dt(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=At(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${jt(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${jt(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function Ot(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function kt(e){return e.replace(/\s+/g,` `).trim()}function At(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function jt(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}var Mt=`\n\n${lt}\n`;function Nt(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function Pt(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function Ft(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:B(!1)}if(!e.name)throw Error(`Shader module must have a name`);bt(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}var H=`([a-zA-Z_][a-zA-Z0-9_]*)`,It=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,Lt=RegExp(`^\\s*\\#\\s*ifdef\\s*${H}\\s*$`),Rt=RegExp(`^\\s*\\#\\s*ifndef\\s*${H}\\s*(?:\\/\\/.*)?$`),zt=/^\s*\#\s*else\s*(?:\/\/.*)?$/,Bt=/^\s*\#\s*endif\s*$/,Vt=RegExp(`^\\s*\\#\\s*ifdef\\s*${H}\\s*(?:\\/\\/.*)?$`),Ht=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function Ut(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(It),o=e.match(Vt)||e.match(Lt),s=e.match(Rt),c=e.match(zt),l=e.match(Ht)||e.match(Bt);if(n){let e=Wt(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=!i.length||i[i.length-1].active):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function Wt(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=`(?:[A-Za-z_][A-Za-z0-9_]*|[+-]?\\d+(?:\\.\\d+)?)`,i=n.match(RegExp(`^(${r})\\s*(==|!=|<=|>=|<|>)\\s*(${r})$`));if(i){let e=e=>/^[A-Za-z_]/.test(e)?Number(t[e]??0):Number(e),n=e(i[1]),r=e(i[3]);switch(i[2]){case`==`:return n===r;case`!=`:return n!==r;case`<=`:return n<=r;case`>=`:return n>=r;case`<`:return n<r;case`>`:return n>r}}let a=n.match(RegExp(`^!\\s*${H}$`));if(a)return!t[a[1]];let o=n.match(RegExp(`^${H}$`));if(o)return!!t[o[1]];let s=n.match(RegExp(`^defined\\s*\\(\\s*${H}\\s*\\)$`));if(s)return t[s[1]]!==void 0;let c=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${H}\\s*\\)$`));if(c)return t[c[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function Gt(e,t){let n=[];for(let[r,i]of Object.entries(t))Jt(e,r),n.push(`in ${qt(i)} ${r};`);return n.join(`
`)}function Kt(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=Yt(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Xt(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||tn(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=nn(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function qt(e){let{primitiveType:t,components:n}=A.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function Jt(e,t){let n=on(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function Yt(e,t){let n=RegExp(`\\bfn\\s+${on(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=rn(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Xt(e,t){let n=Zt(t),r=new Set(Qt(t)),i=$t(t);for(let t of i){let i=en(e,t);if(i!==null){n.push(...Zt(i));for(let e of Qt(i))r.add(e)}}return{locations:n,names:r}}function Zt(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function Qt(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function $t(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function en(e,t){let n=RegExp(`\\bstruct\\s+${on(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=rn(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function tn(e,t){let n=on(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(an(e,i.index)===0)return!0;i=r.exec(e)}return!1}function nn(e){let t=0;for(;e.has(t);)t++;return t}function rn(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function an(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function on(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function sn(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){Dn(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${qt(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Tn(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function cn(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=ln(a,t,`vertex`),s=un(a,o),c=ln(a,n,`fragment`),l=dn(a,c),u=fn(a,s),d=l?fn(a,l.type):null,f=new Set([...Sn(o.parameters),...Sn(u.body),...Sn(c.parameters),...Sn(d?.body||``)]),p=new Set([...xn(u.body),...xn(d?.body||``),...xn(c.parameters)]),m=[],h=[],g=[],_=[],v=[];for(let[e,t]of i){if(f.has(e)||Cn(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=wn(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;if(m.push(`  @location(${n})${r} ${e}: ${t.type},`),g.push(`var<private> ${e}: ${t.type};`),_.push(`${e} = ${En(t.type)};`),l)v.push(`${e} = ${l.name}.${e};`);else{let i=`_luma_${e}`;if(f.has(i))throw Error(`ShaderPlugin varying "${e}" conflicts with a generated fragment parameter`);h.push(`@location(${n})${r} ${i}: ${t.type}`),v.push(`${e} = ${i};`)}}mn(a,s,o.openBrace,o.closeBrace),a=hn(a,s,o,i.map(([e])=>e)),o=ln(a,t,`vertex`),a=gn(a,o,i.map(([e])=>e));let y=(!l||s===l.type?[s]:[s,l.type]).map(e=>fn(a,e).closeBrace).sort((e,t)=>t-e);for(let e of y)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=ln(a,n,`fragment`),h.length){let e=c.parameters,t=L(e).trimEnd();if(t.trim()&&!t.endsWith(`,`)){let n=t.length;e=`${e.slice(0,n)},${e.slice(n)}`}a=a.slice(0,c.openParenthesis+1)+e+`
  `+h.join(`,
  `)+`
`+a.slice(c.closeParenthesis)}return{source:a,declarations:g.join(`
`),vertexInitialization:_.join(`
`),fragmentInitialization:v.join(`
`)}}function ln(e,t,n){let r=RegExp(`\\bfn\\s+${U(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin interStageVariables require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=On(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=On(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function un(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||pn(e,r[1])===null)throw Error(`ShaderPlugin interStageVariables require the WGSL vertex entry point to return a named struct`);return r[1]}function dn(e,t){let n=[];for(let r of bn(L(t.parameters),`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&pn(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length>1)throw Error(`ShaderPlugin interStageVariables require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]||null}function fn(e,t){let n=pn(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function pn(e,t){let n=RegExp(`\\bstruct\\s+${U(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=On(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function mn(e,t,n,r){let i=RegExp(`\\b${U(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function hn(e,t,n,r){let i=RegExp(`\\b${U(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=On(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function gn(e,t,n){let r=_n(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function _n(e,t,n){let r=[],i=t;for(;i<n;)if(i=yn(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=vn(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function vn(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=yn(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function yn(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function bn(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function xn(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function Sn(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Cn(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${U(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(kn(e,r.index)===0)return!0;r=n.exec(e)}return!1}function wn(e){let t=0;for(;e.has(t);)t++;return t}function Tn(e){let{primitiveType:t,components:n}=A.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${qt(e)}(${r})`}function En(e){let{primitiveType:t,components:n}=A.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function Dn(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${U(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function On(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function kn(e,t){let n=0;for(let r=0;r<t;r++){let i=yn(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function U(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function An(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i],o=a.returnType||`void`,s=n===`wgsl`?`fn`:o,c=n===`wgsl`&&o!==`void`?` -> ${o}`:``;if(r+=`${s} ${a.signature}${c} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function jn(e,t=[],n=`glsl`){let r={vertex:{},fragment:{}};for(let t of e){let e=t[n];if(e){let n=t.stage===`vertex`?`vs`:`fs`;r[t.stage][`${n}:${t.name}`]={...e,signature:`${t.name}(${e.parameters})`}}}for(let e of t){let t=jn([e],[],n);for(let e of[`vertex`,`fragment`])for(let[n,i]of Object.entries(t[e])){let t=r[e][n];if(t&&(t.signature!==i.signature||(t.returnType||`void`)!==(i.returnType||`void`)))throw Error(`Conflicting ShaderPlugin injection target ${n}`);r[e][n]=t||i}}return r}function Mn(e,t){return!!(t.startsWith(`vs:`)?e.vertex:e.fragment)[t]}function Nn(e,t,n){let r=n===`vertex`?`vs:`:n===`fragment`?`fs:`:null;for(let n in t)if(!(r&&!n.startsWith(r))&&!Mn(e,n)){let e=[...new Set(t[n].map(e=>e.pluginName).filter(Boolean))];throw Error(`Unknown shader injection target ${n}${e.length?` (plugins: ${e.join(`, `)})`:``}`)}}function Pn(e){let t=V(e.modules||[]),{source:n,bindingAssignments:r}=Fn(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:Nt(t),bindingAssignments:r}}function Fn(e,t){let{source:n,stage:r,modules:i,defines:a={},injectionTargets:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginInterStageVariables:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;B(typeof n==`string`,`shader source must be a string`);let m=Kt(Ut(n,{defines:a}),d,l),h=cn(m.source,d,f,u),g=h.source,_=``,v=jn(o,t.pluginInjectionTargets,`wgsl`),y={},b={},x={};Pt(c,y,b,x),Pt(Array.isArray(s)?ut(s,`wgsl`):{},y,b,x);let S=Array.isArray(s)?{}:s;for(let e in S){let t=typeof S[e]==`string`?{injection:S[e],order:0}:S[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[...b[e]||[],t]:x[e]=[...x[e]||[],t]:y[e]=[...y[e]||[],t]}else x[e]=[...x[e]||[],t]}In(m.declarations,m.initialization,b,x),Ln(h,b,x),Nn(v,y);let C=i.map(e=>({module:e,source:Ut(Ft(e,`wgsl`,p),{defines:a})})),w=Vn(g),T=Bn(w.source),E=Gn(C,t._bindingRegistry,T),D=[],O=C.map(({module:e,source:n})=>{let r=Hn(n,e,{usedBindingsByGroup:T,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:E});return D.push(...r.bindingAssignments),{module:e,source:r.source}});for(let{module:e,source:t}of O)p&&Ke(e,g,p),_+=t;_+=Mt,_=dt(_,r,Rn(b),!1,`wgsl`,{vertex:d,fragment:f});let k=nt(v,[_,w.source,...Object.values(y).flat().map(e=>e.injection),...Object.values(x).flat().map(e=>e.injection)].join(`
`));return _+=zn(v,y,k),_+=Qn(D),_+=w.source,_=dt(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),_=rt(_,v,k),Zn(_),{source:_,bindingAssignments:D}}function In(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function Ln(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function Rn(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function zn(e,t,n=nt(e)){return[`vertex`,`fragment`].map(r=>An(Object.fromEntries(Object.entries(e[r]).map(([e,t])=>{let i=e.slice(3),a=n.get(i)?.[r]||i;return[e,{...t,signature:a+t.signature.slice(i.length)}]})),t,`wgsl`)).join(``)}function Bn(e){let t=new Map;for(let n of oe(e,M)){let e=Number(n.bindingToken),r=Number(n.groupToken);qn(r,e,n.name),W(t,r,e,`application binding "${n.name}"`)}return t}function Vn(e){let t=oe(e,I),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);qn(r,t,e.name),W(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=ce(e,I,e=>Wn(e,n,r));if(N(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function Hn(e,t,n){let r=[],i={sawSupportedBindingDeclaration:oe(e,R).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=ce(e,R,e=>Un(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(N(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function Un(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=$n(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?Yn(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return Jn(n.name,u,s,l),t!==void 0&&Kn(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(W(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);Jn(n.name,u,d,l);let f=$n(u,n.name,l);return Kn(r.reservedBindingKeysByGroup,u,d,f)||W(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function Wn(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=Xn(s,t);return qn(s,e,o),W(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function Gn(e,t,n){let r=new Map,i=[];function a(e,t,i,a){W(n,e,t,a);let o=r.get(e)||new Map;o.set(t,i),r.set(e,o)}for(let{module:t,source:n}of e)for(let e of oe(n,R)){let n=Number(e.groupToken);if(e.bindingToken===`auto`){i.push({module:t,name:e.name,group:n});continue}let r=Number(e.bindingToken);Jn(t.name,n,r,e.name),a(n,r,$n(n,t.name,e.name),`module "${t.name}" binding "${e.name}"`)}for(let{module:e,name:n,group:r}of i){let i=$n(r,e.name,n),o=t?.get(i);o!==void 0&&a(r,o,i,`registered module binding "${i}"`)}return r}function Kn(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return i.delete(n),!0}function qn(e,t,n){if(e===0&&t>=100)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function Jn(e,t,n,r){if(t===0&&n<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function W(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function Yn(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?100:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function Xn(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function Zn(e){let t=re(e,R);if(!t)return;let n=er(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):tr(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${nr(t.match)}".`)}function Qn(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function $n(e,t,n){return`${e}:${t}:${n}`}function er(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function tr(e,t){let n=e.indexOf(Mt);return n>=0?t>n:!0}function nr(e){return e.replace(/\s+/g,` `).trim()}var rr=class e extends Je{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=[...this._injectionTargets,...t.injectionTargets||[]],i=this._transpileShader(t,n,t.source,t.shaderStage??(t.computeEntryPoint?`compute`:void 0)),a={vertex:i.entryPoints?.vertex??t.vertexEntryPoint,fragment:i.entryPoints?.fragment??t.fragmentEntryPoint,compute:i.entryPoints?.compute??t.computeEntryPoint},o=e.getShaderPreprocessorDefines(t,n),s=t.platformInfo.shaderLanguage===`wgsl`&&i.code?Ut(i.code,{defines:o}):i.code,{source:c,getUniforms:l,bindingAssignments:u}=Pn({...t,source:s,vertexEntryPoint:a.vertex,fragmentEntryPoint:a.fragment,defines:o,_bindingRegistry:this._wgslBindingRegistry,modules:i.modules,injectionTargets:r}),d=t.platformInfo.shaderLanguage===`wgsl`?Ut(c,{defines:o}):c;return{source:d,entryPoints:a,getUniforms:l,modules:n,bindingAssignments:u,bindingTable:Xe(d,u),shaderLayout:se(d,{vertexEntryPoint:a.vertex,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}},ir=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),Symbol.toStringTag).get;function ar(e){return ArrayBuffer.isView(e)?ir.call(e):void 0}function or(e){let t=ar(e);return t!==void 0&&t!==`BigInt64Array`&&t!==`BigUint64Array`}var sr=0,cr=class{constructor(e){this.userData={},this.id=e.id||`geometry-${++sr}`,this.topology=e.topology,this.attributes={};let t=e.indices?lr(e.indices):void 0;for(let[n,r]of Object.entries(e.attributes||{})){let e=lr(r);if((n===`POSITION`||n===`positions`)&&(e.size||=3),n===`indices`){if(t)throw Error(`Geometry has multiple index attributes`);t=e}else this.attributes[n]=e}if(t){if(!(t.value instanceof Uint16Array||t.value instanceof Uint32Array))throw Error(`Geometry indices must be a Uint16Array or Uint32Array`);t.size=1,this.indices=t,ur(t,this.attributes)}if(this.vertexCount=e.vertexCount??dr(this.attributes,this.indices),!Number.isInteger(this.vertexCount)||this.vertexCount<0)throw Error(`Geometry vertexCount must be a non-negative integer`)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}};function lr(e){let t=or(e)?{value:e}:{...e};if(!or(t.value))throw Error(`Geometry attributes must contain a typed-array value`);if(t.size!==void 0&&(!Number.isInteger(t.size)||t.size<1))throw Error(`Geometry attribute size must be a positive integer`);if(t.size&&t.value.length%t.size!==0)throw Error(`Geometry attribute length must be divisible by its size`);return t}function ur(e,t){let n=-1;for(let t of e.value)n=Math.max(n,Number(t));for(let[e,r]of Object.entries(t))if(!r.constant&&r.size){let t=r.value.length/r.size;if(n>=t)throw Error(`Geometry index ${n} exceeds ${e} vertex count ${t}`)}}function dr(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e))!t.constant&&t.size&&(n=Math.min(n,t.value.length/t.size));if(!Number.isFinite(n))throw Error(`Geometry has no countable attributes`);return n}var fr=class extends cr{bufferLayout;constructor(e){let t={},n=new Map;for(let[r,i]of Object.entries(e.attributes)){let e=G(r),a=n.get(e);a&&delete t[a],n.set(e,r),t[r]=i}let r=e.indices,i=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;super({...e,attributes:t,indices:i});for(let[e,n]of Object.entries(t))!ArrayBuffer.isView(n)&&Object.isExtensible(n)&&e!==`indices`&&(Object.assign(n,this.attributes[e]),this.attributes[e]=n);this.bufferLayout=e.bufferLayout||pr(this.attributes)}};function G(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function pr(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:i,normalized:a}=r;if(i===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:G(n),format:E.getVertexFormatFromAttribute(e,i,a)})}return t}function mr(e,t={}){let n=t.bufferName||`geometry`;if(hr(e,n))return e;let r=t.minAttributeAlignment||4,i=gr(e,t.attributes),a=[],o=0,s=1/0;for(let[e,t]of i){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:i,normalized:c}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(i===void 0)throw Error(`Attribute ${e} is missing a size`);let l=E.getVertexFormatFromAttribute(n,i,c),u=E.getVertexFormatInfo(l);o=vr(o,r),a.push({sourceName:e,attributeName:G(e),value:n,size:i,format:l,byteOffset:o,byteLength:u.byteLength}),o+=u.byteLength;let d=n.length/i;if(!Number.isInteger(d))throw Error(`Attribute ${e} length is not divisible by size`);s=Math.min(s,d)}if(a.length===0||!Number.isFinite(s))throw Error(`Geometry ${e.id} has no interleavable attributes`);let c=vr(o,r),l=new ArrayBuffer(s*c);for(let e of a)_r(l,s,c,e);return new fr({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(l),size:c,byteStride:c}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:c,attributes:a.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function hr(e,t){if(e.bufferLayout?.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function gr(e,t){let n=new Map,r=t||Object.keys(e.attributes);for(let t of r){let r=e.attributes[t];r&&n.set(G(t),[t,r])}return Array.from(n.values())}function _r(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function vr(e,t){return Math.ceil(e/t)*t}function yr(e=[],t){let n={modules:[],injectionTargets:[],defines:{},injections:{},vertexInputs:{},interStageVariables:{}};for(let r of e)xr(n,r,t);let{vertexInputs:r,interStageVariables:i}=n;for(let e of Object.keys(i))if(r[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return n}function br(e=[],t=[],n={}){let r=[...e],i=new Map;for(let e of r){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||i.set(e.name,e)}for(let e of t){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||(r.push(e),i.set(e.name,e))}return r}function xr(e,t,n){t.module&&e.modules.push(t.module),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){Sr(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.interStageVariables||{})){Sr(n,`varying`);let t=Cr(n,r),i=e.interStageVariables[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.interStageVariables[n]=t}for(let r of t.injectionTargets||[]){let t=r[n];if(!t)continue;let i=`${r.stage===`vertex`?`vs`:`fs`}:${r.name}`;if(!/^(vs|fs):[A-Za-z_][A-Za-z0-9_]*$/.test(i))throw Error(`Invalid ShaderPlugin injection target ${i}`);let a=e.injectionTargets.find(e=>e.stage===r.stage&&e.name===r.name),o=a?.[n];if(o&&(o.parameters!==t.parameters||(o.returnType||`void`)!==(t.returnType||`void`)||o.header!==t.header||o.footer!==t.footer))throw Error(`Conflicting ShaderPlugin injection target ${i}`);a||e.injectionTargets.push({name:r.name,stage:r.stage,[n]:t})}let r=ut(Array.isArray(t.injections)?t.injections:Object.entries(t.injections||{}).flatMap(([e,t])=>{let r=wr(e,n);if(r===void 0)return[];let[i,...a]=r.split(`:`);if(i!==`vs`&&i!==`fs`)throw Error(`Invalid ShaderPlugin injection ${e}`);return[{stage:i===`vs`?`vertex`:`fragment`,target:a.join(`:`),[n]:t}]}),n,t.name);for(let[t,n]of Object.entries(r))e.injections[t]||=[],e.injections[t].push(...n)}function Sr(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function Cr(e,t){let{primitiveType:n}=A.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function wr(e,t){let n=/^(glsl|wgsl):([\s\S]+)$/.exec(e);return n?n[1]===t?n[2]:void 0:e}function Tr(e,t){return{name:Er(e,t),language:`glsl`,version:Dr(e)}}function Er(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Dr(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function Or(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`nvidia`:return`#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;case`intel`:return`#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`amd`:return`#define AMD_GPU
`;default:return`#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`}}function kr(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=Nr(e,jr),e;case`fragment`:return e=Nr(e,Mr),e;default:throw Error(t)}}var Ar=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],jr=[...Ar,[Pr(`attribute`),`in $1`],[Pr(`varying`),`out $1`]],Mr=[...Ar,[Pr(`varying`),`in $1`]];function Nr(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function Pr(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var Fr=`precision highp float;
`;function Ir(e){let{vs:t,fs:n}=e,r=V(e.modules||[]);return{vs:Lr(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:Lr(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:Nt(r)}}function Lr(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},injectionTargets:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginInterStageVariables:d={},prologue:f=!0,log:p}=t;B(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?Tr(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${Or(e)}
${r===`fragment`?Fr:``}

// ----- APPLICATION DEFINES -------------------------

${Rr(v)}

`:`${g}
`;break}let b=jn(s,t.pluginInjectionTargets,`glsl`),x={},S={},C={};Pt(l,x,S,C),Pt(Array.isArray(c)?ut(c,`glsl`):{},x,S,C);let w=Array.isArray(c)?{}:c;for(let e in w){let t=typeof w[e]==`string`?{injection:w[e],order:0}:w[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[...S[e]||[],t]:C[e]=[...C[e]||[],t]:x[e]=[...x[e]||[],t]}else C[e]=[...C[e]||[],t]}if(r===`vertex`){let e=Gt(_,u);e&&(y+=`${e}\n`)}let T=sn(_,r,d);T.declarations&&(y+=`${T.declarations}\n`),T.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:T.initialization,order:-(2**53-1)}));for(let e of a){p&&Ke(e,_,p);let t=Ft(e,r,p);y+=t}return Nn(b,x,r),y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=Mt,y=dt(y,r,S),y+=An(b[r],x),y+=_,y=dt(y,r,C),i===`glsl`&&m!==h&&(y=kr(y,r)),i===`glsl`&&St(y,r,p),y.trim()}function Rr(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var zr=class extends Je{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...Ir({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}},Br=class{device;buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),n=this.device.createBuffer({id:`batch-uniforms`,byteLength:t,usage:k.UNIFORM|k.COPY_DST});this.buffer?.destroy(),this.buffer=n}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){w(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}};function Vr(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var Hr=`__debugFramebufferState`,Ur=8;function Wr(e,t,n){if(e.device.type!==`webgl`)return;let r=qr(e.device);if(!r.flushing){if(Yr(e)){Gr(e,n,r);return}t&&Jr(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function Gr(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=Xr(t.top,Ur),l=Xr(t.left,Ur);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=Kr({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+Ur}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function Kr(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function qr(e){return e.userData[Hr]||={flushing:!1,queuedFramebuffers:[]},e.userData[Hr]}function Jr(e){return`colorAttachments`in e}function Yr(e){let t=e.props.framebuffer;return!t||t.handle===null}function Xr(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function K(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!K(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=e,i=t,a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(let e of a)if(!t.hasOwnProperty(e)||!K(r[e],i[e],n-1))return!1;return!0}return!1}var Zr=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return P(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function Qr(e,t){let n=ne(e),r=t.slice();return r.sort((e,t)=>ie(P(e).map(e=>n[e]))-ie(P(t).map(e=>n[e]))),r}function $r(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of ii(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function ei(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?si(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:oi(e.bindings,t.bindings)}:e:t}function ti(e){return!!(e.uniformTypes&&!ai(e.uniformTypes))}function ni(e){let t=[];for(let n of e){let e=_t(n),r=new Set([n.vs,n.fs].flatMap(e=>e?xt(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),i=r.has(e)?e:r.size===1?r.values().next().value:void 0;ti(n)&&i&&t.push({name:i,uniformTypes:n.uniformTypes})}return t}function ri(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function ii(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function ai(e){for(let t in e)return!1;return!0}function oi(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function si(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}function ci(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var li={};function ui(e=`id`){return li[e]=li[e]||1,`${e}-${li[e]++}`}function di(e,t,n){for(let[r,i]of Object.entries(t)){if(!i)continue;if(!i.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=n.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let a=t.attributes??[];if(a.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let o=a[0],s=t.format??o?.format,c=pi(e,r,i.format),l=t.byteStride??c.byteLength;if(s!==i.format||l!==i.byteStride||i.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function fi(e,t){let n=Object.entries(t).filter(e=>e[1]!==void 0);if(n.length===0)return[];let[r,i]=n[0];for(let[t,a]of n){if(!a.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(pi(e,t,a.format),a.length!==i.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(a.data.length!==i.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let a=0;return i.data.map((t,r)=>{let i={};for(let[a,o]of n){let n=o.data[r];if(!n||n.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(n.format!==o.format||n.byteStride!==o.byteStride||n.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${a}" chunk layout must be stable`);i[a]=n}let o={batchIndex:r,rowIndexOffset:a,rowCount:t.length,data:i};return a+=t.length,o})}function pi(e,t,n){if(n.includes(`<`))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return E.getVertexFormatInfo(n)}function q(e){let t;for(let n of Object.values(e)){if(!n||`isConstant`in n)continue;let e=0;for(let t of n.data)e+=t.length;if(w(e===n.length),t){w(n.length===t.length&&n.data.length===t.data.length);for(let e=0;e<n.data.length;e++)w(n.data[e].length===t.data[e].length)}else t=n}}function mi(e,t,n,r,i,a){let o=t.inputs,s=n.inputs,c=t.sourceLayouts,l=n.sourceLayouts,u=t.layouts,d=n.layouts,f=n.stepMode,p=t.batchCount,m=n.batchCount,h=Array.from({length:p},(e,n)=>t.getBatch(n)),g=Array.from({length:m},(e,t)=>n.getBatch(t)),_=hi(h),v=hi(g),y=e.vertexCount,b=e.instanceCount,x=!0;try{let o=e.isInstanced&&n.vertexCount===void 0,s=o?p*m:Math.max(p,m);if(p===0||m===0)return!0;for(let c=0;c<s;c++){let s=o?Math.floor(c/m):Math.min(c,p-1),l=o?c%m:Math.min(c,m-1);t.setInputs(h[s],u,`vertex`),n.setInputs(g[l],d,f),r();let S=t.rowCount===void 0?n.vertexCount===void 0?0:v[l]:_[s];a===`vertex`&&e.setVertexCount(Math.max(0,Math.min(t.rowCount??n.vertexCount??y,y-S))),a===`instance`&&n.instanceCount!==void 0&&e.setInstanceCount(Math.max(0,Math.min(n.instanceCount,b-v[l]))),!(!e.indexBuffer&&e.vertexCount===0||e.isInstanced&&e.instanceCount===0)&&(x=i()&&x)}}finally{t.setInputs(o,c,`vertex`),n.setInputs(s,l,f),r(),e.setVertexCount(y),e.setInstanceCount(b)}return x}function hi(e){let t=0;return e.map(e=>{let n=t;for(let n of Object.values(e))if(n&&`data`in n){t+=n.length;break}return n})}var gi=class{device;id;inputs={};sourceLayouts;stepMode=`vertex`;claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,n,r=!0){if(r)q(e);else for(let t of Object.values(e))t&&!J(t)&&w(t.data.length===1);this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=n,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let i=t??Object.entries(e).flatMap(([e,t])=>t&&!J(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),a=Object.entries(e).flatMap(([e,t])=>{if(!t||i.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];w(t.format);let r=t.format;return[{name:e,stepMode:n,byteStride:J(t)?0:t.byteStride,attributes:[{attribute:e,format:r,byteOffset:0}]}]}),o=[...i,...vi(e,a)];for(let[t,i]of Object.entries(e))if(i){if(!J(i)&&!Array.isArray(i.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);!J(i)&&r&&((o.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t))?.stepMode??n)===`instance`?(w(this.instanceCount===void 0||this.instanceCount===i.length),this.instanceCount=i.length):(w(this.vertexCount===void 0||this.vertexCount===i.length),this.vertexCount=i.length),this.rowCount=n===`instance`?this.instanceCount:this.vertexCount),this.claimedNames.add(t)}this.layouts=o.flatMap(t=>{let r=e[t.name],i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),a=i.filter(t=>J(e[t.attribute])),o={...t,stepMode:t.stepMode??n};return this.device.type!==`webgpu`||r&&!J(r)&&r.bufferLayout||!a.length||a.length===i.length?[{...o,byteStride:a.length===i.length&&a.length?0:o.byteStride}]:[{...o,attributes:i.filter(t=>!J(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:a}]}),this.buffers={},this.byteOffsets={},this.constants={};let s=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let n=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of n)this.claimedNames.add(e.attribute);let r=e[t.name];if(r&&!J(r)){let e=r.bufferLayout||!r.format?0:(n.find(e=>e.attribute===t.name)??n[0])?.byteOffset??0;this.bindVector(t.name,r,e)}let i=0;for(let r of n){let n=e[r.attribute]??(r.attribute===t.name?e[t.name]:void 0);n&&(w(n.format===void 0||n.format===r.format),J(n)?(this.constants[r.attribute]=_i(n),i=Math.max(i,(r.byteOffset??0)+n.byteLength)):this.buffers[t.name]||this.bindVector(t.name,n,r.byteOffset??0))}if(this.device.type===`webgpu`&&i&&!this.buffers[t.name]){let r=new Uint8Array(Math.ceil(i/4)*4);for(let t of n){let n=e[t.attribute];J(n)&&r.set(new Uint8Array(n.value.buffer,n.value.byteOffset,n.byteLength),t.byteOffset??0)}let a=this.constantBuffers[t.name];(!a||a.byteLength<r.byteLength)&&(a?.destroy(),a=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:r.byteLength,usage:k.VERTEX|k.COPY_DST|k.COPY_SRC}),this.constantBuffers[t.name]=a),a.write(r),this.buffers[t.name]=a,s.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))s.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!J(e));return e&&!J(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,n])=>{if(!n||J(n))return[t,n];let r=n.data[e];return[t,{...n,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,n){let r=t.data[0];if(!r)return;let i=r.byteOffset-n;w(i>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=i}};function J(e){return!!(e&&`isConstant`in e&&e.isConstant)}function _i(e){let t=E.getVertexFormatInfo(e.format);if(e.format===`unorm10-10-10-2`){let t=e.value[0];return new Float32Array([(t&1023)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let n=Array.from(e.value);if(e.format===`unorm8x4-bgra`&&([n[0],n[2]]=[n[2],n[0]]),t.normalized){let r=e.value.BYTES_PER_ELEMENT*8,i=2**r-1;return new Float32Array(n.map(e=>t.signed?(e+2**(r-1))/i*2-1:e/i))}return t.integer?t.signed?new Int32Array(n):new Uint32Array(n):new Float32Array(n)}function vi(e,t){let n=[],r,i=0,a=[...t].sort((t,n)=>{let r=e[t.name],i=e[n.name];return(r&&!J(r)?r.data[0]?.byteOffset??0:0)-(i&&!J(i)?i.data[0]?.byteOffset??0:0)});for(let t of a){let a=e[t.name],o=t.attributes[0];if(J(a)){r||(r={...t,attributes:[]},n.push(r));let e=Math.min(4,a.byteLength);i=Math.ceil(i/e)*e,r.attributes.push({...o,byteOffset:i}),i+=a.byteLength;continue}let s=n.find(n=>{let r=e[n.name];if(!r||J(r)||!r.data.length||!a.data.length)return!1;let i=a.data[0].byteOffset-r.data[0].byteOffset;return n.stepMode===t.stepMode&&n.byteStride===t.byteStride&&i>=0&&i+a.rowByteLength<=a.byteStride&&a.data.every((e,t)=>{let n=r.data[t];return e.buffer===n.buffer&&e.byteStride===n.byteStride&&e.byteOffset-n.byteOffset===i})});if(s){let t=e[s.name];s.attributes.push({...o,byteOffset:a.data[0].byteOffset-t.data[0].byteOffset})}else n.push({...t,attributes:[...t.attributes]})}return n}function yi(e){return(Array.isArray(e)?e.length===0||typeof e[0]==`number`:ArrayBuffer.isView(e)&&!(e instanceof DataView))||typeof e==`number`||typeof e==`boolean`}function bi(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||yi(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var xi=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=V(Object.values(e).filter(Ei));for(let t of n)e[t.name]=t;S.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&S.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},i=this.modules[n];if(!i)this.options.disableWarnings||S.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:a,bindings:o}=bi(i.getUniforms?.(r,e)||r,i.uniformTypes);this.moduleUniforms[n]=Si(e,a,i.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=V(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=Si({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function Si(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=Ci(e[i],a,n[i]));return r}function Ci(e,t,n){if(!n||typeof n==`string`)return Y(t);if(Array.isArray(n)){if(wi(t)||!Array.isArray(t))return Y(t);let r=Array.isArray(e)&&!wi(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=Ci(r[e],a,n[0]))}return i}if(!Ti(t))return Y(t);let r=n,i=Ti(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=Ci(i[e],n,r[e]));return a}function Y(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?wi(e)?e.slice():e.map(e=>e===void 0?void 0:Y(e)):Ti(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:Y(t)])):e}function wi(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function Ti(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Ei(e){return!!e?.dependencies}function Di(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function Oi(e){return e?.type===`texture`||e?.type===`external-texture`}function ki(e,t,n){let r=te(e,t,{ignoreWarnings:!0});return Oi(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var X=2,Ai=1e4,ji=`render pipeline initialization failed`,Mi=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],Ni=class e{static async createAsync(e,t){let n=!b.getAsyncCompilation(e),r=n?b.beginAsyncCompilation(e):b.getAsyncCompilation(e),i;try{i=new this(e,t)}finally{n&&b.endAsyncCompilation(e,r)}try{return n?await Promise.all(r):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...D.defaultProps,inferDrawCount:`no`,enforceMatchingVectorLengths:!0,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){this.constructorDrawOffsets={firstVertex:n.firstVertex,firstIndex:n.firstIndex};let i=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:n.vertexCount??(i.vertexCount||void 0),instanceCount:n.instanceCount??(i.instanceCount||void 0)};let a=i.shaderAssembler,o=Object.hasOwn(n,`vertexCount`);this.props={...i,...n,shaderAssembler:n.shaderAssembler??(a&&Pi(a,t.info.shadingLanguage)?a:t.info.shadingLanguage===`wgsl`?new rr:new zr)},this._vertexCountSet=o,n=this.props,this.id=n.id||ui(`model`),this.device=t,Object.assign(this.userData,n.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=n.isInstanced??(n.instanceCount?!0:void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new gi(t,`${this.id}-geometry`),this.attributeVectorBindings=new gi(t,`${this.id}-attributes`);try{this._initializeProps(n);let e=ci(t),i=yr(this.props.plugins,e.shaderLanguage),a=br(this.props.modules,i.modules),o=Object.fromEntries(a.map(e=>[e.name,e])),s=n.shaderInputs||new xi(o,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&i.modules.length>0&&s.addModules(i.modules),this.setShaderInputs(s);let c=ri(this.props.modules,s.getModules()),l={...i.defines,...this.props.defines};if(this.device.type===`webgl`&&(this.props._uniformBlockLayouts=ni(c)),this.props.shaderLayout=$r(this.props.shaderLayout,c)||null,this.device.type===`webgpu`&&this.props.source){let n=this.props.shaderAssembler;w(Pi(n,`wgsl`));let{source:r,getUniforms:a,bindingTable:o,entryPoints:s={},shaderLayout:u}=n.assembleWGSLShader({platformInfo:e,...this.props,modules:c,defines:l,pluginInjectionTargets:i.injectionTargets,pluginInjections:i.injections,pluginVertexInputs:i.vertexInputs,pluginInterStageVariables:i.interStageVariables});this.source=r,this.props.vertexEntryPoint=s.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=s.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=a,this._bindingTable=o;let d=Fi(u??t.getShaderLayout?.(this.source),i.vertexInputs),f=ei(this.props.shaderLayout,d,Object.keys(i.vertexInputs));this.props.shaderLayout=$r(f||null,c)||null}else{let t=this.props.shaderAssembler;w(Pi(t,`glsl`));let{vs:n,fs:r,getUniforms:a}=t.assembleGLSLShaderPair({platformInfo:e,...this.props,modules:c,defines:l,pluginInjectionTargets:i.injectionTargets,pluginInjections:i.injections,pluginVertexInputs:i.vertexInputs,pluginInterStageVariables:i.interStageVariables});this.vs=n,this.fs=r,this._getModuleUniforms=a,this._bindingTable=[]}this.pipelineFactory=n.pipelineFactory||b.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||r.getDefaultShaderFactory(this.device);let u=b.getAsyncCompilation(this.device);u?(this._pipelineInitialization=this._initializePipelineAsync(n),u.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(n))}catch(t){try{e.prototype.destroy.call(this)}finally{throw t}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),e.indexCount!==void 0&&this.setIndexCount(e.indexCount),this.constructorDrawOffsets.firstVertex!==void 0&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),this.constructorDrawOffsets.firstIndex!==void 0&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),e.isInstanced!==void 0&&(this.isInstanced=e.isInstanced),this.constructorDrawCounts.instanceCount!==void 0&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),this.constructorDrawCounts.vertexCount!==void 0&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||=(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e,t){return t?.parameters?this._withDrawParameters(e,t.parameters,()=>this._draw(e)):this._draw(e)}_withDrawParameters(e,t,n){let r=e.getParameters();try{return e.setParameters(t),n()}finally{e.setParameters(r)}}_draw(e){if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(this.geometryVectorBindings.batchCount!==1||this.attributeVectorBindings.batchCount!==1))return this.drawVectorGroups(e);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return S.info(X,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return S.info(X,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)S.info(X,`>>> DRAWING ABORTED ${this.id}: ${ji}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)S.info(X,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??(this._vertexCountSet?this.vertexCount:a.byteLength/(a.indexType===`uint32`?4:2)):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0||e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=ji,this._drawBlockedReason=ji):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),this.validateVectorLengthPolicy(),this.props.enforceMatchingVectorLengths&&q(e),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||this.attributeVectorBindings.vertexCount!==void 0)&&q([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let n=this.geometryVectorBindings.rowCount;w(n===void 0||this.attributeVectorBindings.vertexCount===void 0||n===this.attributeVectorBindings.vertexCount),this.props.inferDrawCount===`vertex`&&this.setVertexCount(n??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),this.isInstanced===void 0&&(t?.some(e=>e.stepMode===`instance`)||Object.values(e).some(e=>e&&`data`in e&&e.bufferLayout?.stepMode===`instance`))&&(this.isInstanced=!0);let n=!this.isInstanced||Object.entries(e).some(([e,n])=>n&&`data`in n&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??n.bufferLayout?.stepMode)===`vertex`);this.validateVectorLengthPolicy(),n&&this.props.enforceMatchingVectorLengths&&q([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),this.props.inferDrawCount===`instance`&&this.attributeVectorBindings.instanceCount!==void 0&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let r=this.attributeVectorBindings.vertexCount;if(r!==void 0&&this.props.inferDrawCount===`vertex`){let e=this.geometryVectorBindings.rowCount;w(e===void 0||e===r),e===void 0&&this.setVertexCount(r)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&(w(e.format===`uint8`||e.format===`uint16`||e.format===`uint32`),w(e.data.length<=1),w(e.byteStride===(e.format===`uint32`?4:e.format===`uint16`?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];t&&this.indexVector&&w((t.buffer instanceof s?t.buffer.buffer:t.buffer).indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride===0),this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let n=new Set(Object.keys(e)),r=t.filter(e=>n.has(e.name)||e.attributes?.some(e=>n.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),this.device.type===`webgl`&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let n=fi(this.id,e);w(n.length<=1),di(this.id,e,this.bufferLayout),n[0]&&this.setGPUData(n[0].data),this.setBatchDrawCount(n[0]?.rowCount??0,t?.count)}drawVectorGroups(t){let n=this.drawingVectorBatches,r=this._vertexCountSet;this.drawingVectorBatches=!0;try{let n=mi(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>e.prototype.draw.call(this,t),this.props.inferDrawCount);return n&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),n}finally{this._vertexCountSet=r,this.drawingVectorBatches=n}}drawBatches(t,{vectors:n,onBatch:r}){let i=fi(this.id,n);di(this.id,n,this.bufferLayout);for(let e of Object.keys(n))w(!n[e]||this.currentAttributes[e]);let a={...this.currentAttributes},o={...this.currentAttributeByteOffsets},s={...this.bindings},c=this.instanceCount,l=this.vertexCount,u=this.isInstanced,d=this._vertexCountSet,f=this.drawingVectorBatches,p=this.device.type===`webgpu`&&i.length?new Fe(this.device,this.shaderInputs.modules):void 0;if(p&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new Br(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(p.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*i.length)}this.drawingVectorBatches=!0;let m=!0;try{for(let n of i){this.setGPUData(n.data),this.setBatchDrawCount(n.rowCount),r?.(n);let i={};try{if(p){p.setUniforms(this.shaderInputs.getUniformValues());for(let[e,t]of this._uniformStore.uniformBuffers){let n=`${e}Uniforms`;this.bindings[n]===t&&(i[n]=t,this.setBindings({[n]:this.batchUniformBuffer.write(p.getUniformBufferData(e))}))}}m=e.prototype.draw.call(this,t)&&m}finally{this.setBindings(i)}}}finally{p?.destroy(),this.setAttributes(a,{byteOffsets:o});for(let e of Object.keys(this.bindings))e in s||delete this.bindings[e];this.setBindings(s),this.setInstanceCount(c),this.setVertexCount(l),this.isInstanced=u,this._vertexCountSet=d,this.drawingVectorBatches=f}return m}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let n=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(n?.attributes?.[0]?.byteOffset??0);return w(r>=0),[e,r]}))})}validateVectorLengthPolicy(){w(this.props.enforceMatchingVectorLengths!==!1||this.props.inferDrawCount===`no`)}setBatchDrawCount(e,t=this.props.inferDrawCount===`no`?`none`:this.props.inferDrawCount){t===`instance`?this.setInstanceCount(e):t===`vertex`&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,n=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,i=this.getExplicitVectorLayouts(n.inputs)??n.sourceLayouts;t.setInputs(t.inputs,r,`vertex`,this.props.enforceMatchingVectorLengths),n.setInputs(n.inputs,i,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||n.vertexCount!==void 0)&&q([...Object.values(t.inputs),...Object.values(n.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(n),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(e=Qr(this.pipeline.shaderLayout,e),K(e,this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){K(e,this.parameters,2)||(this.parameters=e,this.device.type===`webgl`?this.setNeedsRedraw(`parameters`):this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new Fe(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(ti(t)&&this._usesManagedUniformBuffer(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw(`shaderInputs`)}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof s?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof s?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){Object.assign(this.currentAttributes,e);for(let n of Object.keys(e))this.currentAttributeByteOffsets[n]=t?.byteOffsets?.[n]??0;this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&S.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=Qr(this.pipeline.shaderLayout,this.bufferLayout);let r=new Zr(this.bufferLayout);for(let[i,a]of Object.entries(e)){let e=a instanceof s?a.buffer:a,o=r.getBufferLayout(i);if(!o){n||S.warn(`Model(${this.id}): Missing layout for buffer "${i}".`)();continue}let c=r.getAttributeNamesForBuffer(o),l=!1;for(let r of c){let o=this._attributeInfos[r];if(o){let r=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(o.bufferName):o.location;if(r===null){n||S.warn(`Model(${this.id}): Missing vertex array slot for buffer "${o.bufferName}".`)();continue}let c=t?.byteOffsets?.[i]??0;this.vertexArray.setBuffer(r,e,c),a instanceof s?this._dynamicAttributeBufferSources[r]={source:a,generation:a.generation,byteOffset:c}:delete this._dynamicAttributeBufferSources[r],l=!0}}!l&&!n&&S.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${i}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||S.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(Di(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=Ii(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?j(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let n of Object.values(this.bindings))n instanceof de?e=Math.max(e,n.texture.updateTimestamp):n instanceof k||n instanceof O||n instanceof le||n instanceof s?e=Math.max(e,n.updateTimestamp):Di(n)?e=n.isReady?Math.max(e,n.updateTimestamp):1/0:t(n)&&(e=Math.max(e,(n.buffer instanceof s,n.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?.vs??null,t=this.pipeline?.fs??null;this.pipeline&&S.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let n=null,r=null;try{n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(n,r),this._pipelineNeedsUpdate=`shader creation failed`,e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r},vertexShader:n,fragmentShader:r,previousVertexShader:e,previousFragmentShader:t}}_finishPipelineUpdate(e){this._attributeInfos=Le(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=S.level>3?0:Ai;S.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,S.group(X,`>>> DRAWING MODEL ${this.id}`,{collapsed:S.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=Vr(this.pipeline.shaderLayout,this.id);S.table(X,e)();let t=this.shaderInputs.getDebugTable();S.table(X,t)();let n=this._getAttributeDebugTable();S.table(X,this._attributeInfos)(),S.table(X,n)(),S.groupEnd(X)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;Wr(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let n=T.getTypedArrayConstructor(t);return(e instanceof k?new n(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>Li(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??Ri(t?.depthStencilAttachment?.props?.format??t?.depthStencilAttachment?.texture?.format);(!K(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function Pi(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function Fi(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function Ii(e,n,r){if(Di(n)){let t=ki(r,e,{fallbackGroup:0});return t?n.resolveTextureBinding(t):null}return n instanceof s?n.buffer:t(n)?y(n):n}function Li(e){return e&&!zi(e)?e:null}function Ri(e){return e&&zi(e)?e:void 0}function zi(e){return Mi.includes(e)}var Bi=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||ui(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&k.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function Vi(e,t){if(t instanceof Bi)return t;let n=mr(t),r=Hi(e,n),{attributes:i,bufferLayout:a}=Ui(e,n);return new Bi({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function Hi(e,t){if(!t.indices)return;let n=t.indices.value;return e.createBuffer({usage:k.INDEX,data:n})}function Ui(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout?.find(e=>e.name===r)?.name||G(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout||pr(t.attributes),vertexCount:t.vertexCount}}var Z=class{attributes;indices;topology;vertexCount;bufferLayout;destroy(){}constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??`triangle-list`,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}};function Wi(e){let t={};for(let[n,r]of Object.entries(e.attributes)){let i=e.bufferLayout.find(e=>e.name===n),a=i?.format,o=i?.byteStride??(a?E.getVertexFormatInfo(a).byteLength:0),s=e.indices&&o?Math.floor(r.byteLength/o):e.vertexCount;t[n]={name:n,format:a,length:s,byteStride:o,rowByteLength:o,bufferLayout:i,data:[{buffer:r,byteOffset:0,length:s,format:a,byteStride:o,rowByteLength:o}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[n,r]of Object.entries(t))t[n]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let n=e.indices,r=n?.indexType===`uint32`?4:n?.indexType===`uint8`?1:2,i=n?n.byteLength/r:0;return new Z({attributes:t,indices:n?{name:`indices`,format:n.indexType,length:i,byteStride:r,rowByteLength:r,data:[{buffer:n,byteOffset:0,length:i,format:n.indexType,byteStride:r,rowByteLength:r}]}:null,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}var Gi=class extends Ni{static defaultProps={...Ni.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let n=t.geometry===void 0?new.target.defaultProps.geometry:t.geometry,r=n&&!(n instanceof Z)?Vi(e,n):null,i=r?Wi(r):n,a={...t,geometry:i instanceof Z?i:null};try{super(e,a)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=n,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=e&&!(e instanceof Z)?Vi(this.device,e):null;let t=this._gpuGeometry?Wi(this._gpuGeometry):e;super.setGeometry(t instanceof Z?t:null),e instanceof Z||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if(Di(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}},Ki=``;function qi(e){return Xi(e)?e:Ki+e}async function Ji(e,t){let n=new Image,r=qi(e);n.crossOrigin=t?.crossOrigin||`anonymous`,n.src=r;try{await n.decode()}catch(e){throw Yi(`decode`,r,e)}try{return t?await createImageBitmap(n,t):await createImageBitmap(n)}catch(e){throw Yi(`create`,r,e)}}function Yi(e,t,n){let r=n instanceof Error?n.message:String(n),i=e===`decode`?`Could not decode source image "${t}": ${r}`:`Could not create ImageBitmap from decoded image "${t}": ${r}`;return Error(i,{cause:n})}function Xi(e){return e.startsWith(`/`)||/^[a-z][a-z\d+\-.]*:/i.test(e)}var Zi=`
@group(0) @binding(0) var history: texture_2d<f32>;
@group(0) @binding(1) var earth: texture_2d<f32>;
struct Presentation {viewport: vec4f, orbit: vec4f};
@group(0) @binding(3) var<uniform> presentation: Presentation;
const PI: f32 = 3.14159265359;
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  if (presentation.viewport.w < 0.5) {return textureLoad(history, vec2i(input.position.xy), 0);}
  let screen = (input.position.xy - presentation.viewport.xy * 0.5) / (min(presentation.viewport.x, presentation.viewport.y) * 0.41);
  let radius = length(screen);
  let background = vec3f(0.006, 0.013, 0.028);
  if (radius > 1.0) {
    let halo = exp(-max(radius - 1.0, 0.0) * 28.0) * 0.3;
    return vec4f(background + vec3f(0.08, 0.4, 0.8) * halo, 1);
  }
  let normal = vec3f(screen.x, -screen.y, sqrt(max(0.0, 1.0 - radius * radius)));
  let pitch = presentation.orbit.x;
  let surfaceNormal = vec3f(normal.x, cos(pitch) * normal.y + sin(pitch) * normal.z,
    -sin(pitch) * normal.y + cos(pitch) * normal.z);
  let longitude = atan2(surfaceNormal.x, surfaceNormal.z) + presentation.viewport.z;
  let latitude = asin(clamp(surfaceNormal.y, -1.0, 1.0));
  let coordinates = vec2f(fract(longitude / (2.0 * PI) + 0.5), 0.5 - latitude / PI);
  let surface = textureLoad(earth, clamp(vec2i(coordinates * vec2f(textureDimensions(earth))), vec2i(0), vec2i(textureDimensions(earth)) - 1), 0).rgb;
  let light = 0.2 + 0.8 * max(dot(normal, normalize(vec3f(-0.5, 0.4, 1.0))), 0.0);
  let ocean = vec3f(0.018, 0.055, 0.09);
  let land = surface * vec3f(0.25, 0.4, 0.45);
  let base = (ocean + land) * light;
  let dimensions = vec2i(textureDimensions(history));
  let grid = coordinates * vec2f(dimensions) - 0.5;
  let lower = vec2i(floor(grid));
  let fraction = fract(grid);
  let left = (lower.x + dimensions.x) % dimensions.x;
  let right = (left + 1) % dimensions.x;
  let top = clamp(lower.y, 0, dimensions.y - 1);
  let bottom = clamp(lower.y + 1, 0, dimensions.y - 1);
  let trailColor = mix(
    mix(textureLoad(history, vec2i(left, top), 0).rgb, textureLoad(history, vec2i(right, top), 0).rgb, fraction.x),
    mix(textureLoad(history, vec2i(left, bottom), 0).rgb, textureLoad(history, vec2i(right, bottom), 0).rgb, fraction.x), fraction.y);
  let trails = max(trailColor - vec3f(0.018, 0.035, 0.055), vec3f(0));
  let rim = pow(1.0 - normal.z, 4.0);
  // Compress dense HDR trails without clipping their hue or washing out the Earth.
  let peak = max(trails.r, max(trails.g, trails.b));
  // Suppress the diffuse low-energy veil while retaining a bounded, bright core.
  // Fewer, wider streaks remain distinct instead of blending into an opaque atlas.
  let contrast = smoothstep(0.015, 0.16, peak);
  let intensity = 0.52 * (1.0 - exp(-peak * 3.0)) * contrast;
  let windGlow = trails / max(peak, 0.00001) * intensity;
  let color = base + windGlow * (0.45 + 0.55 * light) + rim * vec3f(0.06, 0.28, 0.5);
  return vec4f(color, 1);
}`,Qi=`
struct Parameters {
  domain: vec4<f32>,
  simulation: vec4<f32>,
  counters: vec4<u32>,
  temporal: vec4<f32>
};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read> previous: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> next: array<vec4<f32>>;
@group(0) @binding(3) var velocityField: texture_2d<f32>;
@group(0) @binding(4) var nextVelocityField: texture_2d<f32>;

${a}
fn hash(x: u32) -> f32 {
  var value = x;
  value = (value ^ (value >> 16u)) * 2246822519u;
  value = (value ^ (value >> 13u)) * 3266489917u;
  return f32((value ^ (value >> 16u)) >> 8u) / 16777216.0;
}
fn advect(initial: vec4<f32>, particleIndex: u32, substep: u32) -> vec4<f32> {
  var particle = initial;
  // Interpolate between batch endpoints so the final stage lands exactly on its snapshot.
  let fraction = mix(parameters.temporal.x, parameters.temporal.y, f32(substep) / parameters.temporal.z);
  let middleFraction = mix(parameters.temporal.x, parameters.temporal.y, (f32(substep) + 0.5) / parameters.temporal.z);
  let endFraction = mix(parameters.temporal.x, parameters.temporal.y, f32(substep + 1u) / parameters.temporal.z);
  let deltaTime = parameters.simulation.x;
  let first = velocity(particle.xy, fraction);
  let midpoint = particle.xy + first.xy * (deltaTime * 0.5);
  let middle = velocity(midpoint, middleFraction);
  var destination = particle.xy + middle.xy * deltaTime;
  var stagesValid = middle.z;
  if (parameters.simulation.z > 0.5) {
    let third = velocity(particle.xy + middle.xy * (deltaTime * 0.5), middleFraction);
    let fourth = velocity(particle.xy + third.xy * deltaTime, endFraction);
    destination = particle.xy + (first.xy + 2.0 * middle.xy + 2.0 * third.xy + fourth.xy) * (deltaTime / 6.0);
    stagesValid = min(stagesValid, min(third.z, fourth.z));
  }
  let last = velocity(destination, endFraction);
  if (particle.z < 0.0 || particle.z + deltaTime >= parameters.simulation.y ||
      first.z < 0.5 || stagesValid < 0.5 || last.z < 0.5) {
    let seed = particleIndex * 747796405u + parameters.counters.z * 2891336453u + parameters.counters.w + substep;
    let location = vec2<f32>(hash(seed), hash(seed + 1013904223u));
    let valid = velocity(location, endFraction).z > 0.5;
    particle = vec4<f32>(location, select(-1.0, select(0.0, hash(seed + 1664525u) * parameters.simulation.y, particle.w == 0.0), valid), (particle.w + 1.0) % 65536.0);
  } else {
    particle = vec4<f32>(wrapPosition(destination), particle.z + deltaTime, particle.w);
  }
  return particle;
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let particleIndex = invocation.x;
  if (particleIndex >= parameters.counters.x) {return;}
  var particle = previous[particleIndex];
  for (var substep = 0u; substep < u32(parameters.temporal.z); substep++) {
    particle = advect(particle, particleIndex, substep);
  }
  next[particleIndex] = particle;
}
`,$i=class{particleCount;state;uniforms;kernel;current=0;frame=0;device;field;nextField;timeRange;elapsedTime=0;timeCompensation=0;lifetime;seed;integrator;constructor(e,t,n){if(e.type!==`webgpu`)throw Error(`ScientificFlowCompute requires WebGPU`);if(this.device=e,this.field=t,this.nextField=t,this.particleCount=n.particleCount,this.lifetime=n.lifetime,this.seed=n.seed,this.integrator=n.integrator??`rk4`,!Number.isSafeInteger(this.particleCount)||this.particleCount<1||this.particleCount>1048576||!Number.isFinite(this.lifetime)||this.lifetime<=0||!Number.isInteger(this.seed)||this.seed<0||this.seed>4294967295)throw Error(`Invalid flow parameters`);let r=new Float32Array(this.particleCount*4);for(let e=0;e<this.particleCount;e++)r[4*e+2]=-1;let i=t=>e.createBuffer({id:`scientific-flow-state-`+t,byteLength:r.byteLength,usage:k.STORAGE|k.COPY_DST|k.COPY_SRC,data:r});this.state=[i(0),i(1)],this.uniforms=e.createBuffer({id:`scientific-flow-parameters`,byteLength:64,usage:k.UNIFORM|k.COPY_DST}),this.kernel=new o(e,{id:`scientific-flow-advection`,source:Qi,shaderLayout:{bindings:[{name:`parameters`,type:`uniform`,group:0,location:0},{name:`previous`,type:`read-only-storage`,group:0,location:1},{name:`next`,type:`storage`,group:0,location:2},{name:`velocityField`,type:`texture`,group:0,location:3,sampleType:`unfilterable-float`},{name:`nextVelocityField`,type:`texture`,group:0,location:4,sampleType:`unfilterable-float`}]}})}setTimeInterval(e,t,n){if(!n.every(Number.isFinite)||n[1]<=n[0]||e.layout!==t.layout||e.texture.width!==t.texture.width||e.texture.height!==t.texture.height||e.field.coordinates!==t.field.coordinates||e.periodicLongitude!==t.periodicLongitude||!e.field.bounds.every((e,n)=>e===t.field.bounds[n])||this.timeRange&&(n[0]!==this.time||this.remainingTime!==0))throw Error(`Invalid scientific flow interval`);if(!this.timeRange&&this.frame>0)throw Error(`Initialize time before stepping`);this.field=e,this.nextField=t,this.timeRange=[n[0],n[1]],this.elapsedTime=0,this.timeCompensation=0}get time(){return(this.timeRange?.[0]??0)+this.elapsedTime}get remainingTime(){return this.timeRange?this.timeRange[1]-this.timeRange[0]-this.elapsedTime:1/0}get maximumTimeStep(){return Math.min(1/30,.5/Math.max(this.field.maximumCellSpeed,this.nextField.maximumCellSpeed))}validateStep(e,t=1){let n=this.elapsedTime+e*t;if(!Number.isFinite(e)||e<0||e>1/30||!Number.isInteger(t)||t<1||t>4096||!Number.isFinite(n)||this.timeRange&&n>(this.timeRange[1]-this.timeRange[0])*1.000000000001)throw Error(`ScientificFlowCompute requires a bounded timestep within its interval`)}encode(e,t,n=1){this.validateStep(t,n);let[r,i,a,o]=this.field.field.bounds,s=new ArrayBuffer(64),c=new DataView(s);[r,i,a-r,o-i,t,this.lifetime,+(this.integrator===`rk4`),0].forEach((e,t)=>c.setFloat32(t*4,e,!0)),[this.particleCount,this.field.field.coordinates===`lnglat`|(this.field.periodicLongitude?2:0)|(this.field.layout===`c-grid`?8:0),this.seed,this.frame].forEach((e,t)=>c.setUint32(32+t*4,e,!0));let l=this.timeRange?this.timeRange[1]-this.timeRange[0]:1;[this.timeRange?this.elapsedTime/l:0,this.timeRange?Math.min(1,(this.elapsedTime+t*n)/l):0,n,0].forEach((e,t)=>c.setFloat32(48+t*4,e,!0)),this.uniforms.write(new Uint8Array(s)),this.kernel.dispatch(e,{x:Math.ceil(this.particleCount/128),bindings:{parameters:this.uniforms,previous:this.state[this.current],next:this.state[1-this.current],velocityField:this.field.texture,nextVelocityField:this.nextField.texture}}),this.current=1-this.current,this.frame=this.frame+n>>>0;let u=t*n-this.timeCompensation,d=this.elapsedTime+u;this.timeCompensation=d-this.elapsedTime-u,this.elapsedTime=d,this.timeRange&&Math.abs(this.elapsedTime-l)<=1e-12*l&&(this.elapsedTime=l,this.timeCompensation=0)}get output(){return this.state[this.current]}get previous(){return this.state[1-this.current]}step(e){this.validateStep(e);let t=this.device.createCommandEncoder(),n=t.beginComputePass();return this.encode(n,e),n.end(),this.device.submit(t.finish()),this.output}destroy(){this.kernel.destroy(),this.uniforms.destroy();for(let e of this.state)e.destroy()}},ea=class{currentField;fieldOptions;nextField;simulation;commandGraph;device;constructor(e,t){if(this.device=e,this.fieldOptions={bounds:t.bounds,coordinates:t.coordinates,periodicLongitude:t.periodicLongitude},!!t.nextInput!=!!t.timeRange)throw Error(`nextInput and timeRange must be supplied together`);this.currentField=new d(e,t),this.nextField=this.field;let n;try{t.nextInput&&(this.nextField=new d(e,{...t,input:t.nextInput})),n=this.simulation=new $i(e,this.field,{particleCount:t.particleCount??65536,lifetime:t.lifetime??20,seed:t.seed??1,integrator:t.integrator}),t.timeRange&&this.simulation.setTimeInterval(this.field,this.nextField,t.timeRange);let r=new m(e,{id:`scientific-flow`}),i=this.simulation.output.byteLength,a=r.importBuffer({id:`flow-previous`,byteLength:i,usage:k.STORAGE}),o=r.importBuffer({id:`flow-next`,byteLength:i,usage:k.STORAGE}),s=r.importBuffer({id:`flow-uniforms`,byteLength:64,usage:k.UNIFORM},this.simulation.uniforms),c={width:this.field.texture.width,height:this.field.texture.height,format:`rgba32float`,usage:O.SAMPLE},l=r.importTexture({id:`flow-velocity`,...c}),u=r.importTexture({id:`flow-next-velocity`,...c});r.addComputePass({id:`advect-particles`,resources:[{buffer:s,usage:`uniform`},{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-write`},{texture:l,usage:`sampled`},{texture:u,usage:`sampled`}],workload:{operation:`RungeKuttaAdvection`,commandCount:1,maximumWorkgroupCount:Math.ceil(this.simulation.particleCount/128),maximumInvocationCount:Math.ceil(this.simulation.particleCount/128)*128,readByteLength:i,writeByteLength:i},compile:()=>({encode:({computePass:e,parameters:t})=>this.simulation.encode(e,t.deltaTime,t.substeps)})}),this.commandGraph=r.compile()}catch(e){throw n?.destroy(),this.field.destroy(),this.nextField.destroy(),e}}encode(e,t){this.simulation.encode(e,t)}step(e){this.simulation.validateStep(e);let t=this.device.createCommandEncoder();return this.record(t,e),this.device.submit(t.finish()),this.output}record(e,t,n=1){return this.simulation.validateStep(t,n),this.commandGraph.encode(e,{parameters:{deltaTime:t,substeps:n},textures:{"flow-velocity":this.field.texture,"flow-next-velocity":this.nextField.texture},buffers:{"flow-previous":this.output,"flow-next":this.previous}})}get field(){return this.currentField}get time(){return this.simulation.time}get remainingTime(){return this.simulation.remainingTime}advance(e){let t=Math.max(1,Math.ceil(e/this.simulation.maximumTimeStep)),n=e/t;this.simulation.validateStep(n,t);let r=this.device.createCommandEncoder();return this.record(r,n,t),this.device.submit(r.finish()),this.output}setNextSnapshot(e,t){if(this.nextField===this.field)throw Error(`A temporal field pair is required`);let n=new d(this.device,{input:e,...this.fieldOptions});try{this.simulation.setTimeInterval(this.nextField,n,[this.time,t])}catch(e){throw n.destroy(),e}this.field.destroy(),this.currentField=this.nextField,this.nextField=n}get output(){return this.simulation.output}get previous(){return this.simulation.previous}destroy(){this.commandGraph.destroy(),this.simulation.destroy(),this.field.destroy(),this.nextField.destroy()}},ta=class{texture;maximumSpeed;constructor(e,t){let[n,r]=t.shape;w(e.type===`webgpu`),w(Number.isInteger(r)&&Number.isInteger(n)&&r>=3&&n>=3),w(r<=e.limits.maxTextureDimension2D&&n<=e.limits.maxTextureDimension2D),w(r*n<=4194304&&t.velocity.length===r*n*3);let i=new Float32Array(r*n*4),a=0;for(let e=0;e<r*n;e++){let n=t.velocity[e*3],r=t.velocity[e*3+1],o=t.velocity[e*3+2];w(Number.isFinite(n)&&Number.isFinite(r)&&Number.isFinite(o)),i.set([n,r,o,1],e*4),a=Math.max(a,Math.hypot(n,r,o))}let o=Math.max(1,a)*1e-6;for(let e=0;e<n;e++)for(let i=0;i<r;i++)if(!(i!==r-1&&e!==0&&e!==n-1))for(let n=0;n<3;n++)w(Math.abs(t.velocity[(e*r+i)*3+n]-t.velocity[e*r*3+n])<=o);this.maximumSpeed=a,this.texture=e.createTexture({id:`spherical-flow-field`,width:r,height:n,format:`rgba32float`,data:i,usage:O.SAMPLE|O.COPY_DST})}destroy(){this.texture.destroy()}},na=`
struct Parameters {integration: vec4f, counts: vec4u};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read> previous: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> next: array<vec4f>;
@group(0) @binding(3) var velocityField: texture_2d<f32>;
@group(0) @binding(4) var nextVelocityField: texture_2d<f32>;

const PI: f32 = 3.141592653589793;
fn sampleSnapshot(field: texture_2d<f32>, position: vec3f) -> vec3f {
  // Longitude is immaterial at an exact pole: all samples there are identical.
  var longitude = 0.0;
  if (dot(position.xy, position.xy) > 1e-20) {longitude = atan2(position.y, position.x);}
  let coordinates = vec2f(fract(longitude / (2.0 * PI) + 0.5), 0.5 + atan2(position.z, length(position.xy)) / PI);
  let dimensions = vec2i(textureDimensions(field));
  let grid = coordinates * vec2f(dimensions - 1);
  let lower = vec2i(floor(grid));
  let upper = min(lower + 1, dimensions - 1);
  let fraction = fract(grid);
  return mix(mix(textureLoad(field, lower, 0).xyz, textureLoad(field, vec2i(upper.x, lower.y), 0).xyz, fraction.x),
    mix(textureLoad(field, vec2i(lower.x, upper.y), 0).xyz, textureLoad(field, upper, 0).xyz, fraction.x), fraction.y);
}

fn derivative(position: vec3f, fraction: f32) -> vec3f {
  let normal = normalize(position);
  let velocity = mix(sampleSnapshot(velocityField, normal), sampleSnapshot(nextVelocityField, normal), fraction);
  return (velocity - dot(velocity, normal) * normal) * parameters.integration.y;
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= parameters.counts.x) {return;}
  let initial = previous[index];
  var position = initial.xyz;
  let deltaTime = parameters.integration.x;
  for (var substep = 0u; substep < parameters.counts.y; substep++) {
    let start = mix(parameters.integration.z, parameters.integration.w, f32(substep) / f32(parameters.counts.y));
    let middle = mix(parameters.integration.z, parameters.integration.w, (f32(substep) + 0.5) / f32(parameters.counts.y));
    let end = mix(parameters.integration.z, parameters.integration.w, f32(substep + 1u) / f32(parameters.counts.y));
    let first = derivative(position, start);
    let second = derivative(position + first * deltaTime * 0.5, middle);
    if (parameters.counts.z == 4u) {
      let third = derivative(position + second * deltaTime * 0.5, middle);
      let fourth = derivative(position + third * deltaTime, end);
      position = normalize(position + (first + 2.0 * second + 2.0 * third + fourth) * deltaTime / 6.0);
    } else {position = normalize(position + second * deltaTime);}
  }
  next[index] = vec4f(position, initial.w + deltaTime * f32(parameters.counts.y));
}
`,ra=class{particleCount;radius;integrator;commandGraph;device;states;uniforms;kernel;stepLimit;currentField;nextField;current=0;interval;elapsed=0;compensation=0;constructor(e,t){w(e.type===`webgpu`),w(Number.isFinite(t.radius)&&t.radius>0),w(t.positions.length>0&&t.positions.length%3==0),w(!!t.nextInput==!!t.timeRange),t.timeRange&&w(t.timeRange.every(Number.isFinite)&&t.timeRange[1]>t.timeRange[0]),this.device=e,this.radius=t.radius,this.particleCount=t.positions.length/3,this.integrator=t.integrator??`rk4`,this.stepLimit=t.maximumTimeStep,w(Number.isFinite(this.stepLimit)&&this.stepLimit>0),w(this.particleCount<=1048576&&this.particleCount*16<=e.limits.maxStorageBufferBindingSize),this.interval=t.timeRange?[...t.timeRange]:void 0;let n=new Float32Array(this.particleCount*4);for(let e=0;e<this.particleCount;e++){let r=t.positions[e*3],i=t.positions[e*3+1],a=t.positions[e*3+2],o=Math.hypot(r,i,a);w(Number.isFinite(o)&&o>0),n.set([r/o,i/o,a/o,0],e*4)}let r=[],i=e=>(r.push(e),e);try{this.currentField=i(new ta(e,t.input)),this.nextField=t.nextInput?i(new ta(e,t.nextInput)):this.currentField,w(this.currentField.texture.width===this.nextField.texture.width&&this.currentField.texture.height===this.nextField.texture.height),this.states=[0,1].map(t=>i(e.createBuffer({id:`spherical-particles-${t}`,data:n,usage:k.STORAGE|k.COPY_SRC|k.COPY_DST}))),this.uniforms=i(e.createBuffer({id:`spherical-parameters`,byteLength:32,usage:k.UNIFORM|k.COPY_DST})),this.kernel=i(new o(e,{id:`spherical-advection`,source:na,shaderLayout:{bindings:[{name:`parameters`,type:`uniform`,group:0,location:0},{name:`previous`,type:`read-only-storage`,group:0,location:1},{name:`next`,type:`storage`,group:0,location:2},{name:`velocityField`,type:`texture`,group:0,location:3,sampleType:`unfilterable-float`},{name:`nextVelocityField`,type:`texture`,group:0,location:4,sampleType:`unfilterable-float`}]}}));let r=new m(e,{id:`spherical-flow`}),a=r.importBuffer({id:`sphere-previous`,byteLength:n.byteLength,usage:k.STORAGE}),s=r.importBuffer({id:`sphere-next`,byteLength:n.byteLength,usage:k.STORAGE}),c=r.importBuffer({id:`sphere-uniforms`,byteLength:32,usage:k.UNIFORM},this.uniforms),l={width:this.currentField.texture.width,height:this.currentField.texture.height,format:`rgba32float`,usage:O.SAMPLE},u=r.importTexture({id:`sphere-field`,...l}),d=r.importTexture({id:`sphere-next-field`,...l});r.addComputePass({id:`advect-sphere`,resources:[{buffer:a,usage:`storage-read`},{buffer:s,usage:`storage-write`},{buffer:c,usage:`uniform`},{texture:u,usage:`sampled`},{texture:d,usage:`sampled`}],workload:{operation:`SphericalRungeKutta`,commandCount:1,maximumWorkgroupCount:Math.ceil(this.particleCount/128),maximumInvocationCount:Math.ceil(this.particleCount/128)*128,readByteLength:n.byteLength,writeByteLength:n.byteLength},compile:()=>({encode:({computePass:e})=>this.kernel.dispatch(e,{x:Math.ceil(this.particleCount/128),bindings:{parameters:this.uniforms,previous:this.output,next:this.previous,velocityField:this.currentField.texture,nextVelocityField:this.nextField.texture}})})}),this.commandGraph=i(r.compile())}catch(e){for(let e of r.reverse())e.destroy();throw e}}get output(){return this.states[this.current]}get previous(){return this.states[1-this.current]}get time(){return(this.interval?.[0]??0)+this.elapsed}get remainingTime(){return this.interval?this.interval[1]-this.interval[0]-this.elapsed:1/0}get maximumTimeStep(){let e=Math.min(Math.PI/(this.currentField.texture.height-1),2*Math.PI/(this.currentField.texture.width-1));return Math.min(this.stepLimit,.5*e*this.radius/Math.max(this.currentField.maximumSpeed,this.nextField.maximumSpeed))}record(e,t,n=1){w(Number.isFinite(t)&&t>=0&&t<=this.maximumTimeStep*1.000000000001),w(Number.isInteger(n)&&n>=1&&n<=4096);let r=t*n;w(Number.isFinite(r)&&r<=this.remainingTime*1.000000000001);let i=this.interval?this.interval[1]-this.interval[0]:1,a=new ArrayBuffer(32),o=new DataView(a);[t,1/this.radius,this.interval?this.elapsed/i:0,this.interval?Math.min(1,(this.elapsed+r)/i):0].forEach((e,t)=>o.setFloat32(t*4,e,!0)),[this.particleCount,n,this.integrator===`rk4`?4:2,0].forEach((e,t)=>o.setUint32(16+t*4,e,!0)),this.uniforms.write(new Uint8Array(a));let s=this.commandGraph.encode(e,{parameters:void 0,buffers:{"sphere-previous":this.output,"sphere-next":this.previous},textures:{"sphere-field":this.currentField.texture,"sphere-next-field":this.nextField.texture}});this.current=1-this.current;let c=r-this.compensation,l=this.elapsed+c;return this.compensation=l-this.elapsed-c,this.elapsed=l,this.interval&&Math.abs(this.elapsed-i)<=1e-12*i&&(this.elapsed=i,this.compensation=0),s}advance(e){w(Number.isFinite(e)&&e>=0&&e<=this.remainingTime*1.000000000001);let t=Math.min(e,this.remainingTime),n=Math.max(1,Math.ceil(t/this.maximumTimeStep));w(Number.isSafeInteger(n));let r=t/n;for(let e=0;e<n;){let t=Math.min(4096,n-e),i=this.device.createCommandEncoder();this.record(i,Math.min(r,this.remainingTime/t),t),this.device.submit(i.finish()),e+=t}return this.output}setNextSnapshot(e,t){w(this.interval&&this.remainingTime===0&&Number.isFinite(t)&&t>this.time);let n=new ta(this.device,e);(n.texture.width!==this.currentField.texture.width||n.texture.height!==this.currentField.texture.height)&&(n.destroy(),w(!1));let r=this.time;this.currentField.destroy(),this.currentField=this.nextField,this.nextField=n,this.interval=[r,t],this.elapsed=0,this.compensation=0}destroy(){this.commandGraph.destroy(),this.kernel.destroy(),this.uniforms.destroy();for(let e of this.states)e.destroy();this.currentField.destroy(),this.nextField!==this.currentField&&this.nextField.destroy()}},ia=`
struct Settings {viewport: vec4f, orbit: vec4f, history: vec4u, style: vec4f};
@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var<storage, read> frames: array<vec4f>;
const CORNERS = array<vec2f, 6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
struct Vertex {
  @builtin(position) position: vec4f,
  @location(0) depth: f32,
  @location(1) edge: f32,
  @location(2) opacity: f32,
  @location(3) color: vec3f
};
fn camera(position: vec3f) -> vec3f {
  let longitude = settings.orbit.x;
  let pitch = settings.orbit.y;
  let horizontal = position.y * cos(longitude) - position.x * sin(longitude);
  let forward = position.x * cos(longitude) + position.y * sin(longitude);
  return vec3f(horizontal, position.z * cos(pitch) - forward * sin(pitch),
    position.z * sin(pitch) + forward * cos(pitch));
}
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> Vertex {
  let selected = instance % settings.history.w;
  var seed = selected * 747796405u + 2891336453u;
  seed = ((seed >> ((seed >> 28u) + 4u)) ^ seed) * 277803737u;
  seed = (seed >> 22u) ^ seed;
  let stride = u32(settings.style.w);
  let particle = min(selected * stride + seed % stride, settings.history.x - 1u);
  let segment = instance / settings.history.w;
  let firstSlot = (settings.history.y + segment) % settings.history.z;
  let secondSlot = (firstSlot + 1u) % settings.history.z;
  let first = frames[firstSlot * settings.history.x + particle];
  let second = frames[secondSlot * settings.history.x + particle];
  let corner = CORNERS[vertex % 6u];
  let lower = f32(vertex / 6u) / 4.0;
  let upper = lower + 0.25;
  // Normalized linear interpolation stays on the short great circle; subdivision
  // avoids a straight screen-space chord and does not introduce a longitude seam.
  let start = camera(normalize(mix(first.xyz, second.xyz, lower)));
  let end = camera(normalize(mix(first.xyz, second.xyz, upper)));
  let center = mix(start, end, corner.x);
  let direction = end.xy - start.xy;
  let normal = vec2f(-direction.y, direction.x) / max(length(direction), 1e-8);
  let scale = min(settings.viewport.x, settings.viewport.y) * 0.82;
  var output: Vertex;
  output.position = vec4f(center.xy * scale / settings.viewport.xy + normal * corner.y * settings.viewport.z / settings.viewport.xy, 0, 1);
  output.depth = center.z;
  output.edge = corner.y;
  let age = settings.orbit.z - mix(first.w, second.w, mix(lower, upper, corner.x));
  output.opacity = exp(-3.0 * age / max(settings.orbit.w, 1e-6)) * settings.viewport.w;
  // Undefined antipodal arcs and stationary samples must not produce ribbons.
  if (dot(first.xyz, second.xyz) < 0.0 || length(direction) < 1e-8) {output.opacity = 0.0;}
  let speed = length(second.xyz - first.xyz) / max(second.w - first.w, 1e-6);
  let cold = mix(vec3f(0.05,0.16,0.42),vec3f(0.07,0.8,0.85),smoothstep(0.0,0.15,speed));
  output.color = mix(cold,vec3f(1.0,0.68,0.3),smoothstep(0.15,0.3,speed));
  return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  if (input.depth < 0.0) {discard;}
  return vec4f(input.color, clamp(input.opacity * (1.0 - abs(input.edge)), 0.0, 0.85));
}`,aa=class{device;particleCount;history;model;settings;stride;renderedCount;constructor(e,t){this.device=e,this.particleCount=t,w(Number.isSafeInteger(t)&&t>0),this.stride=Math.ceil(t/8192),this.renderedCount=Math.ceil(t/this.stride),this.history=new u(e,{particleCount:t,capacity:Math.min(24,Math.floor(e.limits.maxStorageBufferBindingSize/(t*16)))}),this.settings=e.createBuffer({byteLength:64,usage:k.UNIFORM|k.COPY_DST}),this.model=new Gi(e,{id:`spherical-geodesic-trails`,source:ia,vertexCount:24,shaderLayout:{attributes:[],bindings:[{name:`settings`,type:`uniform`,group:0,location:0},{name:`frames`,type:`read-only-storage`,group:0,location:1,visibility:1}]},bindings:{settings:this.settings,frames:this.history.buffer},parameters:{blend:!0,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,depthWriteEnabled:!1}})}capture(e,t,n){let r=this.history.frames.at(-1);if(r&&t-r.time<n/(this.history.capacity-1))return;let i=this.device.createCommandEncoder();this.history.record(i,e,t),this.device.submit(i.finish())}draw(e,t){let n=this.history.frames;if(n.length<2)return;let r=new Float32Array(16);r.set([t.width,t.height,t.widthPixels,t.exposure,t.longitude,t.latitude,t.time,t.duration]),new Uint32Array(r.buffer).set([this.particleCount,n[0].byteOffset/this.history.frameByteLength,this.history.capacity,this.renderedCount],8),r[15]=this.stride,this.settings.write(r),this.model.setInstanceCount(this.renderedCount*(n.length-1)),this.model.draw(e)}destroy(){this.model.destroy(),this.settings.destroy(),this.history.destroy()}};function oa(e,t=0){let n=new Float32Array(256*256),r=new Float32Array(256*256);for(let i=0;i<256;i++)for(let a=0;a<256;a++){let o=a/255,s=i/255,c=i*256+a;if(e===`weather`){let e=o*Math.PI*2,i=(s-.5)*Math.PI,a=e*3-t*.12,l=i+.12*Math.sin(a),u=Math.cos(i)**2;n[c]=u*(.035+.055*Math.sin(l*5)),r[c]=u*.012*Math.cos(a)*Math.cos(i*2);let d=Math.min(1,Math.max(0,(Math.abs(i)-.7)/.65)),f=d*d*(3-2*d),p=i>=0?1:-1,m=e*3-p*t*.18;n[c]+=p*f*(.06+.018*Math.cos(m)),r[c]+=f*Math.cos(i)*.012*Math.sin(m);for(let[e,i,a]of[[.22,.68,1],[.57,.3,-1],[.78,.72,1],[.4,.4,-1]]){let l=(o-(e+.025*Math.sin(t*.09+e*8))+1.5)%1-.5,d=s-i-.025*Math.sin(t*.11),f=a*1.7*Math.exp(-(l**2+d**2)/.006);n[c]-=d*f*u,r[c]+=l*f*u}}else if(e===`jet`){let e=(s-(.5+.16*Math.sin(o*Math.PI*4)))*10;n[c]=.14/Math.cosh(e)**2,r[c]=n[c]*.64*Math.PI*Math.cos(o*Math.PI*4)}else if(e===`vortex`)for(let e of[.32,.68]){let t=o-e,i=s-.5,a=(e<.5?1:-1)*.012/(t**2+i**2+.015);n[c]-=i*a,r[c]+=t*a}else{let e=.25*Math.sin(2*Math.PI*t/10),i=2*o,a=e*i**2+(1-2*e)*i,l=2*e*i+1-2*e;n[c]=-.13*Math.sin(Math.PI*a)*Math.cos(Math.PI*s),r[c]=.26*Math.cos(Math.PI*a)*Math.sin(Math.PI*s)*l}}return{dimensions:[`y`,`x`],shape:[256,256],eastward:n,northward:r,valid:new Uint8Array(256*256).fill(1)}}function sa(){let e=new Float32Array(1056),t=new Float32Array(1056);function n(e,t){return e===0||t===0||e===32||t===32?0:Math.sin(e*Math.PI/32)*Math.sin(t*Math.PI/32)*.06}for(let r=0;r<=32;r++)for(let i=0;i<=32;i++)r<32&&(e[r*33+i]=-32*(n(i,r+1)-n(i,r))),i<32&&(t[r*32+i]=32*(n(i+1,r)-n(i,r)));return{layout:`c-grid`,shape:[32,32],eastward:e,northward:t,eastwardValid:new Uint8Array(e.length).fill(1),northwardValid:new Uint8Array(t.length).fill(1)}}function ca(e){let t=new Float32Array(8385*3),n=[.12*Math.sin(e*.08),.22,.08*Math.cos(e*.08)];for(let e=0;e<65;e++){let r=-Math.PI/2+e/64*Math.PI;for(let i=0;i<129;i++){let a=-Math.PI+i/128*2*Math.PI,o=Math.cos(r)*Math.cos(a),s=Math.cos(r)*Math.sin(a),c=Math.sin(r);t.set([n[1]*c-n[2]*s,n[2]*o-n[0]*c,n[0]*s-n[1]*o],(e*129+i)*3)}}return{shape:[65,129],velocity:t}}function la(e){let t=new Float32Array(e*3);for(let n=0;n<e;n++){let r=1-2*(n+.5)/e,i=n*Math.PI*(3-Math.sqrt(5)),a=Math.sqrt(1-r*r);t.set([a*Math.cos(i),a*Math.sin(i),r],n*3)}return t}var ua=`// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma, Buffer, Texture, type Framebuffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Model, loadImageBitmap} from '@luma.gl/engine';
import earthTextureUrl from '../../showcase/globe/earth.jpg';
import {GLOBE_PRESENTATION} from './globe';
import {SphericalTrails} from './spherical-trails';
import {
  SphericalFlowGraph,
  ScientificFlowGraph,
  ScientificFlowTracer,
  type ScientificFlowTraceResult
} from '@luma.gl/graph/experimental-simulation';
import {makeField} from './fields';
import {makeStaggeredGyre} from './staggered-field';
import {makeSphericalField, makeSphericalPositions} from './spherical-field';
import {ObservatoryControlPanel} from './control-panel';
import './style.css';

function element<ElementType extends HTMLElement>(identifier: string): ElementType {
  return document.querySelector<ElementType>('#' + identifier)!;
}
const canvas = element<HTMLCanvasElement>('flow');
const status = element<HTMLElement>('status');
const source = /* wgsl */ \`
struct View {size: vec4f, options: vec4f};
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> current: array<vec4f>;
@group(0) @binding(2) var<storage, read> previous: array<vec4f>;
@group(0) @binding(3) var<storage, read> diagnostics: array<vec4f>;
const CORNERS = array<vec2f, 6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
struct Vertex {@builtin(position) position: vec4f, @location(0) color: vec3f, @location(1) edge: vec2f};
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> Vertex {
  let particleCount = arrayLength(&current);
  let index = instance % particleCount;
  var wrapOffset = 0.0;
  if (instance >= particleCount) {wrapOffset = select(-1.0, 1.0, previous[index].x < 0.5);}
  var particle = current[index];
  var before = previous[index];
  if (instance >= particleCount) {wrapOffset = select(-1.0, 1.0, before.x < 0.5);}
  var displacement = particle.xy - before.xy;
  if (view.options.z > 0.5) {displacement.x -= round(displacement.x);}
  let velocity = length(displacement) / max(particle.z - before.z, 0.00001) * select(1.0, 3.0, view.options.z > 0.5);
  let corner = CORNERS[vertex];
  let aspect = view.size.x / view.size.y;
  let extent = select(1.8 * vec2f(min(1.0, 1.0 / aspect), min(1.0, aspect)), vec2f(2.0), view.options.z > 0.5);
  let direction = displacement * extent * view.size.xy;
  let normal = vec2f(-direction.y, direction.x) / max(length(direction), 0.001);
  var output: Vertex;
  let center = before.xy + displacement * corner.x + vec2f(wrapOffset, 0);
  output.position = vec4f((center - 0.5) * extent + normal * corner.y * view.size.z / view.size.xy, 0, 1);
  if (particle.z < 0.0 || particle.w != before.w) {output.position = vec4f(3,3,0,1);}
  let cold = mix(vec3f(0.05,0.16,0.42),vec3f(0.07,0.8,0.85),smoothstep(0.0,0.15,velocity));
  output.color = mix(cold,vec3f(1.0,0.68,0.3),smoothstep(0.15,0.3,velocity));
  if (view.options.y > 0.5) {
    let particleDiagnostics = diagnostics[index];
    if (view.options.x > 0.5 && view.options.x < 1.5) {
      let stepScale = clamp(log2(max(particleDiagnostics.w, 0.0001) / 0.0001) / log2(10000.0), 0.0, 1.0);
      output.color = mix(vec3f(0.7,0.12,0.7), vec3f(0.2,1.0,0.65), stepScale);
    }
    if (particleDiagnostics.z > 0.5) {
      output.position = vec4f((particle.xy + vec2f(wrapOffset, 0) - 0.5) * extent + vec2f((corner.x - 0.5) * 2.0, corner.y) * 3.0 / view.size.xy, 0, 1);
      output.color = vec3f(1.0,0.45,0.12);
      if (particleDiagnostics.z == 1.0) {output.color = vec3f(0.5);}
      if (particleDiagnostics.z == 3.0) {output.color = vec3f(0.85,0.2,0.85);}
      if (particleDiagnostics.z >= 4.0) {output.color = vec3f(1.0,0.1,0.15);}
    } else if (view.options.x > 1.5) {output.color = vec3f(0.2,1.0,0.65);}
  }
  output.color *= view.size.w * (0.25 + 0.75 * min(particle.z, 1.0));
  output.edge = corner;
  return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  let opacity = (1.0 - abs(input.edge.y)) * (0.35 + 0.65 * input.edge.x);
  return vec4f(input.color * opacity, 1);
}\`;

try {
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {canvas, autoResize: true},
    onError: error => {
      throw error;
    }
  });
  const view = device.createBuffer({byteLength: 32, usage: Buffer.UNIFORM | Buffer.COPY_DST});
  let history: Framebuffer;
  let historyTexture: Texture;
  let historyWidth = 0;
  let historyHeight = 0;
  const fullscreen = \`
struct Vertex {@builtin(position) position: vec4f};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> Vertex {
 let corners = array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
 var output: Vertex; output.position = vec4f(corners[index],0,1); return output;
}
\`;
  const fade = new Model(device, {
    id: 'fade-trails',
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'view', type: 'uniform', group: 0, location: 0}]
    },
    bindings: {view},
    source:
      fullscreen +
      \`
struct View {size: vec4f, options: vec4f};
@group(0) @binding(0) var<uniform> view: View;
@fragment fn fragmentMain() -> @location(0) vec4f {return vec4f(0.018,0.035,0.055,view.options.w);}\`,
    vertexCount: 3,
    parameters: {
      blend: true,
      blendColorSrcFactor: 'src-alpha',
      blendColorDstFactor: 'one-minus-src-alpha',
      depthWriteEnabled: false
    }
  });
  const earthImage = await loadImageBitmap(earthTextureUrl);
  const earthTexture = device.createTexture({
    id: 'weather-earth',
    width: earthImage.width,
    height: earthImage.height,
    data: earthImage,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge'
    }
  });
  earthImage.close();
  const presentation = device.createBuffer({
    byteLength: 32,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const present = new Model(device, {
    id: 'present-trails',
    source: fullscreen + GLOBE_PRESENTATION,
    vertexCount: 3,
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'history', type: 'texture', group: 0, location: 0},
        {name: 'earth', type: 'texture', group: 0, location: 1},
        {name: 'presentation', type: 'uniform', group: 0, location: 3}
      ]
    },
    bindings: {earth: earthTexture, presentation}
  });
  let globeLongitude = -0.4;
  let globeLatitude = 0;
  let dragPosition: {horizontal: number; vertical: number} | undefined;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', event => {
    if (controls.settings.field !== 'weather' && controls.settings.field !== 'spherical') return;
    dragPosition = {horizontal: event.clientX, vertical: event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (dragPosition === undefined) return;
    globeLongitude -= (event.clientX - dragPosition.horizontal) * 0.006;
    globeLatitude = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, globeLatitude + (event.clientY - dragPosition.vertical) * 0.006)
    );
    dragPosition = {horizontal: event.clientX, vertical: event.clientY};
  });
  const finishDrag = () => {
    dragPosition = undefined;
  };
  canvas.addEventListener('pointerup', finishDrag);
  canvas.addEventListener('pointercancel', finishDrag);
  canvas.addEventListener('lostpointercapture', finishDrag);
  function resizeHistory() {
    if (history && historyWidth === canvas.width && historyHeight === canvas.height) return;
    history?.destroy();
    historyTexture?.destroy();
    historyWidth = canvas.width;
    historyHeight = canvas.height;
    historyTexture = device.createTexture({
      width: historyWidth,
      height: historyHeight,
      format: 'rgba16float',
      usage: Texture.RENDER | Texture.SAMPLE
    });
    history = device.createFramebuffer({colorAttachments: [historyTexture]});
    const clear = device.beginRenderPass({
      framebuffer: history,
      clearColor: [0.018, 0.035, 0.055, 1]
    });
    clear.end();
    device.submit();
    present.setBindings({history: historyTexture});
  }
  let graph: ScientificFlowGraph | ScientificFlowTracer | SphericalFlowGraph;
  let activeField = 'gyre';
  let activeIntegrator = 'rk4';
  let activeCount = 262144;
  let restartRequested = false;
  let queuedTime = 0;
  let graphSamples = 0;
  let traceResult: ScientificFlowTraceResult | undefined;
  let particles: Model;
  /** GPU history for the spherical preset, independent of the screen atlas. */
  let sphericalTrails: SphericalTrails | undefined;
  const controls = new ObservatoryControlPanel(
    element<HTMLElement>('observatory-panels'),
    restart => {
      restartRequested ||= restart;
      updateLegend();
    },
    () => {
      restartRequested = true;
    }
  );
  function updateLegend() {
    const mode = activeIntegrator === 'rk45' ? controls.settings.coloring : 'speed';
    element<HTMLElement>('legend-low').textContent =
      mode === 'step' ? 'SHORT STEP' : mode === 'status' ? 'ACTIVE' : 'LOW VELOCITY';
    element<HTMLElement>('legend-high').textContent =
      mode === 'step' ? 'LONG STEP' : mode === 'status' ? 'STOPPED' : 'HIGH';
    element<HTMLElement>('legend-ramp').style.background =
      mode === 'step'
        ? 'linear-gradient(90deg,#b31fb3,#33ffa6)'
        : mode === 'status'
          ? 'linear-gradient(90deg,#33ffa6,#888,#ff731f,#d933d9,#ff1a26)'
          : 'linear-gradient(90deg,#164d9b,#24d8db,#c7e9a0,#ffb365)';
  }
  let snapshotEnd = 0.25;
  let previousFrame = performance.now();
  function restart() {
    controls.resetGraphDiagnostics();
    graphSamples = 0;
    particles?.destroy();
    sphericalTrails?.destroy();
    sphericalTrails = undefined;
    graph?.destroy();
    snapshotEnd = 0.25;
    previousFrame = performance.now();
    activeField = controls.settings.field;
    activeIntegrator = controls.settings.integrator;
    activeCount = controls.settings.particleCount;
    queuedTime = 0;
    traceResult = undefined;
    const fields = {
      input: activeField === 'c-grid' ? makeStaggeredGyre() : makeField(activeField, 0),
      ...(activeField === 'gyre' || activeField === 'weather'
        ? {nextInput: makeField(activeField, snapshotEnd), timeRange: [0, snapshotEnd] as const}
        : {}),
      bounds: [0, 0, 1, 1] as const,
      periodicLongitude: activeField === 'weather',
      lifetime: 45
    };
    if (activeField === 'spherical') {
      graph = new SphericalFlowGraph(device, {
        input: makeSphericalField(0),
        nextInput: makeSphericalField(snapshotEnd),
        timeRange: [0, snapshotEnd],
        positions: makeSphericalPositions(activeCount),
        maximumTimeStep: 1 / 30,
        radius: 1,
        integrator: activeIntegrator === 'rk2' ? 'rk2' : 'rk4'
      });
      sphericalTrails = new SphericalTrails(device, activeCount);
      sphericalTrails.capture(graph.output, graph.time, controls.settings.trailPersistence);
    } else if (activeIntegrator === 'rk45') {
      const positions = new Float32Array(activeCount * 2);
      const side = Math.ceil(Math.sqrt(activeCount));
      for (let index = 0; index < activeCount; index++) {
        positions[index * 2] = ((index % side) + 0.5) / side;
        positions[index * 2 + 1] = (Math.floor(index / side) + 0.5) / side;
      }
      graph = new ScientificFlowTracer(device, {
        ...fields,
        positions,
        tolerance: controls.settings.tolerance,
        maximumAttempts: 16,
        scheduling: controls.settings.scheduling,
        dispatchesPerReadback: controls.settings.dispatchesPerReadback
      });
    } else {
      graph = new ScientificFlowGraph(device, {
        ...fields,
        particleCount: activeCount,
        seed: 17,
        integrator: activeIntegrator === 'rk2' ? 'rk2' : 'rk4'
      });
      graph.step(0);
    }
    controls.updateTelemetry({
      time: graph.time,
      queuedTime,
      particleCount: activeCount,
      integrator: activeIntegrator,
      framesPerSecond: 0,
      traceResult
    });
    updateLegend();
    particles = new Model(device, {
      id: 'scientific-flow-streaks',
      source,
      vertexCount: 6,
      instanceCount: controls.settings.particleCount * (activeField === 'weather' ? 2 : 1),
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'view', type: 'uniform', group: 0, location: 0},
          {name: 'current', type: 'read-only-storage', group: 0, location: 1, visibility: 1},
          {name: 'previous', type: 'read-only-storage', group: 0, location: 2, visibility: 1},
          {name: 'diagnostics', type: 'read-only-storage', group: 0, location: 3, visibility: 1}
        ]
      },
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one',
        depthWriteEnabled: false
      }
    });
    historyWidth = 0;
    resizeHistory();
  }
  restart();
  let frames = 0;
  let lastReport = performance.now();
  let animationFrame = 0;
  let stopped = false;
  let currentFrame: Promise<void> | undefined;
  async function animate(now: number) {
    if (stopped) return;
    try {
      if (restartRequested) {
        restart();
        restartRequested = false;
      }
      // Discard long background-tab gaps; normal playback follows elapsed wall time.
      const frameSeconds = Math.min(0.1, Math.max(0, (now - previousFrame) / 1000));
      let deltaTime = frameSeconds * controls.settings.timeScale;
      previousFrame = now;
      resizeHistory();
      controls.redraw();
      if (!controls.settings.paused) {
        queuedTime += deltaTime;
        let firstSegment = true;
        while (queuedTime > 0 || (graph instanceof ScientificFlowTracer && graph.hasPendingWork)) {
          if (
            (activeField === 'gyre' || activeField === 'weather' || activeField === 'spherical') &&
            graph.remainingTime === 0 &&
            !(graph instanceof ScientificFlowTracer && graph.hasPendingWork)
          ) {
            snapshotEnd += 0.25;
            if (graph instanceof SphericalFlowGraph)
              graph.setNextSnapshot(makeSphericalField(snapshotEnd), snapshotEnd);
            else graph.setNextSnapshot(makeField(activeField, snapshotEnd), snapshotEnd);
          }
          deltaTime =
            activeField === 'gyre' || activeField === 'weather' || activeField === 'spherical'
              ? Math.min(queuedTime, graph.remainingTime)
              : queuedTime;
          if (graph instanceof ScientificFlowTracer) {
            if (graph.hasPendingWork) traceResult = await graph.continue();
            else {
              queuedTime -= deltaTime;
              traceResult = await graph.advance(deltaTime);
            }
            /** Every dispatch in the batch contributes a separate inspectable trace. */
            for (const encoding of traceResult.encodings)
              controls.diagnostics.record(graph.commandGraph, encoding);
          } else {
            const substeps = Math.max(
              1,
              Math.ceil(
                deltaTime /
                  (graph instanceof SphericalFlowGraph
                    ? graph.maximumTimeStep
                    : graph.simulation.maximumTimeStep)
              )
            );
            const querySet =
              graphSamples++ % 60 === 0 && device.features.has('timestamp-query')
                ? device.createQuerySet({type: 'timestamp', count: 2})
                : undefined;
            try {
              const encoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
              const encoding = graph.record(encoder, deltaTime / substeps, substeps);
              device.submit(encoder.finish());
              controls.diagnostics.record(graph.commandGraph, encoding, querySet);
            } catch (error) {
              querySet?.destroy();
              throw error;
            }
            queuedTime -= deltaTime;
          }
          if (stopped) return;
          view.write(
            new Float32Array([
              canvas.width,
              canvas.height,
              controls.settings.streakWidth,
              // Dense closed-cell circulation needs less additive exposure than the weather atlas.
              (controls.settings.exposure * 1.2 * 65536 * (activeField === 'c-grid' ? 0.08 : 1)) /
                activeCount,
              controls.settings.coloring === 'step'
                ? 1
                : controls.settings.coloring === 'status'
                  ? 2
                  : 0,
              activeIntegrator === 'rk45' ? 1 : 0,
              activeField === 'spherical' ? 2 : activeField === 'weather' ? 1 : 0,
              1 - Math.exp(-frameSeconds / controls.settings.trailPersistence)
            ])
          );
          particles.setBindings({
            view,
            current: graph.output,
            previous: graph.previous,
            diagnostics: graph instanceof ScientificFlowTracer ? graph.diagnostics : graph.output
          });
          const pass = device.beginRenderPass({framebuffer: history, clearColor: false});
          if (firstSegment) fade.draw(pass);
          if (!sphericalTrails) particles.draw(pass);
          pass.end();
          // Submit this segment before the next advance reuses its state and uniform buffers.
          device.submit();
          firstSegment = false;
          if (graph instanceof ScientificFlowTracer) break; // One bounded dispatch per animation frame.
        }
      }
      if (
        (activeField === 'weather' || activeField === 'spherical') &&
        controls.settings.rotateGlobe &&
        !controls.settings.paused &&
        dragPosition === undefined
      ) {
        globeLongitude += frameSeconds * 0.06;
      }
      presentation.write(
        new Float32Array([
          canvas.width,
          canvas.height,
          globeLongitude,
          activeField === 'spherical' ? 2 : activeField === 'weather' ? 1 : 0,
          globeLatitude,
          0,
          0,
          0
        ])
      );
      const sphericalDuration =
        controls.settings.trailPersistence * Math.max(controls.settings.timeScale, 0.01);
      sphericalTrails?.capture(graph.output, graph.time, sphericalDuration);
      const screen = device.beginRenderPass({clearColor: [0.018, 0.035, 0.055, 1]});
      present.draw(screen);
      if (sphericalTrails) {
        sphericalTrails.draw(screen, {
          width: canvas.width,
          height: canvas.height,
          longitude: globeLongitude,
          latitude: globeLatitude,
          time: graph.time,
          duration: sphericalDuration,
          widthPixels: controls.settings.streakWidth,
          exposure: controls.settings.exposure
        });
      }
      screen.end();
      device.submit();
      frames++;
      if (now - lastReport > 500) {
        status.textContent = \`\${activeCount.toLocaleString()} particles · \${Math.round((frames * 1000) / (now - lastReport))} fps · \${activeIntegrator.toUpperCase()}\${activeField === 'weather' ? ' · synthetic winds · drag to rotate' : ''}\${controls.settings.paused ? ' · paused' : ''}\`;
        controls.updateTelemetry({
          time: graph.time,
          queuedTime,
          particleCount: activeCount,
          integrator: activeIntegrator,
          framesPerSecond: Math.round((frames * 1000) / (now - lastReport)),
          traceResult
        });
        frames = 0;
        lastReport = now;
      }
      animationFrame = requestAnimationFrame(now => {
        currentFrame = animate(now);
      });
    } catch (error) {
      fail(error);
    }
  }
  animationFrame = requestAnimationFrame(now => {
    currentFrame = animate(now);
  });
  window.addEventListener(
    'pagehide',
    () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      // Await the sole in-flight counter readback before releasing GPU resources.
      void (currentFrame ?? Promise.resolve()).then(() => {
        controls.destroy();
        particles.destroy();
        sphericalTrails?.destroy();
        graph.destroy();
        view.destroy();
        fade.destroy();
        present.destroy();
        presentation.destroy();
        earthTexture.destroy();
        history.destroy();
        historyTexture.destroy();
        device.destroy();
      });
    },
    {once: true}
  );
} catch (error) {
  fail(error);
}

function fail(error: unknown) {
  const message = element<HTMLElement>('error');
  message.hidden = false;
  message.textContent = \`The observatory requires WebGPU. Open this example in a browser with WebGPU enabled. \${String(error)}\`;
  status.textContent = 'Simulation unavailable';
}
`,da=`// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ScientificVectorFieldInput} from '@luma.gl/graph/experimental-simulation';

/** Reproducible analytic benchmarks, not observational ocean or weather data. */
export function makeField(name: string, time = 0): ScientificVectorFieldInput {
  const size = 256;
  const eastward = new Float32Array(size * size);
  const northward = new Float32Array(size * size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const horizontal = column / (size - 1);
      const vertical = row / (size - 1);
      const index = row * size + column;
      if (name === 'weather') {
        // Illustrative normalized flow: evolving zonal winds and drifting storm systems.
        const longitude = horizontal * Math.PI * 2;
        const latitude = (vertical - 0.5) * Math.PI;
        const wave = longitude * 3 - time * 0.12;
        const jetLatitude = latitude + 0.12 * Math.sin(wave);
        const envelope = Math.cos(latitude) ** 2;
        eastward[index] = envelope * (0.035 + 0.055 * Math.sin(jetLatitude * 5));
        // Cross-equatorial meanders avoid an artificial latitude-zero transport barrier.
        northward[index] = envelope * 0.012 * Math.cos(wave) * Math.cos(latitude * 2);
        // Angular circulation stays finite at high latitudes: projected speed naturally
        // shrinks with the circumference, without leaving an artificial empty polar cap.
        const polarWeight = Math.min(1, Math.max(0, (Math.abs(latitude) - 0.7) / 0.65));
        const polarEnvelope = polarWeight * polarWeight * (3 - 2 * polarWeight);
        const hemisphere = latitude >= 0 ? 1 : -1;
        const polarWave = longitude * 3 - hemisphere * time * 0.18;
        eastward[index] += hemisphere * polarEnvelope * (0.06 + 0.018 * Math.cos(polarWave));
        northward[index] += polarEnvelope * Math.cos(latitude) * 0.012 * Math.sin(polarWave);
        for (const [centerLongitude, centerLatitude, spin] of [
          [0.22, 0.68, 1],
          [0.57, 0.3, -1],
          [0.78, 0.72, 1],
          [0.4, 0.4, -1]
        ]) {
          const center = centerLongitude + 0.025 * Math.sin(time * 0.09 + centerLongitude * 8);
          const horizontalDistance = ((horizontal - center + 1.5) % 1) - 0.5;
          const verticalDistance = vertical - centerLatitude - 0.025 * Math.sin(time * 0.11);
          const strength =
            spin * 1.7 * Math.exp(-(horizontalDistance ** 2 + verticalDistance ** 2) / 0.006);
          eastward[index] -= verticalDistance * strength * envelope;
          northward[index] += horizontalDistance * strength * envelope;
        }
      } else if (name === 'jet') {
        const center = 0.5 + 0.16 * Math.sin(horizontal * Math.PI * 4);
        const distance = (vertical - center) * 10;
        eastward[index] = 0.14 / Math.cosh(distance) ** 2;
        northward[index] = eastward[index] * 0.64 * Math.PI * Math.cos(horizontal * Math.PI * 4);
      } else if (name === 'vortex') {
        for (const center of [0.32, 0.68]) {
          const horizontalDistance = horizontal - center;
          const verticalDistance = vertical - 0.5;
          const strength =
            ((center < 0.5 ? 1 : -1) * 0.012) /
            (horizontalDistance ** 2 + verticalDistance ** 2 + 0.015);
          eastward[index] -= verticalDistance * strength;
          northward[index] += horizontalDistance * strength;
        }
      } else {
        const oscillation = 0.25 * Math.sin((2 * Math.PI * time) / 10);
        const coordinate = 2 * horizontal;
        const warped = oscillation * coordinate ** 2 + (1 - 2 * oscillation) * coordinate;
        const derivative = 2 * oscillation * coordinate + 1 - 2 * oscillation;
        eastward[index] = -0.13 * Math.sin(Math.PI * warped) * Math.cos(Math.PI * vertical);
        northward[index] =
          0.26 * Math.cos(Math.PI * warped) * Math.sin(Math.PI * vertical) * derivative;
      }
    }
  }
  return {
    dimensions: ['y', 'x'],
    shape: [size, size],
    eastward,
    northward,
    valid: new Uint8Array(size * size).fill(1)
  };
}
`,fa=`// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Project the advected trail atlas onto a lit globe without smearing trails as the camera turns. */
export const GLOBE_PRESENTATION = /* wgsl */ \`
@group(0) @binding(0) var history: texture_2d<f32>;
@group(0) @binding(1) var earth: texture_2d<f32>;
struct Presentation {viewport: vec4f, orbit: vec4f};
@group(0) @binding(3) var<uniform> presentation: Presentation;
const PI: f32 = 3.14159265359;
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  if (presentation.viewport.w < 0.5) {return textureLoad(history, vec2i(input.position.xy), 0);}
  let screen = (input.position.xy - presentation.viewport.xy * 0.5) / (min(presentation.viewport.x, presentation.viewport.y) * 0.41);
  let radius = length(screen);
  let background = vec3f(0.006, 0.013, 0.028);
  if (radius > 1.0) {
    let halo = exp(-max(radius - 1.0, 0.0) * 28.0) * 0.3;
    return vec4f(background + vec3f(0.08, 0.4, 0.8) * halo, 1);
  }
  let normal = vec3f(screen.x, -screen.y, sqrt(max(0.0, 1.0 - radius * radius)));
  let pitch = presentation.orbit.x;
  let surfaceNormal = vec3f(normal.x, cos(pitch) * normal.y + sin(pitch) * normal.z,
    -sin(pitch) * normal.y + cos(pitch) * normal.z);
  let longitude = atan2(surfaceNormal.x, surfaceNormal.z) + presentation.viewport.z;
  let latitude = asin(clamp(surfaceNormal.y, -1.0, 1.0));
  let coordinates = vec2f(fract(longitude / (2.0 * PI) + 0.5), 0.5 - latitude / PI);
  let surface = textureLoad(earth, clamp(vec2i(coordinates * vec2f(textureDimensions(earth))), vec2i(0), vec2i(textureDimensions(earth)) - 1), 0).rgb;
  let light = 0.2 + 0.8 * max(dot(normal, normalize(vec3f(-0.5, 0.4, 1.0))), 0.0);
  let ocean = vec3f(0.018, 0.055, 0.09);
  let land = surface * vec3f(0.25, 0.4, 0.45);
  let base = (ocean + land) * light;
  let dimensions = vec2i(textureDimensions(history));
  let grid = coordinates * vec2f(dimensions) - 0.5;
  let lower = vec2i(floor(grid));
  let fraction = fract(grid);
  let left = (lower.x + dimensions.x) % dimensions.x;
  let right = (left + 1) % dimensions.x;
  let top = clamp(lower.y, 0, dimensions.y - 1);
  let bottom = clamp(lower.y + 1, 0, dimensions.y - 1);
  let trailColor = mix(
    mix(textureLoad(history, vec2i(left, top), 0).rgb, textureLoad(history, vec2i(right, top), 0).rgb, fraction.x),
    mix(textureLoad(history, vec2i(left, bottom), 0).rgb, textureLoad(history, vec2i(right, bottom), 0).rgb, fraction.x), fraction.y);
  let trails = max(trailColor - vec3f(0.018, 0.035, 0.055), vec3f(0));
  let rim = pow(1.0 - normal.z, 4.0);
  // Compress dense HDR trails without clipping their hue or washing out the Earth.
  let peak = max(trails.r, max(trails.g, trails.b));
  // Suppress the diffuse low-energy veil while retaining a bounded, bright core.
  // Fewer, wider streaks remain distinct instead of blending into an opaque atlas.
  let contrast = smoothstep(0.015, 0.16, peak);
  let intensity = 0.52 * (1.0 - exp(-peak * 3.0)) * contrast;
  let windGlow = trails / max(peak, 0.00001) * intensity;
  let color = base + windGlow * (0.45 + 0.55 * light) + rim * vec3f(0.06, 0.28, 0.5);
  return vec4f(color, 1);
}\`;
`,pa=class{diagnostics=new _({traceTitle:`Trace`});graphNotices=new Set;settings={field:`weather`,rotateGlobe:!0,particleCount:65536,integrator:`rk4`,tolerance:1e-5,scheduling:`dense`,dispatchesPerReadback:1,coloring:`speed`,timeScale:1,exposure:.85,streakWidth:1.7,trailPersistence:.7,paused:!1};manager;settingsPanel;settingsHost=null;telemetryHost=null;telemetry;constructor(e,t,r){this.settingsPanel=new h({id:`observatory-settings`,schema:this.makeSchema(),settings:this.settings,onSettingsChange:e=>{if(e.field===`gfs`){window.location.href=`./gfs.html`;return}let n={...this.settings};(e.field===`gyre`||e.field===`vortex`||e.field===`jet`||e.field===`weather`||e.field===`spherical`||e.field===`c-grid`)&&(this.settings.field=e.field),(e.integrator===`rk2`||e.integrator===`rk4`||e.integrator===`rk45`)&&(this.settings.integrator=e.integrator),this.settings.field===`spherical`&&this.settings.integrator===`rk45`&&(this.settings.integrator=`rk4`),(e.scheduling===`dense`||e.scheduling===`active`)&&(this.settings.scheduling=e.scheduling),(e.coloring===`speed`||e.coloring===`step`||e.coloring===`status`)&&(this.settings.coloring=e.coloring);for(let t of[`particleCount`,`tolerance`,`dispatchesPerReadback`,`timeScale`,`exposure`,`streakWidth`,`trailPersistence`])typeof e[t]==`number`&&(this.settings[t]=e[t]);typeof e.rotateGlobe==`boolean`&&(this.settings.rotateGlobe=e.rotateGlobe),typeof e.paused==`boolean`&&(this.settings.paused=e.paused),this.settingsPanel.setSchemaAndSettings(this.makeSchema(),this.settings),this.settingsHost&&g(this.settingsHost,this.settingsPanel.makePanel()),t(n.field!==this.settings.field||n.particleCount!==this.settings.particleCount||n.integrator!==this.settings.integrator||n.tolerance!==this.settings.tolerance||n.scheduling!==this.settings.scheduling||n.dispatchesPerReadback!==this.settings.dispatchesPerReadback)}}),this.manager=new i({parentElement:e}),this.manager.setProps({components:[new f({title:`Vector Observatory`,subtitle:`Scientific GPU advection`,directory:`experimental`,id:`vector-observatory`,websiteBaseUrl:`/`,appearance:`cinematic`,panel:n({id:`observatory-tabs`,theme:`dark`,panels:[p({id:`observatory-controls`,title:`Settings`,html:`<div data-observatory-settings></div><p><button type="button" data-observatory-reset>Reseed particles</button></p>`,onRender:e=>{l(e,`cinematic`),this.settingsHost=e.querySelector(`[data-observatory-settings]`),g(this.settingsHost,this.settingsPanel.makePanel());let t=e.querySelector(`[data-observatory-reset]`);return t.addEventListener(`click`,r),()=>{t.removeEventListener(`click`,r),this.settingsHost&&g(this.settingsHost,null),this.settingsHost=null}}}),p({id:`observatory-info`,title:`Info`,html:`<p>The weather globe shows synthetic jet streams, wind bands, drifting storms and polar vortices over Earth imagery. Drag horizontally to rotate and vertically to tilt toward either pole; disable Rotate globe to hold a view. The field evolves in illustrative seconds, not physical weather time. This is a 2D normalized flow projected onto a sphere, not a forecast or a spherical atmospheric solver. Longitude wraps continuously across the antimeridian. Latitude remains bounded.</p><p>The pole-crossing globe uses Cartesian unit-sphere RK2/RK4 transport, equal-area seeds and a smooth evolving rotation field. Particle identities persist through the poles. Its bounded Cartesian history renders great-circle trails continuously through poles and the antimeridian, and reprojects while paused.</p><p>Trace an evolving double gyre, a vortex pair, or a meandering jet. These are synthetic fields sampled on a 256 × 256 regular grid, not observations. The C-grid gyre instead samples normal velocities on 32 × 32 cell faces, with a discrete streamfunction preserving cell flux balance and zero flow across the exterior faces.</p>
              <p>The double gyre has a ten-second cycle with linearly interpolated snapshots every 0.25 seconds. Streaks connect GPU particle states; the clock reports simulated seconds.</p>
              <p>RK2 and RK4 continuously respawn particles. Adaptive RK45 follows one scientific release with stable identities and explicit stopping reasons. Reseed starts a new release; changing the field, particle count, integrator or tolerance also reseeds.</p>
              <p>RK45 tolerance controls estimated local integration error in field units, not total trajectory or interpolation error. Its bounded work can lag behind wall time; Diagnostics shows pending particles and queued time.</p>
              <p>Stopped markers: gray = expired, orange = outside domain, purple = missing data, red = tolerance or numerical failure. Active status coloring is green; step coloring runs from magenta (short) to green (long).</p>`}),p({id:`observatory-diagnostics`,title:`Diagnostics`,html:``,onRender:e=>(this.telemetryHost=e,this.renderTelemetry(),()=>{this.telemetryHost=null})}),this.makeGraphPanel(this.diagnostics.inspectorPanel.panel,`Graph`),this.makeGraphPanel(this.diagnostics.tracePanel.panel,`Trace`),p({id:`example-source`,title:`Source`,html:``,onRender:e=>{for(let[t,n]of[[`main.ts`,ua],[`fields.ts`,da],[`globe.ts`,fa]]){let r=document.createElement(`h3`);r.textContent=t;let i=document.createElement(`pre`);i.className=`observatory-source`,i.textContent=n,e.append(r,i)}}})]})})]}),this.redraw()}redraw(){this.manager.onRedraw({viewports:[],layers:[]})}updateTelemetry(e){this.telemetry=e,this.renderTelemetry()}destroy(){this.manager.finalize(),this.settingsPanel.finalize(),this.diagnostics.clear()}resetGraphDiagnostics(){this.diagnostics.clear();for(let e of this.graphNotices)this.updateGraphNotice(e)}updateGraphNotice(e){e.textContent=this.settings.integrator===`rk45`?`Live RK45 graph: reset counters, optionally compact active slots, then bounded adaptive integration. Trace samples every 60 dispatches; copy nodes show CPU cost only. Counter readback and trail rendering are outside the graph.`:`Live compiled advection graph. Timings are sampled every 60 encodings; trail rendering is submitted separately.`}makeGraphPanel(e,t){return p({id:`observatory-${t.toLowerCase()}`,title:t,html:`<p data-graph-notice></p><div data-graph-panel></div>`,onRender:t=>{let n=t.querySelector(`[data-graph-notice]`),r=t.querySelector(`[data-graph-panel]`);return this.graphNotices.add(n),this.updateGraphNotice(n),g(r,e),()=>{this.graphNotices.delete(n),g(r,null)}}})}renderTelemetry(){if(!this.telemetryHost)return;let e=this.telemetry;if(!e){this.telemetryHost.textContent=`Initializing simulation…`;return}let t=e.traceResult,n=[[`Simulation time`,`${e.time.toFixed(2)} s`],[`Particles`,e.particleCount.toLocaleString()],[`Integrator`,e.integrator.toUpperCase()],[`Frame rate`,`${e.framesPerSecond} fps`],[`Queued time`,`${e.queuedTime.toFixed(2)} s`]];if(t){n.push([`Dispatch`,`${t.dispatchIndex} · ${t.isContinuation?`continuation`:`new horizon`}`],[`Target time`,`${t.targetTime.toFixed(2)} s`]),n.push([`Compute time`,t.gpuMilliseconds===void 0?`Timer unavailable`:`${t.gpuMilliseconds.toFixed(2)} ms`]);for(let[e,r]of[[`Active`,t.active],[`Pending`,t.pending],[`Expired`,t.expired],[`Outside domain`,t.outsideDomain],[`Missing data`,t.missingData],[`Tolerance failure`,t.toleranceFailure],[`Numerical failure`,t.numericalFailure],[`Accepted steps`,t.acceptedSteps],[`Rejected steps`,t.rejectedSteps],[`Scheduled integration slots`,t.scheduledParticles],[`Integration workgroups`,t.integrationWorkgroups],[`Counter readback bytes`,t.counterReadbackBytes]])n.push([e,r.toLocaleString()])}let r=document.createElement(`dl`);r.className=`observatory-telemetry`;for(let[e,t]of n){let n=document.createElement(`dt`);n.textContent=e;let i=document.createElement(`dd`);i.textContent=t,r.append(n,i)}let i=document.createElement(`p`);i.textContent=t?`Work counts describe the latest batch. Scheduled slots exclude the full-slot queue scan; GPU time includes it, but excludes counter readback and rendering. Pending particles may be at different intermediate times.`:`Frame rate measures the animation loop, not GPU compute time. Select RK45 for adaptive work and particle-state diagnostics.`,this.telemetryHost.replaceChildren(r,i)}makeSchema(){return{title:`Settings`,sections:[{id:`simulation`,name:``,settings:[{name:`field`,label:`Vector field`,type:`select`,persist:`none`,options:[{label:`Weather globe · synthetic`,value:`weather`},{label:`Pole-crossing globe · spherical`,value:`spherical`},{label:`GFS Atlantic · archived model winds`,value:`gfs`},{label:`Evolving double gyre`,value:`gyre`},{label:`C-grid gyre · face velocities`,value:`c-grid`},{label:`Vortex pair`,value:`vortex`},{label:`Meandering jet`,value:`jet`}]},...this.settings.field===`weather`||this.settings.field===`spherical`?[{name:`rotateGlobe`,label:`Rotate globe`,type:`boolean`,persist:`none`}]:[],{name:`particleCount`,label:`Particles`,type:`select`,persist:`none`,options:[{label:`65,536`,value:65536},{label:`262,144`,value:262144},{label:`1,048,576`,value:1048576}]},{name:`integrator`,label:`Integration`,type:`select`,persist:`none`,options:[{label:`Runge–Kutta 4`,value:`rk4`},{label:`Midpoint / RK2`,value:`rk2`},...this.settings.field===`spherical`?[]:[{label:`Adaptive RK45`,value:`rk45`}]]},...this.settings.integrator===`rk45`?[{name:`tolerance`,label:`Local error tolerance`,type:`select`,persist:`none`,options:[{label:`1e-3 · exploratory`,value:.001},{label:`1e-5 · precise`,value:1e-5},{label:`1e-7 · demanding`,value:1e-7}]},{name:`scheduling`,label:`RK45 scheduling`,type:`select`,persist:`none`,options:[{label:`Dense · all slots`,value:`dense`},{label:`Active · GPU queue`,value:`active`}]},{name:`dispatchesPerReadback`,label:`Dispatches per readback`,type:`select`,persist:`none`,options:[{label:`1 · interactive`,value:1},{label:`4`,value:4},{label:`16 · throughput`,value:16}]},{name:`coloring`,label:`Color by`,type:`select`,persist:`none`,options:[{label:`Speed`,value:`speed`},{label:`Accepted step size`,value:`step`},{label:`Particle status`,value:`status`}]}]:[],{name:`timeScale`,label:`Time scale`,type:`number`,persist:`none`,min:.1,max:3,step:.1},{name:`exposure`,label:`Exposure`,type:`number`,persist:`none`,min:.15,max:1.5,step:.05},{name:`streakWidth`,label:`Streak width`,type:`number`,persist:`none`,min:.7,max:3,step:.1},{name:`trailPersistence`,label:`Trail persistence (s)`,type:`number`,persist:`none`,min:.2,max:2,step:.1},{name:`paused`,label:`Pause`,type:`boolean`,persist:`none`}]}]}}};function Q(e){return document.querySelector(`#`+e)}var $=Q(`flow`),ma=Q(`status`),ha=`
struct View {size: vec4f, options: vec4f};
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> current: array<vec4f>;
@group(0) @binding(2) var<storage, read> previous: array<vec4f>;
@group(0) @binding(3) var<storage, read> diagnostics: array<vec4f>;
const CORNERS = array<vec2f, 6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
struct Vertex {@builtin(position) position: vec4f, @location(0) color: vec3f, @location(1) edge: vec2f};
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> Vertex {
  let particleCount = arrayLength(&current);
  let index = instance % particleCount;
  var wrapOffset = 0.0;
  if (instance >= particleCount) {wrapOffset = select(-1.0, 1.0, previous[index].x < 0.5);}
  var particle = current[index];
  var before = previous[index];
  if (instance >= particleCount) {wrapOffset = select(-1.0, 1.0, before.x < 0.5);}
  var displacement = particle.xy - before.xy;
  if (view.options.z > 0.5) {displacement.x -= round(displacement.x);}
  let velocity = length(displacement) / max(particle.z - before.z, 0.00001) * select(1.0, 3.0, view.options.z > 0.5);
  let corner = CORNERS[vertex];
  let aspect = view.size.x / view.size.y;
  let extent = select(1.8 * vec2f(min(1.0, 1.0 / aspect), min(1.0, aspect)), vec2f(2.0), view.options.z > 0.5);
  let direction = displacement * extent * view.size.xy;
  let normal = vec2f(-direction.y, direction.x) / max(length(direction), 0.001);
  var output: Vertex;
  let center = before.xy + displacement * corner.x + vec2f(wrapOffset, 0);
  output.position = vec4f((center - 0.5) * extent + normal * corner.y * view.size.z / view.size.xy, 0, 1);
  if (particle.z < 0.0 || particle.w != before.w) {output.position = vec4f(3,3,0,1);}
  let cold = mix(vec3f(0.05,0.16,0.42),vec3f(0.07,0.8,0.85),smoothstep(0.0,0.15,velocity));
  output.color = mix(cold,vec3f(1.0,0.68,0.3),smoothstep(0.15,0.3,velocity));
  if (view.options.y > 0.5) {
    let particleDiagnostics = diagnostics[index];
    if (view.options.x > 0.5 && view.options.x < 1.5) {
      let stepScale = clamp(log2(max(particleDiagnostics.w, 0.0001) / 0.0001) / log2(10000.0), 0.0, 1.0);
      output.color = mix(vec3f(0.7,0.12,0.7), vec3f(0.2,1.0,0.65), stepScale);
    }
    if (particleDiagnostics.z > 0.5) {
      output.position = vec4f((particle.xy + vec2f(wrapOffset, 0) - 0.5) * extent + vec2f((corner.x - 0.5) * 2.0, corner.y) * 3.0 / view.size.xy, 0, 1);
      output.color = vec3f(1.0,0.45,0.12);
      if (particleDiagnostics.z == 1.0) {output.color = vec3f(0.5);}
      if (particleDiagnostics.z == 3.0) {output.color = vec3f(0.85,0.2,0.85);}
      if (particleDiagnostics.z >= 4.0) {output.color = vec3f(1.0,0.1,0.15);}
    } else if (view.options.x > 1.5) {output.color = vec3f(0.2,1.0,0.65);}
  }
  output.color *= view.size.w * (0.25 + 0.75 * min(particle.z, 1.0));
  output.edge = corner;
  return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  let opacity = (1.0 - abs(input.edge.y)) * (0.35 + 0.65 * input.edge.x);
  return vec4f(input.color * opacity, 1);
}`;try{let t=await e.createDevice({adapters:[x],optionalFeatures:[`timestamp-query`],createCanvasContext:{canvas:$,autoResize:!0},onError:e=>{throw e}}),n=t.createBuffer({byteLength:32,usage:k.UNIFORM|k.COPY_DST}),r,i,a=0,o=0,s=new Gi(t,{id:`fade-trails`,shaderLayout:{attributes:[],bindings:[{name:`view`,type:`uniform`,group:0,location:0}]},bindings:{view:n},source:`
struct Vertex {@builtin(position) position: vec4f};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> Vertex {
 let corners = array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
 var output: Vertex; output.position = vec4f(corners[index],0,1); return output;
}

struct View {size: vec4f, options: vec4f};
@group(0) @binding(0) var<uniform> view: View;
@fragment fn fragmentMain() -> @location(0) vec4f {return vec4f(0.018,0.035,0.055,view.options.w);}`,vertexCount:3,parameters:{blend:!0,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,depthWriteEnabled:!1}}),l=await Ji(c),u=t.createTexture({id:`weather-earth`,width:l.width,height:l.height,data:l,format:`rgba8unorm`,usage:O.SAMPLE|O.COPY_DST|O.RENDER,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`repeat`,addressModeV:`clamp-to-edge`}});l.close();let d=t.createBuffer({byteLength:32,usage:k.UNIFORM|k.COPY_DST}),f=new Gi(t,{id:`present-trails`,source:`
struct Vertex {@builtin(position) position: vec4f};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> Vertex {
 let corners = array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
 var output: Vertex; output.position = vec4f(corners[index],0,1); return output;
}
`+Zi,vertexCount:3,shaderLayout:{attributes:[],bindings:[{name:`history`,type:`texture`,group:0,location:0},{name:`earth`,type:`texture`,group:0,location:1},{name:`presentation`,type:`uniform`,group:0,location:3}]},bindings:{earth:u,presentation:d}}),p=-.4,m=0,h;$.style.touchAction=`none`,$.addEventListener(`pointerdown`,e=>{M.settings.field!==`weather`&&M.settings.field!==`spherical`||(h={horizontal:e.clientX,vertical:e.clientY},$.setPointerCapture(e.pointerId))}),$.addEventListener(`pointermove`,e=>{h!==void 0&&(p-=(e.clientX-h.horizontal)*.006,m=Math.max(-Math.PI/2,Math.min(Math.PI/2,m+(e.clientY-h.vertical)*.006)),h={horizontal:e.clientX,vertical:e.clientY})});let g=()=>{h=void 0};$.addEventListener(`pointerup`,g),$.addEventListener(`pointercancel`,g),$.addEventListener(`lostpointercapture`,g);function _(){r&&a===$.width&&o===$.height||(r?.destroy(),i?.destroy(),a=$.width,o=$.height,i=t.createTexture({width:a,height:o,format:`rgba16float`,usage:O.RENDER|O.SAMPLE}),r=t.createFramebuffer({colorAttachments:[i]}),t.beginRenderPass({framebuffer:r,clearColor:[.018,.035,.055,1]}).end(),t.submit(),f.setBindings({history:i}))}let y,b=`gyre`,S=`rk4`,C=262144,w=!1,T=0,E=0,D,A,j,M=new pa(Q(`observatory-panels`),e=>{w||=e,ee()},()=>{w=!0});function ee(){let e=S===`rk45`?M.settings.coloring:`speed`;Q(`legend-low`).textContent=e===`step`?`SHORT STEP`:e===`status`?`ACTIVE`:`LOW VELOCITY`,Q(`legend-high`).textContent=e===`step`?`LONG STEP`:e===`status`?`STOPPED`:`HIGH`,Q(`legend-ramp`).style.background=e===`step`?`linear-gradient(90deg,#b31fb3,#33ffa6)`:e===`status`?`linear-gradient(90deg,#33ffa6,#888,#ff731f,#d933d9,#ff1a26)`:`linear-gradient(90deg,#164d9b,#24d8db,#c7e9a0,#ffb365)`}let N=.25,P=performance.now();function te(){M.resetGraphDiagnostics(),E=0,A?.destroy(),j?.destroy(),j=void 0,y?.destroy(),N=.25,P=performance.now(),b=M.settings.field,S=M.settings.integrator,C=M.settings.particleCount,T=0,D=void 0;let e={input:b===`c-grid`?sa():oa(b,0),...b===`gyre`||b===`weather`?{nextInput:oa(b,N),timeRange:[0,N]}:{},bounds:[0,0,1,1],periodicLongitude:b===`weather`,lifetime:45};if(b===`spherical`)y=new ra(t,{input:ca(0),nextInput:ca(N),timeRange:[0,N],positions:la(C),maximumTimeStep:1/30,radius:1,integrator:S===`rk2`?`rk2`:`rk4`}),j=new aa(t,C),j.capture(y.output,y.time,M.settings.trailPersistence);else if(S===`rk45`){let n=new Float32Array(C*2),r=Math.ceil(Math.sqrt(C));for(let e=0;e<C;e++)n[e*2]=(e%r+.5)/r,n[e*2+1]=(Math.floor(e/r)+.5)/r;y=new v(t,{...e,positions:n,tolerance:M.settings.tolerance,maximumAttempts:16,scheduling:M.settings.scheduling,dispatchesPerReadback:M.settings.dispatchesPerReadback})}else y=new ea(t,{...e,particleCount:C,seed:17,integrator:S===`rk2`?`rk2`:`rk4`}),y.step(0);M.updateTelemetry({time:y.time,queuedTime:T,particleCount:C,integrator:S,framesPerSecond:0,traceResult:D}),ee(),A=new Gi(t,{id:`scientific-flow-streaks`,source:ha,vertexCount:6,instanceCount:M.settings.particleCount*(b===`weather`?2:1),shaderLayout:{attributes:[],bindings:[{name:`view`,type:`uniform`,group:0,location:0},{name:`current`,type:`read-only-storage`,group:0,location:1,visibility:1},{name:`previous`,type:`read-only-storage`,group:0,location:2,visibility:1},{name:`diagnostics`,type:`read-only-storage`,group:0,location:3,visibility:1}]},parameters:{blend:!0,blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,depthWriteEnabled:!1}}),a=0,_()}te();let F=0,I=performance.now(),L=0,ne=!1,R;async function re(e){if(!ne)try{w&&=(te(),!1);let i=Math.min(.1,Math.max(0,(e-P)/1e3)),a=i*M.settings.timeScale;if(P=e,_(),M.redraw(),!M.settings.paused){T+=a;let e=!0;for(;T>0||y instanceof v&&y.hasPendingWork;){if((b===`gyre`||b===`weather`||b===`spherical`)&&y.remainingTime===0&&!(y instanceof v&&y.hasPendingWork)&&(N+=.25,y instanceof ra?y.setNextSnapshot(ca(N),N):y.setNextSnapshot(oa(b,N),N)),a=b===`gyre`||b===`weather`||b===`spherical`?Math.min(T,y.remainingTime):T,y instanceof v){y.hasPendingWork?D=await y.continue():(T-=a,D=await y.advance(a));for(let e of D.encodings)M.diagnostics.record(y.commandGraph,e)}else{let e=Math.max(1,Math.ceil(a/(y instanceof ra?y.maximumTimeStep:y.simulation.maximumTimeStep))),n=E++%60==0&&t.features.has(`timestamp-query`)?t.createQuerySet({type:`timestamp`,count:2}):void 0;try{let r=t.createCommandEncoder({timeProfilingQuerySet:n}),i=y.record(r,a/e,e);t.submit(r.finish()),M.diagnostics.record(y.commandGraph,i,n)}catch(e){throw n?.destroy(),e}T-=a}if(ne)return;n.write(new Float32Array([$.width,$.height,M.settings.streakWidth,M.settings.exposure*1.2*65536*(b===`c-grid`?.08:1)/C,M.settings.coloring===`step`?1:M.settings.coloring===`status`?2:0,+(S===`rk45`),b===`spherical`?2:+(b===`weather`),1-Math.exp(-i/M.settings.trailPersistence)])),A.setBindings({view:n,current:y.output,previous:y.previous,diagnostics:y instanceof v?y.diagnostics:y.output});let o=t.beginRenderPass({framebuffer:r,clearColor:!1});if(e&&s.draw(o),j||A.draw(o),o.end(),t.submit(),e=!1,y instanceof v)break}}(b===`weather`||b===`spherical`)&&M.settings.rotateGlobe&&!M.settings.paused&&h===void 0&&(p+=i*.06),d.write(new Float32Array([$.width,$.height,p,b===`spherical`?2:+(b===`weather`),m,0,0,0]));let o=M.settings.trailPersistence*Math.max(M.settings.timeScale,.01);j?.capture(y.output,y.time,o);let c=t.beginRenderPass({clearColor:[.018,.035,.055,1]});f.draw(c),j&&j.draw(c,{width:$.width,height:$.height,longitude:p,latitude:m,time:y.time,duration:o,widthPixels:M.settings.streakWidth,exposure:M.settings.exposure}),c.end(),t.submit(),F++,e-I>500&&(ma.textContent=`${C.toLocaleString()} particles · ${Math.round(F*1e3/(e-I))} fps · ${S.toUpperCase()}${b===`weather`?` · synthetic winds · drag to rotate`:``}${M.settings.paused?` · paused`:``}`,M.updateTelemetry({time:y.time,queuedTime:T,particleCount:C,integrator:S,framesPerSecond:Math.round(F*1e3/(e-I)),traceResult:D}),F=0,I=e),L=requestAnimationFrame(e=>{R=re(e)})}catch(e){ga(e)}}L=requestAnimationFrame(e=>{R=re(e)}),window.addEventListener(`pagehide`,()=>{ne=!0,cancelAnimationFrame(L),(R??Promise.resolve()).then(()=>{M.destroy(),A.destroy(),j?.destroy(),y.destroy(),n.destroy(),s.destroy(),f.destroy(),d.destroy(),u.destroy(),r.destroy(),i.destroy(),t.destroy()})},{once:!0})}catch(e){ga(e)}function ga(e){let t=Q(`error`);t.hidden=!1,t.textContent=`The observatory requires WebGPU. Open this example in a browser with WebGPU enabled. ${String(e)}`,ma.textContent=`Simulation unavailable`}