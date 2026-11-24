import{n as e,o as t,t as n,u as r}from"./render-pipeline-DDR8msNB.js";import{a as i,r as a,t as o}from"./buffer-BovtX3qk.js";import{a as s,r as c,t as l,u}from"./vertex-format-decoder-ByUscIqH.js";import{c as d,u as f}from"./wgsl-binding-scan-BoUAMUSg.js";import{a as p,i as m,n as h,o as g,r as _,t as v}from"./gpu-vector-CguWXzI9.js";var y=new WeakMap,b=class t{static defaultProps={...n.defaultProps};static getDefaultPipelineFactory(e){let n=e.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new t(e),n.defaultPipelineFactory}static beginAsyncCompilation(e){if(y.has(e))throw Error(`An asynchronous pipeline compilation scope is already active`);let t=[];return y.set(e,t),t}static getAsyncCompilation(e){return y.get(e)}static endAsyncCompilation(e,t){if(y.get(e)!==t)throw Error(`The asynchronous pipeline compilation scope is not active`);y.delete(e)}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_pendingRenderPipelineCache={};_pendingComputePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...n.defaultProps,...e},a=this._renderPipelineCache,o=this._hashRenderPipeline(t),s=a[o]?.resource;if(s)a[o].useCount++,this.device.props.debugFactories&&r.log(3,`${this}: ${a[o].resource} reused, count=${a[o].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;s=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:i(`unnamed-cached`),_sharedRenderPipeline:e}),s.hash=o,a[o]={resource:s,useCount:1},this.device.props.debugFactories&&r.log(3,`${this}: ${s} created, count=${a[o].useCount}`)()}return s}async createRenderPipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createRenderPipelineAsync(e);let t={...n.defaultProps,...e},r=this._hashRenderPipeline(t);return await this._createPipelineAsync(this._renderPipelineCache,this._pendingRenderPipelineCache,r,()=>{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;return this.device.createRenderPipelineAsync({...t,id:t.id?`${t.id}-cached`:i(`unnamed-cached`),_sharedRenderPipeline:e})})}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...f.defaultProps,...e},n=this._computePipelineCache,i=this._hashComputePipeline(t),a=n[i]?.resource;return a?(n[i].useCount++,this.device.props.debugFactories&&r.log(3,`${this}: ${n[i].resource} reused, count=${n[i].useCount}, (id=${e.id})`)()):(a=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),a.hash=i,n[i]={resource:a,useCount:1},this.device.props.debugFactories&&r.log(3,`${this}: ${a} created, count=${n[i].useCount}`)()),a}async createComputePipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createComputePipelineAsync(e);let t={...f.defaultProps,...e},n=this._hashComputePipeline(t);return await this._createPipelineAsync(this._computePipelineCache,this._pendingComputePipelineCache,n,()=>this.device.createComputePipelineAsync({...t,id:t.id?`${t.id}-cached`:void 0}))}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&r.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(r.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&r.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}async _createPipelineAsync(e,t,r,i){let a=e[r];if(a)return a.useCount++,a.resource;let o=t[r];if(o)return o.useCount++,await o.promise;let s={promise:void 0,useCount:1};return s.promise=i().then(i=>{delete t[r];let a=e[r];return a?(a.useCount+=s.useCount,i.destroy(),i instanceof n&&this.releaseSharedRenderPipeline(i),a.resource):(i.hash=r,e[r]={resource:i,useCount:s.useCount},i)}).catch(e=>{throw delete t[r],e}),t[r]=s,await s.promise}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof n&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof f&&(t=this._computePipelineCache),e instanceof n&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){return`${this._getHash(e.shader.source)}/${this._getHash(JSON.stringify([e.shaderLayout,e.entryPoint??`main`,e.constants]))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e._uniformBlockLayouts)),o=this._getHash(JSON.stringify(e.bufferLayout)),{type:s}=this.device;switch(s){case`webgl`:let c=this._getHash(JSON.stringify(e.parameters));return`${s}/R/${t}/${n}V${r}T${e.topology}P${c}SL${i}UBL${a}BL${o}`;default:let l=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),u=this._getHash(JSON.stringify(e.parameters)),d=this._getWebGPUAttachmentHash(e);return`${s}/R/${t}/${n}V${r}T${e.topology}EP${l}P${u}SL${i}BL${o}A${d}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(t){let n=t.colorAttachmentFormats??[this.device.preferredColorFormat],r=e(this.device,t)??null;return this._getHash(JSON.stringify({colorAttachmentFormats:n,depthStencilAttachmentFormat:r}))}},ee=class e{static defaultProps={...t.defaultProps};static getDefaultShaderFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new e(t),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&r.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let i=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:i,useCount:1},this.device.props.debugFactories&&r.log(3,`${this}: Created new shader ${i.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&r.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&r.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}};function x(e,t){if(!e){let e=Error(t||`shaders: assertion failed.`);throw Error.captureStackTrace?.(e,x),e}}var S={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function te(e){let t={};for(let[n,r]of Object.entries(e))t[n]=ne(r);return t}function ne(e){let t=C(e);if(t!==`object`)return{value:e,...S[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=C(e.value),{...e,...S[t],type:t}):{...e,...S[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function C(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}function w(e){e.map(e=>re(e))}function re(e){if(e.instance)return;w(e.dependencies||[]);let{propTypes:t={},deprecations:n=[]}=e,r={parsedDeprecations:ae(n),normalizedInjections:{vertex:{},fragment:{}}};t&&(r.propValidators=te(t)),e.instance=r;let i={};t&&(i=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...i}}function ie(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function ae(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function T(e){let t=new Set,n=new Set,r=[],i=new Map;function a(e){let t=i.get(e.name);if(t&&t!==e)throw Error(`Shader module name collision: Multiple different module objects share the name "${e.name}". Each module object must have a unique name.`);i.set(e.name,e)}function o(e,i){if(n.has(e)){let t=[...i,e.name].join(` -> `);throw Error(`Shader module dependency cycle detected: ${t}`)}if(t.has(e))return;a(e),n.add(e);let s=[...i,e.name];if(e.dependencies)for(let t of e.dependencies)o(t,s);n.delete(e),t.add(e),r.push(e)}for(let t of e)o(t,[]);let s=new Set;for(let e of r)e.implements!==void 0&&(x(!s.has(e.implements)),s.add(e.implements));return w(r),r}var oe={vertex:`#ifdef MODULE_LOGDEPTH
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
`},E=/void\s+main\s*\([^)]*\)\s*\{\n?/,se=/}\n?[^{}]*$/,D=[],O=`__LUMA_INJECT_DECLARATIONS__`;function ce(e,t,n){let r={};for(let i of e){let e=i[t];if(e===void 0)continue;if(i.stage!==`vertex`&&i.stage!==`fragment`||i.target.includes(`:`))throw Error(`Shader injection targets require an explicit stage and unqualified target`);let a=`${i.stage===`vertex`?`vs`:`fs`}:${i.target}`;if(!/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][A-Za-z0-9_]*)$/.test(a))throw Error(`Shader injection target "${a}" must be a named shader injection target`);r[a]||=[],r[a].push({injection:e,order:i.order??0,...n?{pluginName:n}:{}})}return r}function le(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),D.length=r.length;for(let e=0,t=r.length;e<t;++e)D[e]=r[e].injection;let s=`${D.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(O,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?k(e,`vertex`,s,`start`,a.vertex):e.replace(E,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?k(e,`vertex`,s,`end`,a.vertex):e.replace(se,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(O,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?k(e,`fragment`,s,`start`,a.fragment):e.replace(E,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?k(e,`fragment`,s,`end`,a.fragment):e.replace(se,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(O,``),r&&(e=e.replace(/\}\s*$/,e=>e+oe[t])),e}function k(e,t,n,r,i){let a=ue(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function ue(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${de(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function de(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var fe=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,pe=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function A(e){return`${e.name}Uniforms`}function me(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=A(e);return ve(n,t===`wgsl`?`wgsl`:`glsl`,r)}function he(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=me(e,t);return r?{moduleName:e.name,uniformBlockName:A(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:xe(n,r)}:null}function ge(e,t,n={}){let r=he(e,t);if(!r||r.matches)return r;let i=Se(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&x(!1,i),r}function j(e){let t=[],n=Ce(e);for(let e of n.matchAll(pe)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function _e(e,t,n,r){let i=j(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${we(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function ve(e,t,n){let r=t===`wgsl`?ye(e,n):be(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(fe);r&&i.push(r[1])}return i}function ye(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function be(e,t){return j(e).find(e=>e.blockName===t)?.body||null}function xe(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Se(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=Te(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${M(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${M(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function Ce(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function we(e){return e.replace(/\s+/g,` `).trim()}function Te(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function M(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}var Ee=`\n\n${O}\n`;function De(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function Oe(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function ke(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:x(!1)}if(!e.name)throw Error(`Shader module must have a name`);ge(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}function Ae(e,t){let n=[];for(let[r,i]of Object.entries(t))Me(e,r),n.push(`in ${N(i)} ${r};`);return n.join(`
`)}function je(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=Ne(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Pe(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||Le(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=Re(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function N(e){let{primitiveType:t,components:n}=u.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function Me(e,t){let n=L(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function Ne(e,t){let n=RegExp(`\\bfn\\s+${L(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=I(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Pe(e,t){let n=P(t),r=new Set(F(t)),i=Fe(t);for(let t of i){let i=Ie(e,t);if(i!==null){n.push(...P(i));for(let e of F(i))r.add(e)}}return{locations:n,names:r}}function P(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function F(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Fe(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Ie(e,t){let n=RegExp(`\\bstruct\\s+${L(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=I(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function Le(e,t){let n=L(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(ze(e,i.index)===0)return!0;i=r.exec(e)}return!1}function Re(e){let t=0;for(;e.has(t);)t++;return t}function I(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function ze(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function L(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Be(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){et(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${N(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Qe(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function Ve(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=R(a,t,`vertex`),s=He(a,o),c=R(a,n,`fragment`),l=Ue(a,c),u=z(a,s),f=l?z(a,l.type):null,p=new Set([...U(o.parameters),...U(u.body),...U(c.parameters),...U(f?.body||``)]),m=new Set([...H(u.body),...H(f?.body||``),...H(c.parameters)]),h=[],g=[],_=[],v=[],y=[];for(let[e,t]of i){if(p.has(e)||Xe(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=Ze(m);m.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;if(h.push(`  @location(${n})${r} ${e}: ${t.type},`),_.push(`var<private> ${e}: ${t.type};`),v.push(`${e} = ${$e(t.type)};`),l)y.push(`${e} = ${l.name}.${e};`);else{let i=`_luma_${e}`;if(p.has(i))throw Error(`ShaderPlugin varying "${e}" conflicts with a generated fragment parameter`);g.push(`@location(${n})${r} ${i}: ${t.type}`),y.push(`${e} = ${i};`)}}We(a,s,o.openBrace,o.closeBrace),a=Ge(a,s,o,i.map(([e])=>e)),o=R(a,t,`vertex`),a=Ke(a,o,i.map(([e])=>e));let b=(!l||s===l.type?[s]:[s,l.type]).map(e=>z(a,e).closeBrace).sort((e,t)=>t-e);for(let e of b)a=a.slice(0,e)+`${h.join(`
`)}\n`+a.slice(e);if(c=R(a,n,`fragment`),g.length){let e=c.parameters,t=d(e).trimEnd();if(t.trim()&&!t.endsWith(`,`)){let n=t.length;e=`${e.slice(0,n)},${e.slice(n)}`}a=a.slice(0,c.openParenthesis+1)+e+`
  `+g.join(`,
  `)+`
`+a.slice(c.closeParenthesis)}return{source:a,declarations:_.join(`
`),vertexInitialization:v.join(`
`),fragmentInitialization:y.join(`
`)}}function R(e,t,n){let r=RegExp(`\\bfn\\s+${G(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin interStageVariables require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=W(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=W(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function He(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||B(e,r[1])===null)throw Error(`ShaderPlugin interStageVariables require the WGSL vertex entry point to return a named struct`);return r[1]}function Ue(e,t){let n=[];for(let r of Ye(d(t.parameters),`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&B(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length>1)throw Error(`ShaderPlugin interStageVariables require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]||null}function z(e,t){let n=B(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function B(e,t){let n=RegExp(`\\bstruct\\s+${G(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=W(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function We(e,t,n,r){let i=RegExp(`\\b${G(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function Ge(e,t,n,r){let i=RegExp(`\\b${G(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=W(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function Ke(e,t,n){let r=qe(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function qe(e,t,n){let r=[],i=t;for(;i<n;)if(i=V(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=Je(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function Je(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=V(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function V(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function Ye(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function H(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function U(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Xe(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${G(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(tt(e,r.index)===0)return!0;r=n.exec(e)}return!1}function Ze(e){let t=0;for(;e.has(t);)t++;return t}function Qe(e){let{primitiveType:t,components:n}=u.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${N(e)}(${r})`}function $e(e){let{primitiveType:t,components:n}=u.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function et(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${G(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function W(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function tt(e,t){let n=0;for(let r=0;r<t;r++){let i=V(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function G(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function nt(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i],o=a.returnType||`void`,s=n===`wgsl`?`fn`:o,c=n===`wgsl`&&o!==`void`?` -> ${o}`:``;if(r+=`${s} ${a.signature}${c} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function K(e,t=[],n=`glsl`){let r={vertex:{},fragment:{}};for(let t of e){let e=t[n];if(e){let n=t.stage===`vertex`?`vs`:`fs`;r[t.stage][`${n}:${t.name}`]={...e,signature:`${t.name}(${e.parameters})`}}}for(let e of t){let t=K([e],[],n);for(let e of[`vertex`,`fragment`])for(let[n,i]of Object.entries(t[e])){let t=r[e][n];if(t&&(t.signature!==i.signature||(t.returnType||`void`)!==(i.returnType||`void`)))throw Error(`Conflicting ShaderPlugin injection target ${n}`);r[e][n]=t||i}}return r}function rt(e,t){return!!(t.startsWith(`vs:`)?e.vertex:e.fragment)[t]}function it(e,t,n){let r=n===`vertex`?`vs:`:n===`fragment`?`fs:`:null;for(let n in t)if(!(r&&!n.startsWith(r))&&!rt(e,n)){let e=[...new Set(t[n].map(e=>e.pluginName).filter(Boolean))];throw Error(`Unknown shader injection target ${n}${e.length?` (plugins: ${e.join(`, `)})`:``}`)}}var at=class{_shaderTranspilers=new Map;_injectionTargets=[];_defaultModules=[];addShaderTranspiler(e){this._shaderTranspilers.set(e.sourceLanguage,e)}removeShaderTranspiler(e){this._shaderTranspilers.delete(e)}_transpileShader(e,t,n,r){let i=e.sourceLanguage||this.shaderLanguage;if(i===this.shaderLanguage)return x(!T(t).some(e=>e.sourceLanguage&&e.sourceLanguage!==this.shaderLanguage)),{code:n||``,modules:t};let a=this._shaderTranspilers.get(i);x(a);let o=T(t);x(!o.some(e=>e.sourceLanguage&&e.sourceLanguage!==i&&e.sourceLanguage!==this.shaderLanguage));let s=o.filter(e=>e.sourceLanguage===i).map(e=>e.source||``).join(`
`),c={vertex:e.vertexEntryPoint,fragment:e.fragmentEntryPoint,compute:e.computeEntryPoint},l=n==null?{code:``}:a.transpile({source:[s,n].filter(Boolean).join(`
`),target:this.shaderLanguage,stage:r,entryPoints:c,platformInfo:e.platformInfo}),u=o.map(e=>({...e,dependencies:void 0,...e.sourceLanguage===i?{source:void 0,vs:void 0,fs:void 0}:{}}));return{...l,modules:u}}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderInjectionTarget(e){this._injectionTargets.push(e)}resetShaderInjectionTargets(){this._injectionTargets.length=0}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,w(t),t}},ot={name:`fp32`,source:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`,vs:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`};function st(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var ct=o.DEBUG_DATA_MAX_LENGTH,q=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:n=!1,buffer:r,ownsBuffer:a=!0,...s}=t;if(r&&r.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(r&&(s.byteLength!==void 0||s.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let c=t.id||r?.id||i(`dynamic-buffer`),l={...s,id:c,usage:s.usage??r?.usage,indexType:s.indexType??r?.indexType};(l.usage||0)&o.INDEX&&!l.indexType&&(s.data instanceof Uint32Array?l.indexType=`uint32`:s.data instanceof Uint16Array?l.indexType=`uint16`:s.data instanceof Uint8Array&&(l.indexType=`uint8`)),delete l.data,delete l.byteOffset,this.device=e,this.id=c,this.props=l,this.usage=l.usage||0,this._debugDataEnabled=!!n,this._maxDebugDataByteLength=typeof n==`object`&&n.maxByteLength!==void 0?n.maxByteLength:ct,this._ownsBuffer=a,this._buffer=r??this.device.createBuffer({...s,id:c}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),s.data&&this._writeDebugData(s.data,s.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}};function J(e){return typeof e==`object`&&!!e&&`buffer`in e}function lt(e){return e instanceof q?e:J(e)&&e.buffer instanceof q?e.buffer:null}function ut(e){return e instanceof q?e.buffer:e}function dt(e){return{buffer:ut(e.buffer),offset:e.offset,size:e.size}}function Y(e,t){let n=new Map,r=[],i=new Set;function o(e){a(!i.has(e));let s=n.get(e);if(s)return s;let c=t?.(e,n.size)??`value-${n.size}`;i.add(e),n.set(e,c);let l=e.source,u=l instanceof Z,d=(u?[l]:l?.dependencies??[]).map(o);return r.push(Object.freeze({id:c,label:e.id,kind:u?`alias`:l?`operation`:`source`,operation:l&&!u?l.name:void 0,dependencies:Object.freeze(d),type:e.type,size:e.size,format:ft(e),length:e.length,normalized:e.normalized,isConstant:e.isConstant,offset:e.offset,stride:e.stride,byteLength:e.byteLength,evaluated:e.evaluated})),i.delete(e),c}let s=e.map(o);return Object.freeze({outputs:Object.freeze(s),nodes:Object.freeze(r)})}function ft(e){if(e.format)return e.format;let t=e.size;if(!(t!==1&&t!==2&&t!==3&&t!==4)){if(t===3&&!e.normalized&&(e.type===`uint8`||e.type===`sint8`))return e.type===`uint8`?`uint8x3-webgl`:`sint8x3-webgl`;try{return l.makeVertexFormat(e.type,t,e.normalized)}catch{return}}}var X=new class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,t){if(t>e.limits.maxBufferSize)throw Error(`Buffer pool cannot allocate ${t} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let n=this.bufferPools.get(e),r=n?n.findIndex(e=>e.byteLength>=t):-1;if(r<0)return e.createBuffer({usage:o.VERTEX|o.STORAGE|o.COPY_DST|o.COPY_SRC,byteLength:t});let[i]=n.splice(r,1);return i}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let n=this.bufferPools.get(t),r=n.findIndex(t=>t.byteLength>e.byteLength);r<0?n.push(e):n.splice(r,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let n=e.isLost?0:this.poolSize;for(;t.length>n;)t.shift().destroy();t.length===0&&this.bufferPools.delete(e)}}},Z=class e{static get bufferPoolSize(){return X.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw Error(`GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer`);X.poolSize=e,X.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_evaluationScope;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership=`owned`;_targetBuffer;static fromArray(t,{type:n,size:r=1,offset:i=0,stride:a=0,normalized:o=!1}){let l=n,u;return Array.isArray(t)?(l||=`float32`,u=new(s(l))(t)):t instanceof Float64Array?(l=`uint32`,r*=2,i*=2,a*=2,u=new Uint32Array(t.buffer,t.byteOffset,t.byteLength/4)):(l||=c(t),u=t),new e({id:`<${l} * ${r}>`,type:l,size:r,offset:i,stride:a,normalized:o,value:u})}static fromConstant(t,n=`float32`){let r=s(n),i;return Array.isArray(t)?i=`[${t.join(`,`)}]`:(i=String(t),t=[t]),new e({id:i,isConstant:!0,type:n,size:t.length,value:new r(t)})}static fromGPUData(t,n={}){return ht(t),new e({...Q(new _({buffer:t.buffer,format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride})),id:n.id,gpuData:t})}static fromGPUDataView(t,n={}){return new e({...Q(t),id:n.id,buffer:t.buffer})}constructor(t){let{id:n,value:r,buffer:i,gpuData:a,format:o,source:c=null,isConstant:l=!1}=t;if(!c&&!r&&!i&&!a)throw Error(`GPUDataEvaluator must have a value source`);let{type:u,size:d,offset:f,stride:p,normalized:m,length:h}=t;if(c instanceof e?(u??=c.type,d??=c.size,f??=c.offset,p??=c.stride,m??=c.normalized,h??=c.length):(d??=1,f??=0,m??=!1,h=l?1:h),!u)throw Error(`GPUDataEvaluator: type not defined`);if(this._id=n,this.type=u,this.size=d,this.ValueType=s(this.type),this._offset=f,this._stride=p||this.ValueType.BYTES_PER_ELEMENT*d,this.normalized=m,this.source=c,this.format=o,h===void 0)if(l)h=1;else{if(!r)throw Error(`GPUDataEvaluator: length not defined`);h=Math.ceil(r.byteLength/this.stride)}this.isConstant=l,this.length=h;let g=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=h===0?0:(h-1)*this.stride+g,this._value=r,this._bufferOwnership=c instanceof e||i||a?`borrowed`:`owned`,a?this._gpuVector=new v({type:`data`,name:this._id??`data`,format:a.format,data:[a],stride:a.stride,byteStride:a.byteStride,rowByteLength:a.rowByteLength}):i&&(this._gpuVector=this.createGPUVectorView({buffer:i,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof e?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}getInspection(){return Y([this])}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return $(this.gpuVector)}setTargetBuffer({buffer:t,byteOffset:n=0,byteStride:r=this.stride}){if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof e)throw Error(`GPUDataEvaluator target buffers require a deferred operation source`);this._targetBuffer={buffer:t,byteOffset:n,byteStride:r}}async evaluate(t,n={}){if(this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this.assertScopeAccess(n.scope),n.scope&&(n.scope.assertEvaluating(t),!this._evaluationScope)){let e=!!this._gpuVector,t={offset:this._offset,stride:this._stride,byteLength:this._byteLength,ownership:this._bufferOwnership,target:this._targetBuffer};this._evaluationScope=n.scope,n.scope.retain(n=>{this._evaluationScope=void 0,!n&&!e&&this._gpuVector&&(this._bufferOwnership===`owned`&&X.recycle($(this._gpuVector)),this._gpuVector=void 0),!n&&!e&&(this._offset=t.offset,this._stride=t.stride,this._byteLength=t.byteLength,this._bufferOwnership=t.ownership,this._targetBuffer=t.target)})}if(this._gpuVector){if(n.scope&&this.source instanceof e&&await this.source.evaluate(t,{scope:n.scope}),n.scope&&this.buffer.device!==t)throw Error(`Evaluator buffer belongs to a different device`);return this._gpuVector}let r;if(this.source instanceof e){let e=await this.source.evaluate(t,{scope:n.scope});return this._gpuVector=this.createGPUVectorView({...n,buffer:$(e)}),this._gpuVector}if(r=this._getEvaluationBuffer(t),this._value)r.write(this._value);else{let e;try{e=await this.source.execute(t,r,n.scope)}catch(e){throw n.scope&&this._bufferOwnership===`owned`&&X.recycle(r),e}if(!e.success)throw n.scope&&this._bufferOwnership===`owned`&&X.recycle(r),e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...n,buffer:r}),this._gpuVector}evaluateSync(t,n={}){if(n.scope)throw Error(`Use scope.evaluate() for deferred submission`);if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let r;if(this.source instanceof e){let e=this.source.evaluateSync(t);return this._gpuVector=this.createGPUVectorView({...n,buffer:$(e)}),this._gpuVector}if(r=this._getEvaluationBuffer(t),this._value)r.write(this._value);else{let e=this.source.executeSync(t,r);if(!e.success)throw e.error||Error(`${this.source} evaluation failed`);e.value&&(this._value=e.value)}return this._gpuVector=this.createGPUVectorView({...n,buffer:r}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??`vector`,n=e.format??this.format??bt(this.type,this.size,this.normalized);if(e.interleaved){let n=typeof e.interleaved==`object`&&e.interleaved.attributes?e.interleaved.attributes:_t(this);return new v({type:`interleaved`,name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:n,ownsBuffer:!1})}return new v({type:`buffer`,name:t,buffer:e.buffer,format:n,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return X.createOrReuse(e,Math.max(this.offset+this.byteLength,this._value?.byteLength??0));if(t.buffer.device!==e)throw Error(`GPUDataEvaluator target buffer belongs to a different device`);let n=this.ValueType.BYTES_PER_ELEMENT*this.size,r=this.length===0?0:(this.length-1)*t.byteStride+n;if(t.byteOffset+r>t.buffer.byteLength)throw Error(`GPUDataEvaluator target buffer is too small for the output layout`);return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=r,this._bufferOwnership=`borrowed`,this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){this.assertScopeAccess();let{ValueType:n}=this,{size:r,offset:i,stride:a,length:o}=this,s=n.BYTES_PER_ELEMENT*r;if(t??=o,e=Math.max(0,Math.min(o,e)),t=Math.max(e,Math.min(o,t)),this._value)return pt(this,this._value,e,t);let c=t-e;if(c===0)return new n(0);let l=i+e*a,u=a===s?c*s:(c-1)*a+s,d=await this.buffer.readAsync(l,u),f=new n(d.buffer,d.byteOffset,d.byteLength/n.BYTES_PER_ELEMENT);if(a===s)return f;let p=new Uint8Array(s*c);for(let e=0;e<c;e++){let t=e*a;p.set(d.subarray(t,t+s),e*s)}return new n(p.buffer)}async ensureCPUValue(){this.assertScopeAccess();let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!==0)throw Error(`${this} backing buffer byte length is not aligned to its scalar type`);let n=t.slice();return this._value=new this.ValueType(n.buffer,n.byteOffset,n.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){this.assertScopeAccess();let e=this.value;if(e)return e;throw Error(`${this} CPU value is not available for synchronous evaluation`)}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error(`Evaluator is retained by an unsubmitted scope`)}toString(){return this._id??this.source?.toString()??this.constructor.name}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error(`Cannot invalidate a destroyed evaluator`);if((this.source||this._bufferOwnership===`borrowed`)&&(this._value=void 0),!(!this.source&&this._bufferOwnership===`borrowed`)&&this._gpuVector){let t=$(this._gpuVector);this._bufferOwnership===`owned`?X.recycle(t):this.source instanceof e||(this._targetBuffer={buffer:t,byteOffset:this.offset,byteStride:this.stride}),this._gpuVector=void 0}}destroy(){this.assertScopeAccess(),this._gpuVector&&=(this._bufferOwnership===`owned`&&X.recycle($(this._gpuVector)),void 0),this._targetBuffer=void 0,this._destroyed=!0}};function pt(e,t,n,r){let{ValueType:i,size:a,offset:o,stride:s}=e,c=s/i.BYTES_PER_ELEMENT,l=o/i.BYTES_PER_ELEMENT,u=r-n;if(c===a){let e=l+n*c;return t.subarray(e,e+u*a)}let d=new i(u*a);for(let e=0;e<u;e++){let r=l+(n+e)*c;d.set(t.subarray(r,r+a),e*a)}return d}function mt(e){if(e instanceof Z)return e;if(typeof e==`number`||Array.isArray(e))return Z.fromConstant(e);if(e instanceof h)return Z.fromGPUData(e);if(e instanceof _)return Z.fromGPUDataView(e);throw Error(`getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]`)}function ht(e){if(!e.format)throw Error(`GPUDataEvaluator.fromGPUData() requires GPUData format metadata`);if(g(e.format)||p(e.format))throw Error(`GPUDataEvaluator.fromGPUData() does not support variable-length input`);let t=m(e.format).byteLength;if(e.rowByteLength!==t)throw Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}function Q(e){let t=m(e.format),n=s(t.signedDataType),r=n.BYTES_PER_ELEMENT*t.components;if(t.byteLength!==r)throw Error(`GPUDataEvaluator does not support packed vertex format ${e.format}: ${t.byteLength} physical bytes cannot expose ${t.components} ${t.signedDataType} components`);if(e.byteOffset%n.BYTES_PER_ELEMENT!==0||e.byteStride%n.BYTES_PER_ELEMENT!==0)throw Error(`GPUDataEvaluator requires ${e.format} offset and stride aligned to ${n.BYTES_PER_ELEMENT} bytes`);return{type:t.signedDataType,size:t.components,offset:e.byteOffset,stride:e.byteStride,normalized:t.normalized,length:e.length,format:e.format}}function $(e){let t=gt(e).buffer;return t instanceof q?t.buffer:t}function gt(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${e.name}"`);return t}function _t(e){let t=[];return vt(e,t,{byteOffset:0}),t}function vt(e,t,n){let r=e.source;if(r&&!(r instanceof Z)&&r.name===`interleave`){for(let e of Object.values(r.inputs))e instanceof Z&&vt(e,t,n);return}t.push({attribute:e.id??e.toString(),format:yt(e.type,e.size,e.normalized),byteOffset:n.byteOffset}),n.byteOffset+=e.ValueType.BYTES_PER_ELEMENT*e.size}function yt(e,t,n=!1){if(t<1||t>4)throw Error(`Cannot synthesize a GPUVector vertex format with ${t} components`);if(e===`float16`&&t===3&&!n)return`uint16x3-webgl`;let r=e;if(n)switch(e){case`uint8`:r=`unorm8`;break;case`sint8`:r=`snorm8`;break;case`uint16`:r=`unorm16`;break;case`sint16`:r=`snorm16`;break;case`float32`:r=`float32`;break;default:throw Error(`Unsupported normalized vertex format for ${e}`)}return(r===`uint8`||r===`sint8`||r===`uint16`||r===`sint16`||r===`unorm8`||r===`snorm8`||r===`unorm16`||r===`snorm16`)&&t===3?`${r}x3-webgl`:`${r}${t===1?``:`x${t}`}`}function bt(e,t,n=!1){return t>=1&&t<=4?yt(e,t,n):void 0}var xt={add:{arity:2,symbol:`arithmetic_add`},subtract:{arity:2,symbol:`arithmetic_subtract`},multiply:{arity:2,symbol:`arithmetic_multiply`},divide:{arity:2,symbol:`arithmetic_divide`},pow:{arity:2,symbol:`pow`},sqrt:{arity:1,symbol:`sqrt`},abs:{arity:1,symbol:`abs`},sin:{arity:1,symbol:`sin`},cos:{arity:1,symbol:`cos`},tan:{arity:1,symbol:`arithmetic_tan`},exp:{arity:1,symbol:`exp`},log:{arity:1,symbol:`log`}};function St(e,{operations:t,inputs:n}){switch(e.kind){case`input`:if(!(e.name in n))throw Error(`Unknown expression input '${e.name}'`);return;case`literal`:if(Array.isArray(e.value)){for(let t of e.value)if(!Number.isFinite(t))throw Error(`Expression literal array must contain only finite values, got ${t}`)}else if(!Number.isFinite(e.value))throw Error(`Expression literal must be finite, got ${e.value}`);return;case`call`:{let r=t[e.op];if(!r)throw Error(`Unknown expression op '${e.op}'`);if(e.args.length!==r.arity)throw Error(`Expression op '${e.op}' expects ${r.arity} args, got ${e.args.length}`);for(let r of e.args)St(r,{operations:t,inputs:n});return}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}function Ct(e,t){return St(e,t),wt(e,t)}function wt(e,t){switch(e.kind){case`input`:{let n=t.inputs[e.name];return t.laneIndex<n.size?t.formatInput(e.name):t.formatOutOfBoundsInput(e.name)}case`literal`:return t.formatLiteral(e.value);case`call`:{let n=t.operations[e.op],r=e.args.map(e=>wt(e,t));return t.formatCall(n.symbol,r)}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}export{T as A,De as C,_e as D,A as E,x as M,ee as N,le as O,b as P,Oe as S,j as T,Be as _,X as a,Ae as b,lt as c,st as d,ot as f,it as g,K as h,mt as i,ie as j,ce as k,J as l,nt as m,xt as n,Y as o,at as p,Z as r,q as s,Ct as t,dt as u,Ve as v,ke as w,Ee as x,je as y};