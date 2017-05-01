function getDocUrl(filename) {
  return `docs/${filename}`;
}

function generatePath(tree) {
  if (Array.isArray(tree)) {
    tree.forEach(branch => generatePath(branch));
  }
  if (tree.children) {
    generatePath(tree.children);
  }
  if (tree.name) {
    tree.path = tree.name.match(/(([A-Z]|^)[a-z]+|\d+)/g).join('-').toLowerCase();
  }
  return tree;
}

export const examplePages = generatePath([
  {
    name: 'Overview',
    content: 'code-markdown/examples.md'
  },
  {
    name: 'Cubemap',
    content: {
      demo: 'CubemapDemo',
      code: 'code-markdown/scatterplot.md'
    }
  },
  {
    name: 'Instancing',
    content: {
      demo: 'InstancingDemo',
      code: 'code-markdown/scatterplot.md'
    }
  }
]);

export const docPages = generatePath([
  {
    name: 'Overview',
    children: [
      {
        name: 'Introduction',
        content: getDocUrl('README.md')
      },
      {
        name: 'What\'s New',
        content: getDocUrl('whats-new.md')
      },
      {
        name: 'Upgrade Guide',
        content: getDocUrl('upgrade-guide.md')
      }
    ]
  },
  {
    name: 'Getting Started',
    children: [
      {
        name: 'Installation',
        content: getDocUrl('get-started/README.md')
      },
      {
        name: 'Using with deck.gl',
        content: getDocUrl('get-started/using-with-deckgl.md')
      },
      {
        name: 'Using with Node.js',
        content: getDocUrl('get-started/using-with-node.md')
      },
      {
        name: 'Using with other WebGL Libraries',
        content: getDocUrl('get-started/using-with-other-libs.md')
      }
    ]
  },
  {
    name: 'User\'s Guide',
    children: [
      {
        name: 'Overview',
        content: getDocUrl('user-guide/README.md')
      },
      {
        name: 'Math Libraries',
        content: getDocUrl('user-guide/math.md')
      },
      {
        name: 'Debugging',
        content: getDocUrl('user-guide/debugging.md')
      },
      {
        name: 'Extensions',
        content: getDocUrl('user-guide/extensions.md')
      },
      {
        name: 'WebGL2',
        content: getDocUrl('user-guide/webgl2.md')
      },
      {
        name: 'GPGPU Programming',
        content: getDocUrl('user-guide/gpgpu.md')
      }
    ]
  },
  {
    name: 'WebGL Reference',
    children: [
      {
        name: 'Context',
        content: getDocUrl('webgl/context.md')
      },
      {
        name: 'Resource',
        content: getDocUrl('webgl/resource.md')
      },
      {
        name: 'Buffer',
        content: getDocUrl('webgl/buffer.md')
      },
      {
        name: 'FenceSync',
        content: getDocUrl('webgl/fence-sync.md')
      },
      {
        name: 'Framebuffer',
        content: getDocUrl('webgl/framebuffer.md')
      },
      {
        name: 'Renderbuffer',
        content: getDocUrl('webgl/renderbuffer.md')
      },
      {
        name: 'Program',
        content: getDocUrl('webgl/program.md')
      },
      {
        name: 'Shader',
        content: getDocUrl('webgl/shader.md')
      },
      {
        name: 'Texture2D',
        content: getDocUrl('webgl/texture-2d.md')
      },
      {
        name: 'Texture2DArray (WebGL2)',
        content: getDocUrl('webgl/texture-2d-array.md')
      },
      {
        name: 'Texture3D (WebGL2)',
        content: getDocUrl('webgl/texture-3d.md')
      },
      {
        name: 'TextureCube',
        content: getDocUrl('webgl/texture-cube.md')
      },
      {
        name: 'TransformFeedback (WebGL2)',
        content: getDocUrl('webgl/transform-feedback.md')
      },
      {
        name: 'Query (WebGL2)',
        content: getDocUrl('webgl/query.md')
      },
      {
        name: 'Sampler (WebGL2)',
        content: getDocUrl('webgl/sampler')
      },
      {
        name: 'VertexArrayObject',
        content: getDocUrl('webgl/vertex-array-object.md')
      }
    ]
  },
  {
    name: 'API Reference',
    children: [
      {
        name: 'Animation Frame',
        content: getDocUrl('api-reference/animation-frame.md')
      },
      {
        name: 'Model',
        content: getDocUrl('api-reference/model.md')
      },
      {
        name: 'Addons',
        content: getDocUrl('api-reference/addons.md')
      },
      {
        name: 'Event',
        content: getDocUrl('api-reference/event.md')
      },
      {
        name: 'Geometry',
        content: getDocUrl('api-reference/geometry.md')
      },
      {
        name: 'Shader Cache (Experimental)',
        content: getDocUrl('api-reference/experimental/shader-cache.md')
      },
      {
        name: 'Camera (Deprecated)',
        content: getDocUrl('api-reference/deprecated/camera.md')
      },
      {
        name: 'Effects (Deprecated)',
        content: getDocUrl('api-reference/deprecated/fx.md')
      },
      {
        name: 'Group (Deprecated)',
        content: getDocUrl('api-reference/deprecated/group.md')
      }
    ]
  }]);
