const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/luma.gl/master';

export const EXAMPLE_PAGES = [
  {
    name: 'Core Examples',
    children: [
      {
        name: 'Overview',
        content: {
          path: 'markdown/examples.md'
        }
      },
      {
        name: 'Cubemap',
        content: {
          demo: 'CubemapDemo'
        }
      },
      // {
      //   name: 'Custom Picking',
      //   content: {
      //     demo: 'CustomPickingDemo',
      //     path: `${RAW_GITHUB}/examples/core/custom-picking/`
      //   }
      // },
      {
        name: 'Fragment',
        content: {
          demo: 'FragmentDemo'
        }
      },
      {
        name: 'Instancing',
        content: {
          demo: 'InstancingDemo'
        }
      },
      {
        name: 'Mandelbrot',
        content: {
          demo: 'MandelbrotDemo'
        }
      },
      {
        name: 'Picking',
        content: {
          demo: 'PickingDemo',
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
          demo: 'ShadowmapDemo'
        }
      },
      {
        name: 'Transform Feedback',
        content: {
          demo: 'TransformFeedbackDemo'
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
          demo: 'Lesson01'
        }
      },
      {
        name: 'Lesson 02 - Color',
        content: {
          demo: 'Lesson02'
        }
      },
      {
        name: 'Lesson 03 - Movement',
        content: {
          demo: 'Lesson03'
        }
      },
      {
        name: 'Lesson 04 - 3D Objects',
        content: {
          demo: 'Lesson04'
        }
      },
      {
        name: 'Lesson 05 - Textures',
        content: {
          demo: 'Lesson05',
          path: `${RAW_GITHUB}/examples/lessons/05/`
        }
      },
      {
        name: 'Lesson 06 - Texture Filters',
        content: {
          demo: 'Lesson06',
          path: `${RAW_GITHUB}/examples/lessons/06/`
        }
      },
      {
        name: 'Lesson 07 - Lighting',
        content: {
          demo: 'Lesson07',
          path: `${RAW_GITHUB}/examples/lessons/07/`
        }
      },
      {
        name: 'Lesson 08 - Transparency',
        content: {
          demo: 'Lesson08',
          path: `${RAW_GITHUB}/examples/lessons/08/`
        }
      },
      {
        name: 'Lesson 09 - Moving Objects',
        content: {
          demo: 'Lesson09',
          path: `${RAW_GITHUB}/examples/lessons/09/`
        }
      },
      // {
      //   name: 'Lesson 10',
      //   content: {
      //     demo: 'Lesson03'
      //   }
      // },
      // {
      //   name: 'Lesson 11',
      //   content: {
      //     demo: 'Lesson03'
      //   }
      // },
      // {
      //   name: 'Lesson 12',
      //   content: {
      //     demo: 'Lesson03'
      //   }
      // },
      // {
      //   name: 'Lesson 13',
      //   content: {
      //     demo: 'Lesson03'
      //   }
      // },
      // {
      //   name: 'Lesson 14',
      //   content: {
      //     demo: 'Lesson03'
      //   }
      // },
      // {
      //   name: 'Lesson 15',
      //   content: {
      //     demo: 'Lesson03'
      //   }
      // },
      {
        name: 'Lesson 10 - Render to Texture',
        content: {
          demo: 'Lesson16',
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
    name: 'User\'s Guide',
    children: [
      {
        name: 'Overview',
        content: 'user-guide/README.md'
      },
      {
        name: 'Debugging',
        content: 'user-guide/debugging.md'
      }
    ]
  },
  // ,
  // {
  //   name: 'Advanced',
  //   children: [
  //     {
  //       name: 'Roadmap',
  //       content: 'user-guide/extensions.md'
  //     },
  //     {
  //       name: 'Extensions',
  //       content: 'user-guide/extensions.md'
  //     },
      // {
      //   name: 'WebGL2',
      //   content: 'user-guide/webgl2.md'
      // },
      // {
      //   name: 'GPGPU Programming',
      //   content: 'user-guide/gpgpu.md'
      // }
  //   ]
  // }
  {
    name: 'Core API Reference',
    children: [
      {
        name: 'Animation Loop',
        content: 'api-reference/core/animation-loop.md'
      },
      {
        name: 'Model',
        content: 'api-reference/core/model.md'
      },
      // {
      //   name: 'Object3d',
      //   content: 'api-reference/core/object-3d.md'
      // },
      // {
      //   name: 'Group',
      //   content: 'api-reference/core/group.md'
      // },
      {
        name: 'Geometry',
        content: 'api-reference/core/geometry.md'
      }
      // {
      //   name: 'Picking',
      //   content: 'api-reference/picking/picking.md'
      // }
    ]
  },
  {
    name: 'WebGL2 API Reference',
    children: [
      {
        name: 'WebGL Context',
        content: 'api-reference/webgl/context.md'
      },
      {
        name: 'WebGL Capabilities',
        content: 'api-reference/webgl/context-limits.md'
      },
      {
        name: 'WebGL Parameters',
        content: 'api-reference/webgl/context-state.md'
      },
      {
        name: 'Buffer',
        content: 'api-reference/webgl/buffer.md'
      },
      // {
      //   name: 'FenceSync (WebGL2)',
      //   content: 'api-reference/webgl/fence-sync.md'
      // },
      {
        name: 'Framebuffer',
        content: 'api-reference/webgl/framebuffer.md'
      },
      {
        name: 'Program',
        content: 'api-reference/webgl/program.md'
      },
      {
        name: 'Query (WebGL2*)',
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
        name: 'Sampler (WebGL2)',
        content: 'api-reference/webgl/sampler.md'
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
        name: 'Texture2DArray (WebGL2)',
        content: 'api-reference/webgl/texture-2d-array.md'
      },
      {
        name: 'Texture3D (WebGL2)',
        content: 'api-reference/webgl/texture-3d.md'
      },
      {
        name: 'TextureCube',
        content: 'api-reference/webgl/texture-cube.md'
      },
      {
        name: 'TransformFeedback (WebGL2)',
        content: 'api-reference/webgl/transform-feedback.md'
      },
      {
        name: 'UniformBufferLayout (WebGL2*)',
        content: 'api-reference/webgl/uniform-buffer-layout.md'
      },
      {
        name: 'VertexArray (WebGL2*)',
        content: 'api-reference/webgl/vertex-array.md'
      }
    ]
  },
  // {
  //   name: 'Math API Reference',
  //   children: [
  //     {
  //       name: 'Overview',
  //       content: 'api-reference/math/README.md'
  //     },
  //     {
  //       name: 'Matrix4',
  //       content: 'api-reference/math/matrix4.md'
  //     },
  //     // {
  //     //   name: 'Vector2',
  //     //   content: 'api-reference/math/vector2.md'
  //     // },
  //     {
  //       name: 'Vector3',
  //       content: 'api-reference/math/vector3.md'
  //     }
  //     // {
  //     //   name: 'Vector4',
  //     //   content: 'api-reference/math/vector4.md'
  //     // },
  //     // {
  //     //   name: 'Quaternion',
  //     //   content: 'api-reference/math/quaternion.md'
  //     // },
  //     // {
  //     //   name: 'Euler',
  //     //   content: 'api-reference/math/euler.md'
  //     // }
  //   ]
  // },
  {
    name: 'Shadertools API Reference',
    children: [
      {
        name: 'Shader Modules',
        content: 'api-reference/shadertools/README.md'
      },
      {
        name: 'Shader Cache',
        content: 'api-reference/shadertools/shader-cache.md'
      },
      {
        name: 'picking (Shader Module)',
        content: 'api-reference/shadertools/shadertools-picking.md'
      }
    ]
  },
  {
    name: 'Geometry API Reference',
    children: [
      {
        name: 'Cone',
        content: 'api-reference/primitives/cone.md'
      },
      {
        name: 'Cube',
        content: 'api-reference/primitives/cube.md'
      },
      {
        name: 'Cylinder',
        content: 'api-reference/primitives/cylinder.md'
      },
      {
        name: 'IcoSphere',
        content: 'api-reference/primitives/ico-sphere.md'
      },
      {
        name: 'Plane',
        content: 'api-reference/primitives/plane.md'
      },
      {
        name: 'Sphere',
        content: 'api-reference/primitives/sphere.md'
      }
    ]
  },
  {
    name: 'Addons API Reference',
    children: [
      {
        name: 'Events Package',
        content: 'api-reference/events/event.md'
      }
    ]
  }
];
