// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SettingsSchema} from '@deck.gl-community/panels';
import {
  NETWORK_SWITCH_PLANE_COUNT,
  SPINE_POSITIONS,
  type NetworkFabricTelemetry,
  type NetworkPlaneTelemetry,
  type PickableNetworkNode
} from './network';
import {
  getNetworkStoryProgress,
  makeNetworkOpticsProfile,
  MAX_NETWORK_HDR_HIGHLIGHT_BOOST,
  MAX_NETWORK_OPTICS_LEVEL,
  NETWORK_STORY_CHAPTERS,
  type NetworkDynamicRangeProfile,
  type NetworkStoryBeat,
  type NetworkStoryChapter
} from './story';

const PACKET_SPRAYING_ARTICLE_URL = 'https://openai.com/index/mrc-supercomputer-networking/';
const PACKET_SPRAYING_VIDEO_URL = `${PACKET_SPRAYING_ARTICLE_URL}#mrcs-shift-spraying-packets-across-hundreds-of-paths`;
const PACKET_SPRAYING_PAPER_URL =
  'https://cdn.openai.com/pdf/resilient-ai-supercomputer-networking-using-mrc-and-srv6.pdf';

export const PACKET_SPRAYING_OVERVIEW_HTML = `\
<p><strong>Network Packet Spraying</strong></p>
<p><strong>Two conversations, many routes.</strong> The two servers on the right send independent red and green transfers to two destination servers on the left.</p>
<p>The guided network tour steps through packet spraying, congestion, switch failure, retransmission, and probe-confirmed recovery. While the camera autorotates, scenarios advance every 20 seconds; select any chapter directly or start the authored cinematic tour. The MRC button explains the protocol and links to OpenAI's original packet-spraying animation.</p>
<p>The visual-style slider moves smoothly from a packet-first diagram through clear and cinematic glass to spectral lighting, focused caustics, and full optical fireworks. Individual material controls remain available in Settings.</p>
<p>The visualization has two physical switch planes, each containing four Tier 0 access switches and four Tier 1 aggregation switches. Four larger spine switches connect those planes and provide four independent backbone paths for alternating red and green packets.</p>
<p>The live fabric monitor shows red and green allocation across both physical planes and each of the four backbone paths. Hover or focus a plane to illuminate all eight switches across its two tiers, or inspect an individual path to trace both complete server-to-server routes through its five switches and eight links. Under pressure, adaptive routing moves most packets away from a congested path without retiring it; an offline or recovering path carries none until its control handshake succeeds.</p>
<p>Click any glass switch to move it from healthy to orange and congested, then red and failed. Clicking a failed switch repairs it, but its path stays offline while a blue recovery probe travels to the switch and a cyan acknowledgment returns to its source.</p>
<p>An orange switch gathers a short alternating red/green packet queue and trims overloaded payloads while their smaller headers continue. A red switch visibly scatters in-flight packets before MRC retires the failed path, retransmits over healthy routes, and sends occasional recovery probes.</p>
<p>Muted red and green cubes identify each conversation's source and destination; blue cubes are inactive servers. Each active server emits a restrained colored pulse when it launches or receives a packet. Glass spheres are switches, and fabric links softly brighten with red or green light only while packets are traveling through them. Directional light wakes remain inside each link, congested switches breathe amber, and failures or confirmed recoveries send restrained red or cyan waves through nearby glass. Emissive packets leave short trails, reflect inside nearby glass, and project focused colored caustics onto adjacent reflective surfaces.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer">Read OpenAI's supercomputer networking and MRC article</a></p>`;

export const PACKET_SPRAYING_OPTICS_HTML = `\
<p>Every switch is a physically motivated, GPU-rendered glass volume. Hardware WebGPU and WebGL construct the image live using portable raster techniques, without per-pixel ray tracing.</p>
<p>The 0-11 visual-style slider introduces these layers progressively: diagram, clear glass, cinematic lighting, and the complete optical treatment.</p>
<h3>Physically based glass surfaces</h3>
<p>The glass index of refraction determines dielectric Fresnel reflection and the energy left for transmission. GGX microfacets, geometric specular antialiasing, view-dependent studio reflections, and an energy-conserving clearcoat reproduce polished outer surfaces without washing out the network.</p>
<h3>Transmission, thickness, and dispersion</h3>
<p>A dedicated backface pass measures optical thickness. Refraction bends light at both glass interfaces; glTF-aligned, Abbe-number dispersion gives red and blue wavelengths different refractive indices. Spectral Beer-Lambert absorption tints longer paths, while roughness-aware transmission and opaque-depth contacts preserve believable volume.</p>
<h3>Reflections and interference</h3>
<p>Prefiltered environment maps follow the reflected view direction, screen-space scene reflections pick up nearby geometry, and secondary internal bounces keep curved silhouettes luminous. Restrained thin-film interference adds angle-dependent spectral accents without replacing the underlying dielectric response.</p>
<h3>Packets as moving light sources</h3>
<p>Emissive red and green packets produce bounded local lighting, surface reflections, colored in-volume scattering, short directional trails, and arrival flashes. Reflective link tubes brighten only when active, and rasterized caustics project concentrated packet light onto nearby metallic hardware.</p>
<h3>Order-independent transparency</h3>
<p>Supported WebGPU devices use exact per-pixel A-buffer compositing. WebGL uses weighted-blended order-independent transparency, with depth-sorted alpha as a portable fallback. Shared WGSL and GLSL material modules preserve the same optical model across both backends.</p>
<h3>HDR, selective bloom, and display</h3>
<p>Floating-point scene color retains bright packet cores and glass highlights above standard display range. Selective multiscale bloom and filmic tone mapping preserve saturated red and green; compatible WebGPU displays can present extended-range highlights while ordinary WebGL and SDR displays remain controlled.</p>
<p><strong>Composable by design:</strong> the glass, transmission, point-light, caustic, transparency, bloom, and tone-mapping modules can also compose with canonical physically based materials.</p>`;

