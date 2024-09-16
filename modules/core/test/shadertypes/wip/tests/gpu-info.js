import { describe, it } from '../mocha-support.js';

function objLikeToObj(objLike) {
  const obj = {};
  for (const k in objLike) {
    obj[k] = objLike[k];
  }
  return obj;
}

export async function getInfo() {
  const adapter = await navigator.gpu.requestAdapter();
  const title = JSON.stringify({
    gpu: objLikeToObj(adapter?.info || await adapter?.requestAdapterInfo() || { webgpuError: 'no info' }),
    userAgentData: JSON.parse(JSON.stringify(navigator.userAgentData || { userAgentData: 'none' })),
  }, null, 2);

  describe('gpu info', () => {
    it(title, () => {});
  });
}

