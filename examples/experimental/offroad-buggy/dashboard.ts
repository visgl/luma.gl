// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {PanelManager} from '@deck.gl-community/panels';
import {InfoBoxPanelContainer} from '../../example-info-box';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {applyExampleTheme} from '../../example-theme';

/** Mount the driving instruments and sample the physics readback at dashboard refresh rate. */
export function createDashboard(travel: number) {
  const host = document.querySelector<HTMLElement>('#info')!;
  const dashboard = document.querySelector<HTMLElement>('#dashboard')!;
  const speed = dashboard.querySelector<HTMLElement>('#speed')!;
  const horizon = dashboard.querySelector<HTMLElement>('#horizon')!;
  const angles = dashboard.querySelector<HTMLElement>('#angles')!;
  const frontLoad = dashboard.querySelector<HTMLElement>('#front-load')!;
  const load = dashboard.querySelector<HTMLElement>('#load')!;
  const status = dashboard.querySelector<HTMLOutputElement>('#status')!;
  const wheels = ['FL', 'FR', 'RL', 'RR'].map(name => {
    const label = document.createElement('label');
    const reading = document.createElement('span');
    const meter = document.createElement('meter');
    meter.max = travel;
    reading.textContent = name + ' —';
    label.append(reading, meter);
    dashboard.querySelector('#suspension')!.append(label);
    return {name, reading, meter};
  });
  frontLoad.hidden = true;
  applyExampleTheme(host, 'cinematic');
  const manager = new PanelManager({parentElement: host});
  manager.setProps({
    components: [
      new InfoBoxPanelContainer({
        title: 'Off-road buggy',
        subtitle: 'Chassis dynamics',
        appearance: 'cinematic',
        websiteBaseUrl: '/',
        style: {width: 360},
        initiallyCollapsed: false,
        panel: makeExampleTabbedPanel({
          id: 'buggy-tabs',
          theme: 'dark',
          panels: [
            makeHtmlCustomPanel({
              id: 'buggy-instruments',
              title: 'Telemetry',
              html: '',
              onRender: root => {
                configurePanelHostElement(root, 'cinematic');
                root.append(dashboard);
                dashboard.hidden = false;
                return () => {
                  dashboard.hidden = true;
                  document.body.append(dashboard);
                };
              }
            }),
            makeHtmlCustomPanel({
              id: 'buggy-controls',
              title: 'Driving',
              html: '<p>Use W/S or the arrow keys to drive forward and reverse. Steer with A/D or the left and right arrows. Hold Space to brake.</p><p>Drag to orbit and scroll to zoom. Chase camera follows the heading of the buggy.</p><p>Spring travel shows compression from full extension at each wheel. Axle load shows how the supported weight shifts between the front and rear wheels.</p>',
              onRender: root => configurePanelHostElement(root, 'cinematic')
            })
          ]
        })
      })
    ]
  });
  manager.onRedraw({viewports: [], layers: []});
  const plot = dashboard.querySelector<HTMLCanvasElement>('#motion')!;
  const context = plot.getContext('2d');
  const samples: {time: number; pitch: number; roll: number}[] = [];
  let previous = -Infinity;
  return (
    now: number,
    velocity: number,
    pitch: number,
    roll: number,
    demo: boolean,
    contacts: readonly {length: number; load: number}[]
  ) => {
    if (now - previous < 100) return;
    previous = now;
    samples.push({time: now, pitch, roll});
    while (samples[0].time < now - 6000) samples.shift();
    if (context && plot.getClientRects().length) {
      const middle = plot.height / 2;
      context.clearRect(0, 0, plot.width, plot.height);
      context.fillStyle = '#64748b';
      context.fillRect(0, middle, plot.width, 1);
      for (const axis of ['pitch', 'roll'] as const) {
        context.beginPath();
        for (const sample of samples) {
          const x = plot.width * (1 - (now - sample.time) / 6000);
          const y = middle - middle * Math.max(-1, Math.min(1, sample[axis] / 30));
          context.lineTo(x, y);
        }
        context.lineWidth = 2;
        context.strokeStyle = axis === 'pitch' ? '#38bdf8' : '#ce9e67';
        context.stroke();
      }
    }
    speed.textContent = String(Math.round(velocity * 3.6));
    status.value = demo ? 'Demo lap' : 'Manual';
    horizon.style.transform = `rotate(${-roll}deg) translateY(${Math.max(-30, Math.min(30, pitch))}px)`;
    angles.textContent = `Pitch ${Math.round(pitch)}° · Roll ${Math.round(roll)}°`;
    contacts.forEach((contact, index) => {
      const wheel = wheels[index];
      wheel.meter.value = travel - contact.length;
      wheel.reading.textContent = `${wheel.name} ${Math.round(wheel.meter.value * 100)} cm`;
    });
    const total = contacts.reduce((sum, contact) => sum + contact.load, 0);
    const percent =
      total > 0 ? Math.round((100 * (contacts[0].load + contacts[1].load)) / total) : 0;
    frontLoad.hidden = total <= 0;
    frontLoad.style.width = percent + '%';
    load.textContent = total > 0 ? `Front ${percent}% · Rear ${100 - percent}%` : 'No wheel load';
  };
}
