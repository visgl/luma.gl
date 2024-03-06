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
        'tutorials/two-cubes',
        'tutorials/instanced-cubes',
        'tutorials/lighting',
        'tutorials/hello-instancing',
        'tutorials/shader-modules',
        'tutorials/shader-hooks'
      ]
    }
  ]
};

module.exports = sidebars;
