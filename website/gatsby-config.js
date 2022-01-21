const {resolve} = require('path');
const DOC_TABLE_OF_CONTENTS = require('../docs/table-of-contents.json');

const ROOT_DIR = resolve('..');

module.exports = {
  plugins: [
    {
      resolve: `gatsby-theme-ocular`,
      options: {
        logLevel: 1, // Adjusts amount of debug information from ocular-gatsby

        // Folders
        DIR_NAME: __dirname,
        ROOT_FOLDER: ROOT_DIR,
        
        DOCS: DOC_TABLE_OF_CONTENTS,
        DOC_FOLDERS: [
          resolve(ROOT_DIR, 'docs'),
          resolve(ROOT_DIR, 'modules')
        ],
        SOURCE: [
          resolve('./static'),
          resolve('./src')
        ],
            

        PROJECT_TYPE: 'github',
      
        PROJECT_NAME: 'luma.gl',
        PROJECT_ORG: 'visgl',
        PROJECT_ORG_LOGO: 'images/visgl-logo.png',
        PROJECT_URL: `https://luma.gl`,
        PROJECT_DESC: 'High-performance GPU Rendering and Compute Toolkit',
        PROJECT_IMAGE: 'images/hero.png',
      
        PATH_PREFIX: '/luma.gl',
      
        LINK_TO_GET_STARTED: '/docs/getting-started',
      
        GA_TRACKING_ID: 'UA-74374017-2',
      
        // For showing star counts and contributors.
        // Should be like btoa('YourUsername:YourKey') and should be readonly.
        GITHUB_KEY: null,
      
        HOME_PATH: '',
      
        PROJECTS: [
          {
            name: 'vis.gl',
            url: 'https://vis.gl'
          },
          {
            name: 'deck.gl',
            url: 'https://deck.gl'
          },
          {
            name: 'math.gl', 
            url: 'https://math.gl'
          },
          {
            name: 'loaders.gl',
            url: 'https://loaders.gl'
          }
        ],
      
        LINK_TO_GET_STARTED: '/docs/getting-started',

        ADDITIONAL_LINKS: [{
          name: 'Blog',
          href: 'http://medium.com/vis-gl',
          index: 4
        }],
      
        THEME_OVERRIDES: require('./templates/theme.json'),
      
        STYLESHEETS: ['/style.css'],
      
        INDEX_PAGE_URL: resolve(__dirname, './templates/index.jsx'),
        PAGES: [
          {
            path: '/',
            componentUrl: resolve(__dirname, './templates/index.jsx'),
            content: ''
          }
        ],

        EXAMPLES: [
          {
            category: 'Showcases',
            title: 'Instancing',
            componentUrl: resolve(__dirname, './templates/showcase/example-instancing.jsx'),
            path: 'examples/showcase/instancing/',
            image: 'images/example-instancing.jpg'
          },
          {
            category: 'Showcases',
            title: 'Persistence',
            componentUrl: resolve(__dirname, './templates/showcase/example-persistence.jsx'),
            path: 'examples/showcase/persistence/',
            image: 'images/example-persistence.jpg'
          },
          {
            category: 'Showcases',
            title: 'GLTF',
            componentUrl: resolve(__dirname, './templates/showcase/example-gltf.jsx'),
            path: 'examples/showcase/gltf/',
            image: 'images/example-gltf.jpg'
          },
          {
            category: 'Showcases',
            title: 'DOF',
            componentUrl: resolve(__dirname, './templates/showcase/example-dof.jsx'),
            path: 'examples/showcase/dof/',
            image: 'images/example-dof.jpg'
          },
          {
            category: 'Showcases',
            title: 'Geospatial',
            componentUrl: resolve(__dirname, './templates/showcase/example-geospatial.jsx'),
            path: 'examples/showcase/geospatial/',
            image: 'images/example-geospatial.jpg'
          },
          {
            category: 'Showcases',
            title: 'Wandering',
            componentUrl: resolve(__dirname, './templates/showcase/example-wandering.jsx'),
            path: 'examples/showcase/wandering/',
            image: 'images/example-wandering.png'
          },
          {
            category: 'Tutorials',
            title: 'Hello Triangle',
            componentUrl: resolve(__dirname, './templates/getting-started/example-hello-triangle.jsx'),
            path: 'examples/getting-started/hello-triangle',
            image: 'images/example-hello-triangle.png'
          },
          {
            category: 'Tutorials',
            title: 'Hello Instancing',
            componentUrl: resolve(
              __dirname,
              './templates/getting-started/example-hello-instancing.jsx'
            ),
            path: 'examples/getting-started/hello-instancing',
            image: 'images/example-hello-instancing.png'
          },
          {
            category: 'Tutorials',
            title: 'Shader Modules',
            componentUrl: resolve(__dirname, './templates/getting-started/example-shader-modules.jsx'),
            path: 'examples/getting-started/shader-modules',
            image: 'images/example-shader-modules.png'
          },
          {
            category: 'Tutorials',
            title: 'Shader Hooks',
            componentUrl: resolve(__dirname, './templates/getting-started/example-shader-hooks.jsx'),
            path: 'examples/getting-started/shader-hooks',
            image: 'images/example-shader-hooks.jpg'
          },
          {
            category: 'Tutorials',
            title: 'Transform Feedback',
            componentUrl: resolve(
              __dirname,
              './templates/getting-started/example-transform-feedback.jsx'
            ),
            path: 'examples/getting-started/transform-feedback',
            image: 'images/example-transform-feedback.jpg'
          },
          {
            category: 'Tutorials',
            title: 'Hello Cube',
            componentUrl: resolve(__dirname, './templates/getting-started/example-hello-cube.jsx'),
            path: 'examples/getting-started/hello-cube/',
            image: 'images/example-hello-cube.jpg'
          },
          {
            category: 'Tutorials',
            title: 'Lighting',
            componentUrl: resolve(__dirname, './templates/getting-started/example-lighting.jsx'),
            path: 'examples/getting-started/lighting/',
            image: 'images/example-lighting.jpg'
          },
          {
            category: 'Tutorials',
            title: 'Instanced Transform',
            componentUrl: resolve(
              __dirname,
              './templates/getting-started/example-instanced-transform.jsx'
            ),
            path: 'examples/getting-started/instanced-transform/',
            image: 'images/example-instanced-transform.jpg'
          },
          {
            category: 'Tutorials',
            title: 'Animation',
            componentUrl: resolve(__dirname, './templates/api/example-animation.jsx'),
            path: 'examples/api/animation/',
            image: 'images/example-animation.png'
          },
          // {
          //   category: 'Tutorials',
          //   title: 'Program Management',
          //   componentUrl: resolve(__dirname, './templates/api/example-program-management.jsx'),
          //   path: 'examples/api/program-management/',
          //   image: 'images/example-program-management.png'
          // },
          {
            category: 'Tutorials',
            title: 'Cubemap',
            componentUrl: resolve(__dirname, './templates/api/example-cubemap.jsx'),
            path: 'examples/api/cubemap/',
            image: 'images/example-cubemap.jpg'
          },
          {
            category: 'Tutorials',
            title: 'Texture3D',
            componentUrl: resolve(__dirname, './templates/api/example-texture-3d.jsx'),
            path: 'examples/api/texture3d/',
            image: 'images/example-texture3d.png'
          },
          // {
          //   category: 'Performance',
          //   title: 'Stress Test',
          //   componentUrl: resolve(__dirname, './templates/performance/example-stress-test.jsx'),
          //   path: 'examples/performance/stress-test/',
          //   image: 'images/example-stress-test.png'
          // },
          {
            category: 'WebGL',
            title: 'Hello Instancing - Raw WebGL',
            componentUrl: resolve(
              __dirname,
              './templates/webgl/example-hello-instancing-webgl.jsx'
            ),
            path: 'examples/webgl/hello-instancing-webgl/',
            image: 'images/example-hello-instancing.png'
          },
          {
            category: 'WebGL',
            title: 'Shader Modules - Raw WebGL',
            componentUrl: resolve(
              __dirname,
              './templates/webgl/example-shader-modules-webgl.jsx'
            ),
            path: 'examples/webgl/shader-modules-webgl/',
            image: 'images/example-shader-hooks.jpg'
          },
          {
            category: 'WebGL',
            title: 'External Context',
            componentUrl: resolve(__dirname, './templates/webgl/example-external-webgl-context.jsx'),
            path: 'examples/webgl/external-webgl-context/',
            image: 'images/example-hello-triangle.png'
          },
          {
            category: 'WebGPU',
            title: 'Hello Triangle - Shader Geometry',
            componentUrl: resolve(__dirname, './templates/webgpu/example-hello-triangle-webgpu.jsx'),
            path: 'examples/webgpu/hello-triangle/',
            image: 'images/example-hello-triangle.png'
          },
          {
            category: 'WebGPU',
            title: 'Rotating Cube - Uniform Buffer',
            componentUrl: resolve(__dirname, './templates/webgpu/example-rotating-cube-webgpu.jsx'),
            path: 'examples/webgpu/rotating-cube/',
            image: 'images/example-hello-triangle.png'
          },
          {
            category: 'WebGPU',
            title: 'Two Rotating Cubes - One Model, two Uniform Buffers',
            componentUrl: resolve(__dirname, './templates/webgpu/example-two-cubes-webgpu.jsx'),
            path: 'examples/webgpu/two-cubes/',
            image: 'images/example-hello-triangle.png'
          },
          {
            category: 'WebGPU',
            title: 'Instanced Cubes',
            componentUrl: resolve(__dirname, './templates/webgpu/example-instanced-cubes-webgpu.jsx'),
            path: 'examples/webgpu/instanced-cubes/',
            image: 'images/example-hello-triangle.png'
          },
          {
            category: 'WebGPU',
            title: 'Textured Cube',
            componentUrl: resolve(__dirname, './templates/webgpu/example-textured-cube-webgpu.jsx'),
            path: 'examples/getting-started/lighting/',
            image: 'images/example-hello-triangle.png'
          }
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-env-variables',
      options: {
        whitelist: ['MapboxAccessToken']
      }
    },
    `gatsby-plugin-no-sourcemaps`
  ]
};
