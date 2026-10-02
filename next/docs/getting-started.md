# Getting Started

In this getting started we will guide you through rendering your first `Hello Triangle`. `Hello Triangle` is a simple triangle that is rendered to the screen. Its synonymous with printing `Hello World` to the console when learning a programming new language.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

* A browser with WebGPU or WebGL2 support
* Basic TypeScript knowledge
* Basic WebGL2 or WebGPU knowledge

## Project Setup[​](#project-setup "Direct link to Project Setup")

We are going to use Vite to scaffold our project.

```
npm create vite@latest luma-demo -- --template vanilla-ts
```

## Installation[​](#installation "Direct link to Installation")

Install luma.gl using your package manager of choice.

```
npm install @luma.gl/core @luma.gl/engine @luma.gl/webgl @luma.gl/webgpu
```

## Setup[​](#setup "Direct link to Setup")

### Step 1. Render a frame[​](#step-1-render-a-frame "Direct link to Step 1. Render a frame")

Replace `src/main.ts` with:

```
import {luma} from '@luma.gl/core';

import {AnimationLoopTemplate, type AnimationProps, makeAnimationLoop} from '@luma.gl/engine';

import {webgpuAdapter} from '@luma.gl/webgpu';

import {webgl2Adapter} from '@luma.gl/webgl';



// This class extends AnimationLoopTemplate to define the main render loop

class AppAnimationLoopTemplate extends AnimationLoopTemplate {

  // main render loop

  override onRender({device}: AnimationProps): void {

    const renderPass = device.beginRenderPass({

      clearColor: [0.961, 0.961, 0.961, 1] // clears the color buffer to a light gray color

    });



    renderPass.end(); // ends the render pass

  }



  onFinalize(): void {}

}



// gets the container element to render to

const container = document.getElementById('app')!;



// sets up the device

const device = await luma.createDevice({

  adapters: [webgpuAdapter,webgl2Adapter],

  createCanvasContext: {

    container,

    width: 500,

    height: 500,

  },

});



// sets up the animation loop

makeAnimationLoop(AppAnimationLoopTemplate, {

  device

}).start();
```

With that you can run the vite development server and see the result.

```
npm run dev
```

At this checkpoint, you should see a light gray background. The next steps add the shaders and draw the triangle.

### Step 2. Write the shaders[​](#step-2-write-the-shaders "Direct link to Step 2. Write the shaders")

In this step you will write the shaders that will render the triangle both in GLSL and WGSL seperarely. Add the following code to `main.ts` file. The shaders below uses the vertex index to determine the position of each vertex.

```
// vertex shader in GLSL

const VS_GLSL = /* glsl */`#version 300 es



  const vec2 pos[3] = vec2[3](vec2(0.0f, 0.5f), vec2(-0.5f, -0.5f), vec2(0.5f, -0.5f));



  void main() {

    gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);

  }

`;



// fragment shader in GLSL

const FS_GLSL = /* glsl */ `\

    #version 300 es



    precision highp float;



    layout(location = 0) out vec4 outColor;



    void main() {

    outColor = vec4(1.0, 0.0, 0.0, 1.0);

    }

`;



// vertex shader in WGSL

const WGSL_SHADER = /* wgsl */ `\

    @vertex

    fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {



    var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));

        return vec4<f32>(positions[vertexIndex], 0.0, 1.0);

    }





    @fragment

    fn fragmentMain() -> @location(0) vec4<f32> {

        return vec4<f32>(1.0, 0.0, 0.0, 1.0);

    }

`
```

### Step 3. Render the triangle[​](#step-3-render-the-triangle "Direct link to Step 3. Render the triangle")

In order to render the triangle, we need to create a `Model` resource and call its `draw` method in the `onRender` method of the `AppAnimationLoopTemplate`. In the model we pass in all the necessary data to it such as the shader sources, vertex data, topology etc which will then be used to render the triangle.

