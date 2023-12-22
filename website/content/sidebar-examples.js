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
        'showcase/instancing',
        'showcase/persistence',
        'api/animation'
        // Broken pending texture refactor
        // 'api/cubemap',
        // 'api/texture-3d'
      ]
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: [
        'tutorials/hello-triangle',
        'tutorials/hello-cube',
        'tutorials/lighting',
        'tutorials/hello-instancing',
        'tutorials/shader-modules',
        'tutorials/shader-hooks'
      ]
    },
    // {
    //   type: 'category',
    //   label: 'WebGPU',
    //   items: [
    //     'webgpu/triangle',
    //     'webgpu/rotating-cube',
    //     'webgpu/textured-cube',
    //     'webgpu/two-cubes',
    //     'webgpu/instanced-cubes'
    //   ]
    // }
  ]
};

module.exports = sidebars;
