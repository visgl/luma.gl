import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {ExampleCard} from '../components/example-card';
import {FrameworkModuleCards} from '../components/framework-module-cards';
import styles from './index.module.css';

const HomepageGPUScene = React.lazy(() => import('../components/homepage-gpu-scene'));
const HERO_CAPABILITIES = ['WebGPU', 'WebGL2', 'GPU compute', 'HDR rendering'];

const FEATURED_EXAMPLES = [
  {
    title: 'glTF Asset Studio',
    route: 'showcase/gltf',
    image: 'showcase/gltf.jpg',
    description:
      'Explore standards-first glTF assets with physical materials, animated characters, morph targets, native extensions, and portable WebGPU/WebGL rendering.',
    category: 'glTF',
    backends: ['webgpu', 'webgl2'],
    highDynamicRange: true,
    difficulty: 'intermediate',
    maturity: 'stable',
    topics: ['gltf', 'materials', 'animation']
  },
  {
    title: 'Gaussian Splats',
    route: 'showcase/gaussian-splat-viewer',
    image: 'showcase/gaussian-splat-viewer.jpg',
    description:
      'Explore a captured Train scene with streamed HDR Gaussian splats, GPU-native projection, ordering, and interactive rendering.',
    category: 'WebGPU',
    backends: ['webgpu', 'webgl2'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['gaussian-splats', 'streaming', 'compute']
  },
  {
    title: 'Lightstorm Megacity',
    route: 'showcase/lightstorm-megacity',
    image: 'showcase/lightstorm-megacity.jpg',
    description:
      'Fly through a GPU-driven city beneath synchronized lightning, luminous streets, and screen-space reflections.',
    category: 'WebGPU',
    backends: ['webgpu'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['lighting', 'compute']
  },
  {
    title: 'Tempest Ocean',
    route: 'showcase/tempest-ocean',
    image: 'showcase/tempest-ocean.jpg',
    description:
      'Cross a spectral stormfront with GPU-displaced waves, wind-driven whitecaps, and high-dynamic-range moonlight.',
    category: 'WebGPU',
    backends: ['webgpu'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['simulation', 'compute']
  },
  {
    title: 'Cinematic Bloom',
    route: 'experimental/bloom',
    image: 'experimental/bloom.jpg',
    description:
      'Shape HDR highlights with physically based glow, spectral diffraction, chromatic lens ghosts, and temporal stabilization.',
    category: 'Showcase',
    backends: ['webgpu', 'webgl2'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['effects', 'bloom']
  },
  {
    title: 'Volumetric Fire Forge',
    route: 'experimental/volumetric-fire-forge',
    image: 'experimental/volumetric-fire-forge.jpg',
    description:
      'Simulate reactive fire around solid obstacles, then compose emissive flames and drifting smoke into a 3D forge.',
    category: 'WebGPU',
    backends: ['webgpu'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['volumetrics', 'simulation']
  },
  {
    title: 'Prism Cathedral',
    route: 'experimental/spectral-caustics',
    image: 'experimental/spectral-caustics.jpg',
    description:
      'Follow light through a faceted refractor as spectral caustics scatter across an atmospheric stone interior.',
    category: 'WebGPU',
    backends: ['webgpu'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['caustics', 'lighting']
  },
  {
    title: 'Fluid Foundry',
    route: 'experimental/fluid-foundry',
    image: 'experimental/fluid-foundry.jpg',
    description:
      'Shape a GPU-resident liquid-metal simulation inside an industrial vessel with responsive splashes and HDR highlights.',
    category: 'WebGPU',
    backends: ['webgpu'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['simulation', 'compute']
  },
  {
    title: 'Virtual Geometry Canyon',
    route: 'experimental/virtual-geometry-canyon',
    image: 'experimental/virtual-geometry-canyon.jpg',
    description:
      'Travel through a procedural canyon as GPU-selected geometry streams new detail into a massive virtual landscape.',
    category: 'WebGPU',
    backends: ['webgpu'],
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['geometry', 'performance']
  },
  {
    title: 'Illumination Lab',
    route: 'experimental/deferred-rendering',
    image: 'experimental/deferred-rendering.jpg',
    description:
      'Inspect clustered lighting, ambient occlusion, glossy reflections, volumetrics, and adaptive HDR exposure.',
    category: 'WebGPU',
    backends: ['webgpu'],
    highDynamicRange: true,
    difficulty: 'advanced',
    maturity: 'experimental',
    topics: ['lighting', 'effects']
  },
  {
    title: 'Effects: Image Processing',
    route: 'showcase/postprocessing',
    image: 'showcase/postprocessing.jpg',
    description:
      'Build, reorder, and tune a complete image-effect stack against a continuously animated procedural scene.',
    category: 'API',
    backends: ['webgpu', 'webgl2'],
    difficulty: 'intermediate',
    maturity: 'stable',
    topics: ['effects', 'image-processing']
  }
];

const CAPABILITY_STORIES = [
  {
    index: '01',
    title: 'Rendering that scales',
    description:
      'Move from a first triangle to physically based materials, HDR lighting, composable effects, and GPU-driven scenes.',
    technologies: ['Shader modules', 'PBR + HDR', 'Indirect draws']
  },
  {
    index: '02',
    title: 'Compute without detours',
    description:
      'Keep data on the GPU for simulation, filtering, aggregation, spatial queries, and command-graph execution.',
    technologies: ['Compute pipelines', 'GPU tables', 'Zero readback']
  },
  {
    index: '03',
    title: 'Open assets, without compromise',
    description:
      'Load, animate, render, and round-trip standards-first glTF assets with shared physical materials, skeletons, morph targets, and native animation pointers.',
    technologies: ['glTF 2.0 + GLB', 'PBR + animation', 'WebGPU + WebGL2']
  }
];

if (typeof window !== 'undefined') {
  window.website = true;
}

function DeferredHomepageGPUScene() {
  const [isSceneRequested, setIsSceneRequested] = React.useState(false);

  React.useEffect(() => {
    const sceneStartupTimeout = window.setTimeout(() => setIsSceneRequested(true), 120);
    return () => window.clearTimeout(sceneStartupTimeout);
  }, []);

  return (
    <div
      className={styles.heroExampleContainer}
      style={{
        background:
          'radial-gradient(ellipse at 72% 34%, rgba(56, 189, 248, 0.18), transparent 44%), #050b15'
      }}
    >
      {isSceneRequested ? (
        <React.Suspense fallback={null}>
          <HomepageGPUScene />
        </React.Suspense>
      ) : null}
    </div>
  );
}

export default function IndexPage() {
  const {siteConfig} = useDocusaurusContext();
  const baseUrl = useBaseUrl('/');
  const gettingStartedUrl = useBaseUrl('/docs/getting-started');
  const examplesUrl = `${baseUrl}examples`;

  return (
    <Layout
      title="Home"
      description="The open-source WebGPU and WebGL2 toolkit for ambitious rendering, GPU compute, and data visualization."
    >
      <main className={styles.page}>
        <section className={styles.banner} aria-labelledby="homepage-title">
          <DeferredHomepageGPUScene />
          <div className={styles.bannerContainer}>
            <p className={styles.heroEyebrow}>The open-source GPU toolkit</p>
            <h1 className={styles.projectName} id="homepage-title">
              {siteConfig.title}
            </h1>
            <p className={styles.heroTagline}>{siteConfig.tagline}</p>
            <p className={styles.heroDescription}>
              Build living worlds, responsive simulations, and massive data visualizations—at the
              speed of the GPU.
            </p>

            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href={gettingStartedUrl}>
                Get started <span aria-hidden="true">→</span>
              </a>
              <a className={styles.secondaryAction} href={examplesUrl}>
                Explore live examples <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className={styles.heroActionNote}>
              Start with a guided tour. No installation required.
            </p>

            <ul className={styles.heroCapabilities} aria-label="Toolkit capabilities">
              {HERO_CAPABILITIES.map(capability => (
                <li className={styles.heroCapability} key={capability}>
                  {capability}
                </li>
              ))}
            </ul>
          </div>
          <p className={styles.liveSceneLabel}>
            <span className={styles.liveSceneIndicator} aria-hidden="true" />
            Live GPU-rendered scene
          </p>
          <a
            className={styles.discoveryCue}
            href="#flagship-examples"
            aria-label="Explore the live examples and GPU capabilities below"
          >
            <span>Explore what’s below</span>
            <span className={styles.discoveryCueArrow} aria-hidden="true">
              ↓
            </span>
          </a>
        </section>

        <section
          className={styles.flagshipSection}
          id="flagship-examples"
          aria-labelledby="flagship-examples-heading"
        >
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>Build with luma.gl</p>
                <h2 className={styles.sectionTitle} id="flagship-examples-heading">
                  See what your GPU can do.
                </h2>
              </div>
              <p className={styles.sectionDescription}>
                Real-time worlds, physical simulations, and visual effects—live in your browser,
                with nothing to install.
              </p>
            </div>

            <div className={styles.flagshipGrid}>
              {FEATURED_EXAMPLES.map(example => (
                <ExampleCard
                  key={example.route}
                  href={`${examplesUrl}/${example.route}`}
                  imageUrl={`${baseUrl}images/examples/${example.image}`}
                  imagePosition={example.imagePosition}
                  imageScale={example.imageScale}
                  title={example.title}
                  description={example.description}
                  category={example.category}
                  backends={example.backends}
                  highDynamicRange={example.highDynamicRange}
                  difficulty={example.difficulty}
                  maturity={example.maturity}
                  topics={example.topics}
                />
              ))}
            </div>

            <a className={styles.galleryAction} href={examplesUrl}>
              Explore every example <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section
          className={styles.frameworkSection}
          id="framework-modules"
          aria-labelledby="framework-modules-heading"
        >
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>Explore the framework</p>
                <h2 className={styles.sectionTitle} id="framework-modules-heading">
                  The GPU stack, layer by layer.
                </h2>
              </div>
              <p className={styles.sectionDescription}>
                Seven focused modules for GPU portability, rendering, shaders, effects, 3D scenes,
                Gaussian splats, and compute.
              </p>
            </div>

            <FrameworkModuleCards />
          </div>
        </section>

        <section className={styles.capabilitySection} aria-labelledby="capabilities-heading">
          <div className={styles.sectionContainer}>
            <div className={styles.capabilityHeading}>
              <p className={styles.capabilityEyebrow}>Built for the whole pipeline</p>
              <h2 className={styles.capabilityTitle} id="capabilities-heading">
                Low-level control.
                <br />
                High-level ambition.
              </h2>
              <p className={styles.capabilityIntroduction}>
                One toolkit for the shader, the simulation, and everything you build around them.
              </p>
            </div>

            <div className={styles.capabilityGrid}>
              {CAPABILITY_STORIES.map(capability => (
                <article className={styles.capabilityCard} key={capability.index}>
                  <p className={styles.capabilityIndex}>{capability.index}</p>
                  <h3 className={styles.capabilityCardTitle}>{capability.title}</h3>
                  <p className={styles.capabilityCardDescription}>{capability.description}</p>
                  <ul className={styles.technologyList} aria-label="Related technologies">
                    {capability.technologies.map(technology => (
                      <li className={styles.technology} key={technology}>
                        {technology}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className={styles.closingStatement}>
              <p>Found your inspiration? Find the right place to begin.</p>
              <a className={styles.closingAction} href={gettingStartedUrl}>
                Choose your starting point <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
