const {getDocusaurusConfig} = require('@vis.gl/docusaurus-website');

const websiteBaseUrl = process.env.WEBSITE_BASE_URL || '/';

const config = getDocusaurusConfig({
  projectName: 'luma.gl',
  tagline: 'WebGPU and WebGL2 API for visualization and compute',
  siteUrl: 'https://luma.gl',
  baseUrl: websiteBaseUrl,
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
        redirects: [
          {
            from: ['/examples/arrow/arrow-path-model'],
            to: '/examples/arrow/arrow-lines'
          },
          {
            from: ['/docs/api-reference/tables/gpu-table-object-model'],
            to: '/docs/api-reference/tables/gpu-table-lifecycle'
          },
          {
            from: [
              '/docs/api-guide/gpu/arrow-table-columns',
              '/docs/api-reference/arrow/arrow-table-columns',
              '/docs/api-reference/arrow/arrow-type-mapping',
              '/docs/api-reference/tables/gpu-tables'
            ],
            to: '/docs/api-reference/arrow/supported-arrow-types'
          }
        ],
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
  staticDirectories = [],
  ...baseConfig
} = config;

module.exports = {
  ...baseConfig,
  baseUrl: websiteBaseUrl,
  staticDirectories: [...staticDirectories, '.generated/example-assets'],
  plugins: [
    ...basePlugins.map((plugin) => {
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
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'core-api-reference',
        name: '@luma.gl/core generated API',
        entryPoints: ['../modules/core/src/index.ts'],
        tsconfig: '../modules/core/tsconfig.json',
        out: '../docs/api-reference/generated/core',
        docsPath: '../docs',
        readme: 'none',
        excludeInternal: true,
        excludePrivate: true,
        excludeProtected: true,
        gitRevision: 'master',
        sidebar: {
          autoConfiguration: false
        }
      }
    ]
  ],
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
