// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type Vector3 = [number, number, number];
export type Color = [number, number, number, number];

export type Packet = {
  alpha: number;
  color: Color;
  conversationIndex: number;
  enabled: boolean;
  launchTime: number;
  preferredRouteIndex: number;
  route: Route;
  scale: number;
};

export type NetworkScenario = 'failure' | 'congestion';

export type NetworkPacketEventKind =
  | 'dropped-payload'
  | 'trimmed-payload'
  | 'trimmed-header'
  | 'retransmission'
  | 'probe'
  | 'probe-confirmation';

export type NetworkPacketEvent = {
  color: Color;
  conversationIndex: number;
  duration: number;
  kind: NetworkPacketEventKind;
  route: Route;
  startedAt: number;
  switchIndex: number;
};

export type SwitchArrival = {
  arrivalTime: number;
  conversationIndex: number;
  switchIndex: number;
};

export type NetworkLink = {
  color: Color;
  end: Vector3;
  endInset: number;
  start: Vector3;
  startInset: number;
};

/** Number of colored payload and control packets currently traveling through one physical link. */
export type NetworkLinkTraffic = {
  red: number;
  green: number;
  blue?: number;
};

/** One packet-aligned optical wake constrained to a single physical network link. */
export type NetworkLinkPulse = {
  color: Color;
  conversationIndex: number;
  end: Vector3;
  linkKey: string;
  start: Vector3;
};

/** A short, animated packet queue immediately upstream of a congested switch. */
export type NetworkQueuedPacket = {
  color: Color;
  conversationIndex: number;
  position: Vector3;
  strength: number;
  switchIndex: number;
};

export type NetworkSwitchTransitionKind = 'failure' | 'recovery';

export type NetworkSwitchTransitionWave = {
  color: Color;
  duration: number;
  kind: NetworkSwitchTransitionKind;
  startedAt: number;
  switchIndex: number;
};

export type NetworkPlaneStatus = 'healthy' | 'congested' | 'failed' | 'recovering';

export type NetworkPlaneTelemetry = {
  greenPacketCount: number;
  planeIndex: number;
  redPacketCount: number;
  status: NetworkPlaneStatus;
};

export type NetworkFabricState = 'balanced' | 'congested' | 'rerouting' | 'degraded' | 'probing';

/** Compact, state-derived measurements for the guided network story. */
export type NetworkFabricTelemetry = {
  activePathCount: number;
  capacityPercent: number;
  controlPacketCount: number;
  droppedPayloadCount: number;
  queuedPacketCount: number;
  retransmissionCount: number;
  state: NetworkFabricState;
  totalPathCount: number;
  trimmedPayloadCount: number;
};

/** The physical switches, links, and endpoints traversed by one shared backbone path. */
export type NetworkPathFocus = {
  hostIndices: Set<number>;
  linkKeys: Set<string>;
  pathIndex: number;
  switchIndices: Set<number>;
};

export type NetworkEndpointSignalKind = 'source' | 'destination';

export type NetworkEndpointSignal = {
  color: Color;
  conversationIndex: number;
  hostIndex: number;
  kind: NetworkEndpointSignalKind;
  strength: number;
};

export type Conversation = {
  color: Color;
  destinationHostIndex: number;
  sourceHostIndex: number;
};

export type ConversationRoute = {
  conversationIndex: number;
  route: Route;
};

export type Route = {
  cumulativeLengths: number[];
  points: Vector3[];
  totalLength: number;
};

export type PickableNetworkNode = {
  description: string;
  detail: string;
  role: string;
  status?: 'congested' | 'detecting' | 'offline' | 'online' | 'probing';
  title: string;
};

export type NetworkSwitchGroupId = 'spine' | 'plane-1' | 'plane-2';

export type NetworkSwitchGroup = {
  id: NetworkSwitchGroupId;
  switchIndices: number[];
};

