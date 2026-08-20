const {getDocusaurusConfig} = require('@vis.gl/docusaurus-website');
const {OptionDefaults: typedocOptionDefaults} = require('typedoc');
const path = require('path');

const examplesDirectory = path.resolve(__dirname, '../examples');
const modulesDirectory = path.resolve(__dirname, '../modules');
const websiteExamplesPath = path.resolve(__dirname, 'src/examples.tsx');
const websiteReactLumaDirectory = path.resolve(__dirname, 'src/react-luma');
const websiteBaseUrl = process.env.WEBSITE_BASE_URL || '/';
const websiteBasePathSegments = websiteBaseUrl.split('/').filter(Boolean);
const websiteRoutePrefix =
  websiteBasePathSegments.length === 0 ? '' : `/${websiteBasePathSegments.join('/')}`;

function prefixWebsiteRoute(route) {
  return `${websiteRoutePrefix}${route}`;
}

const config = getDocusaurusConfig({
  projectName: 'luma.gl',
  tagline: 'WebGPU and WebGL2 for visualization and compute',
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
      to: '/showcase',
      label: 'Showcase'
    },
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
            from: ['/examples/showcase/crossfilter-supremacy'],
            to: '/examples/showcase/million-row-crossfilter'
          },
          {
            from: ['/examples/arrow/arrow-path-model'],
            to: '/examples/arrow/arrow-lines'
          },
          {
            from: ['/examples/arrow/arrow-instancing'],
            to: '/examples/showcase/instancing'
          },
          {
            from: ['/examples/experimental/video-texture'],
            to: '/examples/api/video-texture'
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
            return [existingPath.replace('/docs/examples/tutorials/', '/docs/tutorials/')];
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
  presets: basePresets = [],
  plugins: basePlugins = [],
  staticDirectories = [],
  ...baseConfig
} = config;

module.exports = {
  ...baseConfig,
  baseUrl: websiteBaseUrl,
  themeConfig: {
    ...baseConfig.themeConfig,
    footer: baseConfig.themeConfig?.footer
      ? {
          ...baseConfig.themeConfig.footer,
          links: baseConfig.themeConfig.footer.links.map(section => ({
            ...section,
            items: section.items.map(item =>
              item.label === 'deck.gl' ? {...item, href: 'https://deck.gl'} : item
            )
          }))
        }
      : undefined
  },
  staticDirectories: [...staticDirectories, '.generated/example-assets'],
  presets: basePresets.map(preset => {
    if (Array.isArray(preset) && preset[0] === 'classic') {
      return [preset[0], {...preset[1], blog: false}];
    }
    return preset;
  }),
  plugins: [
    ...basePlugins.map(plugin => {
      if (
        Array.isArray(plugin) &&
        plugin[0] === '@docusaurus/plugin-content-docs' &&
        plugin[1]?.id === 'examples'
      ) {
        return [
          plugin[0],
          {
            ...plugin[1],
            docItemComponent: path.resolve(__dirname, 'src/components/example-doc-item.tsx')
          }
        ];
      }
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
      '@signalwire/docusaurus-plugin-llms-txt',
      {
        siteTitle: 'luma.gl',
        siteDescription: 'WebGPU and WebGL2 framework documentation for visualization and compute.',
        // Plugin 1.x builds its route tree from base-prefixed Docusaurus paths.
        // Preserve the configured three levels after the post-build base-path normalization.
        depth: Math.min(5, 3 + websiteBasePathSegments.length),
        enableDescriptions: true,
        includeOrder: [
          '/docs/getting-started',
          '/docs/capabilities',
          '/docs/tutorials/**',
          '/docs/api-guide/**',
          '/docs/api-reference/**',
          '/docs/developer-guide/**'
        ].map(prefixWebsiteRoute),
        onRouteError: 'throw',
        content: {
          enableMarkdownFiles: true,
          enableLlmsFullTxt: false,
          relativePaths: false,
          includeBlog: false,
          includePages: false,
          includeDocs: true,
          includeVersionedDocs: false,
          includeGeneratedIndex: true,
          // Plugin 1.x matches these globs against base-prefixed Docusaurus routes.
          excludeRoutes: ['/docs/legacy/**', '/examples/**'].map(prefixWebsiteRoute)
        }
      }
    ],
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
        blockTags: [...typedocOptionDefaults.blockTags, '@note', '@todo'],
        gitRevision: 'master',
        sidebar: {
          autoConfiguration: false
        }
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'engine-api-reference',
        name: '@luma.gl/engine generated API',
        entryPoints: ['../modules/engine/src/index.ts'],
        tsconfig: '../modules/engine/tsconfig.json',
        out: '../docs/api-reference/generated/engine',
        docsPath: '../docs',
        readme: 'none',
        excludeInternal: true,
        excludePrivate: true,
        excludeProtected: true,
        blockTags: [...typedocOptionDefaults.blockTags, '@note', '@todo'],
        gitRevision: 'master',
        sidebar: {autoConfiguration: false}
      }
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'shadertools-api-reference',
        name: '@luma.gl/shadertools generated API',
        entryPoints: ['../modules/shadertools/src/index.ts'],
        tsconfig: '../modules/shadertools/tsconfig.json',
        out: '../docs/api-reference/generated/shadertools',
        docsPath: '../docs',
        readme: 'none',
        excludeInternal: true,
        excludePrivate: true,
        excludeProtected: true,
        blockTags: [...typedocOptionDefaults.blockTags, '@note', '@todo'],
        gitRevision: 'master',
        sidebar: {autoConfiguration: false}
      }
    ],
    function deckCommunitySourceAliases() {
      return {
        name: 'deck-community-source-aliases',
        configureWebpack(_configuration, isServer) {
          return {
            resolve: {
              alias: {
                '@deck.gl-community/arrow-layers$': path.resolve(
                  __dirname,
                  '../modules/arrow-layers/src/index.ts'
                ),
                '@deck.gl-community/luspatial$': path.resolve(
                  __dirname,
                  '../modules/deck-luspatial/src/index.ts'
                ),
                '@deck.gl-community/luspatial/query$': path.resolve(
                  __dirname,
                  '../modules/deck-luspatial/src/query/index.ts'
                )
              }
            },
            ...(isServer
              ? {}
              : {
                  optimization: {
                    splitChunks: {
                      cacheGroups: {
                        // The default shared chunk requires use by half of all documentation routes.
                        websiteExamples: {
                          name: 'website-examples',
                          chunks: 'async',
                          minChunks: 2,
                          priority: 45,
                          reuseExistingChunk: true,
                          test(module) {
                            const resource = module.resource;
                            return Boolean(
                              resource &&
                                (resource === websiteExamplesPath ||
                                  resource.startsWith(`${examplesDirectory}${path.sep}`) ||
                                  resource.startsWith(`${modulesDirectory}${path.sep}`) ||
                                  resource.startsWith(`${websiteReactLumaDirectory}${path.sep}`))
                            );
                          }
                        }
                      }
                    }
                  }
                }),
            watchOptions: {
              aggregateTimeout: 200,
              poll: 1000
            }
          };
        }
      };
    }
  ],
  future: {
    v4: true,
    faster: true
  },
  markdown: {
    ...(config.markdown || {}),
    hooks: {
      ...(config.markdown?.hooks || {}),
      onBrokenMarkdownLinks: onBrokenMarkdownLinks || 'warn'
    }
  }
};