export const PACKET_SPRAYING_BACKGROUND_HTML = `\
<p><strong>Multipath Reliable Connection (MRC)</strong> is the supercomputer networking protocol developed by OpenAI with industry partners to keep large AI training jobs moving through congestion, component failures, and maintenance.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer"><strong>Read OpenAI's MRC release post</strong></a><br><a href="${PACKET_SPRAYING_VIDEO_URL}" target="_blank" rel="noopener noreferrer">See the packet-spraying animation that inspired this demo</a></p>
<h3>Two conversations, many routes</h3>
<p>Two servers on the right send separate red and green transfers to two servers on the left. At their shared access switch, packets interleave one red and one green; the destination-side switches separate them again for delivery.</p>
<h3>Physical planes and packet spraying</h3>
<p>A high-bandwidth network interface can split across independent physical planes. OpenAI's article describes one 800 Gb/s interface becoming eight 100 Gb/s links; this compact model shows two complete two-tier switch planes and four representative backbone paths. Each transfer sprays successive packets across its available routes instead of waiting behind one busy link.</p>
<h3>Congestion and packet trimming</h3>
<p>When a switch becomes congested, MRC moves most traffic toward healthier routes. If the switch cannot forward a complete packet, it trims the payload but forwards its header, allowing the destination to request retransmission without falsely treating temporary congestion as a permanent failure.</p>
<h3>Failure, recovery, and resilience</h3>
<p>A failed path briefly loses only the packets already committed to it. The sender retires that path, retransmits through surviving routes, and sends occasional recovery probes. Repaired switches remain offline until a blue probe reaches the switch and a cyan acknowledgment confirms the return path; only then does ordinary red and green traffic resume.</p>
<h3>Why training throughput improves</h3>
<p>Spreading each transfer across multiple routes reduces persistent hot spots and worst-case latency. Synchronous training progresses when every GPU receives its data, so avoiding a single slow transfer can protect the throughput of the entire job. Losing one of eight interface links reduces peak physical bandwidth by one eighth rather than crashing the training run.</p>
<h3>Simple source-routed switching</h3>
<p>MRC uses IPv6 Segment Routing (SRv6) to encode the intended switch sequence in each packet. Switches can therefore use static forwarding tables while senders quickly choose healthy alternatives without waiting for dynamic routing convergence.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer">OpenAI: Supercomputer networking to accelerate large scale AI training</a></p>
<p><a href="${PACKET_SPRAYING_PAPER_URL}" target="_blank" rel="noopener noreferrer">Technical paper: Resilient AI Supercomputer Networking using MRC and SRv6</a></p>`;

export class NetworkNodePopup {
  private readonly popupElement: HTMLDivElement;
  private readonly titleElement: HTMLDivElement;
  private readonly roleElement: HTMLDivElement;
  private readonly descriptionElement: HTMLParagraphElement;
  private readonly detailElement: HTMLParagraphElement;

  constructor(canvas: HTMLCanvasElement) {
    this.popupElement = document.createElement('div');
    this.popupElement.setAttribute('data-packet-spraying-node-popup', '');
    this.popupElement.setAttribute('role', 'tooltip');
    this.popupElement.setAttribute('aria-label', 'Network node details');
    Object.assign(this.popupElement.style, {
      position: 'fixed',
      zIndex: '20',
      display: 'none',
      width: 'min(280px, calc(100vw - 32px))',
      padding: '14px 16px',
      border: '1px solid rgba(132, 161, 205, 0.3)',
      borderRadius: '8px',
      background: 'rgba(11, 16, 27, 0.95)',
      boxShadow: '0 14px 36px rgba(0, 0, 0, 0.36)',
      color: '#f4f7fb',
      font: '13px/1.5 system-ui, sans-serif',
      pointerEvents: 'none'
    });

    this.titleElement = document.createElement('div');
    Object.assign(this.titleElement.style, {fontSize: '15px', fontWeight: '650'});

    this.roleElement = document.createElement('div');
    Object.assign(this.roleElement.style, {
      marginTop: '2px',
      color: '#82acf2',
      fontSize: '12px'
    });

    this.descriptionElement = document.createElement('p');
    Object.assign(this.descriptionElement.style, {margin: '10px 0 6px'});

    this.detailElement = document.createElement('p');
    Object.assign(this.detailElement.style, {margin: '0', color: '#c5d0df'});

    this.popupElement.append(
      this.titleElement,
      this.roleElement,
      this.descriptionElement,
      this.detailElement
    );
    (canvas.parentElement || document.body).appendChild(this.popupElement);
  }

  show(node: PickableNetworkNode, clientPosition: [number, number]): void {
    this.titleElement.textContent = node.title;
    this.roleElement.textContent = node.role;
    this.roleElement.style.color =
      node.status === 'offline'
        ? '#ff665a'
        : node.status === 'congested' || node.status === 'detecting'
          ? '#ffad52'
          : node.status === 'probing'
            ? '#73d3ff'
            : '#82acf2';
    this.descriptionElement.textContent = node.description;
    this.detailElement.textContent = node.detail;
    this.popupElement.style.display = 'block';

    const maximumLeft = Math.max(12, window.innerWidth - this.popupElement.offsetWidth - 12);
    const maximumTop = Math.max(12, window.innerHeight - this.popupElement.offsetHeight - 12);
    this.popupElement.style.left = `${Math.min(clientPosition[0] + 14, maximumLeft)}px`;
    this.popupElement.style.top = `${Math.min(clientPosition[1] + 14, maximumTop)}px`;
  }

  readonly hide = (): void => {
    this.popupElement.style.display = 'none';
  };

  destroy(): void {
    this.popupElement.remove();
  }
}

export class NetworkInfoPanel {
  private readonly rootElement: HTMLDivElement;
  private readonly closeButton: HTMLButtonElement;

