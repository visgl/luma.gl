"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[1824],{9486:(e,t,i)=>{i.r(t),i.d(t,{default:()=>p});var a=i(6540),n=i(892),r=i(6065),o=i(5176);const l=JSON.parse('[{"name":"I3S Explorer","url":"https://i3s.loaders.gl/dashboard","image":"/images/examples/i3s-arcgis.jpg","links":{},"description":"Visualization and Debug Tool for I3S 3D geographic data"}]');const d=r.Ay.div`
  padding: 60px 12px;
  width: 800px;
  max-width: 800px;
  margin: 0 auto;
  font-size: 14px;

  @media screen and (max-width: 600px) {
    padding: 12px;
    width: calc(100% - 12px);
  }
`,c=r.Ay.div`
  cursor: pointer;
  position: relative;
  width: 32%;
  display: inline-block;
  line-height: 0;

  img {
    transition: opacity 0.4s;
    width: 100%;
  }
  > div:before,
  > div:after {
    display: block;
    z-index: 1;
    position: absolute;
    transition: opacity 0.4s;
    opacity: 0;
    text-align: center;
    pointer-events: none;
    box-sizing: border-box;
    line-height: 1.5;
  }
  > div:before {
    content: attr(data-title);
    font-size: 1.4em;
    font-weight: 100;
    width: 100%;
    padding: 12%;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
  }
  > div:after {
    font-size: 0.833em;
    content: attr(data-name);
    padding: 5%;
    left: 0;
    width: 90%;
    height: 90%;
    margin: 5%;
    top: 0;
    left: 0;
    border: solid 2px;
    border-color: $primary;
    box-sizing: border-box;
  }
  > div:hover img {
    opacity: 0.2;
  }
  > div:hover:before,
  > div:hover:after {
    opacity: 1;
  }
  @media screen and (max-width: 720px) {
    width: 49%;
  }
  @media screen and (max-width: 480px) {
    width: 100%;
  }
`,s=r.Ay.div`
  width: 68%;
  height: 0;
  padding-top: 32%;
  display: inline-block;
  line-height: 1.5;
  padding-left: 24px;
  vertical-align: top;
  position: relative;
  background: #eee;

  a {
    text-decoration: none;
    color: val(--ifm-color-black);
  }
  h2 {
    color: #111 !important;
  }
  > div {
    position: absolute;
    top: 12px;
    left: 20px;
    right: 20px;
    bottom: 12px;
    overflow: hidden;
    color: #19202C;
  }
  @media screen and (max-width: 720px) {
    width: 50%;
    padding-top: 49%;
  }
  @media screen and (max-width: 480px) {
    display: none;
  }
`;function p(){const e=(0,o.Ay)("/");return a.createElement(n.A,{title:"Showcase",description:"Projects built with deck.gl"},a.createElement(d,null,a.createElement("p",null,a.createElement("i",null,"Would you like us to feature your project?",a.createElement("a",{href:"https://github.com/visgl/loaders.gl/issues"}," Let us know!"))),l.map((t=>{let{name:i,url:n,image:r,links:o,description:l}=t;return a.createElement("div",{key:i},a.createElement(c,null,a.createElement("div",{"data-title":i},a.createElement("a",{href:n},a.createElement("img",{src:(d=e,p=r,p.match(/^\w+:\/\//)?p:`${d.replace(/\/$/,"")}/${p.replace(/^\//,"")}`)})))),a.createElement(s,null,a.createElement("div",null,a.createElement("a",{href:n,target:"_blank",rel:"noopener noreferrer"},a.createElement("h2",null,i)),a.createElement("p",null,Object.keys(o).map(((e,t)=>function(e,t,i){const n=i>0?" | ":"",r=e.search(/[A-Z0-9]\w+/);return a.createElement("span",{key:i},n,e.slice(0,r),a.createElement("a",{href:t,target:"_blank",rel:"noopener noreferrer"},e.slice(r)))}(e,o[e],t)))),a.createElement("p",null,l))));var d,p}))))}}}]);