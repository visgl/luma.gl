/*! For license information please see 5acf416f.e8c1fc3a.js.LICENSE.txt */
"use strict";(self.webpackChunkwebsite_docusaurus=self.webpackChunkwebsite_docusaurus||[]).push([[4531],{6448:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>h,frontMatter:()=>s,metadata:()=>c,toc:()=>a});var n=r(4848),d=r(8453);const s={},i="Texture",c={id:"api-reference/core/resources/texture",title:"Texture",description:"A Texture are GPU objects that contain one or more images that all have the same image format, that can be accessed from shaders.",source:"@site/../docs/api-reference/core/resources/texture.md",sourceDirName:"api-reference/core/resources",slug:"/api-reference/core/resources/texture",permalink:"/docs/api-reference/core/resources/texture",draft:!1,unlisted:!1,editUrl:"https://github.com/visgl/luma.gl/tree/main/docs/../docs/api-reference/core/resources/texture.md",tags:[],version:"current",frontMatter:{},sidebar:"sidebar",previous:{title:"Shader Logs",permalink:"/docs/api-reference/core/shader-logs"},next:{title:"TextureView",permalink:"/docs/api-reference/core/resources/texture-view"}},l={},a=[{value:"Usage",id:"usage",level:2},{value:"Types",id:"types",level:2},{value:"<code>TextureProps</code>",id:"textureprops",level:3},{value:"Usage",id:"usage-1",level:3},{value:"TextureDimension",id:"texturedimension",level:2},{value:"ExternalImage",id:"externalimage",level:2},{value:"TextureData",id:"texturedata",level:2},{value:"CubeFace",id:"cubeface",level:2},{value:"Members",id:"members",level:2},{value:"Static Methods",id:"static-methods",level:2},{value:"<code>Texture.isExternalImage()</code>",id:"textureisexternalimage",level:3},{value:"<code>Texture.getExternalImageSize()</code>",id:"texturegetexternalimagesize",level:3},{value:"<code>Texture.isTextureLevelData()</code>",id:"textureistextureleveldata",level:3},{value:"<code>Texture.getTextureDataSize()</code>",id:"texturegettexturedatasize",level:3},{value:"<code>Texture.getMipLevelCount()</code>",id:"texturegetmiplevelcount",level:3},{value:"<code>Texture.getCubeFaceDepth()</code>",id:"texturegetcubefacedepth",level:3},{value:"Methods",id:"methods",level:2},{value:"<code>constructor(props: TextureProps)</code>",id:"constructorprops-textureprops",level:3},{value:"<code>destroy(): void</code>",id:"destroy-void",level:3},{value:"<code>generateMipmap() : Texture2D</code>",id:"generatemipmap--texture2d",level:3},{value:"<code>copyExternalImage()</code>",id:"copyexternalimage",level:3}];function o(e){const t={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,d.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"texture",children:"Texture"}),"\n",(0,n.jsxs)(t.p,{children:["A ",(0,n.jsx)(t.code,{children:"Texture"})," are GPU objects that contain one or more images that all have the same image format, that can be accessed from shaders."]}),"\n",(0,n.jsxs)(t.p,{children:["While the idea behind textures is simple in principle (a grid of pixels stored on GPU memory), GPU Textures are surprisingly complex objects. It can be helpful to read the ",(0,n.jsx)(t.a,{href:"http://localhost:3000/docs/api-guide/gpu/gpu-textures",children:"API Guide section on textures"})," to make sure you have a full picture."]}),"\n",(0,n.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(t.p,{children:"Creating a texture"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"const texture = device.createTexture({sampler: {addressModeU: 'clamp-to-edge'});\n"})}),"\n",(0,n.jsx)(t.p,{children:"Setting texture data from an image"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"const imageBitmap = // load an image from a URL, perhaps with loaders.gl ImageLoader\ntexture.copyFromExternalImage({source: imageBitmap});\n"})}),"\n",(0,n.jsxs)(t.p,{children:["Note that setting texture data from 8 bit RGBA arrays can also be done via ",(0,n.jsx)(t.code,{children:"texture.copyFromExternalImage()"})," via ",(0,n.jsx)(t.code,{children:"ImageData"}),"."]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"const data = new ClampedUint8Array([...]);\nconst imageData = new ImageData(data, width, height); \ntexture.copyFromExternalImage({source: imageData});\n"})}),"\n",(0,n.jsx)(t.p,{children:"Setting texture data for non-8-bit-per-channel bit depths, texture arrays etc."}),"\n",(0,n.jsx)(t.admonition,{type:"caution",children:(0,n.jsx)(t.p,{children:"This is still WIP"})}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"const commandEncoder = device.createCommandEncoder();\nconst buffer = device.createBuffer({usage: , byteLength});\nconst texture = device.createTexture({ })\ncommandEncoder.end();\n"})}),"\n",(0,n.jsx)(t.p,{children:"Reading from Textures In Shaders"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"const texture = device.createTexture, ...);\n\n// For ease of use, the `Model` class can bind textures for a draw call\nmodel.draw({\n  renderPass,\n  bindings({texture1: texture, texture2: texture})\n});\n\n\nconst framebuffer = device.createFramebuffer({\n  colorAttachments: [texture]\n});\n\nconst renderPass = device.createRenderPass({\n  framebuffer\n});\n\n\n// Alternatively, bind the textures using the `Texture` API directly\nmodel.draw({\n  uniforms({uMVMatrix: matrix})\n});\n"})}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:["For additional usage examples, ",(0,n.jsx)(t.code,{children:"Texture"})," inherits from ",(0,n.jsx)(t.code,{children:"Resource"}),"."]}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"types",children:"Types"}),"\n",(0,n.jsx)(t.h3,{id:"textureprops",children:(0,n.jsx)(t.code,{children:"TextureProps"})}),"\n",(0,n.jsxs)(t.table,{children:[(0,n.jsx)(t.thead,{children:(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.th,{children:"Property"}),(0,n.jsx)(t.th,{children:"Type"}),(0,n.jsx)(t.th,{children:"Description"})]})}),(0,n.jsxs)(t.tbody,{children:[(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"usage?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Bit mask of Usage flags"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"byteLength?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Length of buffer (cannot be changed after creation)."})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"data?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"ArrayBuffer | ArrayBufferView"})}),(0,n.jsxs)(t.td,{children:["Data to be copied into buffer. ",(0,n.jsx)(t.code,{children:"byteLength"})," will be deduced if not supplied."]})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"byteOffset?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsxs)(t.td,{children:["Offset for ",(0,n.jsx)(t.code,{children:"data"})]})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"indexType?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"'uint16' | 'uint32'"})}),(0,n.jsx)(t.td,{children:"If props.usage & Buffer.INDEX"})]})]})]}),"\n",(0,n.jsx)(t.h3,{id:"usage-1",children:"Usage"}),"\n",(0,n.jsx)(t.p,{children:"Usage expresses two things: The type of texture and what operations can be performed on it."}),"\n",(0,n.jsx)(t.p,{children:"Note that the allowed combinations are very limited, especially in WebGPU."}),"\n",(0,n.jsxs)(t.table,{children:[(0,n.jsx)(t.thead,{children:(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.th,{children:"Usage Flag"}),(0,n.jsx)(t.th,{children:"Value"}),(0,n.jsx)(t.th,{children:"Description"})]})}),(0,n.jsxs)(t.tbody,{children:[(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"Texture.COPY_SRC"})}),(0,n.jsx)(t.td,{children:"0x01"}),(0,n.jsx)(t.td,{children:"Enables this texture to be used as a source in CommandEncoder copy commands."})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"Texture.COPY_DST"})}),(0,n.jsx)(t.td,{children:"0x02"}),(0,n.jsx)(t.td,{children:"Enables this texture to be used as a destination in CommandEncoder copy commands."})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"Texture.TEXTURE"})}),(0,n.jsx)(t.td,{children:"0x04"}),(0,n.jsx)(t.td,{})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"Texture.STORAGE_BINDING"})}),(0,n.jsx)(t.td,{children:"0x08"}),(0,n.jsx)(t.td,{children:"Enables this texture to used as a storage binding."})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"Texture.RENDER_ATTACHMENT"})}),(0,n.jsx)(t.td,{children:"0x10"}),(0,n.jsx)(t.td,{children:"Enables this texture to be used as a render attachment."})]})]})]}),"\n",(0,n.jsx)(t.h2,{id:"texturedimension",children:"TextureDimension"}),"\n",(0,n.jsxs)(t.p,{children:["| Dimension | WebGPU | WebGL2 | Description |\n| --------- | ------ | ------ || -------------------------------------------------------------------- |\n| ",(0,n.jsx)(t.code,{children:"1d"}),"         | \u2705      | \u274c      | Contains a one dimensional texture (typically used for compute )     |\n| ",(0,n.jsx)(t.code,{children:"2d"}),'         | \u2705      | \u2705      | Contains a "normal" image texture                                    |\n| ',(0,n.jsx)(t.code,{children:"2d-array"}),'   | \u2705      | \u2705      | Holds an "array" of 2D textures.                                     |\n| ',(0,n.jsx)(t.code,{children:"3d"}),'         | \u2705      | \u2705      | Holds a "stack" of textures which enables 3D interpolation.          |\n| ',(0,n.jsx)(t.code,{children:"cube"}),"       | \u2705      | \u2705      | Holds 6 textures representing sides of a cube.                       |\n| ",(0,n.jsx)(t.code,{children:"cube-array"})," | \u2705      | \u274c      | Holds an array where every 6 textures represent the sides of a cube. |"]}),"\n",(0,n.jsx)(t.h2,{id:"externalimage",children:"ExternalImage"}),"\n",(0,n.jsx)(t.p,{children:"luma.gl allows texture data to be initialized from a number of different CPU object that hold an image.\nThese are referred to as external (to the GPU) images."}),"\n",(0,n.jsxs)(t.p,{children:["| ",(0,n.jsx)(t.code,{children:"Image"})," (",(0,n.jsx)(t.code,{children:"HTMLImageElement"}),")   | image will be used to fill the texture. width and height will be deduced.                             |\n| ",(0,n.jsx)(t.code,{children:"Canvas"})," (",(0,n.jsx)(t.code,{children:"HTMLCanvasElement"}),") | canvas will be used to fill the texture. width and height will be deduced.                            |\n| ",(0,n.jsx)(t.code,{children:"Video"})," (",(0,n.jsx)(t.code,{children:"HTMLVideoElement"}),")   | video will be used to continously update the texture. width and height will be deduced.               |\n| ",(0,n.jsx)(t.code,{children:"ImageData"}),"                    | ",(0,n.jsx)(t.code,{children:"canvas.getImageData()"})," - Used to fill the texture. width and height will be deduced.                 |"]}),"\n",(0,n.jsx)(t.h2,{id:"texturedata",children:"TextureData"}),"\n",(0,n.jsx)(t.p,{children:"luma.gl allows textures to be created from a number of different data sources."}),"\n",(0,n.jsxs)(t.table,{children:[(0,n.jsx)(t.thead,{children:(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.th,{children:"Type"}),(0,n.jsx)(t.th,{children:"Description"})]})}),(0,n.jsxs)(t.tbody,{children:[(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"null"})}),(0,n.jsx)(t.td,{children:'A texture will be created with the appropriate format, size and width. Bytes will be "uninitialized".'})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"typed array"})}),(0,n.jsx)(t.td,{children:"Bytes will be interpreted according to format/type parameters and pixel store parameters."})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"Buffer"})}),(0,n.jsx)(t.td,{children:"Bytes will be interpreted according to format/type parameters and pixel store parameters."})]})]})]}),"\n",(0,n.jsx)(t.h2,{id:"cubeface",children:"CubeFace"}),"\n",(0,n.jsx)(t.p,{children:"Lets cube faces be specified with semantic strings instead of just depth indexes (0-5)."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"type TextureCubeFace = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';\n"})}),"\n",(0,n.jsx)(t.h2,{id:"members",children:"Members"}),"\n",(0,n.jsx)(t.p,{children:"A number of read only accessors are available:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"device"}),": ",(0,n.jsx)(t.code,{children:"Device"})," - holds a reference to the ",(0,n.jsx)(t.code,{children:"Device"})," that created this ",(0,n.jsx)(t.code,{children:"Texture"}),"."]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"handle"}),": ",(0,n.jsx)(t.code,{children:"unknown"})," - holds the underlying WebGL or WebGPU shader object"]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"props"}),": ",(0,n.jsx)(t.code,{children:"TextureProps"})," - holds a copy of the ",(0,n.jsx)(t.code,{children:"TextureProps"})," used to create this ",(0,n.jsx)(t.code,{children:"Texture"}),"."]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"width"})," - width of one face of the cube map"]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"height"})," - height of one face of the cube map"]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"format"})," - internal format of the face textures"]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"border"})," - Always 0."]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"type"})," - type used to create face textures"]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"dataFormat"})," - data format used to create face textures."]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"offset"})," - offset used to create face textures."]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"handle"})," - The underlying WebGL or WebGPU object."]}),"\n"]}),"\n",(0,n.jsxs)(t.li,{children:["\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"id"})," - An identifying string that is intended to help debugging."]}),"\n"]}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"static-methods",children:"Static Methods"}),"\n",(0,n.jsx)(t.h3,{id:"textureisexternalimage",children:(0,n.jsx)(t.code,{children:"Texture.isExternalImage()"})}),"\n",(0,n.jsx)(t.p,{children:"Check whether a value is a valid external image object."}),"\n",(0,n.jsx)(t.h3,{id:"texturegetexternalimagesize",children:(0,n.jsx)(t.code,{children:"Texture.getExternalImageSize()"})}),"\n",(0,n.jsx)(t.p,{children:'Deduces the size (width and height) of an "external image" object.'}),"\n",(0,n.jsx)(t.h3,{id:"textureistextureleveldata",children:(0,n.jsx)(t.code,{children:"Texture.isTextureLevelData()"})}),"\n",(0,n.jsx)(t.p,{children:"Check whether a value is valid as data for setting a texture level."}),"\n",(0,n.jsx)(t.h3,{id:"texturegettexturedatasize",children:(0,n.jsx)(t.code,{children:"Texture.getTextureDataSize()"})}),"\n",(0,n.jsx)(t.p,{children:"Calculates the size of texture data for a composite texture data object"}),"\n",(0,n.jsx)(t.h3,{id:"texturegetmiplevelcount",children:(0,n.jsx)(t.code,{children:"Texture.getMipLevelCount()"})}),"\n",(0,n.jsxs)(t.p,{children:["Calculate the number of mip levels for a texture of width and height.\nIt performs the standard calculation ",(0,n.jsx)(t.code,{children:"Math.floor(Math.log2(Math.max(width, height))) + 1"}),"."]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"Texture.getMipLevelCount(width: number, height: number): number\n"})}),"\n",(0,n.jsx)(t.h3,{id:"texturegetcubefacedepth",children:(0,n.jsx)(t.code,{children:"Texture.getCubeFaceDepth()"})}),"\n",(0,n.jsx)(t.p,{children:"Convert luma.gl cubemap face constants to texture depth index (0-based)."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"Texture.getCubeFaceDepth(face: TextureCubeFace): number\n"})}),"\n",(0,n.jsx)(t.h2,{id:"methods",children:"Methods"}),"\n",(0,n.jsx)(t.h3,{id:"constructorprops-textureprops",children:(0,n.jsx)(t.code,{children:"constructor(props: TextureProps)"})}),"\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"Texture"})," is an abstract class and cannot be instantiated directly. Create with ",(0,n.jsx)(t.code,{children:"device.createTexture(...)"}),"."]}),"\n",(0,n.jsx)(t.h3,{id:"destroy-void",children:(0,n.jsx)(t.code,{children:"destroy(): void"})}),"\n",(0,n.jsx)(t.p,{children:"Free up any GPU resources associated with this texture immediately (instead of waiting for garbage collection)."}),"\n",(0,n.jsx)(t.h3,{id:"generatemipmap--texture2d",children:(0,n.jsx)(t.code,{children:"generateMipmap() : Texture2D"})}),"\n",(0,n.jsx)(t.p,{children:"Call to regenerate mipmaps after modifying texture(s)"}),"\n",(0,n.jsxs)(t.p,{children:["WebGL References ",(0,n.jsx)(t.a,{href:"https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap",children:"gl.generateMipmap"})]}),"\n",(0,n.jsx)(t.h3,{id:"copyexternalimage",children:(0,n.jsx)(t.code,{children:"copyExternalImage()"})}),"\n",(0,n.jsx)(t.p,{children:"Copy data from an image data into the texture."}),"\n",(0,n.jsxs)(t.p,{children:["This function offers a highly granular control but can be called with just an ",(0,n.jsx)(t.code,{children:"image"})," parameter and the remaining arguments will be deduced or set to canonical defaults."]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"copyExternalImage(options: {\n  image: ExternalImage;\n  sourceX?: number;\n  sourceY?: number;\n  width?: number;\n  height?: number;\n  depth?: number;\n  mipLevel?: number;\n  x?: number;\n  y?: number;\n  z?: number;\n  aspect?: 'all' | 'stencil-only' | 'depth-only';\n  colorSpace?: 'srgb';\n  premultipliedAlpha?: boolean;\n}: {width: number; height: number}\n"})}),"\n",(0,n.jsxs)(t.table,{children:[(0,n.jsx)(t.thead,{children:(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.th,{children:"Parameter"}),(0,n.jsx)(t.th,{children:"Type"}),(0,n.jsx)(t.th,{})]})}),(0,n.jsxs)(t.tbody,{children:[(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"image"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"ExternalImage"})}),(0,n.jsx)(t.td,{children:"Image"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"sourceX?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Copy from image x offset (default 0)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"sourceY?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Copy from image y offset (default 0)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"width?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Copy area width (default 1)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"height?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Copy area height (default 1)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"depth?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Copy depth (default 1)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"mipLevel?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Which mip-level to copy into (default 0)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"x?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Start copying into offset x (default 0)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"y?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Start copying into offset y (default 0)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"z?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"number"})}),(0,n.jsx)(t.td,{children:"Start copying from depth layer z (default 0)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"aspect?"})}),(0,n.jsxs)(t.td,{children:[(0,n.jsx)(t.code,{children:"'all' | 'stencil-only' | 'depth-only'"}),";"]}),(0,n.jsx)(t.td,{children:"When copying into depth stencil textures (default 'all')"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"colorSpace?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"'srgb'"})}),(0,n.jsx)(t.td,{children:"Specific color space of image data"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"premultipliedAlpha?"})}),(0,n.jsx)(t.td,{children:(0,n.jsx)(t.code,{children:"boolean"})}),(0,n.jsx)(t.td,{children:"premultiplied"})]})]})]})]})}function h(e={}){const{wrapper:t}={...(0,d.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}},1020:(e,t,r)=>{var n=r(6540),d=Symbol.for("react.element"),s=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,c=n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,l={key:!0,ref:!0,__self:!0,__source:!0};function a(e,t,r){var n,s={},a=null,o=null;for(n in void 0!==r&&(a=""+r),void 0!==t.key&&(a=""+t.key),void 0!==t.ref&&(o=t.ref),t)i.call(t,n)&&!l.hasOwnProperty(n)&&(s[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps)void 0===s[n]&&(s[n]=t[n]);return{$$typeof:d,type:e,key:a,ref:o,props:s,_owner:c.current}}t.Fragment=s,t.jsx=a,t.jsxs=a},4848:(e,t,r)=>{e.exports=r(1020)},8453:(e,t,r)=>{r.d(t,{R:()=>i,x:()=>c});var n=r(6540);const d={},s=n.createContext(d);function i(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(d):e.components||d:i(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);