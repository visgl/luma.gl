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
        'showcase/globe',
        {type: 'doc', id: 'showcase/postprocessing', label: 'Effects: Postprocessing'},
        {type: 'doc', id: 'showcase/dof', label: 'Effects: Depth of Field'},
        {type: 'doc', id: 'showcase/persistence', label: 'Effects: Persistence'}
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
        'experimental/a-buffer',
        {type: 'doc', id: 'experimental/advanced-effects', label: 'Effects: Visualization City'},
        'experimental/bloom',
        'experimental/fp64',
        'experimental/gpt-2',
        'experimental/video-texture',
        'experimental/gpu-frustum-culling',
        'experimental/gpu-trace-viewer',
        'experimental/gpu-sort',
        'experimental/gpu-data-analysis',
        'experimental/html-ui-prism',
        'experimental/webxr-kaleidoscope'
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
        'arrow/arrow-points',
        'arrow/arrow-filtering',
        'arrow/arrow-lines',
        'arrow/arrow-polygons',
        'arrow/arrow-geoarrow',
        'arrow/arrow-float64-precision',
        'arrow/arrow-text-2d',
        'arrow/arrow-text-space-crawl',
        'arrow/arrow-temporal-starfield',
        'arrow/arrow-time-columns',
        'arrow/arrow-mesh-geometry',
        'arrow/arrow-particles',
        'arrow/arrow-instancing',
        'arrow/arrow-dggs-polygons',
        'arrow/arrow-columns'
      ]
    },
    {
      type: 'category',
      label: 'Arrow Layers - deck.gl v10',
      items: [
        'deck/arrow-path-layer',
        'deck/arrow-polygon-layer',
        'deck/arrow-text-layer'
      ]
    }
  ]
};

module.exports = sidebars;