`Model` is a resource that contains per draw call resources such as vertex, index buffers, uniforms and pipeline. For more information, see the [Model](https://luma.gl/next/docs/api-reference/engine/model.md) documentation.

```
import {AnimationLoopTemplate, type AnimationProps, makeAnimationLoop,Model} from '@luma.gl/engine';



// This class extends AnimationLoopTemplate to define the main render loop

class AppAnimationLoopTemplate extends AnimationLoopTemplate {

  model: Model;



  constructor({device}: AnimationProps) {

    super();



    this.model = new Model(device, {

      source: WGSL_SHADER,

      vs: VS_GLSL,

      fs: FS_GLSL,

      topology: 'triangle-list',

      vertexCount: 3,

      shaderLayout: {

        attributes: [],

        bindings: []

      },

      parameters: {

        depthFormat: 'depth24plus'

      }

    });

  }



  // main render loop

  override onRender({device}: AnimationProps): void {

    const renderPass = device.beginRenderPass({

      clearColor: [0.961, 0.961, 0.961, 1] // clears the color buffer to a light gray color

    });



    this.model.draw(renderPass);



    renderPass.end(); // ends the render pass

  }



  onFinalize(): void {

    this.model.destroy();

  }

}
```

### Step 4. Putting it all together[​](#step-4-putting-it-all-together "Direct link to Step 4. Putting it all together")

Your `main.ts` and `index.html` file should look like this:

* src/main.ts
* index.html

```
import { luma } from '@luma.gl/core';

import {AnimationLoopTemplate, type AnimationProps, makeAnimationLoop,Model} from '@luma.gl/engine';

import {webgpuAdapter} from '@luma.gl/webgpu';

import {webgl2Adapter} from '@luma.gl/webgl';



// vertex shader in GLSL

const VS_GLSL = /* glsl */`#version 300 es



  const vec2 pos[3] = vec2[3](vec2(0.0f, 0.5f), vec2(-0.5f, -0.5f), vec2(0.5f, -0.5f));



  void main() {

    gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);

  }

`;



// fragment shader in GLSL

const FS_GLSL = /* glsl */ `\

#version 300 es



precision highp float;



layout(location = 0) out vec4 outColor;



void main() {

   outColor = vec4(1.0, 0.0, 0.0, 1.0);

}

`;



// vertex shader in WGSL

const WGSL_SHADER = /* wgsl */ `\

@vertex

fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {

  var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));

  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);

}





@fragment

fn fragmentMain() -> @location(0) vec4<f32> {

  return vec4<f32>(1.0, 0.0, 0.0, 1.0);

}

`



// This class extends AnimationLoopTemplate to define the main render loop

class AppAnimationLoopTemplate extends AnimationLoopTemplate {

  model: Model;



  constructor({device}: AnimationProps) {

    super();



    this.model = new Model(device, {

      source: WGSL_SHADER,

      vs: VS_GLSL,

      fs: FS_GLSL,

      topology: 'triangle-list',

      vertexCount: 3,

      shaderLayout: {

        attributes: [],

        bindings: []

      },

      parameters: {

        depthFormat: 'depth24plus'

      }

    });

  }



  // main render loop

  override onRender({device}: AnimationProps): void {

    const renderPass = device.beginRenderPass({

       clearColor: [0.961, 0.961, 0.961, 1] // clears the color buffer to a light gray color

    });



    this.model.draw(renderPass);



    renderPass.end(); // ends the render pass

  }



  onFinalize(): void {

    this.model.destroy();

  }

}



// gets the container element to render to

const container = document.getElementById('app')!;



// sets up the device

const device = await luma.createDevice({

  adapters: [webgpuAdapter,webgl2Adapter],

  createCanvasContext: {

    container,

    width: 500,

    height: 500,

  },

});



// sets up the animation loop

makeAnimationLoop(AppAnimationLoopTemplate, {

  device

}).start();
```

```
<!doctype html>

<html lang="en">

  <head>

    <meta charset="UTF-8" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>luma-demo</title>

  </head>

  <body>

    <div id="app"></div>

    <script type="module" src="/src/main.ts"></script>

  </body>

</html>
```

You should now see a red triangle rendered on the screen.

**Loading example**Preparing GPU resources…

## Whats next ?[​](#whats-next- "Direct link to Whats next ?")

[Learn**Learn the fundamentals**Learn more about the luma.gl api and explore how to render a cube using the core api vs engine apiApi Overview, Core Api, Engine Api Overview](https://luma.gl/next/docs/fundamentals)[Framework capabilities**Explore the complete feature set**See how GPU-native data, large-scale visualization, compute pipelines, portable rendering, and visual effects fit together.Packages, techniques, and maturity](https://luma.gl/next/docs/capabilities)[Explore**Explore the tutorials**Learn how various gpu techniques are setup in luma.glInstancing, Lighting, gltf](https://luma.gl/next/docs/tutorials)[See it in action**Explore live GPU examples**Launch interactive scenes for lighting, oceans, fire, Gaussian splats, effects, and data visualization.Interactive examples in your browser](https://luma.gl/next/examples)[Design and concepts**Browse the API guides**Understand the Engine, portable GPU, and Shader APIs before choosing individual resources.Task-oriented explanations](https://luma.gl/next/docs/api-guide)[Look up details**Use the API reference**Find packages, classes, resource methods, accepted formats, and backend-specific behavior.Organized by npm package](https://luma.gl/next/docs/api-reference)
