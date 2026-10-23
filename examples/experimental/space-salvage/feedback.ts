// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyContactEvent} from '@luma.gl/gpu-graph/gpu-physics';

/** Bounded cosmetic feedback driven by public contact events, never collision solving. */
export function createCollisionFeedback() {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '2',
    overflow: 'hidden'
  });
  document.body.append(container);
  let context: AudioContext | null = null;
  let muted = false;
  let voices = 0;
  const unlock = () => {
    if (muted) return;
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  };
  const clear = () => {
    for (const animation of container.getAnimations({subtree: true})) animation.cancel();
    container.replaceChildren();
  };
  return {
    unlock,
    toggleSound() {
      muted = !muted;
      if (!muted) unlock();
      return !muted;
    },
    impact(event: GPURigidBodyContactEvent, extentX: number, extentY: number) {
      if (event.phase === 'end' || event.normalImpulse < 1) return;
      const strength = Math.min(1, event.normalImpulse / 12);
      const horizontal = ((event.point[0] / extentX + 1) * innerWidth) / 2;
      const vertical = ((1 - event.point[1] / extentY) * innerHeight) / 2;
      for (let index = 0; index < 6 && container.childElementCount < 72; index++) {
        const particle = document.createElement('span');
        const angle = (index * Math.PI) / 3 + event.sequence;
        Object.assign(particle.style, {
          position: 'absolute',
          left: `${horizontal}px`,
          top: `${vertical}px`,
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: '#ffc879',
          boxShadow: '0 0 7px #ffad48'
        });
        container.append(particle);
        const distance = 15 + strength * 35;
        const animation = particle.animate(
          [
            {transform: 'translate(0,0)', opacity: 1},
            {
              transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px)`,
              opacity: 0
            }
          ],
          {duration: 350, easing: 'ease-out'}
        );
        void animation.finished.catch(() => {}).finally(() => particle.remove());
      }
      if (!context || context.state !== 'running' || muted || voices >= 4) return;
      voices++;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(230, now);
      oscillator.frequency.exponentialRampToValueAtTime(75, now + 0.07);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035 + strength * 0.09, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      oscillator.connect(gain).connect(context.destination);
      oscillator.onended = () => {
        voices--;
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(now);
      oscillator.stop(now + 0.1);
    },
    clear,
    destroy() {
      clear();
      container.remove();
      void context?.close().catch(() => {});
    }
  };
}
