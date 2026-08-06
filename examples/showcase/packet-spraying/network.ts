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

/** Number of red and green packets currently traveling through one physical link. */
export type NetworkLinkTraffic = {
  red: number;
  green: number;
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
const PACKETS_PER_BURST = 24;
const BURST_PACKET_INTERVAL = 0.14;

export const BURST_CYCLE_DURATION = 11;
export const CONGESTION_TRIM_INTERVAL = 1.35;
export const FAILURE_DETECTION_DELAY = 0.52;
export const PACKET_TRAVEL_SPEED = 3.4;
export const ENDPOINT_SIGNAL_DURATION = 0.34;
export const SWITCH_CONFIRMATION_DURATION = 0.46;
export const SWITCH_PROBE_DURATION = 0.66;
export const SWITCH_PROBE_INTERVAL = 2.2;
export const SWITCH_TRANSITION_WAVE_DURATION = 0.78;

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

export function makeConversationRoutes(): ConversationRoute[] {
  const conversationRoutes: ConversationRoute[] = [];
  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const conversation = CONVERSATIONS[conversationIndex];
    const sourceColumnIndex = conversation.sourceHostIndex % HOST_X_POSITIONS.length;
    const destinationColumnIndex = conversation.destinationHostIndex % HOST_X_POSITIONS.length;
    for (let spineIndex = 0; spineIndex < SPINE_POSITIONS.length; spineIndex++) {
      conversationRoutes.push({
        conversationIndex,
        route: makeRoute([
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

export function makePackets(conversationRoutes: ConversationRoute[]): Packet[] {
  const packets: Packet[] = [];

  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const conversation = CONVERSATIONS[conversationIndex];
    const routes = conversationRoutes.filter(
      route => route.conversationIndex === conversationIndex
    );
    for (let packetIndex = 0; packetIndex < PACKETS_PER_BURST; packetIndex++) {
      const {route} = routes[packetIndex % routes.length];
      const sourceTravelTime = getDistance(route.points[0], route.points[1]) / PACKET_TRAVEL_SPEED;
      const launchTime =
        1 +
        packetIndex * BURST_PACKET_INTERVAL +
        (conversationIndex * BURST_PACKET_INTERVAL) / CONVERSATIONS.length -
        sourceTravelTime;
      packets.push({
        route,
        color: conversation.color,
        conversationIndex,
        enabled: true,
        launchTime,
        preferredRouteIndex: packetIndex,
        scale: 0.05,
        alpha: 1
      });
    }
  }

  return packets;
}

export function makeSwitchArrivals(packets: Packet[]): SwitchArrival[] {
  const arrivals: SwitchArrival[] = [];

  for (const packet of packets) {
    if (!packet.enabled) {
      continue;
    }
    for (let pointIndex = 1; pointIndex < packet.route.points.length - 1; pointIndex++) {
      const switchIndex = SWITCH_INDICES_BY_POSITION.get(packet.route.points[pointIndex].join(','));
      if (switchIndex === undefined) {
        continue;
      }

      arrivals.push({
        arrivalTime:
          packet.launchTime + packet.route.cumulativeLengths[pointIndex] / PACKET_TRAVEL_SPEED,
        conversationIndex: packet.conversationIndex,
        switchIndex
      });
    }
  }

  return arrivals;
}

/** Places alternating packets inside the final incoming link without entering switch glass. */
export function makeSwitchQueuePackets(
  packets: readonly Packet[],
  switchIndex: number,
  animationTime: number,
  maximumPackets = 6
): NetworkQueuedPacket[] {
  const switchPosition = SWITCH_POSITIONS[switchIndex];
  if (!switchPosition || maximumPackets <= 0 || !Number.isFinite(animationTime)) {
    return [];
  }

  const incomingPackets = CONVERSATIONS.map((_, conversationIndex) =>
    packets.find(
      packet =>
        packet.enabled &&
        packet.conversationIndex === conversationIndex &&
        packet.route.points.includes(switchPosition)
    )
  ).filter((packet): packet is Packet => Boolean(packet));
  if (incomingPackets.length === 0) {
    return [];
  }

  const queuedPackets: NetworkQueuedPacket[] = [];
  for (let queueIndex = 0; queueIndex < maximumPackets; queueIndex++) {
    const packet = incomingPackets[queueIndex % incomingPackets.length];
    const switchPointIndex = packet.route.points.indexOf(switchPosition);
    if (switchPointIndex < 1) {
      continue;
    }

    const previousPosition = packet.route.points[switchPointIndex - 1];
    const switchSurface = getNetworkNodeSurfaceInset(switchPosition, previousPosition);
    const queueSpacing = 0.115;
    const oscillation = Math.sin(animationTime * 4.6 + queueIndex * 0.58) * 0.025;
    const queueDistance = switchSurface + 0.065 + queueIndex * queueSpacing + oscillation;
    const incomingSegmentLength =
      packet.route.cumulativeLengths[switchPointIndex] -
      packet.route.cumulativeLengths[switchPointIndex - 1];
    if (queueDistance >= incomingSegmentLength - 0.06) {
      break;
    }

    const distanceFromSource = packet.route.cumulativeLengths[switchPointIndex] - queueDistance;
    queuedPackets.push({
      color: packet.color,
      conversationIndex: packet.conversationIndex,
      position: getPointAlongRoute(packet.route, distanceFromSource / packet.route.totalLength),
      strength: 0.65 + Math.sin(animationTime * 5 + queueIndex * 0.84) * 0.18,
      switchIndex
    });
  }

  return queuedPackets;
}

export function makeSwitchPacketEvents({
  packets,
  conversationRoutes,
  scenario,
  startedAt,
  switchIndex
}: {
  packets: readonly Packet[];
  conversationRoutes: readonly ConversationRoute[];
  scenario: NetworkScenario;
  startedAt: number;
  switchIndex: number;
}): NetworkPacketEvent[] {
  const switchPosition = SWITCH_POSITIONS[switchIndex];
  if (!switchPosition) {
    return [];
  }

  const affectedPackets = packets.filter(packet =>
    packet.route.points.some(position => position === switchPosition)
  );
  const alternateRoutes = getHealthyConversationRoutes(conversationRoutes, new Set([switchIndex]));
  const events: NetworkPacketEvent[] = [];
  const packetsPerConversation = scenario === 'failure' ? 2 : 1;

  for (let sequenceIndex = 0; sequenceIndex < packetsPerConversation; sequenceIndex++) {
    for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
      const affectedPacket = affectedPackets.find(
        packet =>
          packet.conversationIndex === conversationIndex &&
          Math.floor(packet.preferredRouteIndex / SPINE_POSITIONS.length) === sequenceIndex
      );
      if (!affectedPacket) {
        continue;
      }

      const eventIndex = sequenceIndex * CONVERSATIONS.length + conversationIndex;
      const eventStartedAt = startedAt + 0.08 + eventIndex * 0.085;
      const baseEvent = {
        color: affectedPacket.color,
        conversationIndex,
        route: affectedPacket.route,
        switchIndex
      };

      if (scenario === 'failure') {
        events.push({
          ...baseEvent,
          duration: 0.68,
          kind: 'dropped-payload',
          startedAt: eventStartedAt
        });
      } else {
        events.push({
          ...baseEvent,
          duration: 0.58,
          kind: 'trimmed-payload',
          startedAt: eventStartedAt
        });
        events.push({
          ...baseEvent,
          duration: 1.05,
          kind: 'trimmed-header',
          startedAt: eventStartedAt
        });
      }

      const alternateRoute = alternateRoutes.find(
        candidate => candidate.conversationIndex === conversationIndex
      );
      if (alternateRoute) {
        events.push({
          ...baseEvent,
          duration: alternateRoute.route.totalLength / (PACKET_TRAVEL_SPEED * 1.16),
          kind: 'retransmission',
          route: alternateRoute.route,
          startedAt:
            startedAt +
            (scenario === 'failure' ? FAILURE_DETECTION_DELAY + 0.08 : 0.42) +
            eventIndex * 0.085
        });
      }
    }
  }

  return events;
}

export function makeSwitchProbeEvent(
  conversationRoutes: readonly ConversationRoute[],
  switchIndex: number,
  startedAt: number,
  unavailableSwitchIndices?: ReadonlySet<number>
): NetworkPacketEvent | null {
  const switchPosition = SWITCH_POSITIONS[switchIndex];
  if (!switchPosition) {
    return null;
  }

  const conversationRoute = conversationRoutes.find(
    ({route}) =>
      route.points.some(position => position === switchPosition) &&
      route.points.every(
        position =>
          position === switchPosition ||
          !unavailableSwitchIndices ||
          !isFailedSwitchPosition(position, unavailableSwitchIndices)
      )
  );
  const route =
    conversationRoute?.route ||
    makePhysicalSwitchProbeRoute(conversationRoutes, switchPosition, unavailableSwitchIndices);
  if (!route) {
    return null;
  }

  return {
    color: [0.35, 0.7, 1, 0.76],
    conversationIndex: conversationRoute?.conversationIndex ?? 0,
    duration: SWITCH_PROBE_DURATION,
    kind: 'probe',
    route,
    startedAt,
    switchIndex
  };
}

function makePhysicalSwitchProbeRoute(
  conversationRoutes: readonly ConversationRoute[],
  targetSwitchPosition: Vector3,
  unavailableSwitchIndices?: ReadonlySet<number>
): Route | null {
  const neighbors = new Map<Vector3, Vector3[]>();

  for (const {start, end} of makeLinks(conversationRoutes)) {
    const startNeighbors = neighbors.get(start) || [];
    startNeighbors.push(end);
    neighbors.set(start, startNeighbors);

    const endNeighbors = neighbors.get(end) || [];
    endNeighbors.push(start);
    neighbors.set(end, endNeighbors);
  }

  const queue = HOST_POSITIONS.map(position => ({position, path: [position]}));
  const visitedPositions = new Set<Vector3>(HOST_POSITIONS);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.position === targetSwitchPosition) {
      return makeRoute(current.path);
    }

    for (const neighbor of neighbors.get(current.position) || []) {
      if (
        visitedPositions.has(neighbor) ||
        (neighbor !== targetSwitchPosition &&
          unavailableSwitchIndices &&
          isFailedSwitchPosition(neighbor, unavailableSwitchIndices))
      ) {
        continue;
      }

      visitedPositions.add(neighbor);
      queue.push({position: neighbor, path: [...current.path, neighbor]});
    }
  }

  return null;
}

/** Sends a successful cyan path confirmation back toward the recovery-probe source. */
export function makeSwitchProbeConfirmationEvent(probe: NetworkPacketEvent): NetworkPacketEvent {
  return {
    ...probe,
    color: [0.2, 1, 0.8, 0.84],
    duration: SWITCH_CONFIRMATION_DURATION,
    kind: 'probe-confirmation',
    startedAt: probe.startedAt + probe.duration
  };
}

/** Checks whether a control packet can still traverse its complete physical switch route. */
export function isSwitchProbeRouteAvailable(
  probe: NetworkPacketEvent,
  unavailableSwitchIndices: ReadonlySet<number>
): boolean {
  const targetSwitchPosition = SWITCH_POSITIONS[probe.switchIndex];
  const targetPositionIndex = targetSwitchPosition
    ? probe.route.points.indexOf(targetSwitchPosition)
    : -1;
  return (
    targetPositionIndex >= 0 &&
    probe.route.points
      .slice(0, targetPositionIndex + 1)
      .every(
        position =>
          position === targetSwitchPosition ||
          !isFailedSwitchPosition(position, unavailableSwitchIndices)
      )
  );
}

/** Creates a restrained state-transition wave centered on a physical switch. */
export function makeSwitchTransitionWave(
  switchIndex: number,
  kind: NetworkSwitchTransitionKind,
  startedAt: number
): NetworkSwitchTransitionWave {
  return {
    color: kind === 'failure' ? [1, 0.24, 0.07, 0.58] : [0.18, 0.88, 1, 0.52],
    duration: SWITCH_TRANSITION_WAVE_DURATION,
    kind,
    startedAt,
    switchIndex
  };
}

export function getHealthyConversationRoutes(
  conversationRoutes: readonly ConversationRoute[],
  failedSwitchIndices: ReadonlySet<number>,
  recoveringSwitchIndices?: ReadonlySet<number>
): ConversationRoute[] {
  return conversationRoutes.filter(({route}) =>
    route.points.every(
      position =>
        !isFailedSwitchPosition(position, failedSwitchIndices) &&
        (!recoveringSwitchIndices || !isFailedSwitchPosition(position, recoveringSwitchIndices))
    )
  );
}

export function reroutePackets(
  packets: Packet[],
  healthyRoutes: readonly ConversationRoute[],
  congestedSwitchIndices?: ReadonlySet<number>
): void {
  const scheduledRoutesByConversation = new Map<number, ConversationRoute[]>();

  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const conversationRoutes = healthyRoutes.filter(
      route => route.conversationIndex === conversationIndex
    );
    const uncongestedRoutes = congestedSwitchIndices
      ? conversationRoutes.filter(({route}) =>
          route.points.every(position => !isFailedSwitchPosition(position, congestedSwitchIndices))
        )
      : conversationRoutes;

    if (uncongestedRoutes.length === 0 || uncongestedRoutes.length === conversationRoutes.length) {
      scheduledRoutesByConversation.set(conversationIndex, conversationRoutes);
      continue;
    }

    const congestedRoutes = conversationRoutes.filter(route => !uncongestedRoutes.includes(route));
    scheduledRoutesByConversation.set(conversationIndex, [
      ...uncongestedRoutes,
      ...congestedRoutes,
      ...uncongestedRoutes,
      ...uncongestedRoutes
    ]);
  }

  for (const packet of packets) {
    const conversationRoutes = scheduledRoutesByConversation.get(packet.conversationIndex) || [];
    packet.enabled = conversationRoutes.length > 0;
    if (packet.enabled) {
      packet.route =
        conversationRoutes[packet.preferredRouteIndex % conversationRoutes.length].route;
    }
  }
}

/** Summarizes the health and red/green packet allocation of each independent spine path. */
export function makeNetworkPlaneTelemetry(
  conversationRoutes: readonly ConversationRoute[],
  packets: readonly Packet[],
  failedSwitchIndices: ReadonlySet<number>,
  recoveringSwitchIndices: ReadonlySet<number>,
  congestedSwitchIndices: ReadonlySet<number>
): NetworkPlaneTelemetry[] {
  return SPINE_POSITIONS.map((spinePosition, planeIndex) => {
    const planeRoutes = conversationRoutes.filter(({route}) =>
      route.points.includes(spinePosition)
    );
    const failed = planeRoutes.every(({route}) =>
      route.points.some(position => isFailedSwitchPosition(position, failedSwitchIndices))
    );
    const recovering = planeRoutes.every(({route}) =>
      route.points.some(
        position =>
          isFailedSwitchPosition(position, failedSwitchIndices) ||
          isFailedSwitchPosition(position, recoveringSwitchIndices)
      )
    );
    const congested = planeRoutes.some(({route}) =>
      route.points.some(position => isFailedSwitchPosition(position, congestedSwitchIndices))
    );
    const planePackets = packets.filter(
      packet => packet.enabled && packet.route.points.includes(spinePosition)
    );

    return {
      planeIndex,
      redPacketCount: planePackets.filter(packet => packet.conversationIndex === 0).length,
      greenPacketCount: planePackets.filter(packet => packet.conversationIndex === 1).length,
      status: failed ? 'failed' : recovering ? 'recovering' : congested ? 'congested' : 'healthy'
    };
  });
}

/** Summarizes the two physical switch planes independently from their four backbone paths. */
export function makeNetworkSwitchPlaneTelemetry(
  conversationRoutes: readonly ConversationRoute[],
  packets: readonly Packet[],
  failedSwitchIndices: ReadonlySet<number>,
  recoveringSwitchIndices: ReadonlySet<number>,
  congestedSwitchIndices: ReadonlySet<number>
): NetworkPlaneTelemetry[] {
  return Array.from({length: NETWORK_SWITCH_PLANE_COUNT}, (_, planeIndex) => {
    const switchIndices = new Set(getNetworkPlaneSwitchIndices(planeIndex));
    const planeRoutes = conversationRoutes.filter(({route}) =>
      route.points.some(position => {
        const switchIndex = SWITCH_INDICES_BY_POSITION.get(position.join(','));
        return switchIndex !== undefined && switchIndices.has(switchIndex);
      })
    );
    const failed = planeRoutes.every(({route}) =>
      route.points.some(position => isFailedSwitchPosition(position, failedSwitchIndices))
    );
    const recovering = [...switchIndices].some(switchIndex =>
      recoveringSwitchIndices.has(switchIndex)
    );
    const congested = [...switchIndices].some(
      switchIndex => congestedSwitchIndices.has(switchIndex) || failedSwitchIndices.has(switchIndex)
    );
    const planePackets = packets.filter(
      packet =>
        packet.enabled &&
        packet.route.points.some(position => {
          const switchIndex = SWITCH_INDICES_BY_POSITION.get(position.join(','));
          return switchIndex !== undefined && switchIndices.has(switchIndex);
        })
    );

    return {
      planeIndex,
      redPacketCount: planePackets.filter(packet => packet.conversationIndex === 0).length,
      greenPacketCount: planePackets.filter(packet => packet.conversationIndex === 1).length,
      status: failed ? 'failed' : recovering ? 'recovering' : congested ? 'congested' : 'healthy'
    };
  });
}

/** Measures current path capacity and exceptional packet handling without estimating bandwidth. */
export function makeNetworkFabricTelemetry(
  spinePaths: readonly NetworkPlaneTelemetry[],
  queuedPackets: readonly NetworkQueuedPacket[],
  packetEvents: readonly NetworkPacketEvent[],
  animationTime: number
): NetworkFabricTelemetry {
  const activeEvents = packetEvents.filter(
    event => animationTime >= event.startedAt && animationTime <= event.startedAt + event.duration
  );
  const totalPathCount = spinePaths.length;
  const activePathCount = spinePaths.filter(
    path => path.status !== 'failed' && path.status !== 'recovering'
  ).length;
  const droppedPayloadCount = activeEvents.filter(event => event.kind === 'dropped-payload').length;
  const trimmedPayloadCount = activeEvents.filter(event => event.kind === 'trimmed-payload').length;
  const retransmissionCount = activeEvents.filter(event => event.kind === 'retransmission').length;
  const controlPacketCount = activeEvents.filter(
    event => event.kind === 'probe' || event.kind === 'probe-confirmation'
  ).length;
  const hasCongestion = spinePaths.some(path => path.status === 'congested');
  const hasUnavailablePath = activePathCount < totalPathCount;
  const state: NetworkFabricState = controlPacketCount
    ? 'probing'
    : droppedPayloadCount || retransmissionCount
      ? 'rerouting'
      : queuedPackets.length || trimmedPayloadCount || hasCongestion
        ? 'congested'
        : hasUnavailablePath
          ? 'degraded'
          : 'balanced';

  return {
    activePathCount,
    capacityPercent: totalPathCount ? Math.round((activePathCount / totalPathCount) * 100) : 0,
    controlPacketCount,
    droppedPayloadCount,
    queuedPacketCount: queuedPackets.length,
    retransmissionCount,
    state,
    totalPathCount,
    trimmedPayloadCount
  };
}

/** Produces bounded source-launch and destination-delivery activity for active conversations. */
export function makeEndpointSignals(
  packets: readonly Packet[],
  animationTime: number,
  duration = ENDPOINT_SIGNAL_DURATION
): NetworkEndpointSignal[] {
  if (duration <= 0) {
    return [];
  }

  const signalsByHost = new Map<number, NetworkEndpointSignal>();

  for (const packet of packets) {
    if (!packet.enabled) {
      continue;
    }

    const conversation = CONVERSATIONS[packet.conversationIndex];
    const endpointEvents: [number, NetworkEndpointSignalKind, number][] = [
      [conversation.sourceHostIndex, 'source', packet.launchTime],
      [
        conversation.destinationHostIndex,
        'destination',
        packet.launchTime + packet.route.totalLength / PACKET_TRAVEL_SPEED
      ]
    ];

    for (const [hostIndex, kind, eventTime] of endpointEvents) {
      const age =
        (((animationTime - eventTime) % BURST_CYCLE_DURATION) + BURST_CYCLE_DURATION) %
        BURST_CYCLE_DURATION;
      if (age > duration) {
        continue;
      }

      const progress = age / duration;
      const strength = Math.sin(progress * Math.PI) * (1 - progress * 0.28);
      const currentSignal = signalsByHost.get(hostIndex);
      if (currentSignal) {
        currentSignal.strength = Math.min(currentSignal.strength + strength * 0.55, 1);
      } else {
        signalsByHost.set(hostIndex, {
          color: packet.color,
          conversationIndex: packet.conversationIndex,
          hostIndex,
          kind,
          strength
        });
      }
    }
  }

  return [...signalsByHost.values()];
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

/** Classifies visible packets by their current route segment and traffic color. */
export function makeLinkTraffic(
  packets: readonly Packet[],
  animationTime: number
): Map<string, NetworkLinkTraffic> {
  const trafficByLink = new Map<string, NetworkLinkTraffic>();

  for (const packet of packets) {
    const segment = getVisiblePacketRouteSegment(packet, animationTime);
    if (!segment) {
      continue;
    }

    const linkKey = makeLinkKey(
      packet.route.points[segment.segmentIndex],
      packet.route.points[segment.segmentIndex + 1]
    );
    const linkTraffic = trafficByLink.get(linkKey) || {red: 0, green: 0};
    linkTraffic.red += packet.color[0];
    linkTraffic.green += packet.color[1];
    trafficByLink.set(linkKey, linkTraffic);
  }

  return trafficByLink;
}

/** Produces directional packet wakes that never cross a switch or server boundary. */
export function makeLinkPulses(
  packets: readonly Packet[],
  animationTime: number,
  pulseLength: number
): NetworkLinkPulse[] {
  if (pulseLength <= 0) {
    return [];
  }

  const pulses: NetworkLinkPulse[] = [];

  for (const packet of packets) {
    const segment = getVisiblePacketRouteSegment(packet, animationTime);
    if (!segment) {
      continue;
    }

    const startPosition = packet.route.points[segment.segmentIndex];
    const endPosition = packet.route.points[segment.segmentIndex + 1];
    const segmentStart =
      packet.route.cumulativeLengths[segment.segmentIndex] +
      getNetworkNodeSurfaceInset(startPosition, endPosition);
    const segmentEnd =
      packet.route.cumulativeLengths[segment.segmentIndex + 1] -
      getNetworkNodeSurfaceInset(endPosition, startPosition);
    const pulseStart = Math.max(segmentStart, segment.packetDistance - pulseLength * 0.82);
    const pulseEnd = Math.min(segmentEnd, segment.packetDistance + pulseLength * 0.18);
    if (pulseEnd - pulseStart < 0.015) {
      continue;
    }

    pulses.push({
      color: packet.color,
      conversationIndex: packet.conversationIndex,
      end: getPointAlongRoute(packet.route, pulseEnd / packet.route.totalLength),
      linkKey: makeLinkKey(startPosition, endPosition),
      start: getPointAlongRoute(packet.route, pulseStart / packet.route.totalLength)
    });
  }

  return pulses;
}

function getVisiblePacketRouteSegment(
  packet: Packet,
  animationTime: number
): {packetDistance: number; segmentIndex: number} | null {
  if (!packet.enabled) {
    return null;
  }

  const packetAge =
    (((animationTime - packet.launchTime) % BURST_CYCLE_DURATION) + BURST_CYCLE_DURATION) %
    BURST_CYCLE_DURATION;
  const packetDistance = packetAge * PACKET_TRAVEL_SPEED;
  if (packetDistance > packet.route.totalLength) {
    return null;
  }

  let segmentIndex = 0;
  while (
    segmentIndex < packet.route.cumulativeLengths.length - 2 &&
    packet.route.cumulativeLengths[segmentIndex + 1] < packetDistance
  ) {
    segmentIndex++;
  }

  return {packetDistance, segmentIndex};
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

function makeRoute(points: Vector3[]): Route {
  const cumulativeLengths = [0];
  let totalLength = 0;
  for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
    totalLength += getDistance(points[pointIndex - 1], points[pointIndex]);
    cumulativeLengths.push(totalLength);
  }
  return {points, cumulativeLengths, totalLength};
}

function getNetworkNodeSurfaceInset(position: Vector3, toward: Vector3): number {
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
