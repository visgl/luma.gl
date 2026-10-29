// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './module-cards.module.css';

type DocumentationModule = {
  name: string;
  description: string;
  image: string;
  reference?: string;
  status?: string;
};

type DocumentationModuleGroup = 'primary' | 'smaller' | 'exploratory';

const DOCUMENTATION_MODULES: Record<DocumentationModuleGroup, readonly DocumentationModule[]> = {
  primary: [
    {
      name: 'core',
      description: 'Portable GPU resources, shader types, and WebGPU and WebGL2 backends.',
      image: 'tutorials/hello-cube'
    },
    {
      name: 'graph',
      description: 'Schedule GPU work and compose graph-based processing pipelines.',
      image: 'experimental/gpu-parquet-constellation'
    },
    {
      name: 'engine',
      description: 'Models, geometry, animation, picking, and rendering helpers.',
      image: 'showcase/instancing'
    },
    {
      name: 'shaders',
      description: 'Compose WGSL and GLSL with reusable shader modules and hooks.',
      image: 'tutorials/shader-modules'
    }
  ],
  smaller: [
    {
      name: 'engine/text',
      description: 'Render GPU text with font atlases and reusable layout helpers.',
      image: 'experimental/text-space-crawl',
      status: 'Experimental'
    },
    {
      name: 'gpgpu',
      description: 'GPU data primitives and immediate compute operations without CPU readback.',
      image: 'experimental/gpu-data-analysis'
    },
    {
      name: 'engine/effects',
      reference: 'effects',
      description: 'Build post-processing pipelines with composable image and lighting effects.',
      image: 'showcase/postprocessing'
    },
    {
      name: 'gltf',
      description: 'Load glTF assets, materials, lights, skins, and animations.',
      image: 'gltf/asset-studio'
    },
    {
      name: 'gpgpu/arrow',
      reference: 'arrow',
      description: 'Convert Arrow vectors, tables and rendering data through optional /arrow subpaths.',
      image: 'arrow/arrow-points',
      status: 'Experimental'
    },
    {
      name: 'engine/splats',
      reference: 'splats',
      description: 'Stream, sort, and render Gaussian splat scenes.',
      image: 'showcase/gaussian-splats',
      status: 'Experimental'
    },
    {
      name: 'core/test-utils',
      reference: 'test-utils',
      description: 'Create test devices and inspect resource ownership with the null backend.',
      image: 'tutorials/hello-triangle'
    }
  ],
  exploratory: [
    {
      name: 'anari',
      description: 'Describe 3D scenes and switch renderers through an ANARI-inspired scene API.',
      image: 'deck/city-scene',
      reference: 'scene',
      status: 'Exploratory'
    },
    {
      name: 'slang',
      description: 'Compile Slang shaders with reflection and typed shader contracts.',
      image: 'tutorials/slang-shaders',
      status: 'Exploratory'
    },
    {
      name: 'three',
      description: 'Combine luma.gl GPU workflows with Three.js scenes and renderers.',
      image: 'experimental/three',
      status: 'Exploratory'
    }
  ]
};

/** Links one package group to its API overviews. */
export function DocumentationModuleCards({
  group
}: {
  group: DocumentationModuleGroup;
}): React.JSX.Element {
  const imageDirectory = useBaseUrl('/images/examples/');

  return (
    <ul className={styles.grid} aria-label={`${group} packages`}>
      {DOCUMENTATION_MODULES[group].map(documentationModule => (
        <li className={styles.item} key={documentationModule.name}>
          <Link
            className={styles.card}
            to={`/docs/api-reference/${documentationModule.reference ?? documentationModule.name}`}
          >
            <img
              className={styles.image}
              src={`${imageDirectory}${documentationModule.image}.jpg`}
              alt=""
              loading="lazy"
              width="480"
              height="240"
            />
            <div className={styles.content}>
              <h3 className={styles.name}>@luma.gl/{documentationModule.name}</h3>
              {documentationModule.status ? (
                <span className={styles.status}>{documentationModule.status}</span>
              ) : null}
              <p className={styles.description}>{documentationModule.description}</p>
              <span className={styles.reference}>
                API reference <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
