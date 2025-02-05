/*! For license information please see f90d060d.dcd02afd.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[7670],{6710:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>a,contentTitle:()=>l,default:()=>p,frontMatter:()=>r,metadata:()=>s,toc:()=>c});var i=t(4848),o=t(8453);const r={},l="Setup",s={id:"tutorials/README",title:"Setup",description:"The tutorial pages have not yet been updated for luma.gl v9.",source:"@site/../docs/tutorials/README.mdx",sourceDirName:"tutorials",slug:"/tutorials/",permalink:"/docs/tutorials/",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/tutorials/README.mdx",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"Upgrade Guide",permalink:"/docs/upgrade-guide"},next:{title:"Hello Triangle",permalink:"/docs/tutorials/hello-triangle"}},a={},c=[{value:"A Minimal Application",id:"a-minimal-application",level:2},{value:"Build Tooling",id:"build-tooling",level:2}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",strong:"strong",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"setup",children:"Setup"}),"\n",(0,i.jsx)(n.admonition,{type:"caution",children:(0,i.jsx)(n.p,{children:"The tutorial pages have not yet been updated for luma.gl v9."})}),"\n",(0,i.jsxs)(n.p,{children:["This tutorial will walk you through setting up a basic development project for luma.gl applications using ",(0,i.jsx)(n.a,{href:"https://vitejs.dev/",children:"Vite"})," tooling. Later tutorials will build on this one, so we recommend going through it first."]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Note:"})," It is assumed for these tutorials that you have some basic knowledge of GPU APIs and JavaScript programming."]}),"\n",(0,i.jsx)(n.h2,{id:"a-minimal-application",children:"A Minimal Application"}),"\n",(0,i.jsxs)(n.p,{children:["Create a new folder on your file system to store your new project.\nThen let's create a file ",(0,i.jsx)(n.code,{children:"app.ts"})," in the project root folder and add the following to it:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"import type {AnimationProps} from '@luma.gl/engine';\nimport {AnimationLoop} from '@luma.gl/engine';\n\nconst loop = new AnimationLoop({\n  override onInitialize({device}: AnimationProps) {\n    // Setup logic goes here\n  },\n\n  override onFinalize({device}: AnimationProps) {\n    // Teardown logic goes here\n  },\n\n  override onRender({device}: AnimationProps) {\n    // Drawing logic goes here\n  }\n});\n\nloop.start();\n"})}),"\n",(0,i.jsx)(n.p,{children:"This will be the basic structure of most luma.gl applications.\nTo make sure everything works, let's add a draw command:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"import {AnimationLoop} from '@luma.gl/engine';\nimport {clear} from '@luma.gl/webgl';\n\nconst loop = new AnimationLoop({\n  override onRender({device}) {\n    // Drawing logic goes here\n    clear(device, {color: [0, 0, 0, 1]});\n  }\n});\n\nloop.start();\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Since this is a web application, you will also want to create a minimal ",(0,i.jsx)(n.code,{children:"index.html"})," web page to start the app:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-html",children:'<!doctype html>\n<script type="module">\n  import \'./app.ts\';\n<\/script>\n<body style="margin: 0;">\n  <canvas id="canvas" style="width: 100vw; height: 100vh;"></canvas>\n</body>\n'})}),"\n",(0,i.jsx)(n.h2,{id:"build-tooling",children:"Build Tooling"}),"\n",(0,i.jsx)(n.p,{children:"We will need the following files in the project folder:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"- package.json\n- vite.config.ts\n- app.ts\n- index.html\n"})}),"\n",(0,i.jsx)(n.p,{children:"From the command line, first run"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"mkdir luma-demo\ncd luma-demo\nnpm init -y\n"})}),"\n",(0,i.jsx)(n.p,{children:"to set up our project directory and initialize npm."}),"\n",(0,i.jsx)(n.p,{children:"Next run"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"npm i @luma.gl/engine @luma.gl/webgl\nnpm i -D vite typescript\n"})}),"\n",(0,i.jsx)(n.p,{children:"to install our dependencies."}),"\n",(0,i.jsxs)(n.p,{children:["Open the file ",(0,i.jsx)(n.code,{children:"package.json"})," (created when we initialized npm), and add the following to the ",(0,i.jsx)(n.code,{children:"scripts"})," block:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'{\n  "scripts": {\n    "start": "vite",\n    "serve": "vite preview"\n  },\n  "dependencies": {\n    "@luma.gl/engine": "^9.1.0-beta.1",\n    "@luma.gl/webgl": "^9.1.0-beta.1",\n  },\n  "devDependencies": {\n    "typescript": "^5.5.0",\n    "vite": "^5.0.0"\n  }\n}\n'})}),"\n",(0,i.jsxs)(n.p,{children:["The full contents of the ",(0,i.jsx)(n.code,{children:"package.json"})," should be the following (dependency version numbers might differ):"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'{\n  "name": "luma-demo",\n  "version": "1.0.0",\n  "description": "",\n  "keywords": [],\n  "author": "",\n  "license": "ISC",\n  "main": "index.js",\n  "scripts": {\n    "start": "vite",\n    "serve": "vite preview"\n  },\n  "dependencies": {\n    "@luma.gl/engine": "^9.1.0-beta.1",\n    "@luma.gl/webgl": "^9.1.0-beta.1",\n  },\n  "devDependencies": {\n    "typescript": "^5.5.0",\n    "vite": "^5.0.0"\n  }\n}\n'})}),"\n",(0,i.jsxs)(n.p,{children:["Create a file ",(0,i.jsx)(n.a,{href:"https://vitejs.dev/config/",children:(0,i.jsx)(n.code,{children:"vite.config.js"})})," in the project root and add the following to it:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-typescript",children:"import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  server: {open: true}\n})\n"})}),"\n",(0,i.jsx)(n.p,{children:"and run"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"npm start\n"})}),"\n",(0,i.jsx)(n.p,{children:"from the command line. If all went well, a tab should open in your default browser,\nand you should see a black rectangle at the top left of your screen."})]})}function p(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},1020:(e,n,t)=>{var i=t(6540),o=Symbol.for("react.element"),r=Symbol.for("react.fragment"),l=Object.prototype.hasOwnProperty,s=i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,a={key:!0,ref:!0,__self:!0,__source:!0};function c(e,n,t){var i,r={},c=null,d=null;for(i in void 0!==t&&(c=""+t),void 0!==n.key&&(c=""+n.key),void 0!==n.ref&&(d=n.ref),n)l.call(n,i)&&!a.hasOwnProperty(i)&&(r[i]=n[i]);if(e&&e.defaultProps)for(i in n=e.defaultProps)void 0===r[i]&&(r[i]=n[i]);return{$$typeof:o,type:e,key:c,ref:d,props:r,_owner:s.current}}n.Fragment=r,n.jsx=c,n.jsxs=c},4848:(e,n,t)=>{e.exports=t(1020)},8453:(e,n,t)=>{t.d(n,{R:()=>l,x:()=>s});var i=t(6540);const o={},r=i.createContext(o);function l(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:l(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);