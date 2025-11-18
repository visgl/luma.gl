const {getDocusaurusConfig} = require('@vis.gl/docusaurus-website');

const config = getDocusaurusConfig({
  projectName: 'luma.gl',
  tagline: 'WebGPU and WebGL2 API for visualization and compute',
  siteUrl: process.env.STAGING ? 'https://visgl.github.io/luma.gl' : 'https://luma.gl',
  repoUrl: 'https://github.com/visgl/luma.gl',

  docsTableOfContents: require('../docs/table-of-contents.json'),

  examplesDir: './content/examples',
  exampleTableOfContents: require('./content/examples/table-of-contents.json'),

  search: 'local',
  customCss: ['./src/custom.css'],
  navbarItems: [
    {
      to: '/docs/tutorials',
      label: 'Tutorials'
    },
    {
      to: 'https://medium.com/vis-gl',
      label: 'Blog'
    }
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          // docs/examples/tutorials/*/api-reference <= /docs/tutorials
          if (existingPath.includes('/docs/examples/tutorials/')) {
            return [
              existingPath
                .replace('/docs/examples/tutorials/', '/docs/tutorials/')
            ];
          }
    
            // docs/modules/*/api-reference <= modules/*/docs/api-reference
          if (existingPath.includes('/docs/modules/')) {
            return [
              existingPath
                .replace('/docs/modules/', '/modules/')
                // Replaces api-reference if present
                .replace('/api-reference/', '/docs/api-reference/')
            ];
          }
          return undefined; // Return a falsy value: no redirect created
        }
      }
    ]
  ]
});

const {
  onBrokenMarkdownLinks,
  plugins: basePlugins = [],
  ...baseConfig
} = config;

module.exports = {
  ...baseConfig,
  plugins: basePlugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === '@cmfcmf/docusaurus-search-local') {
      return [
        plugin[0],
        {
          ...plugin[1],
          indexDocs: true,
          indexBlog: false,
          indexPages: true
        }
      ];
    }
    return plugin;
  }),
  future: {
    v4: true
  },
  markdown: {
    ...(config.markdown || {}),
    hooks: {
      ...(config.markdown?.hooks || {}),
      onBrokenMarkdownLinks: onBrokenMarkdownLinks || 'warn'
    }
  }
};
