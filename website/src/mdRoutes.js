/* eslint-disable max-len */
import {setPathPrefix} from 'luma.gl';

/* eslint-enable max-len */

window.website = true;

const {
  InstancingDemo,
  CubemapDemo,
  //  CustomPickingDemo,
  //  DeferredRenderingDemo,
  MandelbrotDemo,
  FragmentDemo,
  //  ParticlesDemo,
  //  PersistenceDemo,
  PickingDemo,
  ShadowmapDemo,
  TransformFeedbackDemo,
  Lesson01Demo,
  Lesson02Demo,
  Lesson03Demo,
  Lesson04Demo,
  Lesson05Demo,
  Lesson06Demo,
  Lesson07Demo,
  Lesson08Demo,
  Lesson09Demo,
  Lesson10Demo,
  Lesson11Demo,
  Lesson12Demo,
  Lesson13Demo,
  Lesson14Demo,
  Lesson15Demo,
  Lesson16Demo
} = require('./react-demos');

const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/luma.gl/master';

export default [
  {
    name: 'Examples',
    path: '/examples',
    data: [
      {
        name: 'Overview',
        markdown: require('./overview.md')

      },
      {
        name: 'Showcases',
        children: [
          {
            name: 'Cubemap',
            component: CubemapDemo
          },
          // {
          //   name: 'Custom Picking',
          //   component: CustomPicking,
          // },
          {
            name: 'Fragment',
            component: FragmentDemo
          },
          {
            name: 'Instancing',
            component: InstancingDemo
          },
          {
            name: 'Mandelbrot',
            component: MandelbrotDemo
          },
          {
            name: 'Picking',
            component: PickingDemo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/core/picking/`)
          },
          // {
          //   name: 'DeferredRendering',
          // component: DeferredRendering,
          // {
          //   name: 'Particles',
          // component: Particles,
          // {
          //   name: 'Persistence',
          // component: Persistence,
          {
            name: 'Shadowmap',
            component: ShadowmapDemo
          },
          {
            name: 'Transform Feedback',
            component: TransformFeedbackDemo
          }
        ]
      },
      {
        name: 'WebGL Lessons',
        children: [
          {
            name: 'Lesson 01 - Drawing',
            component: Lesson01Demo
          },
          {
            name: 'Lesson 02 - Color',
            component: Lesson02Demo
          },
          {
            name: 'Lesson 03 - Movement',
            component: Lesson03Demo
          },
          {
            name: 'Lesson 04 - 3D Objects',
            component: Lesson04Demo
          },
          {
            name: 'Lesson 05 - Textures',
            component: Lesson05Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/05/`)
          },
          {
            name: 'Lesson 06 - Texture Filters',
            component: Lesson06Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/06/`)
          },
          {
            name: 'Lesson 07 - Lighting',
            component: Lesson07Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/07/`)
          },
          {
            name: 'Lesson 08 - Transparency',
            component: Lesson08Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/08/`)
          },
          {
            name: 'Lesson 09 - Moving Objects',
            component: Lesson09Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/09/`)
          },
          {
            name: 'Lesson 10 - Loading a World',
            component: Lesson10Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/10/`)
          },
          {
            name: 'Lesson 11 - Spheres and Rotations',
            component: Lesson11Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/11/`)
          },
          {
            name: 'Lesson 12 - Point Lighting',
            component: Lesson12Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/12/`)
          },
          {
            name: 'Lesson 13 - Per-Fragment Lighting',
            component: Lesson13Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/13/`)
          },
          {
            name: 'Lesson 14 - Specular Highlights',
            component: Lesson14Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/16/`)
          },
          {
            name: 'Lesson 15 - Specular Maps',
            component: Lesson15Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/16/`)
          },
          {
            name: 'Lesson 16 - Render to Texture',
            component: Lesson16Demo,
            onUpdate: () => setPathPrefix(`${RAW_GITHUB}/examples/lessons/16/`)
          }
        ]
      }
    ]
  },
  {
    name: 'Documentation',
    path: '/docs',
    data: [
      {
        name: 'Overview',
        children: [
          {
            name: 'Introduction',
            markdown: require('../../docs/README.md')
          },
          {
            name: 'What\'s New',
            markdown: require('../../docs/whats-new.md')
          },
          {
            name: 'Roadmaps',
            markdown: require('../../docs/roadmap.md')
          },
          {
            name: 'Frequently Asked Questions',
            markdown: require('../../docs/FAQ .md')
          },
          {
            name: 'Upgrade Guide',
            markdown: require('../../docs/upgrade-guide.md')
          }
        ]
      },
      {
        name: 'Getting Started',
        children: [
          {
            name: 'Overview',
            markdown: require('../../docs/get-started/README.md')
          },
          {
            name: 'Installation',
            markdown: require('../../docs/get-started/installation.md')
          },
          {
            name: 'Examples',
            markdown: require('../../docs/get-started/examples.md')
          },
          {
            name: 'Using with deck.gl',
            markdown: require('../../docs/get-started/using-with-deckgl.md')
          },
          {
            name: 'Using with Node.js',
            markdown: require('../../docs/get-started/using-with-node.md')
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
            name: 'loaders.gl',
            children: [
              {
                name: 'Overview',
                markdown: require('../../docs/developer-guide/loaders.gl/README.md')
              },
              {
                name: 'Understanding Loaders',
                markdown: require('../../docs/developer-guide/loaders.gl/about-loaders.md')
              }
            ]
          },
          {
            name: 'Shadertools',
            children: [
              {
                name: 'Overview',
                markdown: require('../../docs/developer-guide/shadertools/README.md')
              },
              {
                name: 'Shader Assembly',
                markdown: require('../../docs/developer-guide/shadertools/shader-assembly.md')
              },
              {
                name: 'Using Shader Modules',
                markdown: require('../../docs/developer-guide/shadertools/using-shader-modules.md')
              },
              {
                name: 'Model Integration',
                markdown: require('../../docs/developer-guide/shadertools/model-integration.md')
              },
              {
                name: 'Creating Shader Modules',
                markdown:
                  require('../../docs/developer-guide/shadertools/writing-shader-modules.md')
              },
              {
                name: 'Writing GLSL Code',
                markdown: require('../../docs/developer-guide/shadertools/writing-glsl-shaders.md')
              }
            ]
          },
          {
            name: 'Using WebGL',
            children: [
              {
                name: 'Drawing',
                markdown: require('../../docs/developer-guide/drawing.md')
              },
              // {
              //   name: 'Geometry',
              //   markdown: require('../../docs/developer-guide/geometry.md')
              // },
              {
                name: 'Buffers',
                markdown: require('../../docs/developer-guide/buffers.md')
              },
              {
                name: 'Attributes',
                markdown: require('../../docs/developer-guide/attributes.md')
              },
              {
                name: 'Accessors',
                markdown: require('../../docs/developer-guide/accessors.md')
              }
              // {
              //   name: 'Extensions',
              //   markdown: require('../../docs/user-guide/extensions.md')
              // },
              // {
              //   name: 'WebGL2',
              //   markdown: require('../../docs/user-guide/webgl2.md')
              // },
              // {
              //   name: 'GPGPU Programming',
              //   markdown: require('../../docs/user-guide/gpgpu.md')
              // }
            ]
          },
          {
            name: 'Higher Level APIs',
            children: [
              {
                name: 'Multi-Pass Rendering',
                markdown: require('../../docs/developer-guide/multipass/README.md')
              }
            ]
          },
          {
            name: 'Tools and Tips',
            children: [
              {
                name: 'Building Apps',
                markdown: require('../../docs/developer-guide/building-apps.md')
              },
              {
                name: 'Debugging',
                markdown: require('../../docs/developer-guide/debugging.md')
              },
              {
                name: 'Portability',
                markdown: require('../../docs/developer-guide/portability.md')
              }
            ]
          },
          {
            name: 'Overview',
            markdown: require('../../docs/developer-guide/README.md')
          },
          {
            name: 'API Structure',
            markdown: require('../../docs/api-reference/README.md')
          }
        ]
      },
      {
        name: 'API Reference',
        children: [
          {
            name: 'loaders.gl Reference',
            children: [
              {
                name: 'loadFile',
                markdown: require('../../docs/api-reference/loader-api/load-file.md')
              },
              {
                name: 'GLBLoader',
                markdown: require('../../docs/api-reference/loaders/glb-loader.md')
              },
              {
                name: 'PLYLoader',
                markdown: require('../../docs/api-reference/loaders/ply-loader.md')
              },
              {
                name: 'LASLoader',
                markdown: require('../../docs/api-reference/loaders/las-loader.md')
              },
              {
                name: 'PCDLoader',
                markdown: require('../../docs/api-reference/loaders/pcd-loader.md')
              },
              {
                name: 'OBJLoader',
                markdown: require('../../docs/api-reference/loaders/obj-loader.md')
              },
              {
                name: 'KMLLoader',
                markdown: require('../../docs/api-reference/loaders/kml-loader.md')
              }
            ]
          },
          {
            name: 'Shadertools Reference',
            children: [
              {
                name: 'Shadertools:assembleShaders',
                markdown: require('../../docs/api-reference/shadertools/assemble-shaders.md')
              },
              {
                name: 'GLSL Reference',
                content: require('../../docs/api-reference/shadertools/glsl-reference.md')
              }
            ]
          },
          {
            name: 'Shader Modules',
            children: [
              {
                name: 'picking',
                markdown: require('../../docs/api-reference/shadertools/shader-module-picking.md')
              }
            ]
          },
          {
            name: 'Geometries (Models)',
            children: [
              {
                name: 'Cone',
                markdown: require('../../docs/api-reference/models/cone.md')
              },
              {
                name: 'Cube',
                markdown: require('../../docs/api-reference/models/cube.md')
              },
              {
                name: 'Cylinder',
                markdown: require('../../docs/api-reference/models/cylinder.md')
              },
              {
                name: 'IcoSphere',
                markdown: require('../../docs/api-reference/models/ico-sphere.md')
              },
              {
                name: 'Plane',
                markdown: require('../../docs/api-reference/models/plane.md')
              },
              {
                name: 'Sphere',
                markdown: require('../../docs/api-reference/models/sphere.md')
              }
            ]
          },
          // {
          //   name: 'Scenegraph Reference',
          //   children: [
          //     {
          //       name: 'Object3d',
          //      core/object-3d,
          //     },
          //     {
          //       name: 'Group',
          //       markdown: group
          //     },
          //     {
          //       name: 'Picking',
          //      picking/picking,
          //     },
          //     ]
          //   }
          {
            name: 'WebGL2 Reference',
            children: [
              {
                name: 'Buffer',
                markdown: require('../../docs/api-reference/webgl/buffer.md')
              },
              {
                name: 'Program',
                markdown: require('../../docs/api-reference/webgl/program.md')
              },
              {
                name: 'Query',
                markdown: require('../../docs/api-reference/webgl/query.md')
              },
              {
                name: 'Renderbuffer',
                markdown: require('../../docs/api-reference/webgl/renderbuffer.md')
              },
              {
                name: 'Resource',
                markdown: require('../../docs/api-reference/webgl/resource.md')
              },
              {
                name: 'Sampler',
                markdown: require('../../docs/api-reference/webgl/sampler.md')
              },
              {
                name: 'Shader',
                markdown: require('../../docs/api-reference/webgl/shader.md')
              },
              {
                name: 'Texture',
                markdown: require('../../docs/api-reference/webgl/texture.md')
              },
              {
                name: 'Texture2D',
                markdown: require('../../docs/api-reference/webgl/texture-2d.md')
              },
              {
                name: 'Texture2DArray',
                markdown: require('../../docs/api-reference/webgl/texture-2d-array.md')
              },
              {
                name: 'Texture3D',
                markdown: require('../../docs/api-reference/webgl/texture-3d.md')
              },
              {
                name: 'TextureCube',
                markdown: require('../../docs/api-reference/webgl/texture-cube.md')
              },
              {
                name: 'TransformFeedback',
                markdown: require('../../docs/api-reference/webgl/transform-feedback.md')
              },
              {
                name: 'UniformBufferLayout',
                markdown: require('../../docs/api-reference/webgl/uniform-buffer-layout.md')
              },
              {
                name: 'VertexArray',
                markdown: require('../../docs/api-reference/webgl/vertex-array.md')
              },
              {
                name: 'createGLContext',
                markdown: require('../../docs/api-reference/webgl/context/context.md')
              },
              {
                name: 'isWebGL2',
                markdown: require('../../docs/api-reference/webgl/context/is-webGL2.md')
              },
              {
                name: 'hasFeature(s)',
                markdown: require('../../docs/api-reference/webgl/context/has-features.md')
              },
              {
                name: 'getFeatures',
                markdown: require('../../docs/api-reference/webgl/context/get-features.md')
              },
              {
                name: 'getContextInfo',
                markdown: require('../../docs/api-reference/webgl/context/get-context-info.md')
              },
              {
                name: 'getContextLimits',
                markdown: require('../../docs/api-reference/webgl/context/get-context-limits.md')
              },
              {
                name: 'get|setParameter(s)',
                markdown: require('../../docs/api-reference/webgl/context/get-parameters.md')
              },
              {
                name: 'resetParameters',
                markdown: require('../../docs/api-reference/webgl/context/reset-parameters.md')
              },
              {
                name: 'withParameters',
                markdown: require('../../docs/api-reference/webgl/context/with-parameters.md')
              }
            ]
          },
          {
            name: 'AnimationLoop',
            markdown: require('../../docs/api-reference/core/animation-loop.md')
          },
          {
            name: 'Model',
            markdown: require('../../docs/api-reference/core/model.md')
          },
          {
            name: 'ShaderCache',
            markdown: require('../../docs/api-reference/core/shader-cache.md')
          },
          {
            name: 'Geometry',
            markdown: require('../../docs/api-reference/core/geometry.md')
          }
        ]
      }
    ]
  }
];