export const HOST_X_POSITIONS = [-3.6, -1.2, 1.2, 3.6];
export const HOST_Z_POSITIONS = [2.4, 0.8, -0.8, -2.4];
export const HOST_Y = -2.75;
export const HOST_HALF_EXTENTS: Vector3 = [0.42, 0.27, 0.32];
export const LEAF_Y = -1.05;
export const LEAF_SWITCH_RADIUS = 0.42;
export const AGGREGATION_Y = 0.35;
export const AGGREGATION_SWITCH_RADIUS = 0.4;
export const SPINE_Y = 2.05;
export const SPINE_SWITCH_RADIUS = 0.55;

const TRAFFIC_COLORS: Color[] = [
  [1, 0, 0, 1],
  [0, 1, 0, 1]
];

export const HOST_POSITIONS: Vector3[] = HOST_Z_POSITIONS.flatMap(zPosition =>
  HOST_X_POSITIONS.map(xPosition => [xPosition, HOST_Y, zPosition] as Vector3)
);
export const LEAF_POSITIONS: Vector3[] = [0.85, -0.85].flatMap(zPosition =>
  HOST_X_POSITIONS.map(xPosition => [xPosition, LEAF_Y, zPosition] as Vector3)
);
export const AGGREGATION_POSITIONS: Vector3[] = [0.85, -0.85].flatMap(zPosition =>
  HOST_X_POSITIONS.map(xPosition => [xPosition, AGGREGATION_Y, zPosition] as Vector3)
);
export const SPINE_POSITIONS: Vector3[] = HOST_Z_POSITIONS.map(zPosition => [
  0,
  SPINE_Y,
  zPosition
]);
export const SWITCH_POSITIONS: Vector3[] = [
  ...LEAF_POSITIONS,
  ...AGGREGATION_POSITIONS,
  ...SPINE_POSITIONS
];
export const NETWORK_SWITCH_PLANE_COUNT = LEAF_POSITIONS.length / HOST_X_POSITIONS.length;

/** Identifies both four-switch tiers belonging to one physical switch plane. */
export function getNetworkPlaneSwitchIndices(planeIndex: number): number[] {
  if (!Number.isInteger(planeIndex) || planeIndex < 0 || planeIndex >= NETWORK_SWITCH_PLANE_COUNT) {
    return [];
  }

  const planeWidth = HOST_X_POSITIONS.length;
  const leafOffset = planeIndex * planeWidth;
  const aggregationOffset = LEAF_POSITIONS.length + planeIndex * planeWidth;

  return [
    ...Array.from({length: planeWidth}, (_, switchIndex) => leafOffset + switchIndex),
    ...Array.from({length: planeWidth}, (_, switchIndex) => aggregationOffset + switchIndex)
  ];
}

/** Keeps semantic switch planes intact while allowing camera-depth-ordered glass composition. */
export function makeSwitchGroups(): NetworkSwitchGroup[] {
  const leafPlaneWidth = LEAF_POSITIONS.length / 2;
  const aggregationPlaneWidth = AGGREGATION_POSITIONS.length / 2;
  const aggregationOffset = LEAF_POSITIONS.length;
  const spineOffset = aggregationOffset + AGGREGATION_POSITIONS.length;

  return [
    {
      id: 'spine',
      switchIndices: SPINE_POSITIONS.map((_, switchIndex) => spineOffset + switchIndex)
    },
    {
      id: 'plane-1',
      switchIndices: [
        ...Array.from({length: leafPlaneWidth}, (_, switchIndex) => switchIndex),
        ...Array.from(
          {length: aggregationPlaneWidth},
          (_, switchIndex) => aggregationOffset + switchIndex
        )
      ]
    },
    {
      id: 'plane-2',
      switchIndices: [
        ...Array.from({length: leafPlaneWidth}, (_, switchIndex) => leafPlaneWidth + switchIndex),
        ...Array.from(
          {length: aggregationPlaneWidth},
          (_, switchIndex) => aggregationOffset + aggregationPlaneWidth + switchIndex
        )
      ]
    }
  ];
}

