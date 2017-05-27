export const EXAMPLE_PAGES = [
  {
    name: 'Overview',
    content: 'code-markdown/examples.md'
  },
  {
    name: 'Cubemap',
    content: {
      demo: 'CubemapDemo'
    }
  },
  {
    name: 'Custom Picking',
    content: {
      demo: 'CustomPickingDemo',
      path: 'https://raw.githubusercontent.com/uber/luma.gl/master/examples/core/custom-picking/'
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
    name: 'Concentrics',
    content: {
      demo: 'MulticontextDemo'
    }
  },
  {
    name: 'Picking',
    content: {
      demo: 'PickingDemo',
      path: 'https://raw.githubusercontent.com/uber/luma.gl/master/examples/core/picking/'
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
  {
    name: 'Persistence',
    content: {
      demo: 'PersistenceDemo'
    }
  },
  // {
  //   name: 'Shadowmap',
  //   content: {
  //     demo: 'ShadowmapDemo'
  //   }
  // },
  {
    name: 'WebGL Lessons',
    children: [
      {
        name: 'Lesson 01',
        content: {
          demo: 'Lesson01'
        }
      },
      {
        name: 'Lesson 02',
        content: {
          demo: 'Lesson02'
        }
      },
      {
        name: 'Lesson 03',
        content: {
          demo: 'Lesson03'
        }
      },
      {
        name: 'Lesson 04',
        content: {
          demo: 'Lesson04'
        }
      },
      {
        name: 'Lesson 05',
        content: {
          demo: 'Lesson05',
          path: 'https://raw.githubusercontent.com/uber/luma.gl/master/examples/lessons/05/'
        }
      },
      {
        name: 'Lesson 06',
        content: {
          demo: 'Lesson06',
          path: 'https://raw.githubusercontent.com/uber/luma.gl/master/examples/lessons/06/'
        }
      },
      {
        name: 'Lesson 07',
        content: {
          demo: 'Lesson07',
          path: 'https://raw.githubusercontent.com/uber/luma.gl/master/examples/lessons/07/'
        }
      },
      {
        name: 'Lesson 08',
        content: {
          demo: 'Lesson08',
          path: 'https://raw.githubusercontent.com/uber/luma.gl/master/examples/lessons/08/'
        }
      },
      {
        name: 'Lesson 09',
        content: {
          demo: 'Lesson09',
          path: 'https://raw.githubusercontent.com/uber/luma.gl/master/examples/lessons/09/'
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
      // {
      //   name: 'Lesson 16',
      //   content: {
      //     demo: 'Lesson03'
      //   }
      // }
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
        name: 'Installation',
        content: 'get-started/README.md'
      },
      {
        name: 'Using with deck.gl',
        content: 'get-started/using-with-deckgl.md'
      },
      {
        name: 'Using with Node.js',
        content: 'get-started/using-with-node.md'
      },
      {
        name: 'Using with other WebGL Libraries',
        content: 'get-started/using-with-other-libs.md'
      }
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
        name: 'Math Libraries',
        content: 'user-guide/math.md'
      },
      {
        name: 'Debugging',
        content: 'user-guide/debugging.md'
      },
      {
        name: 'WebGL2',
        content: 'user-guide/webgl2.md'
      },
      {
        name: 'GPGPU Programming',
        content: 'user-guide/gpgpu.md'
      }
    ]
  },
  {
    name: 'API Reference',
    children: [
      {
        name: 'Animation Loop',
        content: 'api-reference/core/animation-loop.md'
      },
      {
        name: 'Model',
        content: 'api-reference/core/model.md'
      },
      {
        name: 'Group',
        content: 'api-reference/scenegraph/group.md'
      },
      {
        name: 'Geometry',
        content: 'api-reference/core/geometry.md'
      },
      {
        name: 'Shader Cache',
        content: 'api-reference/shader-tools/shader-cache.md'
      },
      {
        name: 'Events Package',
        content: 'api-reference/events/event.md'
      }
    ]
  },
  {
    name: 'WebGL Reference',
    children: [
      {
        name: 'Context Management',
        content: 'api-reference/webgl/context.md'
      },
      {
        name: 'Capability Management',
        content: 'api-reference/webgl/context-limits.md'
      },
      {
        name: 'State Management',
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
        name: 'Renderbuffer',
        content: 'api-reference/webgl/renderbuffer.md'
      },
      {
        name: 'Program',
        content: 'api-reference/webgl/program.md'
      },
      {
        name: 'Resource',
        content: 'api-reference/webgl/resource.md'
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
        name: 'Query (WebGL2)',
        content: 'api-reference/webgl/query.md'
      },
      {
        name: 'Sampler (WebGL2)',
        content: 'api-reference/webgl/sampler.md'
      },
      {
        name: 'VertexArrayObject (EXT)',
        content: 'api-reference/webgl/vertex-array-object.md'
      }
    ]
  }
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
  //   ]
  // }
];
