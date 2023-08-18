/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
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
        // 'gltf'
      ],
    },
    // {
    //   type: 'category',
    //   label: 'API',
    //   items: [
    //     'i3s',
    //     'i3s-debug',
    //     'i3s-arcgis',
    //     '3d-tiles'
    //   ]
    // },
    // {
    //   type: 'category',
    //   label: 'Tutorials',
    //   items: [
    //     'i3s',
    //     'i3s-debug',
    //     'i3s-arcgis',
    //     '3d-tiles'
    //   ]
    // },
    // {
    //   type: 'category',
    //   label: 'Benchmarks',
    //   items: [
    //     'benchmarks',
    //   ]
    // }
  ]
};

module.exports = sidebars;