export const CONVERSATIONS: Conversation[] = [
  {sourceHostIndex: 3, destinationHostIndex: 8, color: TRAFFIC_COLORS[0]},
  {sourceHostIndex: 7, destinationHostIndex: 12, color: TRAFFIC_COLORS[1]}
];

const SWITCH_INDICES_BY_POSITION = new Map(
  SWITCH_POSITIONS.map((position, switchIndex) => [position.join(','), switchIndex])
);

export function getNetworkSwitchIndex(position: Vector3): number | undefined {
  return SWITCH_INDICES_BY_POSITION.get(position.join(','));
}

export function makeConversationRoutes(): ConversationRoute[] {
  const conversationRoutes: ConversationRoute[] = [];
  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const conversation = CONVERSATIONS[conversationIndex];
    const sourceColumnIndex = conversation.sourceHostIndex % HOST_X_POSITIONS.length;
    const destinationColumnIndex = conversation.destinationHostIndex % HOST_X_POSITIONS.length;
    for (let spineIndex = 0; spineIndex < SPINE_POSITIONS.length; spineIndex++) {
      conversationRoutes.push({
        conversationIndex,
        route: makeNetworkRoute([
          HOST_POSITIONS[conversation.sourceHostIndex],
          LEAF_POSITIONS[sourceColumnIndex],
          AGGREGATION_POSITIONS[spineIndex],
          SPINE_POSITIONS[spineIndex],
          AGGREGATION_POSITIONS[HOST_X_POSITIONS.length + spineIndex],
          LEAF_POSITIONS[HOST_X_POSITIONS.length + destinationColumnIndex],
          HOST_POSITIONS[conversation.destinationHostIndex]
        ])
      });
    }
  }

  return conversationRoutes;
}

/** Collects both conversations' complete source-to-destination routes through one spine. */
export function makeNetworkPathFocus(
  conversationRoutes: readonly ConversationRoute[],
  pathIndex: number
): NetworkPathFocus | null {
  if (!Number.isInteger(pathIndex) || pathIndex < 0 || pathIndex >= SPINE_POSITIONS.length) {
    return null;
  }

  const spinePosition = SPINE_POSITIONS[pathIndex];
  const focusedRoutes = conversationRoutes.filter(({route}) =>
    route.points.includes(spinePosition)
  );
  if (focusedRoutes.length === 0) {
    return null;
  }

  const hostIndices = new Set<number>();
  const linkKeys = new Set<string>();
  const switchIndices = new Set<number>();

  for (const {conversationIndex, route} of focusedRoutes) {
    const conversation = CONVERSATIONS[conversationIndex];
    hostIndices.add(conversation.sourceHostIndex);
    hostIndices.add(conversation.destinationHostIndex);

    for (let pointIndex = 0; pointIndex < route.points.length; pointIndex++) {
      const point = route.points[pointIndex];
      const switchIndex = SWITCH_INDICES_BY_POSITION.get(point.join(','));
      if (switchIndex !== undefined) {
        switchIndices.add(switchIndex);
      }
      if (pointIndex > 0) {
        linkKeys.add(makeLinkKey(route.points[pointIndex - 1], point));
      }
    }
  }

  return {hostIndices, linkKeys, pathIndex, switchIndices};
}

export function isFailedSwitchPosition(
  position: Vector3,
  failedSwitchIndices: ReadonlySet<number>
): boolean {
  const switchIndex = SWITCH_INDICES_BY_POSITION.get(position.join(','));
  return switchIndex !== undefined && failedSwitchIndices.has(switchIndex);
}

export function getActivePlaneCount(conversationRoutes: ConversationRoute[]): number {
  return new Set(conversationRoutes.map(({route}) => route.points[3].join(','))).size;
}

