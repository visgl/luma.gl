import {Vector2, Vector3} from 'math.gl';

const scratchPos0 = new Vector3();
const scratchPos1 = new Vector3();
const scratchPos2 = new Vector3();

const scratchUV0 = new Vector2();
const scratchUV1 = new Vector2();
const scratchUV2 = new Vector2();

const scratchT1 = new Vector3();
const scratchT2 = new Vector3();
const scratchB1 = new Vector3();
const scratchB2 = new Vector3();

export function calculateTangents(positions, texCoords, indices) {
  const tangents = new Float32Array(positions.length);
  const bitangents = new Float32Array(positions.length);
  const length = indices ? indices.length : positions.length / 3;

  for (let i = 0; i < length; i += 3) {
    const locations = indices ? [indices[i], indices[i + 1], indices[i + 2]] : [i, i + 1, i + 2];
    const [v0, v1, v2] = locations;
    scratchPos0.set(positions[v0 * 3], positions[v0 * 3 + 1], positions[v0 * 3 + 2]);
    scratchUV0.set(texCoords[v0 * 2], texCoords[v0 * 2 + 1]);

    scratchPos1.set(positions[v1 * 3], positions[v1 * 3 + 1], positions[v1 * 3 + 2]);
    scratchUV1.set(texCoords[v1 * 2], texCoords[v1 * 2 + 1]);

    scratchPos2.set(positions[v2 * 3], positions[v2 * 3 + 1], positions[v2 * 3 + 2]);
    scratchUV2.set(texCoords[v2 * 2], texCoords[v2 * 2 + 1]);

    const deltaPos1 = scratchPos1.subtract(scratchPos0);
    const deltaPos2 = scratchPos2.subtract(scratchPos0);

    const deltaUV1 = scratchUV1.subtract(scratchUV0);
    const deltaUV2 = scratchUV2.subtract(scratchUV0);

    const r = 1 / (deltaUV1.x * deltaUV2.y - deltaUV1.y * deltaUV2.x);

    // vec3 tangent = (deltaPos1 * deltaUV2.y - deltaPos2 * deltaUV1.y)*r;
    // vec3 bitangent = (deltaPos2 * deltaUV1.x - deltaPos1 * deltaUV2.x)*r;
    const t1 = scratchT1.set(deltaPos1.x, deltaPos1.y, deltaPos1.z).multiplyScalar(deltaUV2.y);
    const t2 = scratchT2.set(deltaPos2.x, deltaPos2.y, deltaPos2.z).multiplyScalar(deltaUV1.y);
    const tangent = t1.subtract(t2).multiplyScalar(r);

    const b1 = scratchB1.set(deltaPos2.x, deltaPos2.y, deltaPos2.z).multiplyScalar(deltaUV1.x);
    const b2 = scratchB2.set(deltaPos1.x, deltaPos1.y, deltaPos1.z).multiplyScalar(deltaUV2.x);
    const bitangent = b1.subtract(b2).multiplyScalar(r);

    for (const v of locations) {
      const index = v * 3;
      tangents[index] += tangent.x;
      tangents[index + 1] += tangent.y;
      tangents[index + 2] += tangent.z;

      bitangents[index] += bitangent.x;
      bitangents[index + 1] += bitangent.y;
      bitangents[index + 2] += bitangent.z;
    }
  }

  return {tangents, bitangents};
}
