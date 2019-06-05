const GITHUB_TREE = 'https://github.com/uber/luma.gl/tree/7.1-release';
const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/luma.gl/7.1-release';

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
        name: 'Persistence',
        content: {
          demo: 'PersistenceDemo',
          code: `${GITHUB_TREE}/examples/core/persistence`
        }
      },
      {
        name: 'Shadowmap',
        content: {
          demo: 'ShadowmapDemo',
          code: `${GITHUB_TREE}/examples/core/shadowmap`
        }
      },
      {
        name: 'Animation',
        content: {
          demo: 'AnimationDemo',
          code: `${GITHUB_TREE}/examples/core/animation`
        }
      },
      {
        name: 'Transform Feedback (WebGL2)',
        content: {
          demo: 'TransformFeedbackDemo',
          code: `${GITHUB_TREE}/examples/core/transform-feedback`
        }
      },
      {
        name: 'Transform  (WebGL2)',
        content: {
          demo: 'TransformDemo',
          code: `${GITHUB_TREE}/examples/core/transform`
        }
      },
      {
        name: 'Depth of Field  (WebGL2)',
        content: {
          demo: 'DOFDemo',
          code: `${GITHUB_TREE}/examples/core/dof`,
          path: `${RAW_GITHUB}/examples/core/dof/`
        }
      },
      {
        name: 'GLTF',
        content: {
          demo: 'GLTFDemo',
          code: `${GITHUB_TREE}/examples/core/gltf`,
          path: `${RAW_GITHUB}/examples/core/gltf/`
        }
      },
      {
        name: 'Quasicrystals',
        content: {
          demo: 'QuasicrystalsDemo',
          code: `${GITHUB_TREE}/examples/core/quasicrystals`
        }
      },
      {
        name: 'Texture3D  (WebGL2)',
        content: {
          demo: 'Texture3DDemo',
          code: `${GITHUB_TREE}/examples/core/texture-3d`
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
        name: "What's New",
        content: 'whats-new.md'
      }
    ]
  },
  {
    name: 'Developer Guide',
    children: [
      {
        name: 'Getting Started',
        content: 'get-started/README.md'
      },
      {
        name: 'Examples',
        content: 'get-started/examples.md'
      },
      {
        name: 'Upgrade Guide',
        content: 'upgrade-guide.md'
      },
      {
        name: 'Shadertools',
        children: [
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
            name: 'Using GLSL 3.00 ES',
            content: 'developer-guide/using-glsl-300-es.md'
          }
        ]
      },
      {
        name: 'Using WebGL',
        children: [
          {
            name: 'Drawing',
            content: 'developer-guide/drawing.md'
          },
          {
            name: 'Buffers',
            content: 'developer-guide/buffers.md'
          },
          {
            name: 'Stencil Buffers',
            content: 'developer-guide/stencil-buffers.md'
          },
          {
            name: 'Attributes',
            content: 'developer-guide/attributes.md'
          },
          {
            name: 'Accessors',
            content: 'developer-guide/accessors.md'
          },
          {
            name: 'Extensions',
            content: 'developer-guide/extensions.md'
          },
          {
            name: 'Transform Feedback',
            content: 'developer-guide/transform-feedback.md'
          }
        ]
      },
      {
        name: 'Higher Level APIs',
        children: [
          {
            name: 'Multi-Pass Rendering',
            content: 'developer-guide/multipass/README.md'
          }
        ]
      },
      {
        name: 'Tools and Tips',
        children: [
          {
            name: 'Building Apps',
            content: 'developer-guide/building-apps.md'
          },
          {
            name: 'Configuring',
            content: 'developer-guide/configuring.md'
          },
          {
            name: 'Debugging',
            content: 'developer-guide/debugging.md'
          },
          {
            name: 'Portability',
            content: 'developer-guide/portability.md'
          },
          {
            name: 'Programs and shaders',
            content: 'developer-guide/programs-and-shaders.md'
          }
        ]
      }
    ]
  },
  {
    name: 'API Reference',
    children: [
      {
        name: 'API Overview',
        children: [
          {
            name: 'API Structure',
            content: 'api-reference/README.md'
          }
        ]
      },
      {
        name: 'Core Classes',
        children: [
          {
            name: 'AnimationLoop',
            content: 'api-reference/core/animation-loop.md'
          },
          {
            name: 'AnimationLoopProxy (Experimental)',
            content: 'api-reference/core/animation-loop-proxy.md'
          },
          {
            name: 'Geometry',
            content: 'api-reference/core/geometry.md'
          },
          {
            name: 'loadFile',
            content: 'api-reference/core/load-file.md'
          },
          {
            name: 'Model',
            content: 'api-reference/core/model.md'
          },
          {
            name: 'Transform',
            content: 'api-reference/core/transform.md'
          },
          {
            name: 'ShaderCache',
            content: 'api-reference/core/shader-cache.md'
          }
        ]
      },
      {
        name: 'Geometry Primitives',
        children: [
          {
            name: 'Cone',
            content: 'api-reference/core/geometries/cone-geometry.md'
          },
          {
            name: 'Cube',
            content: 'api-reference/core/geometries/cube-geometry.md'
          },
          {
            name: 'Cylinder',
            content: 'api-reference/core/geometries/cylinder-geometry.md'
          },
          {
            name: 'IcoSphere',
            content: 'api-reference/core/geometries/ico-sphere-geometry.md'
          },
          {
            name: 'Plane',
            content: 'api-reference/core/geometries/plane-geometry.md'
          },
          {
            name: 'Sphere',
            content: 'api-reference/core/geometries/sphere-geometry.md'
          }
        ]
      },
      {
        name: 'Lights',
        children: [
          {
            name: 'Ambient Light',
            content: 'api-reference/core/lights/ambient-light.md'
          },
          {
            name: 'Directional Light',
            content: 'api-reference/core/lights/directional-light.md'
          },
          {
            name: 'Point Light',
            content: 'api-reference/core/lights/point-light.md'
          }
        ]
      },
      {
        name: 'Materials',
        children: [
          {
            name: 'PhongMaterial',
            content: 'api-reference/core/materials/phong-material.md'
          },
          {
            name: 'PBRMaterial',
            content: 'api-reference/core/materials/pbr-material.md'
          }
        ]
      },
      {
        name: 'Effects',
        children: [
          {
            name: 'Overview',
            content: 'api-reference/effects/overview.md'
          },
          {
            name: 'glfx Shader Modules',
            content: 'api-reference/effects/glfx-shader-modules.md'
          }
        ]
      },
      {
        name: 'Multipass',
        children: [
          {
            name: 'Canvas',
            content: 'api-reference/core/multipass/canvas.md'
          },
          {
            name: 'Clear pass',
            content: 'api-reference/core/multipass/clear-pass.md'
          },
          {
            name: 'Composite pass',
            content: 'api-reference/core/multipass/composite-pass.md'
          },
          {
            name: 'Copy pass',
            content: 'api-reference/core/multipass/copy-pass.md'
          },
          {
            name: 'Multi pass renderer',
            content: 'api-reference/core/multipass/multi-pass-renderer.md'
          },
          {
            name: 'Pass',
            content: 'api-reference/core/multipass/pass.md'
          },
          {
            name: 'Render pass',
            content: 'api-reference/core/multipass/render-pass.md'
          },
          {
            name: 'Shader module pass',
            content: 'api-reference/core/multipass/shader-module-pass.md'
          }
        ]
      },
      {
        name: 'Scenegraph',
        children: [
          {
            name: 'ScenegraphNode',
            content: 'api-reference/core/scenegraph/scenegraph-node.md'
          },
          {
            name: 'ModelNode',
            content: 'api-reference/core/scenegraph/model-node.md'
          },
          {
            name: 'GroupNode',
            content: 'api-reference/core/scenegraph/group-node.md'
          }
        ]
      },
      {
        name: 'Geometry Nodes',
        children: [
          {
            name: 'Cone',
            content: 'api-reference/core/scenegraph/geometries/cone.md'
          },
          {
            name: 'Cube',
            content: 'api-reference/core/scenegraph/geometries/cube.md'
          },
          {
            name: 'Cylinder',
            content: 'api-reference/core/scenegraph/geometries/cylinder.md'
          },
          {
            name: 'IcoSphere',
            content: 'api-reference/core/scenegraph/geometries/ico-sphere.md'
          },
          {
            name: 'Plane',
            content: 'api-reference/core/scenegraph/geometries/plane.md'
          },
          {
            name: 'Sphere',
            content: 'api-reference/core/scenegraph/geometries/sphere.md'
          }
        ]
      },
      {
        name: 'WebGL2 Classes',
        children: [
          {
            name: 'Accessor',
            content: 'api-reference/webgl/accessor.md'
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
            name: 'Program',
            content: 'api-reference/webgl/program.md'
          },
          {
            name: 'Query',
            content: 'api-reference/webgl/query.md'
          },
          {
            name: 'Readback, Copy and Blit',
            content: 'api-reference/webgl/copy-and-blit.md'
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
            content: 'api-reference/webgl/shader.md'
          },
          {
            name: 'Shader',
            content: 'api-reference/webgl/shader.md'
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
            name: 'Texture3D',
            content: 'api-reference/webgl/texture-3d.md'
          },
          {
            name: 'TextureCube',
            content: 'api-reference/webgl/texture-cube.md'
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
            name: 'VertexArrayObject',
            content: 'api-reference/webgl/vertex-array-object.md'
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
            name: 'getGLContextInfo',
            content: 'api-reference/webgl/context/get-gl-context-info.md'
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
          }
        ]
      },
      {
        name: 'Shadertools',
        children: [
          {
            name: 'Shadertools:assembleShaders',
            content: 'api-reference/shadertools/assemble-shaders.md'
          },
          {
            name: 'GLSL Reference',
            content: 'api-reference/shadertools/glsl-reference.md'
          }
        ]
      },
      {
        name: 'Shader Modules',
        children: [
          {
            name: 'picking',
            content: 'api-reference/shadertools/shader-module-picking.md'
          }
        ]
      },
      {
        name: 'Addons',
        children: [
          {
            name: 'Animation',
            children: [
              {
                name: 'Timeline',
                content: 'api-reference/addons/animation/timeline.md'
              },
              {
                name: 'KeyFrames',
                content: 'api-reference/addons/animation/key-frames.md'
              }
            ]
          },
          {
            name: 'Event',
            content: 'api-reference/addons/event.md'
          }
        ]
      }
    ]
  },
  {
    name: 'Contributor Guide',
    children: [
      {
        name: 'Development Environment',
        content: 'developer-guide/README.md'
      }
    ]
  }
];