export function makeActiveLinkKeys(conversationRoutes: readonly ConversationRoute[]): Set<string> {
  const activeLinkKeys = new Set<string>();

  for (const {route} of conversationRoutes) {
    for (let pointIndex = 0; pointIndex < route.points.length - 1; pointIndex++) {
      activeLinkKeys.add(makeLinkKey(route.points[pointIndex], route.points[pointIndex + 1]));
    }
  }

  return activeLinkKeys;
}

export function makeLinks(conversationRoutes: readonly ConversationRoute[]): NetworkLink[] {
  const links: NetworkLink[] = [];
  const activeLinkKeys = makeActiveLinkKeys(conversationRoutes);

  for (let hostIndex = 0; hostIndex < HOST_POSITIONS.length; hostIndex++) {
    const rowIndex = Math.floor(hostIndex / HOST_X_POSITIONS.length);
    const columnIndex = hostIndex % HOST_X_POSITIONS.length;
    const leafRowOffset = rowIndex < 2 ? 0 : HOST_X_POSITIONS.length;
    const start = HOST_POSITIONS[hostIndex];
    const end = LEAF_POSITIONS[leafRowOffset + columnIndex];
    links.push({
      start,
      end,
      startInset: getBoxSurfaceDistance(start, end, HOST_HALF_EXTENTS),
      endInset: LEAF_SWITCH_RADIUS,
      color: makeLinkColor(start, activeLinkKeys.has(makeLinkKey(start, end)))
    });
  }

  for (let rowIndex = 0; rowIndex < 2; rowIndex++) {
    const rowOffset = rowIndex * HOST_X_POSITIONS.length;
    for (let leafColumnIndex = 0; leafColumnIndex < HOST_X_POSITIONS.length; leafColumnIndex++) {
      for (
        let aggregationColumnIndex = 0;
        aggregationColumnIndex < HOST_X_POSITIONS.length;
        aggregationColumnIndex++
      ) {
        const start = LEAF_POSITIONS[rowOffset + leafColumnIndex];
        const end = AGGREGATION_POSITIONS[rowOffset + aggregationColumnIndex];
        links.push({
          start,
          end,
          startInset: LEAF_SWITCH_RADIUS,
          endInset: AGGREGATION_SWITCH_RADIUS,
          color: makeLinkColor(start, activeLinkKeys.has(makeLinkKey(start, end)))
        });
      }
    }
  }

  for (const aggregationPosition of AGGREGATION_POSITIONS) {
    for (let spineIndex = 0; spineIndex < SPINE_POSITIONS.length; spineIndex++) {
      const end = SPINE_POSITIONS[spineIndex];
      links.push({
        start: aggregationPosition,
        end,
        startInset: AGGREGATION_SWITCH_RADIUS,
        endInset: SPINE_SWITCH_RADIUS,
        color: makeLinkColor(
          aggregationPosition,
          activeLinkKeys.has(makeLinkKey(aggregationPosition, end))
        )
      });
    }
  }

  return links;
}

export function makeLinkColor(
  start: Vector3,
  active: boolean,
  failed = false,
  congested = false
): Color {
  if (failed) {
    return [0.86, 0.32, 0.08, 0.085];
  }
  if (congested) {
    return [0.92, 0.24, 0.1, active ? 0.16 : 0.07];
  }
  if (start[1] === HOST_Y) {
    return active ? [0.43, 0.61, 0.91, 0.2] : [0.3, 0.42, 0.66, 0.045];
  }
  if (start[1] === LEAF_Y) {
    return active ? [0.45, 0.61, 0.91, 0.18] : [0.3, 0.42, 0.66, 0.038];
  }
  return active ? [0.47, 0.64, 0.93, 0.16] : [0.3, 0.42, 0.66, 0.034];
}

