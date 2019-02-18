const DOCS = require('../docs/table-of-contents.json');
const ALIASES = require('../aliases');

module.exports = {
  logLevel: 3,

  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'luma.gl',
  PROJECT_ORG: 'uber',
  PROJECT_URL: `https://luma.gl`,
  PROJECT_DESC: 'WebGL2 Components',

  PROJECTS: {},

  HOME_HEADING:
    'High-performance WebGL2 components for GPU-powered data visualization and computation.',

  HOME_RIGHT: null,

  HOME_BULLETS: [{
    text: 'Advanced GPU Usage',
    desc: 'Simplifies advanced GPU techniques, e.g. Instanced Rendering and Transform Feedback',
    img: 'icons/icon-react.svg'
  }, {
    text: 'Shader Programming Power',
    desc: 'Modularized shader code, classes for controlling GPU inputs and outputs, and support for debugging and profiling of GLSL shaders.',
    img: 'icons/icon-layers.svg'
  }, {
    text: 'Performance Focus',
    desc: 'Enables visualization and GPU processing of very large data sets.',
    img: 'icons/icon-high-precision.svg'
  }],

  ADDITIONAL_LINKS: [],

  EXAMPLES: [
    {
      title: 'Instancing',
      path: 'examples/core/instancing/',
      image: 'images/example-instancing.jpg'
    },
    {title: 'Cubemap', path: 'examples/core/cubemap/', image: 'images/example-cubemap.jpg'},
    {
      title: 'Mandelbrot',
      path: 'examples/core/mandelbrot/',
      image: 'images/example-mandelbrot.jpg'
    },
    {title: 'Fragment', path: 'examples/core/fragment/', image: 'images/example-fragment.jpg'},
    {title: 'Picking', path: 'examples/core/picking/', image: 'images/example-picking.jpg'},
    {title: 'Shadowmap', path: 'examples/core/shadowmap/', image: 'images/example-shadowmap.jpg'},
    {title: 'Transform', path: 'examples/core/transform/', image: 'images/example-transform.png'},
    {
      title: 'TransformFeedback',
      path: 'examples/core/transform-feedback/app',
      image: 'images/example-transform-feedback.jpg'
    },
    // {"title": "GLTF", "path": "examples/gltf"},


    {"title": "Lesson01", "path": "examples/lessons/01/", image: 'images/lesson-1.png'},
    { "title": "Lesson02", "path": "examples/lessons/02/", image: 'images/lesson-2.png'},
    { "title": "Lesson03", "path": "examples/lessons/03/", image: 'images/lesson-3.png'},
    { "title": "Lesson04", "path": "examples/lessons/04/", image: 'images/lesson-4.png'},
    { "title": "Lesson05", "path": "examples/lessons/05/", image: 'images/lesson-5.png'},
    { "title": "Lesson06", "path": "examples/lessons/06/", image: 'images/lesson-6.png'},
    { "title": "Lesson07", "path": "examples/lessons/07/", image: 'images/lesson-7.png'},
    { "title": "Lesson08", "path": "examples/lessons/08/", image: 'images/lesson-8.png'},
    { "title": "Lesson09", "path": "examples/lessons/09/", image: 'images/lesson-9.png'},
    { "title": "Lesson10", "path": "examples/lessons/10/", image: 'images/lesson-10.png'},
    { "title": "Lesson11", "path": "examples/lessons/11/", image: 'images/lesson-11.png'},
    { "title": "Lesson12", "path": "examples/lessons/12/", image: 'images/lesson-12.png'},
    { "title": "Lesson13", "path": "examples/lessons/13/", image: 'images/lesson-13.png'},
    { "title": "Lesson14", "path": "examples/lessons/14/", image: 'images/lesson-14.png'},
    { "title": "Lesson15", "path": "examples/lessons/15/", image: 'images/lesson-15.png'},
    { "title": "Lesson16", "path": "examples/lessons/16/", image: 'images/lesson-16.png'}
  ],

  DOCS,

  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../`,
  DIR_NAME: __dirname,
  
  // Avoids duplicate conflicting inputs when importing from examples folders
  // Ocular adds this to gatsby's webpack config
  webpack: {
    resolve: {
      alias: Object.assign({}, ALIASES, {
        // Avoid picking up local node_modules in the examples
        'math.gl': `${__dirname}/../node_modules/math.gl`
      })
    }
  },

  // TODO/ib - remnants from gatsby starter, remove and replace with ocular CAPS constants aboves
  siteUrl: "https://luma.gl", // Domain of your website without pathPrefix.
  pathPrefix: "/luma", // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  siteRss: "/rss.xml", // Path to the RSS file.
  dateFromFormat: "YYYY-MM-DD", // Date format used in the frontmatter.
  dateFormat: "DD/MM/YYYY", // Date format for display.
  userName: "WebGL User", // Username to display in the author segment.
  copyright: "Copyright © 2017 Uber. MIT Licensed", // Copyright string for the footer of the website and RSS feed.
  themeColor: "#c62828", // Used for setting manifest and progress theme colors.
  backgroundColor: "#e0e0e0" // Used for setting manifest background color.
};
