const resolve = require('path').resolve;

const DOCS = require('../docs/table-of-contents.json');
const DEPENDENCIES = require('./package.json').dependencies;
// eslint-disable-next-line import/no-extraneous-dependencies
const ALIASES = require('ocular-dev-tools/config/ocular.config')({
  root: resolve(__dirname, '..')
}).aliases;

// When duplicating example dependencies in website, autogenerate
// aliases to ensure the website version is picked up
// NOTE: module dependencies are automatically injected
// TODO - should this be automatically done by gatsby-theme-ocular?
const dependencyAliases = {};
for (const dependency in DEPENDENCIES) {
  dependencyAliases[dependency] = `${__dirname}/node_modules/${dependency}`;
}

module.exports = {
  logLevel: 1, // Adjusts amount of debug information from ocular-gatsby

  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../`,
  DIR_NAME: `${__dirname}`,

  DOCS,

  // TODO/ib - from ocular, deduplicate with above settings
  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'luma.gl',
  PROJECT_ORG: 'uber',
  PROJECT_URL: `https://luma.gl`,
  PROJECT_DESC: 'High-performance Toolkit for WebGL-based Data Visualization',

  PATH_PREFIX: '/',

  FOOTER_LOGO: '',

  GA_TRACKING: null,

  LINK_TO_GET_STARTED: '/docs',

  // For showing star counts and contributors.
  // Should be like btoa('YourUsername:YourKey') and should be readonly.
  GITHUB_KEY: null,

  HOME_PATH: '/',

  HOME_HEADING: 'High-performance toolkit for WebGL-based data visualization.',

  HOME_RIGHT: null,

  HOME_BULLETS: [
    {
      text: 'Flexibility',
      desc:
        'luma.gl can provide high-level drawing classes or simply enhance programming directly with the WebGL API.',
      img: 'images/icon-high-precision.svg'
    },
    {
      text: 'Consistency',
      desc:
        'luma.gl polyfills WebGL 1 contexts where possible to provide WebGL 2 API support, relieving developers of common cross-platform support headaches.',
      img: 'images/icon-high-precision.svg'
    },
    {
      text: 'Performance',
      desc:
        'luma.gl simplifies usage of high-performance APIs for data visualization like instanced rendering and transform feedback.',
      img: 'images/icon-high-precision.svg'
    }
  ],

  PROJECTS: [
    {
      title: 'deck.gl',
      url: 'https://deck.gl'
    },
    {
      title: 'luma.gl',
      url: 'https://luma.gl'
    },
    {
      title: 'react-map-gl',
      url: 'https://uber.github.io/react-map-gl'
    },
    {
      title: 'react-vis',
      url: 'https://uber.github.io/react-vis'
    }
  ],

  ADDITIONAL_LINKS: [],

  INDEX_PAGE_URL: resolve(__dirname, './templates/index.jsx'),

  EXAMPLES: [
    {
      title: 'Instancing',
      componentUrl: resolve(__dirname, './templates/showcase/example-instancing.jsx'),
      path: 'examples/showcase/instancing/',
      image: 'images/example-instancing.jpg'
    },
    {
      title: 'Geospatial',
      componentUrl: resolve(__dirname, './templates/showcase/example-geospatial.jsx'),
      path: 'examples/showcase/geospatial/',
      image: 'images/example-geospatial.jpg'
    },
    {
      title: 'Persistence',
      componentUrl: resolve(__dirname, './templates/showcase/example-persistence.jsx'),
      path: 'examples/showcase/persistence/',
      image: 'images/example-persistence.jpg'
    },
    {
      title: 'Wandering',
      componentUrl: resolve(__dirname, './templates/showcase/example-wandering.jsx'),
      path: 'examples/showcase/wandering/',
      image: 'images/example-wandering.png'
    },
    {
      title: 'DOF',
      componentUrl: resolve(__dirname, './templates/showcase/example-dof.jsx'),
      path: 'examples/showcase/dof/',
      image: 'images/example-dof.jpg'
    },
    {
      title: 'GLTF',
      componentUrl: resolve(__dirname, './templates/showcase/example-gltf.jsx'),
      path: 'examples/showcase/gltf/',
      image: 'images/example-gltf.jpg'
    },
    {
      title: 'Hello Triangle',
      componentUrl: resolve(__dirname, './templates/getting-started/example-hello-triangle.jsx'),
      path: 'examples/getting-started/hello-triangle',
      image: 'images/example-hello-triangle.png'
    },
    {
      title: 'Hello Instancing - High-level',
      componentUrl: resolve(
        __dirname,
        './templates/getting-started/example-hello-instancing-high.jsx'
      ),
      path: 'examples/getting-started/hello-instancing-high',
      image: 'images/example-hello-instancing.png'
    },
    {
      title: 'Hello Instancing - Mid-level',
      componentUrl: resolve(
        __dirname,
        './templates/getting-started/example-hello-instancing-mid.jsx'
      ),
      path: 'examples/getting-started/hello-instancing-mid',
      image: 'images/example-hello-instancing.png'
    },
    {
      title: 'Hello Instancing - Low-level',
      componentUrl: resolve(
        __dirname,
        './templates/getting-started/example-hello-instancing-low.jsx'
      ),
      path: 'examples/getting-started/hello-instancing-low',
      image: 'images/example-hello-instancing.png'
    },
    {
      title: 'Shader Modules',
      componentUrl: resolve(__dirname, './templates/getting-started/example-shader-modules.jsx'),
      path: 'examples/getting-started/shader-modules',
      image: 'images/example-shader-modules.png'
    },
    {
      title: 'Shader Hooks',
      componentUrl: resolve(__dirname, './templates/getting-started/example-shader-hooks.jsx'),
      path: 'examples/getting-started/shader-hooks',
      image: 'images/example-shader-hooks.jpg'
    },
    {
      title: 'Shader Modules - Low-level',
      componentUrl: resolve(
        __dirname,
        './templates/getting-started/example-shader-modules-low.jsx'
      ),
      path: 'examples/getting-started/shader-modules-low',
      image: 'images/example-shader-hooks.jpg'
    },
    {
      title: 'Transform Feedback',
      componentUrl: resolve(
        __dirname,
        './templates/getting-started/example-transform-feedback.jsx'
      ),
      path: 'examples/getting-started/transform-feedback',
      image: 'images/example-transform-feedback.jpg'
    },
    {
      title: 'External Context',
      componentUrl: resolve(__dirname, './templates/getting-started/example-external-context.jsx'),
      path: 'examples/getting-started/external-context',
      image: 'images/example-hello-triangle.png'
    },
    {
      title: 'Animation',
      componentUrl: resolve(__dirname, './templates/api/example-animation.jsx'),
      path: 'examples/api/animation/',
      image: 'images/example-animation.png'
    },
    {
      title: 'Program Management',
      componentUrl: resolve(__dirname, './templates/api/example-program-management.jsx'),
      path: 'examples/api/program-management/',
      image: 'images/example-program-management.png'
    },
    {
      title: 'Cubemap',
      componentUrl: resolve(__dirname, './templates/api/example-cubemap.jsx'),
      path: 'examples/api/cubemap/',
      image: 'images/example-cubemap.jpg'
    },
    {
      title: 'Texture3D',
      componentUrl: resolve(__dirname, './templates/api/example-texture-3d.jsx'),
      path: 'examples/api/texture3d/',
      image: 'images/example-texture3d.png'
    },
    {
      title: 'Stress Test',
      componentUrl: resolve(__dirname, './templates/performance/example-stress-test.jsx'),
      path: 'examples/performance/stress-test/',
      image: 'images/example-stress-test.png'
    }
  ],

  // Avoids duplicate conflicting inputs when importing from examples folders
  // Ocular adds this to gatsby's webpack config
  webpack: {
    resolve: {
      alias: Object.assign({}, ALIASES, dependencyAliases, {
        // '@luma.gl/addons': `${__dirname}/node_modules/@luma.gl/addons/src`,
        // '@luma.gl/core': `${__dirname}/node_modules/@luma.gl/core/src`,
        // '@luma.gl/constants': `${__dirname}/node_modules/@luma.gl/constants/src`,
        // '@luma.gl/webgl': `${__dirname}/node_modules/@luma.gl/webgl/src`,
        // '@deck.gl/core': `${__dirname}/node_modules/@deck.gl/core/src`,
        // '@deck.gl/layers': `${__dirname}/node_modules/@deck.gl/layers/src`,
        // '@deck.gl/react': `${__dirname}/node_modules/@deck.gl/react/src`
      })
    }
  }
};
