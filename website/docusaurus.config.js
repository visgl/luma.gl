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
  // TODO: Remove after @vis.gl/docusaurus-website handles an omitted webpack resolve config.
  webpackConfig: {resolve: {}},
  customCss: ['./src/custom.css'],
  // The shared website package deep-merges this field and currently requires an object.
  webpackConfig: {resolve: {}},
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
          {from: ['/docs/api-reference/text'], to: '/docs/api-reference/engine/text'},
          {"from":["/docs/api-reference/experimental/a-buffer-renderer"],"to":"/docs/api-reference/scene/a-buffer-renderer"},
          {"from":["/docs/api-reference/experimental/clustered-lighting"],"to":"/docs/api-reference/scene/clustered-lighting"},
          {"from":["/docs/api-reference/experimental/deferred-lighting"],"to":"/docs/api-reference/scene/deferred-lighting"},
          {"from":["/docs/api-reference/experimental/deferred-scene-renderer"],"to":"/docs/api-reference/scene/deferred-scene-renderer"},
          {"from":["/docs/api-reference/experimental/depth-texture-copy"],"to":"/docs/api-reference/scene/depth-texture-copy"},
          {"from":["/docs/api-reference/experimental/g-buffer"],"to":"/docs/api-reference/scene/g-buffer"},
          {"from":["/docs/api-reference/experimental/pbr-environment"],"to":"/docs/api-reference/scene/pbr-environment"},
          {"from":["/docs/api-reference/experimental/ray-tracing-quality-presets"],"to":"/docs/api-reference/scene/ray-tracing-quality-presets"},
          {"from":["/docs/api-reference/experimental/scene-renderer"],"to":"/docs/api-reference/scene/scene-renderer"},
          {"from":["/docs/api-reference/experimental/selection-outline"],"to":"/docs/api-reference/scene/selection-outline"},
          {"from":["/docs/api-reference/experimental/shadow-map-renderer"],"to":"/docs/api-reference/scene/shadow-map-renderer"},
          {"from":["/docs/api-reference/experimental/spectral-caustics-renderer"],"to":"/docs/api-reference/scene/spectral-caustics-renderer"},
          {"from":["/docs/api-reference/experimental/wboit-renderer"],"to":"/docs/api-reference/scene/wboit-renderer"},
          {"from":["/docs/api-reference/experimental/comparison-splitter"],"to":"/docs/api-reference/engine/experimental/comparison-splitter"},
          {"from":["/docs/api-reference/experimental/glass-material"],"to":"/docs/api-reference/engine/experimental/glass-material"},
          {"from":["/docs/api-reference/experimental/reflective-material"],"to":"/docs/api-reference/engine/experimental/reflective-material"},
          {"from":["/docs/api-reference/experimental/webxr"],"to":"/docs/api-reference/engine/experimental/webxr"},
          {"from":["/docs/api-reference/experimental/webxr/webxr-camera-texture"],"to":"/docs/api-reference/engine/experimental/webxr/webxr-camera-texture"},
          {"from":["/docs/api-reference/experimental/webxr/webxr-manager"],"to":"/docs/api-reference/engine/experimental/webxr/webxr-manager"},
          {
            from: ['/docs/api-reference/gpu-graph'],
            to: '/docs/api-reference/graph'
          },
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
            from: [
              '/docs/api-reference/tables/gpu-table-object-model',
              '/docs/api-reference/experimental/gpu-tables/gpu-table-object-model'
            ],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-table-lifecycle'
          },
          {
            from: ['/docs/api-reference/tables'],
            to: '/docs/api-reference/experimental/gpu-tables'
          },
          {
            from: ['/docs/api-reference/tables/gpu-constant'],
            to: '/docs/api-reference/gpgpu/gpu-constant'
          },
          {
            from: ['/docs/api-reference/tables/gpu-data'],
            to: '/docs/api-reference/gpgpu/gpu-data'
          },
          {
            from: ['/docs/api-reference/tables/gpu-data-view'],
            to: '/docs/api-reference/gpgpu/gpu-data-view'
          },
          {
            from: ['/docs/api-reference/tables/gpu-vector'],
            to: '/docs/api-reference/gpgpu/gpu-vector'
          },
          {
            from: ['/docs/api-reference/tables/gpu-vector-format'],
            to: '/docs/api-reference/gpgpu/gpu-vector-format'
          },
          {
            from: ['/docs/api-reference/tables/gpu-table'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-table'
          },
          {
            from: ['/docs/api-reference/tables/gpu-record-batch'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-record-batch'
          },
          {
            from: ['/docs/api-reference/tables/gpu-schema'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-schema'
          },
          {
            from: ['/docs/api-reference/tables/gpu-input-schema'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-input-schema'
          },
          {
            from: ['/docs/api-reference/tables/gpu-table-structure'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-table-structure'
          },
          {
            from: ['/docs/api-reference/tables/gpu-table-lifecycle'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-table-lifecycle'
          },
          {
            from: ['/docs/api-reference/tables/gpu-table-shader-bindings'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-table-shader-bindings'
          },
          {
            from: ['/docs/api-reference/tables/gpu-table-buffer-planner'],
            to: '/docs/api-reference/experimental/gpu-tables/gpu-table-buffer-planner'
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
          })),
          copyright:
            '<div class="footer__legal-notice">Copyright <a href="https://openjsf.org">OpenJS Foundation</a> and luma.gl contributors. All rights reserved. The <a href="https://openjsf.org">OpenJS Foundation</a> has registered trademarks and uses trademarks. For a list of trademarks of the <a href="https://openjsf.org">OpenJS Foundation</a>, please see our <a href="https://trademark-policy.openjsf.org/">Trademark Policy</a> and <a href="https://trademark-list.openjsf.org/">Trademark List</a>. Trademarks and logos not indicated on the <a href="https://trademark-list.openjsf.org">list of OpenJS Foundation trademarks</a> are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.</div><div class="footer__legal-links"><a href="https://openjsf.org/">The OpenJS Foundation</a> | <a href="https://ai-coding-assistants-policy.openjsf.org/">AI Coding Assistants Policy</a> | <a href="https://bylaws.openjsf.org/">Bylaws</a> | <a href="https://code-of-conduct.openjsf.org">Code of Conduct</a> | <a href="https://www.linuxfoundation.org/cookies/">Cookie Policy</a> | <a href="https://privacy-policy.openjsf.org/">Privacy Policy</a> | <a href="https://terms-of-use.openjsf.org/">Terms of Use</a> | <a href="https://trademark-list.openjsf.org/">Trademark List</a> | <a href="https://trademark-policy.openjsf.org/">Trademark Policy</a></div>'
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
    function exampleNavigationLifecycle() {
      return {
        name: 'example-navigation-lifecycle',
        getClientModules() {
          return [path.resolve(__dirname, 'src/client-modules/example-navigation.ts')];
        }
      };
    },
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
    function slangShaderSources() {
      return {
        name: 'slang-shader-sources',
        configureWebpack() {
          return {module: {rules: [{test: /\.slang$/, type: 'asset/source'}]}};
        }
      };
    },
    function deckCommunitySourceAliases() {
      return {
        name: 'deck-community-source-aliases',
        configureWebpack(_configuration, isServer) {
          // Subpath aliases must precede the package aliases generated by ocular.
          _configuration.resolve.alias = {
            '@luma.gl/core/test-utils': path.resolve(__dirname, '../modules/core/src/test-utils'),
            '@luma.gl/gpgpu/_internal': path.resolve(__dirname, '../modules/gpgpu/src/execution'),
            '@luma.gl/engine/effects': path.resolve(__dirname, '../modules/engine/src/effects'),
            '@luma.gl/engine/text-fonts': path.resolve(__dirname, '../modules/engine/src/text/fonts'),
            '@luma.gl/engine/text-3d': path.resolve(__dirname, '../modules/engine/src/text/text-3d'),
            '@luma.gl/engine/text-experimental': path.resolve(__dirname, '../modules/engine/src/text/experimental.ts'),
            '@luma.gl/engine/text': path.resolve(__dirname, '../modules/engine/src/text'),
            '@luma.gl/engine/gltf-physics': path.resolve(__dirname, '../modules/engine/src/gltf/physics'),
            '@luma.gl/engine/gltf': path.resolve(__dirname, '../modules/engine/src/gltf'),
            '@luma.gl/engine/splats': path.resolve(__dirname, '../modules/engine/src/splats'),
            '@luma.gl/engine/models': path.resolve(__dirname, '../modules/engine/src/graph/models'),
            '@luma.gl/engine/physics': path.resolve(__dirname, '../modules/engine/src/graph/physics'),
            '@luma.gl/engine/tables': path.resolve(__dirname, '../modules/engine/src/graph/tables'),
            ..._configuration.resolve.alias
          };
          return {
            mergeStrategy: {'resolve.modules': 'replace'},
            resolve: {
              // Resolve dependency-local versions before the shared website's root fallbacks.
              modules: [
                'node_modules',
                path.resolve(__dirname, 'node_modules'),
                path.resolve(__dirname, '../node_modules')
              ],
              alias: {
                'apache-arrow/type$': path.resolve(
                  __dirname,
                  '../examples/experimental/gpu-parquet-constellation/apache-arrow-type-compat.js'
                ),
                '@deck.gl-community/arrow-layers$': path.resolve(
                  __dirname,
                  '../modules/deck-arrow-layers/src/index.ts'
                ),
                '@deck.gl-community/gpu-layers$': path.resolve(
                  __dirname,
                  '../modules/deck-gpu-layers/src/index.ts'
                ),
                '@deck.gl-community/gpu-layers/query$': path.resolve(
                  __dirname,
                  '../modules/deck-gpu-layers/src/query/index.ts'
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
