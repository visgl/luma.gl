/*! For license information please see 00e67085.885f0ec5.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[978],{29:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>w,contentTitle:()=>y,default:()=>E,frontMatter:()=>h,metadata:()=>g,toc:()=>v});var i=n(4848),r=n(8453),o=n(6540),a=n(447),s=n(5176),l=n(6065);const c=l.Ay.div`
  font: bold 20px/28px var(--ifm-font-family-base);
  color: var(--ifm-color-gray-800);
  margin: 0 20px;
  border-bottom: 1px solid 20px;
  display: inline-block;
  padding: 20px 20px 4px 0;
`,p=l.Ay.main`
  padding: 16px 0;
`,m=l.Ay.main`
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
`,d=l.Ay.a`
  cursor: pointer;
  text-decoration: none;
  width: 50%;
  max-width: 240px;
  line-height: 0;
  outline: none;
  padding: 4px;
  position: relative;
  img {
    transition-property: filter;
    transition-duration: var(--ifm-transition-slow);
    transition-timing-function: var(--ifm-transition-timing-default);
  }
  &:hover {
    box-shadow: var(--ifm-global-shadow-md);
  }
  &:hover img {
    filter: contrast(0.2);
  }
  ${e=>"@media screen and (max-width: 480px)"} {
    width: 33%;
    min-width: 200px;
  }
  @media screen and (max-width: 632px) {
    width: 50%;
  }
`,f=l.Ay.div`
  position: absolute;
  display: flex;
  justify-content: center;
  flex-direction: column;
  color: var(--ifm-color-white);
  font-size: 1.5em;
  text-align: center;
  line-height: initial;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
  border: solid 1px var(--ifm-color-white);
  opacity: 0;
  transition-property: opacity;
  transition-duration: var(--ifm-transition-slow);
  transition-timing-function: var(--ifm-transition-timing-default);
  &:hover {
    opacity: 1;
  }
`;function u(e,t){let{label:n,items:i}=e;return[o.createElement(c,{key:`${n}-header`},n),o.createElement(m,{key:n},i.map((e=>function(e,t){const n=(0,s.Ay)(t(e)),{label:i}="string"==typeof e?{label:e}:e,{href:r}="string"==typeof e?{href:e}:e;return o.createElement(d,{key:i,href:r},o.createElement("img",{width:"100%",src:n,alt:i}),o.createElement(f,null,o.createElement("span",null,i)))}(e,t))))]}function x(e){let{getThumbnail:t}=e;const n=(0,a.t)();return o.createElement(p,null,n.items.map((e=>"category"===e.type?u(e,t):null)))}const h={},y="Examples",g={id:"index",title:"Examples",description:"<ExamplesIndex",source:"@site/content/examples/index.mdx",sourceDirName:".",slug:"/",permalink:"/examples/",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"examplesSidebar",next:{title:"Instancing",permalink:"/examples/showcase/instancing"}},w={},v=[];function b(e){const t={h1:"h1",...(0,r.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.h1,{id:"examples",children:"Examples"}),"\n","\n",(0,i.jsx)(x,{getThumbnail:e=>`/images/examples/${"string"==typeof e?e:e.docId||e.label.toLowerCase()}.jpg`})]})}function E(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(b,{...e})}):b(e)}},1020:(e,t,n)=>{var i=n(6540),r=Symbol.for("react.element"),o=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,s=i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,l={key:!0,ref:!0,__self:!0,__source:!0};function c(e,t,n){var i,o={},c=null,p=null;for(i in void 0!==n&&(c=""+n),void 0!==t.key&&(c=""+t.key),void 0!==t.ref&&(p=t.ref),t)a.call(t,i)&&!l.hasOwnProperty(i)&&(o[i]=t[i]);if(e&&e.defaultProps)for(i in t=e.defaultProps)void 0===o[i]&&(o[i]=t[i]);return{$$typeof:r,type:e,key:c,ref:p,props:o,_owner:s.current}}t.Fragment=o,t.jsx=c,t.jsxs=c},4848:(e,t,n)=>{e.exports=n(1020)},8453:(e,t,n)=>{n.d(t,{R:()=>a,x:()=>s});var i=n(6540);const r={},o=i.createContext(r);function a(e){const t=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:a(e.components),i.createElement(o.Provider,{value:t},e.children)}}}]);