  constructor(
    canvas: HTMLCanvasElement,
    {
      accessibleLabel,
      content,
      id,
      onClose,
      title
    }: {
      accessibleLabel: string;
      content: string;
      id: 'mrc' | 'optics';
      onClose: () => void;
      title: string;
    }
  ) {
    this.rootElement = document.createElement('div');
    this.rootElement.id = `packet-spraying-${id}-panel`;
    this.rootElement.dataset[id === 'mrc' ? 'networkMrcPanel' : 'networkOpticsPanel'] = '';
    this.rootElement.hidden = true;
    this.rootElement.setAttribute('role', 'region');
    this.rootElement.setAttribute('aria-label', accessibleLabel);
    Object.assign(this.rootElement.style, {
      position: 'absolute',
      top: '18px',
      right: '18px',
      zIndex: '16',
      width: 'min(380px, calc(100% - 36px))',
      maxHeight: 'min(56vh, calc(100% - 36px), 460px)',
      padding: '15px 17px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      border: '1px solid rgba(126, 157, 205, 0.29)',
      borderRadius: '8px',
      background: 'rgba(8, 12, 20, 0.91)',
      backdropFilter: 'blur(14px)',
      color: '#edf3fc',
      font: '12px/1.5 system-ui, sans-serif'
    });

    const headerElement = document.createElement('div');
    Object.assign(headerElement.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '10px'
    });
    const titleElement = document.createElement('div');
    titleElement.textContent = title;
    Object.assign(titleElement.style, {color: '#a7c4f1', fontSize: '11px', fontWeight: '700'});

    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.textContent = 'Close';
    this.closeButton.setAttribute('aria-label', `Close ${accessibleLabel}`);
    Object.assign(this.closeButton.style, {
      padding: '3px 8px',
      border: '1px solid rgba(140, 169, 211, 0.28)',
      borderRadius: '4px',
      background: 'rgba(30, 41, 58, 0.68)',
      color: '#dce8f8',
      cursor: 'pointer',
      font: '11px system-ui, sans-serif'
    });
    this.closeButton.addEventListener('click', onClose);
    headerElement.append(titleElement, this.closeButton);

    const contentElement = document.createElement('div');
    contentElement.innerHTML = content;
    for (const paragraph of contentElement.querySelectorAll('p')) {
      Object.assign(paragraph.style, {margin: '0 0 10px', color: '#c2cede'});
    }
    for (const heading of contentElement.querySelectorAll('h3')) {
      Object.assign(heading.style, {
        margin: '13px 0 5px',
        color: '#ecf3ff',
        fontSize: '12px',
        fontWeight: '650'
      });
    }
    for (const link of contentElement.querySelectorAll('a')) {
      Object.assign(link.style, {color: '#91baff', textDecoration: 'underline'});
    }

    this.rootElement.append(headerElement, contentElement);
    this.rootElement.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        onClose();
      }
    });
    (canvas.parentElement || document.body).appendChild(this.rootElement);
  }

  setVisible(isVisible: boolean): void {
    this.rootElement.hidden = !isVisible;
    if (isVisible) {
      this.closeButton.focus();
    }
  }

  destroy(): void {
    this.rootElement.remove();
  }
}

export class NetworkStoryControls {
  private readonly rootElement: HTMLDivElement;
  private readonly titleElement: HTMLDivElement;
  private readonly descriptionElement: HTMLParagraphElement;
  private readonly fabricStatusElement: HTMLSpanElement;
  private readonly fabricMetricsElement: HTMLDivElement;
  private readonly planeIndicators: {
    greenBar: HTMLDivElement;
    redBar: HTMLDivElement;
    row: HTMLButtonElement;
    status: HTMLSpanElement;
  }[];
  private readonly pathIndicators: {
    greenBar: HTMLDivElement;
    redBar: HTMLDivElement;
    row: HTMLButtonElement;
    status: HTMLSpanElement;
  }[];
  private readonly chapterSegments: {
    button: HTMLButtonElement;
    fill: HTMLDivElement;
    markers: {beat: NetworkStoryBeat; element: HTMLSpanElement}[];
  }[];
  private readonly chapterPositionElement: HTMLSpanElement;
  private readonly mrcButton: HTMLButtonElement;
  private readonly opticsButton: HTMLButtonElement;
  private readonly playbackButton: HTMLButtonElement;
  private readonly hdrHighlightInput: HTMLInputElement;
  private readonly hdrHighlightLabel: HTMLSpanElement;
  private readonly hdrHighlightTitle: HTMLSpanElement;
  private readonly visualIntensityInput: HTMLInputElement;
  private readonly visualIntensityLabel: HTMLSpanElement;
  private readonly visualIntensityTitle: HTMLSpanElement;
  private currentBeatId = '';
  private previousFabricMetricsSignature = '';
  private previousTelemetrySignature = '';

