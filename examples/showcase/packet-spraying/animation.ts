// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CONVERSATIONS,
  HOST_POSITIONS,
  NETWORK_SWITCH_PLANE_COUNT,
  SPINE_POSITIONS,
  SWITCH_POSITIONS,
  getDistance,
  getNetworkNodeSurfaceInset,
  getNetworkPlaneSwitchIndices,
  getNetworkSwitchIndex,
  getPointAlongRoute,
  isFailedSwitchPosition,
  makeLinkKey,
  makeLinks,
  makeNetworkRoute,
  type Color,
  type ConversationRoute,
  type NetworkEndpointSignal,
  type NetworkEndpointSignalKind,
  type NetworkFabricState,
  type NetworkFabricTelemetry,
  type NetworkLinkPulse,
  type NetworkLinkTraffic,
  type NetworkPacketEvent,
  type NetworkPlaneTelemetry,
  type NetworkQueuedPacket,
  type NetworkScenario,
  type NetworkSwitchTransitionKind,
  type NetworkSwitchTransitionWave,
  type Packet,
  type Route,
  type SwitchArrival,
  type Vector3
} from './network';

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
      const switchIndex = getNetworkSwitchIndex(packet.route.points[pointIndex]);
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
      return makeNetworkRoute(current.path);
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
        const switchIndex = getNetworkSwitchIndex(position);
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
          const switchIndex = getNetworkSwitchIndex(position);
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

/** Classifies visible packets by their current route segment and traffic color. */
export function makeLinkTraffic(
  packets: readonly Packet[],
  animationTime: number,
  packetEvents: readonly NetworkPacketEvent[] = []
): Map<string, NetworkLinkTraffic> {
  const trafficByLink = new Map<string, NetworkLinkTraffic>();

  for (const packet of packets) {
    const segment = getVisiblePacketRouteSegment(packet, animationTime);
    if (!segment) {
      continue;
    }

    addLinkTraffic(trafficByLink, packet.route, segment.segmentIndex, packet.color);
  }

  for (const packetEvent of packetEvents) {
    if (packetEvent.kind === 'dropped-payload' || packetEvent.kind === 'trimmed-payload') {
      continue;
    }

    const packetAge = animationTime - packetEvent.startedAt;
    if (packetAge < 0 || packetAge > packetEvent.duration) {
      continue;
    }

    if (packetEvent.kind === 'retransmission') {
      const packetDistance = Math.min(
        packetEvent.route.totalLength,
        packetAge * PACKET_TRAVEL_SPEED * 1.16
      );
      addLinkTraffic(
        trafficByLink,
        packetEvent.route,
        getRouteSegmentIndex(packetEvent.route, packetDistance),
        packetEvent.color
      );
      continue;
    }

    const switchPosition = SWITCH_POSITIONS[packetEvent.switchIndex];
    const switchPointIndex = packetEvent.route.points.indexOf(switchPosition);
    if (!switchPosition || switchPointIndex < 0) {
      continue;
    }

    const switchDistance = packetEvent.route.cumulativeLengths[switchPointIndex];
    let packetDistance: number;
    switch (packetEvent.kind) {
      case 'trimmed-header':
        packetDistance = Math.min(
          packetEvent.route.totalLength,
          switchDistance + packetAge * PACKET_TRAVEL_SPEED
        );
        break;
      case 'probe-confirmation':
        packetDistance = switchDistance * (1 - packetAge / packetEvent.duration);
        break;
      case 'probe':
        packetDistance = (switchDistance * packetAge) / packetEvent.duration;
        break;
    }

    addLinkTraffic(
      trafficByLink,
      packetEvent.route,
      getRouteSegmentIndex(packetEvent.route, packetDistance),
      packetEvent.color
    );
  }

  return trafficByLink;
}

function addLinkTraffic(
  trafficByLink: Map<string, NetworkLinkTraffic>,
  route: Route,
  segmentIndex: number,
  color: Color
): void {
  const linkKey = makeLinkKey(route.points[segmentIndex], route.points[segmentIndex + 1]);
  const linkTraffic = trafficByLink.get(linkKey) || {red: 0, green: 0};
  linkTraffic.red += color[0];
  linkTraffic.green += color[1];
  if (color[2] > 0) {
    linkTraffic.blue = (linkTraffic.blue ?? 0) + color[2];
  }
  trafficByLink.set(linkKey, linkTraffic);
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

  return {packetDistance, segmentIndex: getRouteSegmentIndex(packet.route, packetDistance)};
}

function getRouteSegmentIndex(route: Route, packetDistance: number): number {
  let segmentIndex = 0;
  while (
    segmentIndex < route.cumulativeLengths.length - 2 &&
    route.cumulativeLengths[segmentIndex + 1] < packetDistance
  ) {
    segmentIndex++;
  }

  return segmentIndex;
}
