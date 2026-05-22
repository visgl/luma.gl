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
      label: 'Apache Arrow GPU Tables',
      items: [
        'gpu-tables/arrow-instancing',
        'gpu-tables/arrow-text-2d',
        'gpu-tables/arrow-time-columns',
        'gpu-tables/arrow-temporal-starfield',
        'gpu-tables/arrow-path-model',
        'gpu-tables/arrow-mesh-geometry',
        'gpu-tables/gpu-vector-storage-particles',
        'gpu-tables/dggs-gpu-polygons'
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
        'api/texture-tester'
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
    }
  ]
};

module.exports = sidebars;
