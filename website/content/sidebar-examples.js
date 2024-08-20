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
      label: 'Portable',
      items: [
        'portable/hello-triangle',
        'portable/rotating-cube',
        // "portable/textured-cube",
        'portable/two-cubes',
        'portable/instanced-cubes'
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
        'tutorials/hello-gltf',
        'tutorials/shader-modules',
        'tutorials/shader-hooks'
      ]
    }
  ]
};

module.exports = sidebars;
