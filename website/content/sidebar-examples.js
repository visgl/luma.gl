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
        'showcase/globe',
        'showcase/instancing',
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
        {type: 'doc', id: 'api/blending', label: 'Blending'},
        {type: 'doc', id: 'api/multi-draw', label: 'Multi Draw'},
        'api/multi-canvas',
        'api/cubemap',
        'api/texture-3d',
        {type: 'doc', id: 'api/texture-sampling', label: 'Texture Sampling'},
        {type: 'doc', id: 'api/texture-tester', label: 'Texture Compression'},
        {type: 'doc', id: 'api/video-texture', label: 'Texture Video'},
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
        {type: 'doc', id: 'experimental/antialiasing', label: 'Antialiasing Techniques'},
        {type: 'doc', id: 'experimental/advanced-effects', label: 'Effects: Visualization City'},
        {type: 'doc', id: 'experimental/bloom', label: 'Effects: Bloom'},
        'experimental/fp64',
        'experimental/gpt-2',
        'experimental/text-space-crawl',
        {type: 'doc', id: 'experimental/html-ui-prism', label: 'Texture HTML-in-Canvas'},
        {type: 'doc', id: 'experimental/webxr-kaleidoscope', label: 'Texture WebXR'}
      ]
    },
    {
      type: 'category',
      label: 'GPU Data - luma v10',
      items: ['v10/gpgpu']
    },
    {
      type: 'category',
      label: 'GPU Command Graph - luma v10',
      items: [
        'experimental/gpu-frustum-culling',
        'experimental/gpu-trace-viewer',
        'experimental/gpu-sort',
        'experimental/gpu-data-analysis'
      ]
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
        'arrow/arrow-temporal-starfield',
        'arrow/arrow-time-columns',
        'arrow/arrow-mesh-geometry',
        'arrow/arrow-particles',
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
