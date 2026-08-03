import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {ExampleCard} from '../components/example-card';
import {InstancingExample} from '../examples';
import styles from './index.module.css';

const HERO_CAPABILITIES = ['WebGPU', 'WebGL2', 'GPU compute', 'HDR rendering'];

const FEATURED_EXAMPLES = [
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
    title: 'Open by design',
    description:
      'Build with a TypeScript-first API across WebGPU and WebGL2, with natural paths into deck.gl, Arrow, and glTF.',
    technologies: ['WebGPU + WebGL2', 'Apache Arrow', 'deck.gl + glTF']
  }
];

if (typeof window !== 'undefined') {
  window.website = true;
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
          <div className={styles.heroExampleContainer}>
            <InstancingExample panel={false} />
          </div>
          <div className={styles.bannerContainer}>
            <p className={styles.heroEyebrow}>The open-source GPU toolkit</p>
            <h1 className={styles.projectName} id="homepage-title">
              {siteConfig.title}
            </h1>
            <p className={styles.heroTagline}>{siteConfig.tagline}</p>
            <p className={styles.heroDescription}>
              Create ambitious real-time rendering, simulation, and data visualization—directly on
              the GPU.
            </p>

            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href={gettingStartedUrl}>
                Get started <span aria-hidden="true">→</span>
              </a>
              <a className={styles.secondaryAction} href={examplesUrl}>
                Explore examples <span aria-hidden="true">↗</span>
              </a>
            </div>

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
        </section>

        <section className={styles.flagshipSection} aria-labelledby="flagship-examples-heading">
          <div className={styles.sectionContainer}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>Built with luma.gl</p>
                <h2 className={styles.sectionTitle} id="flagship-examples-heading">
                  See what the GPU can do.
                </h2>
              </div>
              <p className={styles.sectionDescription}>
                Real-time worlds, physical simulations, and visual effects—running in your browser.
              </p>
            </div>

            <div className={styles.flagshipGrid}>
              {FEATURED_EXAMPLES.map(example => (
                <ExampleCard
                  key={example.route}
                  href={`${examplesUrl}/${example.route}`}
                  imageUrl={`${baseUrl}images/examples/${example.image}`}
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
              <p>Ready to build something that moves?</p>
              <a className={styles.closingAction} href={gettingStartedUrl}>
                Start building <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
