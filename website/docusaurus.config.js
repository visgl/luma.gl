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
          {from: ["/docs/api-guide/shaders/writing-customizable-shaders"], to: "/docs/api-guide/shaders/shader-injection"},
          {from: ["/docs/tutorials/shader-hooks"], to: "/docs/tutorials/shader-injection"},
          {from: ["/examples/tutorials/shader-hooks"], to: "/examples/tutorials/shader-injection"},
          {
            "from": [
              "/docs/developer-guide/editing"
            ],
            "to": "/docs/developer-guide/installing"
          },
          {
            "from": [
              "/docs/developer-guide/documentation"
            ],
            "to": "/docs/developer-guide/contributing"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu"
            ],
            "to": "/docs/api-reference/graph/gpu-evaluation"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/clean-evaluate"
            ],
            "to": "/docs/api-reference/graph/clean-evaluate"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/custom-operation"
            ],
            "to": "/docs/api-reference/graph/custom-operation"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/gpu-constant"
            ],
            "to": "/docs/api-reference/graph/gpu-constant"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/gpu-data-evaluator"
            ],
            "to": "/docs/api-reference/graph/gpu-data-evaluator"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/gpu-data-view"
            ],
            "to": "/docs/api-reference/graph/gpu-data-view"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/gpu-data"
            ],
            "to": "/docs/api-reference/graph/gpu-data"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/gpu-vector-format"
            ],
            "to": "/docs/api-reference/graph/gpu-vector-format"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/gpu-vector"
            ],
            "to": "/docs/api-reference/graph/gpu-vector"
          },
          {
            "from": [
              "/docs/api-reference/gpgpu/operations"
            ],
            "to": "/docs/api-reference/graph/operations"
          },
          {
            "from": [
              "/docs/api-reference/text"
            ],
            "to": "/docs/api-reference/engine/text"
          },
          {
            "from": [
              "/docs/api-reference/experimental/a-buffer-renderer"
            ],
            "to": "/docs/api-reference/anari/a-buffer-renderer"
          },
          {
            "from": [
              "/docs/api-reference/experimental/clustered-lighting"
            ],
            "to": "/docs/api-reference/anari/clustered-lighting"
          },
          {
            "from": [
              "/docs/api-reference/experimental/deferred-lighting"
            ],
            "to": "/docs/api-reference/anari/deferred-lighting"
          },
          {
            "from": [
              "/docs/api-reference/experimental/deferred-scene-renderer"
            ],
            "to": "/docs/api-reference/anari/deferred-scene-renderer"
          },
          {
            "from": [
              "/docs/api-reference/experimental/g-buffer"
            ],
            "to": "/docs/api-reference/anari/g-buffer"
          },
          {
            "from": [
              "/docs/api-reference/experimental/pbr-environment"
            ],
            "to": "/docs/api-reference/anari/pbr-environment"
          },
          {
            "from": [
              "/docs/api-reference/experimental/scene-renderer"
            ],
            "to": "/docs/api-reference/anari/scene-renderer"
          },
          {
            "from": [
              "/docs/api-reference/experimental/shadow-map-renderer"
            ],
            "to": "/docs/api-reference/anari/shadow-map-renderer"
          },
          {
            "from": [
              "/docs/api-reference/experimental/spectral-caustics-renderer"
            ],
            "to": "/docs/api-reference/anari/spectral-caustics-renderer"
          },
          {
            "from": [
              "/docs/api-reference/experimental/wboit-renderer"
            ],
            "to": "/docs/api-reference/anari/wboit-renderer"
          },
          {
            "from": [
              "/docs/api-reference/experimental/comparison-splitter"
            ],
            "to": "/docs/api-reference/engine/experimental/comparison-splitter"
          },
          {
            "from": [
              "/docs/api-reference/experimental/glass-material"
            ],
            "to": "/docs/api-reference/engine/experimental/glass-material"
          },
          {
            "from": [
              "/docs/api-reference/experimental/reflective-material"
            ],
            "to": "/docs/api-reference/engine/experimental/reflective-material"
          },
          {
            "from": [
              "/docs/api-reference/experimental/webxr"
            ],
            "to": "/docs/api-reference/engine/experimental/webxr"
          },
          {
            "from": [
              "/docs/api-reference/experimental/webxr/webxr-camera-texture"
            ],
            "to": "/docs/api-reference/engine/experimental/webxr/webxr-camera-texture"
          },
          {
            "from": [
              "/docs/api-reference/experimental/webxr/webxr-manager"
            ],
            "to": "/docs/api-reference/engine/experimental/webxr/webxr-manager"
          },
          {
            "from": [
              "/examples/showcase/crossfilter-supremacy"
            ],
            "to": "/examples/showcase/million-row-crossfilter"
          },
          {
            "from": [
              "/examples/arrow/arrow-path-model"
            ],
            "to": "/examples/arrow/arrow-lines"
          },
          {
            "from": [
              "/examples/arrow/arrow-instancing"
            ],
            "to": "/examples/showcase/instancing"
          },
          {
            "from": [
              "/examples/experimental/video-texture"
            ],
            "to": "/examples/api/video-texture"
          }
        ],
        createRedirects(existingPath) {
          const legacyShaderRoutes = new Set(["/docs/api-reference/shadertools","/docs/api-reference/shadertools/shader-assembler","/docs/api-reference/shadertools/shader-conventions","/docs/api-reference/shadertools/shader-info","/docs/api-reference/shadertools/shader-module","/docs/api-reference/shadertools/shader-modules/dggs","/docs/api-reference/shadertools/shader-modules/dirlight","/docs/api-reference/shadertools/shader-modules/float-colors","/docs/api-reference/shadertools/shader-modules/fp32","/docs/api-reference/shadertools/shader-modules/fp64-arithmetic","/docs/api-reference/shadertools/shader-modules/fp64","/docs/api-reference/shadertools/shader-modules/gouraud-material","/docs/api-reference/shadertools/shader-modules/gpu-picking","/docs/api-reference/shadertools/shader-modules/lambert-material","/docs/api-reference/shadertools/shader-modules/lighting","/docs/api-reference/shadertools/shader-modules/pbr-material","/docs/api-reference/shadertools/shader-modules/phong-material","/docs/api-reference/shadertools/shader-modules/picking","/docs/api-reference/shadertools/shader-modules/project","/docs/api-reference/shadertools/shader-modules/random","/docs/api-reference/shadertools/shader-modules/skin","/docs/api-reference/shadertools/shader-pass","/docs/api-reference/shadertools/shader-passes/bloom","/docs/api-reference/shadertools/shader-passes/brightness-contrast","/docs/api-reference/shadertools/shader-passes/bulge-pinch","/docs/api-reference/shadertools/shader-passes/camera-reprojection-antialiasing","/docs/api-reference/shadertools/shader-passes/clustered-volumetric-lighting","/docs/api-reference/shadertools/shader-passes/color-halftone","/docs/api-reference/shadertools/shader-passes/denoise","/docs/api-reference/shadertools/shader-passes/depth-aware-blur","/docs/api-reference/shadertools/shader-passes/depth-of-field","/docs/api-reference/shadertools/shader-passes/dot-screen","/docs/api-reference/shadertools/shader-passes/edge-work","/docs/api-reference/shadertools/shader-passes/fxaa","/docs/api-reference/shadertools/shader-passes/gaussian-blur","/docs/api-reference/shadertools/shader-passes/gtao","/docs/api-reference/shadertools/shader-passes/hdr-auto-exposure","/docs/api-reference/shadertools/shader-passes/hexagonal-pixelate","/docs/api-reference/shadertools/shader-passes/hue-saturation","/docs/api-reference/shadertools/shader-passes/image-processing","/docs/api-reference/shadertools/shader-passes/ink","/docs/api-reference/shadertools/shader-passes/magnify","/docs/api-reference/shadertools/shader-passes/motion-blur","/docs/api-reference/shadertools/shader-passes/noise","/docs/api-reference/shadertools/shader-passes/outlines","/docs/api-reference/shadertools/shader-passes/persistence","/docs/api-reference/shadertools/shader-passes/screen-space-global-illumination","/docs/api-reference/shadertools/shader-passes/screen-space-reflections","/docs/api-reference/shadertools/shader-passes/sepia","/docs/api-reference/shadertools/shader-passes/ssao","/docs/api-reference/shadertools/shader-passes/swirl","/docs/api-reference/shadertools/shader-passes/temporal-antialiasing","/docs/api-reference/shadertools/shader-passes/tilt-shift","/docs/api-reference/shadertools/shader-passes/tone-mapping","/docs/api-reference/shadertools/shader-passes/triangle-blur","/docs/api-reference/shadertools/shader-passes/vibrance","/docs/api-reference/shadertools/shader-passes/vignette","/docs/api-reference/shadertools/shader-passes/volumetric-fog","/docs/api-reference/shadertools/shader-passes/zoom-blur","/docs/api-reference/shadertools/shader-plugin","/docs/api-reference/shadertools/wgsl-support"]);
          const oldShaderPath = existingPath.replace('/docs/api-reference/shaders', '/docs/api-reference/shadertools');
          if (existingPath.startsWith('/docs/api-reference/shaders') && legacyShaderRoutes.has(oldShaderPath)) {
            return [oldShaderPath];
          }
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
    colorMode: {defaultMode: 'dark', disableSwitch: false, respectPrefersColorScheme: false},
    navbar: {
      ...baseConfig.themeConfig.navbar,
      items: baseConfig.themeConfig.navbar.items.flatMap(item =>
        item.href === 'https://github.com/visgl/luma.gl'
          ? [
              {
                type: 'html',
                position: 'right',
                className: 'navbar-badge',
                value: '<a class="navbar-project-badge" href="https://www.npmjs.com/package/@luma.gl/core" target="_blank" rel="noopener noreferrer" aria-label="@luma.gl/core on npm"><img src="https://img.shields.io/npm/dm/@luma.gl/core?label=downloads" alt="Monthly npm downloads for @luma.gl/core" height="20" /><svg class="navbar-project-icon" viewBox="0 0 18 7" width="24" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 0v6h5v1h4V6h9V0H0zm5 5H4V1h1v4zm4 0H7V1h3v4H9zm8 0h-1V1h1v4zM8 2v2h1V2H8z" /></svg><span>npm</span></a>'
              },
              {
                type: 'html',
                position: 'right',
                className: 'navbar-badge',
                value: '<a class="navbar-project-badge" href="https://github.com/visgl/luma.gl" target="_blank" rel="noopener noreferrer" aria-label="luma.gl on GitHub"><img src="https://img.shields.io/github/stars/visgl/luma.gl.svg?style=flat-square&amp;label=%E2%98%85&amp;logo=github&amp;logoColor=white&amp;color=24292f&amp;labelColor=24292f" alt="GitHub stars" height="20" /><svg class="navbar-project-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.334-5.467-5.931 0-1.31.467-2.381 1.236-3.221-.124-.303-.536-1.524.118-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.042.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.656 1.652.244 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.628-5.479 5.925.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg><span>GitHub</span></a>'
              }
            ]
          : item.type === 'html' && item.value?.includes('openvisualization.org')
            ? [{...item, value: item.value.replace('https://openvisualization.org', 'https://openvisualization.com')}]
            : [item]
      )
    },
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
            '<div class="footer__legal-notice">Copyright <a href="https://openjsf.org">OpenJS Foundation</a> and luma.gl contributors. All rights reserved. The <a href="https://openjsf.org">OpenJS Foundation</a> has registered trademarks and uses trademarks. For a list of trademarks of the <a href="https://openjsf.org">OpenJS Foundation</a>, please see our <a href="https://trademark-policy.openjsf.org/">Trademark Policy</a> and <a href="https://trademark-list.openjsf.org/">Trademark List</a>. Trademarks and logos not indicated on the <a href="https://trademark-list.openjsf.org">list of OpenJS Foundation trademarks</a> are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.</div><div class="footer__legal-links"><a href="' + websiteBaseUrl + 'docs/references-and-credits">References and credits</a> | <a href="https://openjsf.org/">The OpenJS Foundation</a> | <a href="https://ai-coding-assistants-policy.openjsf.org/">AI Coding Assistants Policy</a> | <a href="https://bylaws.openjsf.org/">Bylaws</a> | <a href="https://code-of-conduct.openjsf.org">Code of Conduct</a> | <a href="https://www.linuxfoundation.org/cookies/">Cookie Policy</a> | <a href="https://privacy-policy.openjsf.org/">Privacy Policy</a> | <a href="https://terms-of-use.openjsf.org/">Terms of Use</a> | <a href="https://trademark-list.openjsf.org/">Trademark List</a> | <a href="https://trademark-policy.openjsf.org/">Trademark Policy</a></div>'
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
        id: 'shaders-api-reference',
        name: '@luma.gl/shaders generated API',
        entryPoints: ['../modules/shaders/src/index.ts'],
        tsconfig: '../modules/shaders/tsconfig.json',
        out: '../docs/api-reference/generated/shaders',
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
            '@luma.gl/graph/gpu-simple-graph/cpu': path.resolve(__dirname, '../modules/graph/src/gpu-simple-graph/operations/cpu'),
            '@luma.gl/graph/gpu-simple-graph/webgl': path.resolve(__dirname, '../modules/graph/src/gpu-simple-graph/operations/webgl'),
            '@luma.gl/graph/gpu-simple-graph/webgpu': path.resolve(__dirname, '../modules/graph/src/gpu-simple-graph/operations/webgpu'),
            '@luma.gl/graph/_internal/arrow': path.resolve(__dirname, '../modules/graph/src/arrow/internal.ts'),
            '@luma.gl/graph/arrow': path.resolve(__dirname, '../modules/graph/src/arrow'),
            '@luma.gl/engine/arrow': path.resolve(__dirname, '../modules/engine/src/arrow'),
            '@luma.gl/core/test-utils': path.resolve(__dirname, '../modules/core/src/test-utils'),
            '@luma.gl/graph/_internal': path.resolve(__dirname, '../modules/graph/src/execution'),
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
