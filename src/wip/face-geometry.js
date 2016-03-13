import Geometry from '../geometry';
import {Vec3} from '../math';

export class FaceGeometry extends Geometry {

  computeCentroids() {
    const faces = this.faces;
    const vertices = this.vertices;
    const centroids = [];

    faces.forEach(face => {
      const centroid = [0, 0, 0];
      let acum = 0;

      face.forEach(idx => {
        const vertex = vertices[idx];
        centroid[0] += vertex[0];
        centroid[1] += vertex[1];
        centroid[2] += vertex[2];
        acum++;
      });

      centroid[0] /= acum;
      centroid[1] /= acum;
      centroid[2] /= acum;

      centroids.push(centroid);
    });

    this.centroids = centroids;
  }

  computeNormals() {
    const faces = this.faces;
    const vertices = this.vertices;
    const normals = [];

    faces.forEach(face => {
      const v1 = vertices[face[0]];
      const v2 = vertices[face[1]];
      const v3 = vertices[face[2]];
      const dir1 = {
        x: v3[0] - v2[0],
        y: v3[1] - v2[1],
        z: v3[1] - v2[2]
      };
      const dir2 = {
        x: v1[0] - v2[0],
        y: v1[1] - v2[1],
        z: v1[2] - v2[2]
      };

      Vec3.$cross(dir2, dir1);

      if (Vec3.norm(dir2) > 1e-6) {
        Vec3.unit(dir2);
      }

      normals.push([dir2.x, dir2.y, dir2.z]);
    });

    this.normals = normals;
  }
}
