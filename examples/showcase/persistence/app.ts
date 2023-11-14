import type {NumberArray, ShaderUniformType} from '@luma.gl/core';
import {UniformStore, Framebuffer, makeRandomNumberGenerator, glsl} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Geometry, SphereGeometry, Model} from '@luma.gl/engine';
import {Matrix4, Vector3, radians} from '@math.gl/core';

const INFO_HTML = `
<p>
  Electron trails renderings persist across multiple frames.
<p>
  Uses multiple luma.gl <code>Framebuffer</code>s to hold previously rendered data between frames.
</p>
`;

// SPHERE SHADER

type SphereUniforms = {
  color: NumberArray;
  lighting: NumberArray;
  modelViewMatrix: NumberArray;
  projectionMatrix: NumberArray;
};

const sphere: {uniformTypes: Record<keyof SphereUniforms, ShaderUniformType>} = {
  uniformTypes: {
    // TODO make sure order doesn't matter
    color: 'vec3<f32>',
    lighting: 'f32',
    modelViewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x3<f32>'
  }
};

const SPHERE_VS = glsl`\
#version 300 es

attribute vec3 positions;
attribute vec3 normals;

uniform sphereUniforms {
  // fragment shader
  vec3 color;
  bool lighting;
  // vertex shader
  mat4 modelViewMatrix;
  mat4 projectionMatrix;
} sphere;

varying vec3 normal;

void main(void) {
  gl_Position = sphere.projectionMatrix * sphere.modelViewMatrix * vec4(positions, 1.0);
  normal = vec3((sphere.modelViewMatrix * vec4(normals, 0.0)));
}
`;

const SPHERE_FS = glsl`\
#version 300 es

precision highp float;

uniform sphereUniforms {
  // fragment
  vec3 color;
  bool lighting;
  // vertex
  mat4 modelViewMatrix;
  mat4 projectionMatrix;
} sphere;

varying vec3 normal;

void main(void) {
  float attenuation = 1.0;
  if (sphere.lighting) {
    vec3 light = normalize(vec3(1,1,2));
    attenuation = dot(normal, light);
  }
  gl_FragColor = vec4(sphere.color * attenuation, 1);
}
`;

// SCREEN QUAD SHADERS

type ScreenQuadUniforms = {
  resolution: NumberArray;
};

const screenQuad: {uniformTypes: Record<keyof ScreenQuadUniforms, ShaderUniformType>} = {
  uniformTypes: {
    resolution: 'vec2<f32>'
  }
};

const SCREEN_QUAD_VS = glsl`\
#version 300 es

attribute vec2 aPosition;

void main(void) {
  gl_Position = vec4(aPosition, 0, 1);
}
`;

const SCREEN_QUAD_FS = glsl`\
#version 300 es

precision highp float;

uniform sampler2D uTexture;

uniform screenQuadUniforms {
  vec2 resolution;
} screenQuad;

void main(void) {
  vec2 p = gl_FragCoord.xy/screenQuad.resolution.xy;
  gl_FragColor = texture2D(uTexture, p);
}
`;

// PERSISTENCE SHADERS

type PersistenceQuadUniforms = {
  resolution: NumberArray;
};

const persistenceQuad: {uniformTypes: Record<keyof ScreenQuadUniforms, ShaderUniformType>} = {
  uniformTypes: {
    resolution: 'vec2<f32>'
  }
};

const PERSISTENCE_FS = glsl`\
#version 300 es

precision highp float;

uniform sampler2D uScene;
uniform sampler2D uPersistence;

uniform persistenceQuadUniforms {
  vec2 resolution;
} persistence;

void main(void) {
  vec2 p = gl_FragCoord.xy / persistence.resolution.xy;
  vec4 cS = texture2D(uScene, p);
  vec4 cP = texture2D(uPersistence, p);
  gl_FragColor = mix(cS*4.0, cP, 0.9);
}
`;

const random = makeRandomNumberGenerator();

const CORE_COUNT = 64;
const ELECTRON_COUNT = 64;
const electronPosition = [];
const electronRotation = [];
const nucleonPosition = [];

