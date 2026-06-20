const sidebars = {
  examplesSidebar: [
    {
      type: 'doc',
      label: 'Overview',
      id: 'index'
    },
    {
      type: 'category',
      label: 'Showcase',
      items: [
        'showcase/gltf',
        'showcase/instancing',
        'showcase/postprocessing',
        'showcase/dof',
        'showcase/globe'
      ]
    },
    {
      type: 'category',
      label: 'API',
      items: [
        'api/animation',
        'api/multi-canvas',
        'api/cubemap',
        'api/texture-3d',
        'api/texture-tester',
        'api/render-bundles'
      ]
    },
    {
      type: 'category',
      label: 'Integrations',
      items: ['integrations/external-context', 'integrations/react-strict-mode']
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: [
        'tutorials/hello-triangle',
        'tutorials/hello-cube',
        'tutorials/lighting',
        'tutorials/hello-gltf',
        'tutorials/two-cubes',
        'tutorials/instanced-cubes',
        // 'tutorials/hello-instancing',
        // 'tutorials/shader-modules',
        // 'tutorials/shader-hooks',
        'tutorials/transform-feedback'
        // 'tutorials/transform'
      ]
    },
    {
      type: 'category',
      label: 'Experimental',
      items: [
        'experimental/bloom',
        'experimental/fp64',
        'experimental/gpt-2'
      ]
    },
    {
      type: 'category',
      label: 'GPU Data - luma v10',
      items: ['v10/gpgpu']
    },
    {
      type: 'category',
      label: 'Apache Arrow - luma.gl v10',
      items: [
        'arrow/arrow-filtering',
        'arrow/arrow-points',
        'arrow/arrow-lines',
        'arrow/arrow-polygons',
        'arrow/arrow-geoarrow',
        'arrow/arrow-float64-precision',
        'arrow/arrow-text-2d',
        'arrow/arrow-text-3d',
        'arrow/arrow-temporal-starfield',
        'arrow/arrow-time-columns',
        'arrow/arrow-mesh-geometry',
        'arrow/arrow-particles',
        'arrow/arrow-instancing',
        'arrow/arrow-dggs-polygons',
        'arrow/arrow-columns'
      ]
    }
  ]
};

module.exports = sidebars;