export function makePickableNetworkNodes(): PickableNetworkNode[] {
  const servers = HOST_POSITIONS.map((_, hostIndex) => {
    const sourceConversationIndex = CONVERSATIONS.findIndex(
      conversation => conversation.sourceHostIndex === hostIndex
    );
    const destinationConversationIndex = CONVERSATIONS.findIndex(
      conversation => conversation.destinationHostIndex === hostIndex
    );
    const rowIndex = Math.floor(hostIndex / HOST_X_POSITIONS.length) + 1;
    const columnIndex = (hostIndex % HOST_X_POSITIONS.length) + 1;

    if (sourceConversationIndex >= 0) {
      const trafficColor = sourceConversationIndex === 0 ? 'red' : 'green';
      return {
        title: `Server ${hostIndex + 1}`,
        role: `${trafficColor.toUpperCase()} source / grid row ${rowIndex}, column ${columnIndex}`,
        description: `This server originates the ${trafficColor} transfer and sends its packets to a local Tier 0 switch.`,
        detail:
          'The outgoing stream is sprayed across independent network planes after meeting the other conversation.'
      };
    }

    if (destinationConversationIndex >= 0) {
      const trafficColor = destinationConversationIndex === 0 ? 'red' : 'green';
      return {
        title: `Server ${hostIndex + 1}`,
        role: `${trafficColor.toUpperCase()} destination / grid row ${rowIndex}, column ${columnIndex}`,
        description: `This server receives the ${trafficColor} transfer after the destination-side switches separate the interleaved streams.`,
        detail:
          'MRC writes each packet to its final memory address, so packets can arrive through different paths and out of order.'
      };
    }

    return {
      title: `Server ${hostIndex + 1}`,
      role: `Available compute server / grid row ${rowIndex}, column ${columnIndex}`,
      description:
        'This server represents another GPU host connected to the same resilient network fabric.',
      detail:
        'It is not part of the two active conversations, so its links do not carry moving packets.'
    };
  });

  const leafSwitches = LEAF_POSITIONS.map((_, switchIndex) => {
    const side = switchIndex < HOST_X_POSITIONS.length ? 'source' : 'destination';
    const planeIndex = side === 'source' ? 1 : 2;
    const columnIndex = (switchIndex % HOST_X_POSITIONS.length) + 1;
    return {
      title: `Plane ${planeIndex} access switch ${columnIndex}`,
      role: `Tier 0 / ${side.toUpperCase()} side / physical switch plane ${planeIndex}`,
      description:
        side === 'source'
          ? 'This switch gathers outgoing server traffic and forwards packets toward the independent planes.'
          : 'This switch separates returning red and green packets and delivers each stream to the correct destination server.',
      detail:
        'Multiple local servers share the access tier; only the active source and destination paths carry packets.'
    };
  });

  const aggregationSwitches = AGGREGATION_POSITIONS.map((_, switchIndex) => {
    const side = switchIndex < HOST_X_POSITIONS.length ? 'ingress' : 'egress';
    const planeIndex = side === 'ingress' ? 1 : 2;
    const pathIndex = (switchIndex % HOST_X_POSITIONS.length) + 1;
    return {
      title: `Plane ${planeIndex} ${side} switch ${pathIndex}`,
      role: `Tier 1 / physical switch plane ${planeIndex} / backbone path ${pathIndex}`,
      description:
        side === 'ingress'
          ? 'This ingress switch accepts alternating red and green packets from the source-side access tier.'
          : 'This egress switch receives the mixed packet stream and forwards each packet toward its destination.',
      detail: `Plane ${planeIndex} contains both access and aggregation switches; path ${pathIndex} connects through a shared spine.`
    };
  });

  const spineSwitches = SPINE_POSITIONS.map((_, switchIndex) => ({
    title: `Spine switch ${switchIndex + 1}`,
    role: `Fabric backbone / independent routing path ${switchIndex + 1}`,
    description:
      'This spine connects the two physical switch planes along one independent backbone path.',
    detail:
      'Both conversations can share this path, interleaving one red packet with one green packet while other backbone paths carry additional packets.'
  }));

  return [...servers, ...leafSwitches, ...aggregationSwitches, ...spineSwitches];
}

