"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[978],{5101:(e,i,t)=>{t.r(i),t.d(i,{assets:()=>p,contentTitle:()=>l,default:()=>m,frontMatter:()=>r,metadata:()=>d,toc:()=>c});var n=t(4848),o=t(8453),a=t(8670);const r={},l="Examples",d={id:"index",title:"Examples",description:"<ExamplesIndex",source:"@site/content/examples/index.mdx",sourceDirName:".",slug:"/",permalink:"/examples/",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"defaultSidebar",next:{title:"Instancing",permalink:"/examples/showcase/instancing"}},p={},c=[];function s(e){const i={h1:"h1",header:"header",...(0,o.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(i.header,{children:(0,n.jsx)(i.h1,{id:"examples",children:"Examples"})}),"\n","\n",(0,n.jsx)(a.Ys,{getThumbnail:e=>`/images/examples/${"string"==typeof e?e:e.docId||e.label.toLowerCase()}.jpg`})]})}function m(e={}){const{wrapper:i}={...(0,o.R)(),...e.components};return i?(0,n.jsx)(i,{...e,children:(0,n.jsx)(s,{...e})}):s(e)}},8670:(e,i,t)=>{t.d(i,{Ys:()=>g,ww:()=>k});var n=t(3845),o=t(6540),a=t(3156),r=t(5176),l=t(6065),d="@media screen and (max-width: 480px)",p=l.Ay.div.withConfig({displayName:"examples-index__ExampleHeader",componentId:"sc-dc0lb5-0"})(["font:bold 20px/28px var(--ifm-font-family-base);color:var(--ifm-color-gray-800);margin:0 20px;border-bottom:1px solid 20px;display:inline-block;padding:20px 20px 4px 0;"]),c=l.Ay.main.withConfig({displayName:"examples-index__MainExamples",componentId:"sc-dc0lb5-1"})(["padding:16px 0;"]),s=l.Ay.main.withConfig({displayName:"examples-index__ExamplesGroup",componentId:"sc-dc0lb5-2"})(["display:flex;flex-wrap:wrap;padding:16px;"]),m=l.Ay.a.withConfig({displayName:"examples-index__ExampleCard",componentId:"sc-dc0lb5-3"})(["cursor:pointer;text-decoration:none;width:50%;max-width:240px;line-height:0;outline:none;padding:4px;position:relative;img{transition-property:filter;transition-duration:var(--ifm-transition-slow);transition-timing-function:var(--ifm-transition-timing-default);}&:hover{box-shadow:var(--ifm-global-shadow-md);}&:hover img{filter:contrast(0.2);}","{width:33%;min-width:200px;}@media screen and (max-width:632px){width:50%;}"],d),h=l.Ay.div.withConfig({displayName:"examples-index__ExampleTitle",componentId:"sc-dc0lb5-4"})(["position:absolute;display:flex;justify-content:center;flex-direction:column;color:var(--ifm-color-white);font-size:1.5em;text-align:center;line-height:initial;width:90%;height:90%;top:5%;left:5%;border:solid 1px var(--ifm-color-white);opacity:0;transition-property:opacity;transition-duration:var(--ifm-transition-slow);transition-timing-function:var(--ifm-transition-timing-default);&:hover{opacity:1;}"]);function f(e,i){for(var t,a=e.label,l=e.items,d=[],c=[],g=(0,n.A)(l);!(t=g()).done;){var x=t.value;"category"===x.type?c.push(x):"index"!==x.docId&&d.push(x)}return o.createElement(o.Fragment,null,a&&o.createElement(p,null,a),d.length>0&&o.createElement(s,null,d.map((function(e){return function(e,i){var t=(0,r.Ay)(i(e)),n=e.label,a=e.href;return o.createElement(m,{key:n,href:a},o.createElement("img",{width:"100%",src:t,alt:n}),o.createElement(h,null,o.createElement("span",null,n)))}(e,i)}))),c.map((function(e){return f(e,i)})))}function g(e){var i=e.getThumbnail,t=(0,a.t)();return o.createElement(c,null,f(t,i))}var x=t(1059),u=l.Ay.section.withConfig({displayName:"home__Banner",componentId:"sc-jldu3r-0"})(["position:relative;height:30rem;background:var(--ifm-color-gray-400);color:",";z-index:0;","{height:80vh;}"],(function(e){return"light"===e.theme?"var(--ifm-color-gray-900)":"var(--ifm-color-gray-200)"}),d),y=l.Ay.div.withConfig({displayName:"home__Container",componentId:"sc-jldu3r-1"})(["position:relative;padding:2rem;max-width:80rem;width:100%;height:100%;margin:0;"]),v=(0,l.Ay)(y).withConfig({displayName:"home__BannerContainer",componentId:"sc-jldu3r-2"})(["position:absolute;bottom:0;height:auto;padding-left:4rem;z-index:0;pointer-events:none;"]),b=l.Ay.div.withConfig({displayName:"home__HeroExampleContainer",componentId:"sc-jldu3r-3"})(["position:absolute;top:0;left:0;right:0;bottom:0;z-index:-1;"]),w=l.Ay.h1.withConfig({displayName:"home__ProjectName",componentId:"sc-jldu3r-4"})(["font-size:5em;line-height:1;text-transform:uppercase;letter-spacing:4px;font-weight:700;margin:0;margin-bottom:16px;"]),_=l.Ay.a.withConfig({displayName:"home__GetStartedLink",componentId:"sc-jldu3r-5"})(["pointer-events:all;font-size:12px;line-height:44px;letter-spacing:2px;font-weight:bold;margin:24px 0;padding:0 4rem;display:inline-block;text-decoration:none;transition:background-color 250ms ease-in,color 250ms ease-in;border:solid 2px var(--ifm-color-primary);color:inherit;border-image:linear-gradient( to right,var(--ifm-color-gray-700) 0%,var(--ifm-color-gray-400) 100% );border-image-slice:2;&:visited{color:inherit;}&:active{color:var(--ifm-color-white);}&:hover{color:var(--ifm-color-white);background-color:var(--ifm-color-primary);}"]);function k(e){var i=e.HeroExample,t=e.getStartedLink,n=void 0===t?"./docs":t,a=e.theme,r=void 0===a?"light":a,l=(0,x.A)().siteConfig;return o.createElement(u,{theme:r},o.createElement(b,null,i&&o.createElement(i,null)),o.createElement(v,null,o.createElement(w,null,l.title),o.createElement("p",null,l.tagline),n&&o.createElement(_,{href:n},"GET STARTED")))}l.Ay.div.withConfig({displayName:"spinner__SpinnerContainer",componentId:"sc-5xumfh-0"})(["height:18px;line-height:18px;font-size:10px;> div{white-space:nowrap;left:0;bottom:0;position:absolute;height:18px;padding-left:20px;transition:width 0.5s;}.spinner--fill{background:$primary;color:$white;overflow:hidden;}.spinner--text{color:$black-40;}&.done{height:0 !important;line-height:0;font-size:0;transition:height 0.5s 1s;> div{height:0 !important;transition:height 0.5s 1s;}}"]);l.Ay.div.withConfig({displayName:"input__InputContainer",componentId:"sc-1f01vvx-0"})(["position:relative;width:100%;&:last-child{margin-bottom:20px;}> *{vertical-align:middle;white-space:nowrap;}label{display:inline-block;width:40%;margin-right:10%;margin-top:2px;margin-bottom:2px;}input,a,button{background:var(--ifm-color-white);font-size:0.9em;text-transform:none;text-overflow:ellipsis;overflow:hidden;display:inline-block;padding:0 4px;margin:0;width:50%;height:20px;line-height:1.833;text-align:left;}button{color:initial;}button:disabled{color:var(--ifm-color-gray-500);cursor:default;background:var(--ifm-color-gray-300);}input{border:solid 1px var(--ifm-color-gray-500);&:disabled{background:var(--ifm-color-gray-300);}&[type='checkbox']{height:auto;}}.tooltip{left:50%;top:24px;opacity:0;pointer-events:none;transition:opacity 200ms;}&:hover .tooltip{opacity:1;}"]);l.Ay.div.withConfig({displayName:"info-panel__PanelContainer",componentId:"sc-3c5qm2-0"})(["font-size:14px;position:absolute;top:0;right:0;width:344px;background:var(--ifm-color-white);box-shadow:var(--ifm-global-shadow-lw);margin:24px;padding:10px 24px;max-height:96%;overflow-x:hidden;overflow-y:auto;overflow-y:overlay;outline:none;z-index:1;","{width:auto;left:0;}"],d),l.Ay.div.withConfig({displayName:"info-panel__PanelExpander",componentId:"sc-3c5qm2-1"})(["display:none;width:16px;height:16px;font-family:serif;font-size:0.8em;text-align:center;line-height:16px;border-radius:50%;background:",";color:",";","{display:block;}"],(function(e){return e.$expanded?"none":"var(--ifm-color-gray-900)"}),(function(e){return e.$expanded?"var(--ifm-color-black)":"var(--ifm-color-white)"}),d),l.Ay.div.withConfig({displayName:"info-panel__PanelTitle",componentId:"sc-3c5qm2-2"})(["display:flex;align-items:center;justify-content:space-between;font:bold 1.25em var(--ifm-font-family-base);margin:8px 0;","{cursor:pointer;}"],d),l.Ay.div.withConfig({displayName:"info-panel__PanelContent",componentId:"sc-3c5qm2-3"})(["div > *{vertical-align:middle;white-space:nowrap;}div > label{display:inline-block;width:40%;margin-right:10%;color:var(--ifm-color-gray-800);margin-top:2px;margin-bottom:2px;}div > input,div > a,div > button,div > select{background:var(--ifm-color-white);font:normal 11px/16px var(--ifm-font-family-base);line-height:20px;text-transform:none;text-overflow:ellipsis;overflow:hidden;display:inline-block;padding:0 4px;width:50%;height:20px;text-align:left;}div > button{color:initial;}div > button:disabled{color:var(--ifm-color-gray-300);cursor:default;background:var(--ifm-color-gray-300);}div > input{border:solid 1px var(--ifm-color-gray-300);&:disabled{background:var(--ifm-color-white);}&[type='checkbox']{height:auto;}}p{margin-bottom:12px;white-space:initial;}","{display:",";}"],d,(function(e){return e.$expanded?"block":"none"})),l.Ay.a.withConfig({displayName:"info-panel__SourceLink",componentId:"sc-3c5qm2-4"})(["display:block;text-align:right;margin-top:8px;font:bold 12px/20px var(--ifm-font-family-base);color:var(--ifm-color-gray-800);","{display:",";}"],d,(function(e){return e.$expanded?"block":"none"})),l.Ay.div.withConfig({displayName:"info-panel__InfoPanelContent",componentId:"sc-3c5qm2-5"})(["hr{margin:12px -24px;}a{text-decoration:none;display:inline;color:var(--ifm-color-primary);}p{margin-bottom:16px;}.legend{display:inline-block;width:12px;height:12px;}.stat{text-transform:uppercase;font-size:0.833em;b{display:block;font-size:3em;font-weight:bold;line-height:1.833;}}hr{border:none;background:var(--ifm-color-gray-400);height:1px;}.layout{display:table;width:100%;> *{display:table-cell !important;}.col-1-3{width:33.33%;}.col-1-2{width:50%;}.text-right{text-align:right;}.text-center{text-align:center;}}"])},8453:(e,i,t)=>{t.d(i,{R:()=>r,x:()=>l});var n=t(6540);const o={},a=n.createContext(o);function r(e){const i=n.useContext(a);return n.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function l(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),n.createElement(a.Provider,{value:i},e.children)}}}]);