/* eslint-disable max-statements */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  // A single uniform store that manages uniforms for all our shaders
  uniformStore = new UniformStore<{
    sphere: SphereUniforms;
    screenQuad: ScreenQuadUniforms;
    persistenceQuad: PersistenceQuadUniforms;
  }>({
    sphere,
    screenQuad,
    persistenceQuad
  });

  /** Electron model */
  electron: Model;
  /** Nucleon model */
  nucleon: Model;

  mainFramebuffer: Framebuffer;
  pingpongFramebuffers: Framebuffer[];
  screenQuad: Model;
  persistenceQuad: Model;

  constructor({device, width, height}: AnimationProps) {
    super();

    this.electron = new Model(device, {
      id: 'electron',
      vs: SPHERE_VS,
      fs: SPHERE_FS,
      geometry: new SphereGeometry({nlat: 20, nlong: 30}), // To test that sphere generation is working properly.
      bindings: {
        sphere: this.uniformStore.getManagedUniformBuffer(device, 'sphere')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        cullMode: 'back'
      }
    });

    this.nucleon = new Model(device, {
      id: 'nucleon',
      vs: SPHERE_VS,
      fs: SPHERE_FS,
      geometry: new SphereGeometry({nlat: 20, nlong: 30}),
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      },
      bindings: {
        sphere: this.uniformStore.getManagedUniformBuffer(device, 'sphere')
      }
    });

    this.mainFramebuffer = device.createFramebuffer({
      width,
      height,
      colorAttachments: ['rgba8unorm'],
      depthStencilAttachment: 'depth24plus'
    });

    this.pingpongFramebuffers = [
      device.createFramebuffer({
        width,
        height,
        colorAttachments: ['rgba8unorm'],
        depthStencilAttachment: 'depth24plus'
      }),
      device.createFramebuffer({
        width,
        height,
        colorAttachments: ['rgba8unorm'],
        depthStencilAttachment: 'depth24plus'
      })
    ];

    const QUAD_POSITIONS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];

    const quadGeometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        aPosition: {
          value: new Float32Array(QUAD_POSITIONS),
          size: 2
        }
      },
      vertexCount: 6
    });

    this.screenQuad = new Model(device, {
      id: 'quad',
      vs: SCREEN_QUAD_VS,
      fs: SCREEN_QUAD_FS,
      geometry: quadGeometry,
      bindings: {
        screenQuadUniforms: this.uniformStore.getManagedUniformBuffer(device, 'screenQuad')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });

    this.persistenceQuad = new Model(device, {
      id: 'persistence-quad',
      vs: SCREEN_QUAD_VS,
      fs: PERSISTENCE_FS,
      geometry: quadGeometry,
      bindings: {
        persistenceQuadUniforms: this.uniformStore.getManagedUniformBuffer(
          device,
          'persistenceQuad'
        )
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });

    const dt = 0.0125;

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      // Place electron cloud at random positions
      const pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);

      // Push them out a bit
      const distanceFromCenter = random() + 1.0;
      pos.normalize().scale(distanceFromCenter);
      const s = 1.25;
      pos.scale(s);
      electronPosition.push(pos);

      // Get a random vector andcross
      const q = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      const axis = pos.clone().cross(q).normalize();

      const theta = (4 / distanceFromCenter) * dt;
      const rot = new Matrix4().rotateAxis(theta, axis);
      electronRotation.push(rot);
    }

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      let pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      pos = pos.normalize().scale(0.5);
      nucleonPosition.push(pos);
    }
  }

  onFinalize(animationProps: AnimationProps): void {
    this.electron.destroy();
    this.nucleon.destroy();

    this.mainFramebuffer.destroy();
    this.pingpongFramebuffers[0].destroy();
    this.pingpongFramebuffers[1].destroy();
    this.screenQuad.destroy();
    this.persistenceQuad.destroy();
  }

  onRender({device, tick, width, height, aspect}: AnimationProps) {
    this.mainFramebuffer.resize({width, height});
    this.pingpongFramebuffers[0].resize({width, height});
    this.pingpongFramebuffers[1].resize({width, height});

    const projectionMatrix = new Matrix4().perspective({fovy: radians(75), aspect});
    const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 4]});

    const mainRenderPass = device.beginRenderPass({
      framebuffer: this.mainFramebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    // Render electrons to framebuffer

    this.uniformStore.setUniforms({sphere: {color: [0.0, 0.5, 1], lighting: 0}});

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      electronPosition[i] = electronRotation[i].transformVector(electronPosition[i]);
      const modelMatrix = new Matrix4()
        .translate(electronPosition[i])
        .scale([0.06125, 0.06125, 0.06125]);

      this.uniformStore.setUniforms({
        sphere: {
          modelViewMatrix: viewMatrix.clone().multiplyRight(modelMatrix),
          projectionMatrix: projectionMatrix
        }
      });
      this.uniformStore.updateUniformBuffers();
      this.electron.draw(mainRenderPass);
    }

    // Render core to framebuffer
    this.uniformStore.setUniforms({
      sphere: {
        color: [1, 0.25, 0.25],
        lighting: 1
      }
    });

    for (let i = 0; i < CORE_COUNT; i++) {
      const modelMatrix = new Matrix4()
        .rotateXYZ([tick * 0.013, 0, 0])
        .rotateXYZ([0, tick * 0.021, 0])
        .translate(nucleonPosition[i]);

      const translation = [modelMatrix[12], modelMatrix[13], modelMatrix[14]];
      modelMatrix.identity().translate(translation).scale([0.25, 0.25, 0.25]);

      this.uniformStore.setUniforms({
        sphere: {
          modelViewMatrix: viewMatrix.clone().multiplyRight(modelMatrix),
          projectionMatrix: projectionMatrix
        }
      });
      this.uniformStore.updateUniformBuffers();
      this.nucleon.draw(mainRenderPass);
    }

    mainRenderPass.end();

    const ppi = tick % 2;
    const currentFramebuffer = this.pingpongFramebuffers[ppi];
    const nextFramebuffer = this.pingpongFramebuffers[1 - ppi];

    
    // Accumulate in persistence buffer
    const persistenceRenderPass = device.beginRenderPass({
      framebuffer: currentFramebuffer,
      clearColor: [0, 0, 0, 1]
    });
    this.persistenceQuad.setBindings({
      uScene: this.mainFramebuffer.colorAttachments[0],
      uPersistence: nextFramebuffer.colorAttachments[0]
    });
    this.uniformStore.setUniforms({persistenceQuad: {resolution: [width, height]}});
    this.uniformStore.updateUniformBuffers();

    this.persistenceQuad.draw(persistenceRenderPass);
    persistenceRenderPass.end();

    // Copy the current framebuffer to screen
    const screenRenderPass = device.beginRenderPass({clearColor: [1, 0, 0, 1]});
    this.screenQuad.setBindings({
      uTexture: currentFramebuffer.colorAttachments[0]
    });
    this.uniformStore.setUniforms({screenQuad: {resolution: [width, height]}});
    this.uniformStore.updateUniformBuffers();

    this.screenQuad.draw(screenRenderPass);
    screenRenderPass.end();
  }
}
