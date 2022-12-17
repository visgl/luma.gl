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
  // vertex
  uModelView: NumberArray;
  uProjection: NumberArray;
  // fragment
  uColor: NumberArray;
  uLighting: NumberArray;
};

const sphereUniforms: {uniformTypes: Record<keyof SphereUniforms, ShaderUniformType>} = {
  uniformTypes: {
    uModelView: 'mat4x4<f32>',
    uProjection: 'mat4x3<f32>',
    uColor: 'vec3<f32>',
    uLighting: 'f32'
  }
};

const SPHERE_VS = glsl`\
#version 300 es

attribute vec3 positions;
attribute vec3 normals;

uniform sphereUniforms {
  // vertex
  mat4 uModelView;
  mat4 uProjection;
  // fragment
  vec3 uColor;
  bool uLighting;
} sphere;

varying vec3 normal;

void main(void) {
  gl_Position = sphere.uProjection * sphere.uModelView * vec4(positions, 1.0);
  normal = vec3((sphere.uModelView * vec4(normals, 0.0)));
}
`;

const SPHERE_FS = glsl`\
#version 300 es

precision highp float;

uniform sphereUniforms {
  // vertex
  mat4 uModelView;
  mat4 uProjection;
  // fragment
  vec3 uColor;
  bool uLighting;
} sphere;

varying vec3 normal;

void main(void) {
  float attenuation = 1.0;
  if (sphere.uLighting) {
    vec3 light = normalize(vec3(1,1,2));
    attenuation = dot(normal, light);
  }
  gl_FragColor = vec4(sphere.uColor * attenuation, 1);
}
`;

// SCREEN QUAD SHADERS

type ScreenQuadUniforms = {
  uRes: NumberArray;
};

const screenQuadUniforms: {uniformTypes: Record<keyof ScreenQuadUniforms, ShaderUniformType>} = {
  uniformTypes: {
    uRes: 'vec2<f32>'
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
  vec2 uRes;
} screenQuad;

void main(void) {
  vec2 p = gl_FragCoord.xy/screenQuad.uRes.xy;
  gl_FragColor = texture2D(uTexture, p);
}
`;

// PERSISTENCE SHADERS

type PersistenceQuadUniforms = {
  uRes: NumberArray;
};

const persistenceQuadUniforms: {uniformTypes: Record<keyof ScreenQuadUniforms, ShaderUniformType>} =
  {
    uniformTypes: {
      uRes: 'vec2<f32>'
    }
  };

const PERSISTENCE_FS = glsl`\
#version 300 es

precision highp float;

uniform sampler2D uScene;
uniform sampler2D uPersistence;

uniform persistenceQuadUniforms {
  vec2 uRes;
} persistence;

void main(void) {
  vec2 p = gl_FragCoord.xy / persistence.uRes.xy;
  vec4 cS = texture2D(uScene, p);
  vec4 cP = texture2D(uPersistence, p);
  gl_FragColor = mix(cS*4.0, cP, 0.9);
}
`;


const random = makeRandomNumberGenerator();

const ELECTRON_COUNT = 64;
const ePos = [];
const eRot = [];
const nPos = [];

/* eslint-disable max-statements */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  // A single uniform store that manages uniforms for all our shaders
  uniformStore = new UniformStore<{
    sphere: SphereUniforms;
    screenQuad: ScreenQuadUniforms;
    persistenceQuad: PersistenceQuadUniforms;
  }>({
    sphere: sphereUniforms,
    screenQuad: screenQuadUniforms,
    persistenceQuad: persistenceQuadUniforms
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
        sphereUniforms: this.uniformStore.getManagedUniformBuffer(device, 'sphere')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        cullMode: 'back'
      },
      uniforms: {
        uColor: [0.0, 0.5, 1],
        uLighting: 0
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
        sphereUniforms: this.uniformStore.getManagedUniformBuffer(device, 'sphere')
      },
      uniforms: {
        uColor: [1, 0.25, 0.25],
        uLighting: 1
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
        persistenceQuadUniforms: this.uniformStore.getManagedUniformBuffer(device, 'persistenceQuad')
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
      ePos.push(pos);

      // Get a random vector and cross
      const q = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      const axis = pos.clone().cross(q).normalize();

      const theta = (4 / distanceFromCenter) * dt;
      const rot = new Matrix4().rotateAxis(theta, axis);
      eRot.push(rot);
    }

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      let pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      pos = pos.normalize().scale(0.5);
      nPos.push(pos);
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

    const projection = new Matrix4().perspective({fovy: radians(75), aspect});
    const view = new Matrix4().lookAt({eye: [0, 0, 4]});

    const mainRenderPass = device.beginRenderPass({
      framebuffer: this.mainFramebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    // Render electrons to framebuffer
    for (let i = 0; i < ELECTRON_COUNT; i++) {
      ePos[i] = eRot[i].transformVector(ePos[i]);
      const modelMatrix = new Matrix4().translate(ePos[i]).scale([0.06125, 0.06125, 0.06125]);

      this.electron.setUniforms({
        uModelView: view.clone().multiplyRight(modelMatrix),
        uView: view,
        uProjection: projection
      });
      this.electron.draw(mainRenderPass);
    }

    // Render core to framebuffer
    for (let i = 0; i < ELECTRON_COUNT; i++) {
      const modelMatrix = new Matrix4()
        .rotateXYZ([tick * 0.013, 0, 0])
        .rotateXYZ([0, tick * 0.021, 0])
        .translate(nPos[i]);

      const translation = [modelMatrix[12], modelMatrix[13], modelMatrix[14]];
      modelMatrix.identity().translate(translation).scale([0.25, 0.25, 0.25]);

      this.uniformStore.setUniforms({
        sphere: {
          uModelView: view.clone().multiplyRight(modelMatrix),
          // uView: view,
          uProjection: projection
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
    this.uniformStore.setUniforms({
      persistenceQuad: {
        uRes: [width, height]
      }
    });
    this.uniformStore.updateUniformBuffers();

    this.persistenceQuad.draw(persistenceRenderPass);
    persistenceRenderPass.end();

    // Copy the current framebuffer to screen
    const screenRenderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.screenQuad.setBindings({
      uTexture: currentFramebuffer.colorAttachments[0]
    });
    this.uniformStore.setUniforms({
      screenQuad: {
        uRes: [width, height]
      }
    });
    this.uniformStore.updateUniformBuffers();

    this.screenQuad.draw(screenRenderPass);
    screenRenderPass.end();
  }
}