  constructor(
    canvas: HTMLCanvasElement,
    {
      onNext,
      onPrevious,
      onSelectChapter,
      onTogglePlayback,
      onHighlightPlane,
      onHighlightPath,
      onToggleMrc,
      onToggleOptics,
      onHdrHighlightBoostChange,
      onVisualIntensityChange,
      hdrHighlightBoost,
      visualIntensity
    }: {
      onNext: () => void;
      onPrevious: () => void;
      onSelectChapter: (chapterIndex: number) => void;
      onTogglePlayback: () => void;
      onHighlightPlane: (planeIndex: number | null) => void;
      onHighlightPath: (pathIndex: number | null) => void;
      onToggleMrc: () => void;
      onToggleOptics: () => void;
      onHdrHighlightBoostChange: (highlightBoost: number) => void;
      onVisualIntensityChange: (level: number) => void;
      hdrHighlightBoost: number;
      visualIntensity: number;
    }
  ) {
    this.rootElement = document.createElement('div');
    this.rootElement.dataset.networkStoryControls = '';
    this.rootElement.setAttribute('role', 'region');
    this.rootElement.setAttribute('aria-label', 'MRC network packet spraying guided tour');
    Object.assign(this.rootElement.style, {
      position: 'absolute',
      left: '12px',
      bottom: '12px',
      zIndex: '15',
      width: 'min(320px, calc(100% - 24px))',
      padding: '9px 11px',
      boxSizing: 'border-box',
      border: '1px solid rgba(126, 157, 205, 0.26)',
      borderRadius: '8px',
      background: 'rgba(8, 12, 20, 0.46)',
      backdropFilter: 'blur(18px) saturate(145%)',
      WebkitBackdropFilter: 'blur(18px) saturate(145%)',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
      color: '#eff4fd',
      font: '11px/1.35 system-ui, sans-serif'
    });

    const headingElement = document.createElement('div');
    headingElement.textContent = 'MRC GUIDED NETWORK TOUR';
    Object.assign(headingElement.style, {
      color: '#88a9d6',
      fontSize: '9px',
      fontWeight: '650'
    });

    this.titleElement = document.createElement('div');
    this.titleElement.setAttribute('aria-live', 'polite');
    Object.assign(this.titleElement.style, {
      marginTop: '3px',
      fontSize: '13px',
      fontWeight: '650'
    });

    this.descriptionElement = document.createElement('p');
    Object.assign(this.descriptionElement.style, {
      margin: '3px 0 6px',
      color: '#bcc9dc'
    });

    const chapterHeading = document.createElement('div');
    chapterHeading.textContent = 'STORY SCENARIOS';
    Object.assign(chapterHeading.style, {
      margin: '0 0 3px',
      color: '#91a6c3',
      fontSize: '9px'
    });

    const chapterTimeline = document.createElement('div');
    chapterTimeline.setAttribute('role', 'group');
    chapterTimeline.setAttribute('aria-label', 'Choose a guided network story scenario');
    Object.assign(chapterTimeline.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(${NETWORK_STORY_CHAPTERS.length}, minmax(0, 1fr))`,
      gap: '4px',
      margin: '0 0 6px'
    });
    this.chapterSegments = NETWORK_STORY_CHAPTERS.map((chapter, chapterIndex) => {
      const segmentButton = document.createElement('button');
      segmentButton.type = 'button';
      segmentButton.title = chapter.title;
      segmentButton.dataset.networkStorySegment = chapter.id;
      segmentButton.setAttribute(
        'aria-label',
        `Go to chapter ${chapterIndex + 1}: ${chapter.title}`
      );
      Object.assign(segmentButton.style, {
        position: 'relative',
        minWidth: '0',
        height: '27px',
        padding: '4px 3px 6px',
        border: '1px solid rgba(126, 157, 205, 0.2)',
        borderRadius: '4px',
        background: 'rgba(35, 48, 70, 0.36)',
        color: '#aebed4',
        cursor: 'pointer',
        font: '8px/1 system-ui, sans-serif',
        overflow: 'hidden',
        transition:
          'background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease'
      });

      const label = document.createElement('span');
      label.textContent = chapter.navigationLabel;
      Object.assign(label.style, {
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      });

      const track = document.createElement('div');
      Object.assign(track.style, {
        position: 'absolute',
        left: '3px',
        right: '3px',
        bottom: '3px',
        height: '2px',
        overflow: 'hidden',
        borderRadius: '2px',
        background: 'rgba(113, 136, 171, 0.3)'
      });
      const fill = document.createElement('div');
      Object.assign(fill.style, {
        width: '0%',
        height: '100%',
        borderRadius: '2px',
        background: '#86b6ff',
        transition: 'width 100ms linear, background 200ms ease'
      });
      track.appendChild(fill);
      const markers = chapter.beats.map(beat => {
        const marker = document.createElement('span');
        marker.dataset.networkStoryMarker = beat.id;
        marker.title = beat.title;
        marker.setAttribute('aria-hidden', 'true');
        Object.assign(marker.style, {
          position: 'absolute',
          top: '0',
          left: `calc(${beat.position * 100}% - ${beat.position === 0 ? 0 : 1}px)`,
          width: '2px',
          height: '2px',
          borderRadius: '2px',
          background: beat.color,
          opacity: '0.64',
          transition: 'opacity 180ms ease, box-shadow 180ms ease'
        });
        track.appendChild(marker);
        return {beat, element: marker};
      });
      segmentButton.append(label, track);
      segmentButton.addEventListener('click', () => onSelectChapter(chapterIndex));
      chapterTimeline.appendChild(segmentButton);
      return {button: segmentButton, fill, markers};
    });

    const telemetryElement = document.createElement('div');
    Object.assign(telemetryElement.style, {
      margin: '0 0 7px',
      paddingTop: '6px',
      borderTop: '1px solid rgba(137, 166, 211, 0.17)'
    });

    const switchPlaneSection = document.createElement('div');
    switchPlaneSection.dataset.networkSwitchPlanes = '';
    telemetryElement.appendChild(switchPlaneSection);

    const telemetryHeading = document.createElement('div');
    Object.assign(telemetryHeading.style, {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2px',
      color: '#91a6c3',
      fontSize: '9px'
    });
    const telemetryLabel = document.createElement('span');
    telemetryLabel.textContent = 'SWITCH PLANES';
    this.fabricStatusElement = document.createElement('span');
    telemetryHeading.append(telemetryLabel, this.fabricStatusElement);
    switchPlaneSection.appendChild(telemetryHeading);

    this.planeIndicators = Array.from({length: NETWORK_SWITCH_PLANE_COUNT}, (_, planeIndex) => {
      const rowElement = document.createElement('button');
      rowElement.type = 'button';
      rowElement.dataset.networkPlane = String(planeIndex + 1);
      rowElement.setAttribute('aria-label', `Highlight network plane ${planeIndex + 1} switches`);
      rowElement.setAttribute('aria-pressed', 'false');
      Object.assign(rowElement.style, {
        display: 'grid',
        gridTemplateColumns: '39px minmax(0, 1fr) 45px',
        alignItems: 'center',
        gap: '5px',
        width: 'calc(100% + 8px)',
        height: '17px',
        padding: '0 4px',
        margin: '0 -4px',
        border: '1px solid transparent',
        borderRadius: '4px',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 220ms ease, border-color 220ms ease'
      });
      rowElement.addEventListener('pointerenter', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('pointermove', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('pointerleave', () => onHighlightPlane(null));
      rowElement.addEventListener('mouseenter', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('mouseleave', () => onHighlightPlane(null));
      rowElement.addEventListener('focus', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('blur', () => onHighlightPlane(null));

      const labelElement = document.createElement('span');
      labelElement.textContent = `Plane ${planeIndex + 1}`;
      Object.assign(labelElement.style, {color: '#becce0', fontSize: '9px'});

      const trackElement = document.createElement('div');
      Object.assign(trackElement.style, {
        display: 'flex',
        height: '5px',
        overflow: 'hidden',
        borderRadius: '3px',
        background: 'rgba(93, 113, 146, 0.3)'
      });
      const redBar = document.createElement('div');
      const greenBar = document.createElement('div');
      Object.assign(redBar.style, {
        height: '100%',
        background: '#ff504d',
        transition: 'width 260ms ease'
      });
      Object.assign(greenBar.style, {
        height: '100%',
        background: '#34db87',
        transition: 'width 260ms ease'
      });
      trackElement.append(redBar, greenBar);

      const status = document.createElement('span');
      Object.assign(status.style, {textAlign: 'right', fontSize: '8px'});
      rowElement.append(labelElement, trackElement, status);
      switchPlaneSection.appendChild(rowElement);
      return {greenBar, redBar, row: rowElement, status};
    });

    const pathHeading = document.createElement('div');
    pathHeading.textContent = 'BACKBONE PATHS';
    Object.assign(pathHeading.style, {
      margin: '5px 0 2px',
      color: '#91a6c3',
      fontSize: '9px'
    });
    telemetryElement.appendChild(pathHeading);

    const pathGrid = document.createElement('div');
    Object.assign(pathGrid.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      columnGap: '7px'
    });
    telemetryElement.appendChild(pathGrid);

    this.pathIndicators = SPINE_POSITIONS.map((_, pathIndex) => {
      const rowElement = document.createElement('button');
      rowElement.type = 'button';
      rowElement.dataset.networkPath = String(pathIndex + 1);
      rowElement.setAttribute('aria-label', `Inspect complete backbone path ${pathIndex + 1}`);
      rowElement.setAttribute('aria-pressed', 'false');
      Object.assign(rowElement.style, {
        display: 'grid',
        gridTemplateColumns: '34px minmax(0, 1fr) 39px',
        alignItems: 'center',
        gap: '4px',
        width: '100%',
        height: '17px',
        padding: '0 2px',
        margin: '0',
        border: '1px solid transparent',
        borderRadius: '4px',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 220ms ease, border-color 220ms ease'
      });
      rowElement.addEventListener('pointerenter', () => onHighlightPath(pathIndex));
      rowElement.addEventListener('pointermove', () => onHighlightPath(pathIndex));
      rowElement.addEventListener('pointerleave', () => onHighlightPath(null));
      rowElement.addEventListener('focus', () => onHighlightPath(pathIndex));
      rowElement.addEventListener('blur', () => onHighlightPath(null));

      const label = document.createElement('span');
      label.textContent = `Path ${pathIndex + 1}`;
      Object.assign(label.style, {color: '#becce0', fontSize: '9px'});
      const track = document.createElement('div');
      Object.assign(track.style, {
        display: 'flex',
        height: '4px',
        overflow: 'hidden',
        borderRadius: '2px',
        background: 'rgba(93, 113, 146, 0.3)'
      });
      const redBar = document.createElement('div');
      const greenBar = document.createElement('div');
      Object.assign(redBar.style, {
        height: '100%',
        background: '#ff504d',
        transition: 'width 260ms ease'
      });
      Object.assign(greenBar.style, {
        height: '100%',
        background: '#34db87',
        transition: 'width 260ms ease'
      });
      track.append(redBar, greenBar);
      const status = document.createElement('span');
      Object.assign(status.style, {textAlign: 'right', fontSize: '8px'});
      rowElement.append(label, track, status);
      pathGrid.appendChild(rowElement);
      return {greenBar, redBar, row: rowElement, status};
    });

    this.fabricMetricsElement = document.createElement('div');
    this.fabricMetricsElement.setAttribute('aria-live', 'polite');
    Object.assign(this.fabricMetricsElement.style, {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '8px',
      marginTop: '4px',
      color: '#8fa5c3',
      font: '8px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace',
      whiteSpace: 'nowrap'
    });
    telemetryElement.appendChild(this.fabricMetricsElement);

    const visualIntensityElement = document.createElement('div');
    Object.assign(visualIntensityElement.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      columnGap: '10px',
      margin: '0 0 7px',
      paddingTop: '6px',
      borderTop: '1px solid rgba(137, 166, 211, 0.17)'
    });
    const visualIntensityControl = document.createElement('div');
    const visualIntensityHeading = document.createElement('div');
    Object.assign(visualIntensityHeading.style, {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2px',
      color: '#91a6c3',
      fontSize: '9px'
    });
    this.visualIntensityTitle = document.createElement('span');
    this.visualIntensityTitle.textContent = 'VISUAL STYLE';
    this.visualIntensityLabel = document.createElement('span');
    visualIntensityHeading.append(this.visualIntensityTitle, this.visualIntensityLabel);
    this.visualIntensityInput = document.createElement('input');
    this.visualIntensityInput.type = 'range';
    this.visualIntensityInput.min = '0';
    this.visualIntensityInput.max = String(MAX_NETWORK_OPTICS_LEVEL);
    this.visualIntensityInput.step = '0.25';
    this.visualIntensityInput.dataset.networkVisualIntensity = '';
    this.visualIntensityInput.setAttribute('aria-label', 'Visual effects intensity');
    Object.assign(this.visualIntensityInput.style, {
      display: 'block',
      width: '100%',
      height: '14px',
      margin: '0',
      accentColor: '#84acff',
      cursor: 'pointer'
    });
    this.visualIntensityInput.addEventListener('input', () => {
      onVisualIntensityChange(Number(this.visualIntensityInput.value));
    });
    visualIntensityControl.append(visualIntensityHeading, this.visualIntensityInput);

    const hdrHighlightControl = document.createElement('div');
    const hdrHighlightHeading = document.createElement('div');
    Object.assign(hdrHighlightHeading.style, {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2px',
      color: '#91a6c3',
      fontSize: '9px'
    });
    this.hdrHighlightTitle = document.createElement('span');
    this.hdrHighlightTitle.textContent = 'HDR';
    this.hdrHighlightLabel = document.createElement('span');
    hdrHighlightHeading.append(this.hdrHighlightTitle, this.hdrHighlightLabel);
    this.hdrHighlightInput = document.createElement('input');
    this.hdrHighlightInput.type = 'range';
    this.hdrHighlightInput.min = '0';
    this.hdrHighlightInput.max = '100';
    this.hdrHighlightInput.step = '1';
    this.hdrHighlightInput.dataset.networkHdrHighlight = '';
    this.hdrHighlightInput.setAttribute('aria-label', 'HDR highlight intensity');
    Object.assign(this.hdrHighlightInput.style, {
      display: 'block',
      width: '100%',
      height: '14px',
      margin: '0',
      accentColor: '#ffbf80',
      cursor: 'pointer'
    });
    this.hdrHighlightInput.addEventListener('input', () => {
      onHdrHighlightBoostChange(
        (Number(this.hdrHighlightInput.value) / 100) * MAX_NETWORK_HDR_HIGHLIGHT_BOOST
      );
    });
    hdrHighlightControl.append(hdrHighlightHeading, this.hdrHighlightInput);
    visualIntensityElement.append(visualIntensityControl, hdrHighlightControl);
    this.setVisualIntensity(visualIntensity);
    this.setHdrHighlightBoost(hdrHighlightBoost);

    const actionsElement = document.createElement('div');
    Object.assign(actionsElement.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    });

    const previousButton = this.makeButton('Back', 'Previous story chapter', onPrevious);
    previousButton.dataset.networkStoryPrevious = '';
    this.playbackButton = this.makeButton('Play', 'Play guided network tour', onTogglePlayback);
    this.playbackButton.dataset.networkStoryPlayback = '';
    const nextButton = this.makeButton('Next', 'Next story chapter', onNext);
    nextButton.dataset.networkStoryNext = '';
    this.mrcButton = this.makeButton('MRC', 'Show MRC networking information', onToggleMrc);
    this.mrcButton.dataset.networkStoryMrc = '';
    this.mrcButton.setAttribute('aria-controls', 'packet-spraying-mrc-panel');
    this.mrcButton.setAttribute('aria-expanded', 'false');
    this.opticsButton = this.makeButton('Optics', 'Show GPU optics information', onToggleOptics);
    this.opticsButton.dataset.networkStoryOptics = '';
    this.opticsButton.setAttribute('aria-controls', 'packet-spraying-optics-panel');
    this.opticsButton.setAttribute('aria-expanded', 'false');
    this.chapterPositionElement = document.createElement('span');
    Object.assign(this.chapterPositionElement.style, {
      marginLeft: 'auto',
      color: '#90a2bd',
      fontSize: '11px'
    });

    actionsElement.append(
      previousButton,
      this.playbackButton,
      nextButton,
      this.mrcButton,
      this.opticsButton,
      this.chapterPositionElement
    );
    this.rootElement.append(
      headingElement,
      this.titleElement,
      this.descriptionElement,
      chapterHeading,
      chapterTimeline,
      telemetryElement,
      visualIntensityElement,
      actionsElement
    );
    (canvas.parentElement || document.body).appendChild(this.rootElement);
  }

  update(chapter: NetworkStoryChapter, chapterIndex: number, isPlaying: boolean): void {
    this.titleElement.textContent = chapter.title;
    this.descriptionElement.textContent = chapter.description;
    this.chapterPositionElement.textContent = `${chapterIndex + 1} / ${NETWORK_STORY_CHAPTERS.length}`;
    this.playbackButton.textContent = isPlaying ? 'Pause' : 'Play';
    this.playbackButton.setAttribute(
      'aria-label',
      isPlaying ? 'Pause guided network tour' : 'Play guided network tour'
    );
    this.rootElement.dataset.networkStoryChapter = chapter.id;
    this.rootElement.dataset.networkStoryPlaying = String(isPlaying);
    for (const [segmentIndex, segment] of this.chapterSegments.entries()) {
      const isCurrentChapter = segmentIndex === chapterIndex;
      segment.button.setAttribute('aria-current', isCurrentChapter ? 'step' : 'false');
      segment.button.style.background = isCurrentChapter
        ? 'rgba(83, 122, 180, 0.34)'
        : 'rgba(35, 48, 70, 0.36)';
      segment.button.style.borderColor = isCurrentChapter
        ? 'rgba(155, 194, 255, 0.76)'
        : 'rgba(126, 157, 205, 0.2)';
      segment.button.style.color = isCurrentChapter ? '#eff5ff' : '#aebed4';
      segment.button.style.boxShadow = isCurrentChapter
        ? 'inset 0 0 10px rgba(115, 169, 255, 0.14)'
        : 'none';
    }
  }

  updateProgress(chapterIndex: number, elapsedTime: number): void {
    const progress = getNetworkStoryProgress(chapterIndex, elapsedTime);
    for (const [segmentIndex, segment] of this.chapterSegments.entries()) {
      const fill =
        segmentIndex < chapterIndex
          ? 1
          : segmentIndex === chapterIndex
            ? Math.max(progress.chapterProgress, 0.08)
            : 0;
      segment.fill.style.width = `${fill * 100}%`;
      segment.fill.style.background = segmentIndex === chapterIndex ? '#a3c7ff' : '#638cc5';
    }
    this.rootElement.dataset.networkStoryProgress = progress.overallProgress.toFixed(3);
  }

  updateBeat(chapter: NetworkStoryChapter, beat: NetworkStoryBeat | null): void {
    const nextBeatId = beat?.id ?? '';
    if (this.currentBeatId === nextBeatId) {
      return;
    }

    this.currentBeatId = nextBeatId;
    this.descriptionElement.textContent = beat?.description ?? chapter.description;
    this.rootElement.dataset.networkStoryBeat = nextBeatId;

    for (const segment of this.chapterSegments) {
      for (const marker of segment.markers) {
        const isCurrentBeat = marker.beat === beat;
        marker.element.style.opacity = isCurrentBeat ? '1' : '0.64';
        marker.element.style.boxShadow = isCurrentBeat ? `0 0 6px ${marker.beat.color}` : 'none';
      }
    }
  }

  updateTelemetry(
    planes: readonly NetworkPlaneTelemetry[],
    spinePaths: readonly NetworkPlaneTelemetry[]
  ): void {
    const signature = planes
      .map(plane => `${plane.status}:${plane.redPacketCount}:${plane.greenPacketCount}`)
      .concat(spinePaths.map(path => path.status))
      .join('|');
    if (signature === this.previousTelemetrySignature) {
      return;
    }
    this.previousTelemetrySignature = signature;

    const availablePlaneCount = planes.filter(plane => plane.status !== 'failed').length;
    const availablePathCount = spinePaths.filter(
      path => path.status !== 'failed' && path.status !== 'recovering'
    ).length;
    const maximumPlaneLoad = Math.max(
      ...planes.map(plane => plane.redPacketCount + plane.greenPacketCount),
      1
    );
    const maximumPathLoad = Math.max(
      ...spinePaths.map(path => path.redPacketCount + path.greenPacketCount),
      1
    );
    this.fabricStatusElement.textContent = `${availablePlaneCount} / ${planes.length} · ${availablePathCount} / ${spinePaths.length} PATHS`;

    for (const plane of planes) {
      const indicator = this.planeIndicators[plane.planeIndex];
      indicator.redBar.style.width = `${(plane.redPacketCount / maximumPlaneLoad) * 100}%`;
      indicator.greenBar.style.width = `${(plane.greenPacketCount / maximumPlaneLoad) * 100}%`;
      indicator.status.textContent =
        plane.status === 'healthy'
          ? 'ONLINE'
          : plane.status === 'congested'
            ? 'PRESSURE'
            : plane.status === 'recovering'
              ? 'PROBING'
              : 'OFFLINE';
      indicator.status.style.color =
        plane.status === 'healthy'
          ? '#8ba6c7'
          : plane.status === 'congested'
            ? '#ffac59'
            : plane.status === 'recovering'
              ? '#72d4ff'
              : '#ff7065';
    }

    for (const path of spinePaths) {
      const indicator = this.pathIndicators[path.planeIndex];
      indicator.redBar.style.width = `${(path.redPacketCount / maximumPathLoad) * 100}%`;
      indicator.greenBar.style.width = `${(path.greenPacketCount / maximumPathLoad) * 100}%`;
      indicator.status.textContent =
        path.status === 'healthy'
          ? 'ONLINE'
          : path.status === 'congested'
            ? 'PRESSURE'
            : path.status === 'recovering'
              ? 'PROBING'
              : 'OFFLINE';
      indicator.status.style.color =
        path.status === 'healthy'
          ? '#8ba6c7'
          : path.status === 'congested'
            ? '#ffac59'
            : path.status === 'recovering'
              ? '#72d4ff'
              : '#ff7065';
    }

    this.rootElement.dataset.networkPlaneStates = planes.map(plane => plane.status).join(',');
  }

  updateFabricTelemetry(telemetry: NetworkFabricTelemetry): void {
    const signature = [
      telemetry.state,
      telemetry.capacityPercent,
      telemetry.queuedPacketCount,
      telemetry.trimmedPayloadCount,
      telemetry.droppedPayloadCount,
      telemetry.retransmissionCount,
      telemetry.controlPacketCount
    ].join(':');
    if (signature === this.previousFabricMetricsSignature) {
      return;
    }
    this.previousFabricMetricsSignature = signature;

    const stateLabel = telemetry.state.toUpperCase();
    const eventSummary = telemetry.controlPacketCount
      ? `PROBE ${telemetry.controlPacketCount}`
      : `Q ${telemetry.queuedPacketCount} · T ${telemetry.trimmedPayloadCount} · L ${telemetry.droppedPayloadCount} · R ${telemetry.retransmissionCount}`;
    this.fabricMetricsElement.textContent = `${stateLabel} · CAP ${telemetry.capacityPercent}% · ${eventSummary}`;
    this.fabricMetricsElement.style.color =
      telemetry.state === 'balanced'
        ? '#8fa5c3'
        : telemetry.state === 'probing'
          ? '#72dfff'
          : telemetry.state === 'congested'
            ? '#ffb764'
            : '#ff8175';
    this.fabricMetricsElement.setAttribute(
      'aria-label',
      `${stateLabel}. ${telemetry.activePathCount} of ${telemetry.totalPathCount} paths available, ${telemetry.capacityPercent} percent physical path capacity, ${telemetry.queuedPacketCount} queued payloads, ${telemetry.trimmedPayloadCount} trimmed payloads, ${telemetry.droppedPayloadCount} dropped payloads, ${telemetry.retransmissionCount} retransmissions, ${telemetry.controlPacketCount} control packets.`
    );
    this.rootElement.dataset.networkFabricState = telemetry.state;
    this.rootElement.dataset.networkFabricCapacity = String(telemetry.capacityPercent);
  }

  setHighlightedPlane(planeIndex: number | null): void {
    this.rootElement.dataset.networkHighlightedPlane =
      planeIndex === null ? '' : String(planeIndex + 1);

    for (const [indicatorIndex, indicator] of this.planeIndicators.entries()) {
      const highlighted = indicatorIndex === planeIndex;
      indicator.row.style.background = highlighted ? 'rgba(97, 145, 216, 0.13)' : 'transparent';
      indicator.row.style.borderColor = highlighted ? 'rgba(137, 184, 255, 0.34)' : 'transparent';
      indicator.row.setAttribute('aria-pressed', String(highlighted));
    }
  }

  setHighlightedPath(pathIndex: number | null): void {
    this.rootElement.dataset.networkHighlightedPath =
      pathIndex === null ? '' : String(pathIndex + 1);

    for (const [indicatorIndex, indicator] of this.pathIndicators.entries()) {
      const highlighted = indicatorIndex === pathIndex;
      indicator.row.style.background = highlighted ? 'rgba(86, 171, 199, 0.15)' : 'transparent';
      indicator.row.style.borderColor = highlighted ? 'rgba(112, 211, 230, 0.36)' : 'transparent';
      indicator.row.setAttribute('aria-pressed', String(highlighted));
    }
  }

  setMrcExpanded(isExpanded: boolean): void {
    this.mrcButton.setAttribute('aria-expanded', String(isExpanded));
    this.mrcButton.setAttribute(
      'aria-label',
      isExpanded ? 'Hide MRC networking information' : 'Show MRC networking information'
    );
  }

  focusMrcButton(): void {
    this.mrcButton.focus();
  }

  setOpticsExpanded(isExpanded: boolean): void {
    this.opticsButton.setAttribute('aria-expanded', String(isExpanded));
    this.opticsButton.setAttribute(
      'aria-label',
      isExpanded ? 'Hide GPU optics information' : 'Show GPU optics information'
    );
  }

  focusOpticsButton(): void {
    this.opticsButton.focus();
  }

  setVisualIntensity(level: number): void {
    const profile = makeNetworkOpticsProfile(level);
    this.visualIntensityInput.value = String(profile.level);
    this.visualIntensityInput.setAttribute('aria-valuetext', profile.label);
    this.visualIntensityLabel.textContent = `${profile.label.toUpperCase()} ${profile.level.toFixed(
      profile.level % 1 === 0 ? 0 : 2
    )}`;
    this.rootElement.dataset.networkVisualStyle = profile.label;
  }

  setHdrHighlightBoost(highlightBoost: number): void {
    const percentage = Math.round((highlightBoost / MAX_NETWORK_HDR_HIGHLIGHT_BOOST) * 100);
    this.hdrHighlightInput.value = String(percentage);
    this.hdrHighlightInput.setAttribute('aria-valuetext', `${percentage}%`);
    this.hdrHighlightLabel.textContent = `${percentage}%`;
    this.rootElement.dataset.networkHdrHighlight = String(percentage);
  }

  setDynamicRange(profile: NetworkDynamicRangeProfile): void {
    this.visualIntensityTitle.textContent =
      profile.displayMode === 'extended-hdr'
        ? 'STYLE · HDR'
        : profile.sceneIsFloatingPoint
          ? 'STYLE · FP16'
          : 'STYLE';
    this.hdrHighlightTitle.textContent =
      profile.displayMode === 'extended-hdr' ? 'HDR RANGE' : 'HIGHLIGHTS';
    this.rootElement.dataset.networkDynamicRange = profile.displayMode;
  }

  destroy(): void {
    this.rootElement.remove();
  }

  private makeButton(
    label: string,
    accessibleLabel: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-label', accessibleLabel);
    Object.assign(button.style, {
      padding: '4px 8px',
      border: '1px solid rgba(140, 169, 211, 0.3)',
      borderRadius: '5px',
      background: 'rgba(30, 41, 58, 0.75)',
      color: '#edf3fc',
      cursor: 'pointer',
      font: '11px system-ui, sans-serif'
    });
    button.addEventListener('click', onClick);
    return button;
  }
}

export function makeSettingsSchema(
  supportsABuffer: boolean,
  supportsWeightedBlending: boolean
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'rendering',
        name: 'Rendering',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'visualIntensity',
            label: 'Visual Style (0–11)',
            type: 'number',
            persist: 'none',
            min: 0,
            max: MAX_NETWORK_OPTICS_LEVEL,
            step: 0.25
          },
          {
            name: 'transparencyMode',
            label: 'Transparency',
            type: 'select',
            persist: 'none',
            options: [
              ...(supportsABuffer ? [{label: 'Exact A-buffer OIT', value: 'a-buffer'}] : []),
              ...(supportsWeightedBlending
                ? [{label: 'Weighted blended OIT', value: 'weighted-blended'}]
                : []),
              {label: 'Depth-sorted alpha', value: 'sorted-alpha'}
            ]
          }
        ]
      },
      {
        id: 'animation',
        name: 'Animation',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'speed',
            label: 'Packet Speed',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'orbit',
            label: 'Camera Orbit',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.5,
            step: 0.01
          },
          {
            name: 'adaptiveRouting',
            label: 'Adaptive Routing',
            type: 'boolean',
            persist: 'none'
          }
        ]
      },
      {
        id: 'packet-lighting',
        name: 'Emissive Packets',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'packetEmission',
            label: 'Packet Emission',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 8,
            step: 0.1
          },
          {
            name: 'packetTrailLength',
            label: 'Packet Trail Length',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.35,
            step: 0.01
          },
          {
            name: 'packetTrailIntensity',
            label: 'Packet Trail Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'switchFlashIntensity',
            label: 'Switch Arrival Flash',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'switchRippleIntensity',
            label: 'Switch Arrival Ripple',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.2,
            step: 0.05
          },
          {
            name: 'switchTransitionIntensity',
            label: 'Switch Transition Wave',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'packetLightIntensity',
            label: 'Local Light Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'packetLightRadius',
            label: 'Local Light Radius',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'linkTrafficGlow',
            label: 'Link Traffic Glow',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'linkPulseLength',
            label: 'Link Pulse Length',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.65,
            step: 0.01
          },
          {
            name: 'linkPulseIntensity',
            label: 'Link Pulse Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'endpointSignalIntensity',
            label: 'Server Activity Glow',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'congestionPressureIntensity',
            label: 'Congestion Pressure',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.2,
            step: 0.05
          },
          {
            name: 'causticIntensity',
            label: 'Glass Caustic Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'causticFocus',
            label: 'Glass Caustic Focus',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'bloomIntensity',
            label: 'Bloom Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.02
          },
          {
            name: 'bloomThreshold',
            label: 'Bloom Threshold',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.02
          },
          {
            name: 'exposure',
            label: 'Exposure',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'hdrHighlightBoost',
            label: 'HDR Highlight Boost',
            type: 'number',
            persist: 'none',
            min: 0,
            max: MAX_NETWORK_HDR_HIGHLIGHT_BOOST,
            step: 0.05
          }
        ]
      },
      {
        id: 'glass',
        name: 'Glass Material',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'glassIndexOfRefraction',
            label: 'Index of Refraction',
            type: 'number',
            persist: 'none',
            min: 1.01,
            max: 2.2,
            step: 0.01
          },
          {
            name: 'glassRoughness',
            label: 'Roughness',
            type: 'number',
            persist: 'none',
            min: 0.02,
            max: 0.8,
            step: 0.01
          },
          {
            name: 'glassDispersion',
            label: 'Chromatic Dispersion',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          },
          {
            name: 'glassThickness',
            label: 'Thickness',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassRefractionStrength',
            label: 'Lens Distortion',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassFresnelStrength',
            label: 'Fresnel Edge',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassClearcoatStrength',
            label: 'Clearcoat Highlight',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassIridescenceStrength',
            label: 'Spectral Edge',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.6,
            step: 0.01
          },
          {
            name: 'glassInternalReflectionStrength',
            label: 'Internal Reflection',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassTransmissionStrength',
            label: 'Transmission',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.6,
            step: 0.05
          },
          {
            name: 'glassEnvironmentIntensity',
            label: 'Studio Reflections',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'glassEnvironmentPrefilterStrength',
            label: 'Prefiltered Reflections',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassContactShadowStrength',
            label: 'Glass Contact Shadows',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.05
          },
          {
            name: 'glassVolumeThickness',
            label: 'Volume Thickness',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassRoughTransmissionStrength',
            label: 'Frosted Transmission',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassSpectralAbsorptionStrength',
            label: 'Spectral Absorption',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassThinFilmThickness',
            label: 'Film Thickness (nm)',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 900,
            step: 10
          },
          {
            name: 'glassThinFilmStrength',
            label: 'Thin-Film Interference',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          },
          {
            name: 'glassVolumeScatteringStrength',
            label: 'Volume Light Scattering',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'glassDynamicReflectionStrength',
            label: 'Moving Scene Reflections',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'glassSecondaryBounceStrength',
            label: 'Secondary Internal Bounce',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'glassFaultDistortionStrength',
            label: 'Fault Surface Distortion',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          }
        ]
      }
    ]
  };
}