export function makeHostColor(hostIndex: number): Color {
  const conversationIndex = CONVERSATIONS.findIndex(
    conversation =>
      conversation.sourceHostIndex === hostIndex || conversation.destinationHostIndex === hostIndex
  );
  if (conversationIndex === 0) {
    return [0.48, 0.09, 0.08, 1];
  }
  if (conversationIndex === 1) {
    return [0.07, 0.38, 0.1, 1];
  }
  return [0.18, 0.4, 0.92, 1];
}

export function makeLinkKey(start: Vector3, end: Vector3): string {
  const startKey = start.join(',');
  const endKey = end.join(',');
  return startKey < endKey ? `${startKey}:${endKey}` : `${endKey}:${startKey}`;
}

export function getPointAlongRoute(route: Route, progress: number): Vector3 {
  const distance = progress * route.totalLength;
  let segmentIndex = 0;
  while (
    segmentIndex < route.cumulativeLengths.length - 2 &&
    route.cumulativeLengths[segmentIndex + 1] < distance
  ) {
    segmentIndex++;
  }

  const startDistance = route.cumulativeLengths[segmentIndex];
  const endDistance = route.cumulativeLengths[segmentIndex + 1];
  const segmentProgress = (distance - startDistance) / (endDistance - startDistance);
  const start = route.points[segmentIndex];
  const end = route.points[segmentIndex + 1];
  return [
    start[0] + (end[0] - start[0]) * segmentProgress,
    start[1] + (end[1] - start[1]) * segmentProgress,
    start[2] + (end[2] - start[2]) * segmentProgress
  ];
}

export function getRouteSegmentStartDistance(route: Route, distance: number): number {
  let segmentIndex = 0;
  while (
    segmentIndex < route.cumulativeLengths.length - 2 &&
    route.cumulativeLengths[segmentIndex + 1] < distance
  ) {
    segmentIndex++;
  }
  return route.cumulativeLengths[segmentIndex];
}

export function getDistance(start: Vector3, end: Vector3): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}

export function getDistanceSquared(start: Vector3, end: Vector3): number {
  const differenceX = end[0] - start[0];
  const differenceY = end[1] - start[1];
  const differenceZ = end[2] - start[2];
  return differenceX * differenceX + differenceY * differenceY + differenceZ * differenceZ;
}

export function makeNetworkRoute(points: Vector3[]): Route {
  const cumulativeLengths = [0];
  let totalLength = 0;
  for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
    totalLength += getDistance(points[pointIndex - 1], points[pointIndex]);
    cumulativeLengths.push(totalLength);
  }
  return {points, cumulativeLengths, totalLength};
}

export function getNetworkNodeSurfaceInset(position: Vector3, toward: Vector3): number {
  if (position[1] === HOST_Y) {
    return getBoxSurfaceDistance(position, toward, HOST_HALF_EXTENTS);
  }
  if (position[1] === LEAF_Y) {
    return LEAF_SWITCH_RADIUS;
  }
  if (position[1] === AGGREGATION_Y) {
    return AGGREGATION_SWITCH_RADIUS;
  }
  return SPINE_SWITCH_RADIUS;
}

function getBoxSurfaceDistance(start: Vector3, end: Vector3, halfExtents: Vector3): number {
  const distance = getDistance(start, end);
  const direction: Vector3 = [
    (end[0] - start[0]) / distance,
    (end[1] - start[1]) / distance,
    (end[2] - start[2]) / distance
  ];
  return Math.min(
    direction[0] === 0 ? Infinity : halfExtents[0] / Math.abs(direction[0]),
    direction[1] === 0 ? Infinity : halfExtents[1] / Math.abs(direction[1]),
    direction[2] === 0 ? Infinity : halfExtents[2] / Math.abs(direction[2])
  );
}
