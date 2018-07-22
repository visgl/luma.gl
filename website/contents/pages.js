const GITHUB_TREE = 'https://github.com/uber/luma.gl/tree/master';
const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/luma.gl/master';

export const EXAMPLE_PAGES = [
  {
    name: 'Overview',
    content: 'markdown/examples.md'
  },
  {
    name: 'Core Examples',
    children: [
      {
        name: 'Cubemap',
        content: {
          demo: 'CubemapDemo',
          code: `${GITHUB_TREE}/examples/core/cubemap`
        }
      },
      // {
      //   name: 'Custom Picking',
      //   content: {
      //     demo: 'CustomPickingDemo',
      //     path: `${GITHUB_TREE}/examples/core/custom-picking/`
      //   }
      // },
      {
        name: 'Fragment',
        content: {
          demo: 'FragmentDemo',
          code: `${GITHUB_TREE}/examples/core/fragment`
        }
      },
      {
        name: 'Instancing',
        content: {
          demo: 'InstancingDemo',
          code: `${GITHUB_TREE}/examples/core/instancing`
        }
      },
      {
        name: 'Mandelbrot',
        content: {
          demo: 'MandelbrotDemo',
          code: `${GITHUB_TREE}/examples/core/mandelbrot`
        }
      },
      {
        name: 'Picking',
        content: {
          demo: 'PickingDemo',
          code: `${GITHUB_TREE}/examples/core/picking`,
          path: `${RAW_GITHUB}/examples/core/picking/`
        }
      },
      // {
      //   name: 'DeferredRendering',
      //   content: {
      //     demo: 'DeferredRenderingDemo'
      //   }
      // },
      // {
      //   name: 'Particles',
      //   content: {
      //     demo: 'ParticlesDemo'
      //   }
      // },
      // {
      //   name: 'Persistence',
      //   content: {
      //     demo: 'PersistenceDemo'
      //   }
      // },
      {
        name: 'Shadowmap',
        content: {
          demo: 'ShadowmapDemo',
          code: `${GITHUB_TREE}/examples/core/shadowmap`
        }
      },
      {
        name: 'Transform Feedback',
        content: {
          demo: 'TransformFeedbackDemo',
          code: `${GITHUB_TREE}/examples/core/transform-feedback`
        }
      },
      {
        name: 'Transform',
        content: {
          demo: 'TransformDemo',
          code: `${GITHUB_TREE}/examples/core/transform`
        }
      }
    ]
  },
  {
    name: 'WebGL Lessons',
    children: [
      {
        name: 'Lesson 01 - Drawing',
        content: {
          demo: 'Lesson01',
          code: `${GITHUB_TREE}/examples/lessons/01`
        }
      },
      {
        name: 'Lesson 02 - Color',
        content: {
          demo: 'Lesson02',
          code: `${GITHUB_TREE}/examples/lessons/02`
        }
      },
      {
        name: 'Lesson 03 - Movement',
        content: {
          demo: 'Lesson03',
          code: `${GITHUB_TREE}/examples/lessons/03`
        }
      },
      {
        name: 'Lesson 04 - 3D Objects',
        content: {
          demo: 'Lesson04',
          code: `${GITHUB_TREE}/examples/lessons/04`
        }
      },
      {
        name: 'Lesson 05 - Textures',
        content: {
          demo: 'Lesson05',
          code: `${GITHUB_TREE}/examples/lessons/05`,
          path: `${RAW_GITHUB}/examples/lessons/05/`
        }
      },
      {
        name: 'Lesson 06 - Texture Filters',
        content: {
          demo: 'Lesson06',
          code: `${GITHUB_TREE}/examples/lessons/06/`,
          path: `${RAW_GITHUB}/examples/lessons/06/`
        }
      },
      {
        name: 'Lesson 07 - Lighting',
        content: {
          demo: 'Lesson07',
          code: `${GITHUB_TREE}/examples/lessons/07/`,
          path: `${RAW_GITHUB}/examples/lessons/07/`
        }
      },
      {
        name: 'Lesson 08 - Transparency',
        content: {
          demo: 'Lesson08',
          code: `${GITHUB_TREE}/examples/lessons/08/`,
          path: `${RAW_GITHUB}/examples/lessons/08/`
        }
      },
      {
        name: 'Lesson 09 - Moving Objects',
        content: {
          demo: 'Lesson09',
          code: `${GITHUB_TREE}/examples/lessons/09/`,
          path: `${RAW_GITHUB}/examples/lessons/09/`
        }
      },
      {
        name: 'Lesson 10 - 3D World',
        content: {
          demo: 'Lesson10',
          code: `${GITHUB_TREE}/examples/lessons/10/`,
          path: `${RAW_GITHUB}/examples/lessons/10/`
        }
      },
      {
        name: 'Lesson 11 - Sphere',
        content: {
          demo: 'Lesson11',
          code: `${GITHUB_TREE}/examples/lessons/11/`,
          path: `${RAW_GITHUB}/examples/lessons/11/`
        }
      },
      {
        name: 'Lesson 12 - Point Lighting',
        content: {
          demo: 'Lesson12',
          code: `${GITHUB_TREE}/examples/lessons/12/`,
          path: `${RAW_GITHUB}/examples/lessons/12/`
        }
      },
      {
        name: 'Lesson 13 - Per-Fragment Lighting',
        content: {
          demo: 'Lesson13',
          code: `${GITHUB_TREE}/examples/lessons/13/`,
          path: `${RAW_GITHUB}/examples/lessons/13/`
        }
      },
      {
        name: 'Lesson 14 - Specular Highlights',
        content: {
          demo: 'Lesson14',
          code: `${GITHUB_TREE}/examples/lessons/14/`,
          path: `${RAW_GITHUB}/examples/lessons/14/`
        }
      },
      {
        name: 'Lesson 15 - Specular Maps',
        content: {
          demo: 'Lesson15',
          code: `${GITHUB_TREE}/examples/lessons/15/`,
          path: `${RAW_GITHUB}/examples/lessons/15/`
        }
      },
      {
        name: 'Lesson 16 - Render to Texture',
        content: {
          demo: 'Lesson16',
          code: `${GITHUB_TREE}/examples/lessons/16/`,
          path: `${RAW_GITHUB}/examples/lessons/16/`
        }
      }
    ]
  }
];

