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
// TODO - should this be automatically done by ocular-gatsby?
const dependencyAliases = {};
for (const dependency in DEPENDENCIES) {
  dependencyAliases[dependency] = `${__dirname}/node_modules/${dependency}`;
}

module.exports = {
  logLevel: 3, // Adjusts amount of debug information from ocular-gatsby

  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../`,
  DIR_NAME: `${__dirname}`,

  DOCS,

  // TODO/ib - from ocular, deduplicate with above settings
  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'luma.gl',
  PROJECT_ORG: 'uber',
  PROJECT_URL: `https://luma.gl`,
  PROJECT_DESC:
    'High-performance WebGL2 components for GPU-powered data visualization and computation.',

  PATH_PREFIX: '/',

  FOOTER_LOGO: '',

  GA_TRACKING: null,

  // For showing star counts and contributors.
  // Should be like btoa('YourUsername:YourKey') and should be readonly.
  GITHUB_KEY: null,

  HOME_PATH: '/',

  HOME_HEADING:
    'High-performance WebGL2 components for GPU-powered data visualization and computation.',

  HOME_RIGHT: null,

  HOME_BULLETS: [
    {
      text: 'Advanced GPU Usage',
      desc:
        'luma.gl facilitates use of advanced GPU techniques, such as Instanced Rendering, Transform Feedback and WebGL2 features.',
      img: 'images/icon-high-precision.svg'
    },
    {
      text: 'Shader Programming Power',
      desc:
        'Modularized shader code, classes for controlling GPU inputs and outputs, and support for debugging and profiling GLSL shaders.',
      img: 'images/icon-high-precision.svg'
    },
    {
      text: 'Performance Focus',
      desc:
        'Strong focus on performance enables visualization and GPU processing of very large data sets.',
      img: 'images/icon-high-precision.svg'
    }
  ],

  PROJECTS: [
    {
      name: 'deck.gl',
      url: 'https://deck.gl'
    },
    {
      name: 'luma.gl',
      url: 'https://luma.gl'
    },
    {
      name: 'react-map-gl',
      url: 'https://uber.github.io/react-map-gl'
    },
    {
      name: 'react-vis',
      url: 'https://uber.github.io/react-vis'
    }
  ],

  ADDITIONAL_LINKS: [],

  INDEX_PAGE_URL: resolve(__dirname, './templates/index.jsx'),

  EXAMPLES: [
    {
      title: 'Cubemap',
      componentUrl: resolve(__dirname, './templates/core/example-cubemap.jsx'),
      path: 'examples/core/cubemap/',
      image: 'images/example-cubemap.jpg'
    },
    {
      title: 'Fragment',
      componentUrl: resolve(__dirname, './templates/core/example-fragment.jsx'),
      path: 'examples/core/fragment/',
      image: 'images/example-fragment.jpg'
    },
    {
      title: 'Instancing',
      componentUrl: resolve(__dirname, './templates/core/example-instancing.jsx'),
      path: 'examples/core/instancing/',
      image: 'images/example-instancing.jpg'
    },
    {
      title: 'Mandelbrot',
      componentUrl: resolve(__dirname, './templates/core/example-mandelbrot.jsx'),
      path: 'examples/core/mandelbrot/',
      image: 'images/example-mandelbrot.jpg'
    },
    {
      title: 'Persistence',
      componentUrl: resolve(__dirname, './templates/core/example-persistence.jsx'),
      path: 'examples/core/persistence/',
      image: 'images/example-persistence.jpg'
    },
    {
      title: 'Shadowmap',
      componentUrl: resolve(__dirname, './templates/core/example-shadowmap.jsx'),
      path: 'examples/core/shadowmap/',
      image: 'images/example-shadowmap.jpg'
    },
    {
      title: 'Animation',
      componentUrl: resolve(__dirname, './templates/core/example-animation.jsx'),
      path: 'examples/core/animation/',
      image: 'images/example-animation.png'
    },
    {
      title: 'TransformFeedback',
      componentUrl: resolve(__dirname, './templates/core/example-transform-feedback.jsx'),
      path: 'examples/core/transform-feedback/app',
      image: 'images/example-transform-feedback.jpg'
    },
    {
      title: 'Transform',
      componentUrl: resolve(__dirname, './templates/core/example-transform.jsx'),
      path: 'examples/core/transform/',
      image: 'images/example-transform.png'
    },
    {
      title: 'DOF',
      componentUrl: resolve(__dirname, './templates/core/example-dof.jsx'),
      path: 'examples/core/dof/',
      image: 'images/example-dof.jpg'
    },
    {
      title: 'GLTF',
      componentUrl: resolve(__dirname, './templates/core/example-gltf.jsx'),
      path: 'examples/core/gltf',
      image: 'images/example-gltf.jpg'
    },
    {
      title: 'Quasicrystals',
      componentUrl: resolve(__dirname, './templates/core/example-quasicrystals.jsx'),
      path: 'examples/core/quasicrystals/',
      image: 'images/example-quasicrystals.jpg'
    },
    {
      title: 'Texture3D',
      componentUrl: resolve(__dirname, './templates/core/example-texture-3d.jsx'),
      path: 'examples/core/texture3d/',
      image: 'images/example-texture3d.png'
    },
    {
      title: 'Lesson01',
      componentUrl: resolve(__dirname, './templates/lessons/example-01.jsx'),
      path: 'examples/lessons/01/',
      image: 'images/lesson-1.png'
    },
    {
      title: 'Lesson02',
      componentUrl: resolve(__dirname, './templates/lessons/example-02.jsx'),
      path: 'examples/lessons/02/',
      image: 'images/lesson-2.png'
    },
    {
      title: 'Lesson03',
      componentUrl: resolve(__dirname, './templates/lessons/example-04.jsx'),
      path: 'examples/lessons/03/',
      image: 'images/lesson-3.png'
    },
    {
      title: 'Lesson04',
      componentUrl: resolve(__dirname, './templates/lessons/example-04.jsx'),
      path: 'examples/lessons/04/',
      image: 'images/lesson-4.png'
    },
    {
      title: 'Lesson05',
      componentUrl: resolve(__dirname, './templates/lessons/example-05.jsx'),
      path: 'examples/lessons/05/',
      image: 'images/lesson-5.png'
    },
    {
      title: 'Lesson06',
      componentUrl: resolve(__dirname, './templates/lessons/example-06.jsx'),
      path: 'examples/lessons/06/',
      image: 'images/lesson-6.png'
    },
    {
      title: 'Lesson07',
      componentUrl: resolve(__dirname, './templates/lessons/example-07.jsx'),
      path: 'examples/lessons/07/',
      image: 'images/lesson-7.png'
    },
    {
      title: 'Lesson08',
      componentUrl: resolve(__dirname, './templates/lessons/example-08.jsx'),
      path: 'examples/lessons/08/',
      image: 'images/lesson-8.png'
    },
    {
      title: 'Lesson09',
      componentUrl: resolve(__dirname, './templates/lessons/example-09.jsx'),
      path: 'examples/lessons/09/',
      image: 'images/lesson-9.png'
    },
    {
      title: 'Lesson10',
      componentUrl: resolve(__dirname, './templates/lessons/example-10.jsx'),
      path: 'examples/lessons/10/',
      image: 'images/lesson-10.png'
    },
    {
      title: 'Lesson11',
      componentUrl: resolve(__dirname, './templates/lessons/example-11.jsx'),
      path: 'examples/lessons/11/',
      image: 'images/lesson-11.png'
    },
    {
      title: 'Lesson12',
      componentUrl: resolve(__dirname, './templates/lessons/example-12.jsx'),
      path: 'examples/lessons/12/',
      image: 'images/lesson-12.png'
    },
    {
      title: 'Lesson13',
      componentUrl: resolve(__dirname, './templates/lessons/example-13.jsx'),
      path: 'examples/lessons/13/',
      image: 'images/lesson-13.png'
    },
    {
      title: 'Lesson14',
      componentUrl: resolve(__dirname, './templates/lessons/example-14.jsx'),
      path: 'examples/lessons/14/',
      image: 'images/lesson-14.png'
    },
    {
      title: 'Lesson15',
      componentUrl: resolve(__dirname, './templates/lessons/example-15.jsx'),
      path: 'examples/lessons/15/',
      image: 'images/lesson-15.png'
    },
    {
      title: 'Lesson16',
      componentUrl: resolve(__dirname, './templates/lessons/example-16.jsx'),
      path: 'examples/lessons/16/',
      image: 'images/lesson-16.png'
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
