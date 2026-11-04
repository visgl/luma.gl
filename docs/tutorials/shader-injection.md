# Shader Injection

[Modules](https://luma.gl/docs/tutorials/shader-modules.md)[Injection](https://luma.gl/docs/tutorials/shader-injection.md)[Plugins](https://luma.gl/docs/tutorials/shader-plugins.md)[Lighting](https://luma.gl/docs/tutorials/lighting.md)

Injection targets identify where plugins can add shader code. This example declares a callable `OFFSET_POSITION` target and attaches two plugins that shift geometry left or right. See the [Shader Injection guide](https://luma.gl/docs/api-guide/shaders/shader-injection.md) for built-in targets and injection syntax.

<!-- -->

0

<!-- -->

s

Scroll page · Ctrl/⌘ + scroll to interact

It is assumed you've set up your development environment as described in [Setup](https://luma.gl/docs/tutorials.md).

Callable injection targets act like named functions within shader code. The base vertex shader calls `OFFSET_POSITION`, and plugins supply injections that modify the position. By attaching different plugins to each model, one triangle is nudged left while the other is pushed right.

The complete source for this example is shown below:

```
import {Buffer, NumberArray, UniformStore} from '@luma.gl/core';

import {AnimationLoopTemplate, AnimationProps, Model, makeAnimationLoop} from '@luma.gl/engine';

import {GLSLShaderAssembler} from '@luma.gl/shaders/glsl';

import type {ShaderPlugin} from '@luma.gl/shaders';

import {webgl2Adapter} from '@luma.gl/core/webgl';

import {webgpuAdapter} from '@luma.gl/core/webgpu';



// Base vertex and fragment shader code

const vs = `\

#version 300 es



in vec2 position;



void main() {

  gl_Position = vec4(position, 0.0, 1.0);

  OFFSET_POSITION(gl_Position);

}

`;



const fs = `\

#version 300 es



uniform appUniforms {  

  vec3 color;

} app;



out vec4 fragColor;



void main() {

  fragColor = vec4(app.color, 1.0);

}

`;



const offsetLeftPlugin: ShaderPlugin = {

  name: 'offsetLeft',

  injections: [{stage: 'vertex', target: 'OFFSET_POSITION', glsl: 'position.x -= 0.5;'}]

};



const offsetRightPlugin: ShaderPlugin = {

  name: 'offsetRight',

  injections: [{stage: 'vertex', target: 'OFFSET_POSITION', glsl: 'position.x += 0.5;'}]

};



class AppAnimationLoopTemplate extends AnimationLoopTemplate {

  model1: Model;

  model2: Model;

  positionBuffer: Buffer;

  uniformBuffer1: Buffer;

  uniformBuffer2: Buffer;



  uniformStore = new UniformStore<{

    app: {

      color: NumberArray;

    };

  }>({

    app: {

      uniformTypes: {

        color: 'vec3<f32>'

      }

    }

  });



  constructor({device, animationLoop}: AnimationProps) {

    super();



    if (device.type !== 'webgl') {

      throw new Error('This demo is only implemented for WebGL2');

    }



    const shaderAssembler = new GLSLShaderAssembler();

    shaderAssembler.addShaderInjectionTarget({name: 'OFFSET_POSITION', stage: 'vertex', glsl: {parameters: 'inout vec4 position'}});



    this.positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));



    this.uniformBuffer1 = this.uniformStore.createUniformBuffer(device, 'app', {

      app: {

        color: [1, 0, 0]

      }

    });



    const uniformBufferData = this.uniformStore.getUniformBufferData('app');

    this.uniformBuffer1.write(uniformBufferData);



    this.uniformBuffer2 = this.uniformStore.createUniformBuffer(device, 'app', {

      app: {

        color: [0, 0, 1]

      }

    });



    this.model1 = new Model(device, {

      vs,

      fs,

      shaderAssembler,

      plugins: [offsetLeftPlugin],

      bufferLayout: [{name: 'position', format: 'float32x2'}],

      attributes: {

        position: this.positionBuffer

      },

      vertexCount: 3,

      bindings: {

        app: this.uniformBuffer1

      }

    });



    this.model2 = new Model(device, {

      vs,

      fs,

      shaderAssembler,

      plugins: [offsetRightPlugin],

      bufferLayout: [{name: 'position', format: 'float32x2'}],

      vertexCount: 3,

      attributes: {

        position: this.positionBuffer

      },

      bindings: {

        app: this.uniformBuffer2

      }

    });

  }



  onFinalize() {

    this.model1.destroy();

    this.model2.destroy();

    this.positionBuffer.destroy();

    this.uniformStore.destroy();

    this.uniformBuffer1.destroy();

    this.uniformBuffer2.destroy();

  }



  onRender({device}: AnimationProps) {

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

    this.model1.draw(renderPass);

    this.model2.draw(renderPass);

    renderPass.end();

  }

}



const animationLoop = makeAnimationLoop(AppAnimationLoopTemplate, {

  adapters: [webgpuAdapter, webgl2Adapter]

});

animationLoop.start();
```

The `ShaderAssembler` gathers injections from the attached plugins and places them in the declared target when it builds the shader. The base shader calls `OFFSET_POSITION` without depending on either plugin.