export const DOC_PAGES = [
  {
    name: 'Overview',
    children: [
      {
        name: 'Introduction',
        content: 'README.md'
      },
      {
        name: 'What\'s New',
        content: 'whats-new.md'
      },
      {
        name: 'Roadmap',
        content: 'roadmap.md'
      },
      {
        name: 'Upgrade Guide',
        content: 'upgrade-guide.md'
      }
    ]
  },
  {
    name: 'Getting Started',
    children: [
      {
        name: 'Overview',
        content: 'get-started/README.md'
      },
      {
        name: 'Installation',
        content: 'get-started/installation.md'
      },
      {
        name: 'Examples',
        content: 'get-started/examples.md'
      },
      {
        name: 'Using with deck.gl',
        content: 'get-started/using-with-deckgl.md'
      },
      {
        name: 'Using with Node.js',
        content: 'get-started/using-with-node.md'
      }
      // {
      //   name: 'Using with other Frameworks',
      //   content: 'get-started/using-with-other-frameworks.md'
      // }
    ]
  },
  {
    name: 'Developer Guide',
    children: [
      {
        name: 'Welcome',
        content: 'developer-guide/README.md'
      },
      {
        name: 'API Overview',
        content: 'api-reference/README.md'
      },
      {
        name: 'Drawing',
        content: 'developer-guide/drawing.md'
      },
      // {
      //   name: 'Geometry',
      //   content: 'developer-guide/geometry.md'
      // },
      {
        name: 'Attributes',
        content: 'developer-guide/attributes.md'
      },
      {
        name: 'Portability',
        content: 'developer-guide/portability.md'
      },
      {
        name: 'Multi-Pass Rendering',
        content: 'developer-guide/multipass/README.md'
      },
      {
        name: 'Shadertools',
        content: 'developer-guide/shadertools/README.md'
      },
      {
        name: 'Shader Assembly',
        content: 'developer-guide/shadertools/shader-assembly.md'
      },
      {
        name: 'Using Shader Modules',
        content: 'developer-guide/shadertools/using-shader-modules.md'
      },
      {
        name: 'Model Integration',
        content: 'developer-guide/shadertools/model-integration.md'
      },
      {
        name: 'Creating Shader Modules',
        content: 'developer-guide/shadertools/writing-shader-modules.md'
      },
      {
        name: 'Writing GLSL Code',
        content: 'developer-guide/shadertools/writing-glsl-shaders.md'
      },
      {
        name: 'Building Apps',
        content: 'developer-guide/building-apps.md'
      },
      {
        name: 'Debugging',
        content: 'developer-guide/debugging.md'
      }
      // {
      //   name: 'Extensions',
      //   content: 'user-guide/extensions.md'
      // },
      // {
      //   name: 'WebGL2',
      //   content: 'user-guide/webgl2.md'
      // },
      // {
      //   name: 'GPGPU Programming',
      //   content: 'user-guide/gpgpu.md'
      // }
    ]
  },
  {
    name: 'API Reference',
    children: [
      {
        name: 'AnimationLoop',
        content: 'api-reference/core/animation-loop.md'
      },
      {
        name: 'Attribute',
        content: 'api-reference/core/attribute.md'
      },
      {
        name: 'Buffer',
        content: 'api-reference/webgl/buffer.md'
      },
      {
        name: 'Framebuffer',
        content: 'api-reference/webgl/framebuffer.md'
      },
      {
        name: 'Geometry',
        content: 'api-reference/core/geometry.md'
      },
      // {
      //   name: 'Group',
      //   content: 'api-reference/core/group.md'
      // },
      {
        name: 'Model',
        content: 'api-reference/core/model.md'
      },
      {
        name: 'Model:Cone',
        content: 'api-reference/models/cone.md'
      },
      {
        name: 'Model:Cube',
        content: 'api-reference/models/cube.md'
      },
      {
        name: 'Model:Cylinder',
        content: 'api-reference/models/cylinder.md'
      },
      {
        name: 'Model:IcoSphere',
        content: 'api-reference/models/ico-sphere.md'
      },
      {
        name: 'Model:Plane',
        content: 'api-reference/models/plane.md'
      },
      {
        name: 'Model:Sphere',
        content: 'api-reference/models/sphere.md'
      },
      // {
      //   name: 'Object3d',
      //   content: 'api-reference/core/object-3d.md'
      // },
      // {
      //   name: 'Picking',
      //   content: 'api-reference/picking/picking.md'
      // },
      {
        name: 'Program',
        content: 'api-reference/webgl/program.md'
      },
      {
        name: 'Query',
        content: 'api-reference/webgl/query.md'
      },
      {
        name: 'Renderbuffer',
        content: 'api-reference/webgl/renderbuffer.md'
      },
      {
        name: 'Resource',
        content: 'api-reference/webgl/resource.md'
      },
      {
        name: 'Sampler',
        content: 'api-reference/webgl/sampler.md'
      },
      {
        name: 'Shader',
        content: 'api-reference/webgl/shader.md'
      },
      {
        name: 'ShaderCache',
        content: 'api-reference/core/shader-cache.md'
      },
      {
        name: 'Texture',
        content: 'api-reference/webgl/texture.md'
      },
      {
        name: 'Texture2D',
        content: 'api-reference/webgl/texture-2d.md'
      },
      {
        name: 'Texture2DArray',
        content: 'api-reference/webgl/texture-2d-array.md'
      },
      {
        name: 'Texture3D',
        content: 'api-reference/webgl/texture-3d.md'
      },
      {
        name: 'TextureCube',
        content: 'api-reference/webgl/texture-cube.md'
      },
      {
        name: 'Transform (Experimental)',
        content: 'api-reference/core/transform.md'
      },
      {
        name: 'TransformFeedback',
        content: 'api-reference/webgl/transform-feedback.md'
      },
      {
        name: 'UniformBufferLayout',
        content: 'api-reference/webgl/uniform-buffer-layout.md'
      },
      {
        name: 'VertexArray',
        content: 'api-reference/webgl/vertex-array.md'
      },
      {
        name: 'createGLContext',
        content: 'api-reference/webgl/context/context.md'
      },
      {
        name: 'isWebGL2',
        content: 'api-reference/webgl/context/is-webGL2.md'
      },
      {
        name: 'hasFeature(s)',
        content: 'api-reference/webgl/context/has-features.md'
      },
      {
        name: 'getFeatures',
        content: 'api-reference/webgl/context/get-features.md'
      },
      {
        name: 'getContextInfo',
        content: 'api-reference/webgl/context/get-context-info.md'
      },
      {
        name: 'getContextLimits',
        content: 'api-reference/webgl/context/get-context-limits.md'
      },
      {
        name: 'get|setParameter(s)',
        content: 'api-reference/webgl/context/get-parameters.md'
      },
      {
        name: 'resetParameters',
        content: 'api-reference/webgl/context/reset-parameters.md'
      },
      {
        name: 'withParameters',
        content: 'api-reference/webgl/context/with-parameters.md'
      },
      {
        name: 'Shadertools:assembleShaders',
        content: 'api-reference/shadertools/assemble-shaders.md'
      },
      {
        name: 'Shader Module:picking',
        content: 'api-reference/shadertools/shader-module-picking.md'
      },
      {
        name: 'GLSL Reference',
        content: 'api-reference/shadertools/glsl-reference.md'
      }
    ]
  }
];
