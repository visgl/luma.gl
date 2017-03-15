///////////////////////////////////////
//
//
//
// Intersects a ray with the qj set w/ parameter mu and returns
// the color of the phong shaded surface (estimate)
// (Surface also colored by normal direction)
//
//   Adapted by Nicolas Garcia Belmonte from original work by Keenan Crane (kcrane@uiuc.edu)
//
//

#ifdef GL_ES
precision highp float;
#endif

//
// Some constants used in the ray tracing process.  (These constants
// were determined through trial and error and are not by any means
// optimal.)

// radius of a bounding sphere for the set used to accelerate intersection
#define BOUNDING_RADIUS_2  3.0

// any series whose points' magnitude exceed this threshold are considered divergent
#define ESCAPE_THRESHOLD   7.0

// delta is used in the finite difference approximation of the gradient (to determine normals)
#define DEL                0.0001

#define MAX_ITERATIONS     10


// --------- quaternion representation -----------------------------------------
//
// Each quaternion can be specified by four scalars q = A + Bi + Cj + Dk, so are
// stored as a vec4.  I've tried a struct containing a separate scalar and
// 3-vector to avoid a lot of swizzling, but the vec4 representation ends up
// using fewer instructions.  A matrix representation is also possible.
//


// -------- quatMult() ----------------------------------------------------------
//
// Returns the product of quaternions q1 and q2.
// Note that quaternion multiplication is NOT commutative (i.e., q1 ** q2 != q2 ** q1 ).
//

vec4 quatMult( vec4 q1, vec4 q2 ) {
   vec4 r;

   r.x   = q1.x * q2.x - dot( q1.yzw, q2.yzw );
   r.yzw = q1.x * q2.yzw + q2.x * q1.yzw + cross( q1.yzw, q2.yzw );

   return r;
}

// ------- quatSq() --------------------------------------------------------------
//
// Returns the square of quaternion q.  This function is a special (optimized)
// case of quatMult().
//

vec4 quatSq( vec4 q ) {
   vec4 r;

   r.x   = q.x * q.x - dot( q.yzw, q.yzw );
   r.yzw = 2.0 * q.x * q.yzw;

   return r;
}

// ------- iterateIntersect() -----------------------------------------------------
//
// Iterates the quaternion q for the purposes of intersection.  This function also
// produces an estimate of the derivative at q, which is required for the distance
// estimate.  The quaternion c is the parameter specifying the Julia set, and the
// integer maxIterations is the maximum number of iterations used to determine
// whether a point is in the set or not.
//
// To estimate membership in the set, we recursively evaluate
//
// q = q*q + c
//
// until q has a magnitude greater than the threshold value (i.e., it probably
// diverges) or we've reached the maximum number of allowable iterations (i.e.,
// it probably converges).  More iterations reveal greater detail in the set.
//\
// To estimate the derivative at q, we recursively evaluate
//
// q' = 2*q*q'
//
// concurrently with the evaluation of q.
//

void iterateIntersect( inout vec4 q, inout vec4 qp, vec4 c, int maxIterations ) {
   for( int i = 0; i < MAX_ITERATIONS; i++ ) {
      if ( i >= maxIterations ) {
        break;
      }
      qp = 2.0 * quatMult(q, qp);
      q = quatSq(q) + c;

      if( dot( q, q ) > ESCAPE_THRESHOLD ) {
         break;
      }
   }
}

// ----------- normEstimate() -------------------------------------------------------
//
// Create a shading normal for the current point.  We use an approximate normal of
// the isosurface of the potential function, though there are other ways to
// generate a normal (e.g., from an isosurface of the potential function).
//

vec3 normEstimate(vec3 p, vec4 c, int maxIterations ) {
   vec3 N;
   vec4 qP = vec4( p, 0.0 );
   float gradX, gradY, gradZ;

   vec4 gx1 = qP - vec4( DEL, 0.0, 0.0, 0.0 );
   vec4 gx2 = qP + vec4( DEL, 0.0, 0.0, 0.0 );
   vec4 gy1 = qP - vec4( 0.0, DEL, 0.0, 0.0 );
   vec4 gy2 = qP + vec4( 0.0, DEL, 0.0, 0.0 );
   vec4 gz1 = qP - vec4( 0.0, 0.0, DEL, 0.0 );
   vec4 gz2 = qP + vec4( 0.0, 0.0, DEL, 0.0 );

   for( int i = 0; i < MAX_ITERATIONS; i++ ) {
      if ( i >= maxIterations ) {
        break;
      }
      gx1 = quatSq( gx1 ) + c;
      gx2 = quatSq( gx2 ) + c;
      gy1 = quatSq( gy1 ) + c;
      gy2 = quatSq( gy2 ) + c;
      gz1 = quatSq( gz1 ) + c;
      gz2 = quatSq( gz2 ) + c;
   }

   gradX = length(gx2) - length(gx1);
   gradY = length(gy2) - length(gy1);
   gradZ = length(gz2) - length(gz1);

   N = normalize(vec3( gradX, gradY, gradZ ));

   return N;
}

// ---------- intersectQJulia() ------------------------------------------
//
// Finds the intersection of a ray with origin rO and direction rD with the
// quaternion Julia set specified by quaternion constant c.  The intersection
// is found using iterative sphere tracing, which takes a conservative step
// along the ray at each iteration by estimating the minimum distance between
// the current ray origin and the closest point in the Julia set.  The
// parameter maxIterations is passed on to iterateIntersect() which determines
// whether the current ray origin is in (or near) the set.
//

float intersectQJulia( inout vec3 rO, inout vec3 rD, vec4 c, int maxIterations, float epsilon ) {
   float dist; // the (approximate) distance between the first point along the ray within
               // epsilon of some point in the Julia set, or the last point to be tested if
               // there was no intersection.

   for(int j = 0; j < 25; ++j) {

      // iterate on the point at the current ray origin.  We
      // want to know if this point belongs to the set.
      vec4 z = vec4( rO, 0.0 );

      vec4 zp = vec4( 1, 0.0, 0.0, 0.0 );
      // start the derivative at real 1.  The derivative is
      // needed to get a lower bound on the distance to the set.

      // iterate this point until we can guess if the sequence diverges or converges.
      iterateIntersect( z, zp, c, maxIterations );

      // find a lower bound on the distance to the Julia set and step this far along the ray.
      float normZ = length( z );
      dist = 0.5 * normZ * log( normZ ) / length( zp );  //lower bound on distance to surface

      rO += rD * dist; // (step)

      // Intersection testing finishes if we're close enough to the surface
      // (i.e., we're inside the epsilon isosurface of the distance estimator
      // function) or have left the bounding sphere.
      if( dist < epsilon || dot(rO, rO) > BOUNDING_RADIUS_2 ) {
         break;
      }
   }

   // return the distance for this ray
   return dist;
}

// ----------- Phong() --------------------------------------------------
//
// Computes the direct illumination for point pt with normal N due to
// a point light at light and a viewer at eye.
//

vec3 Phong( vec3 light, vec3 eye, vec3 pt, vec3 N ) {
   vec3 diffuse = vec3( 0.1, 0.45, 1.00 );     // base color of shading
   float specularExponent = 10.0;             // shininess of shading
   float specularity = 0.45;              // amplitude of specular highlight

   vec3 L     = normalize( light - pt );  // find the vector to the light
   vec3 E     = normalize( eye   - pt );  // find the vector to the eye
   float  NdotL = dot( N, L );            // find the cosine of the angle between light and normal
   vec3 R     = L - 2.0 * NdotL * N;        // find the reflected vector

   diffuse += abs( N ) * 0.3;  // add some of the normal to the
                             // color to make it more interesting

   // compute the illumination using the Phong equation
   return diffuse * max( NdotL, 0.0 ) + specularity * pow( max( dot( E, R ), 0.0 ), specularExponent );
}

// ---------- intersectSphere() ---------------------------------------
//
// Finds the intersection of a ray with a sphere with statically
// defined radius BOUNDING_RADIUS centered around the origin.  This
// sphere serves as a bounding volume for the Julia set.

vec3 intersectSphere( vec3 rO, vec3 rD ) {
   float B, C, d, t0, t1, t;

   B = 2.0 * dot( rO, rD );
   C = dot( rO, rO ) - BOUNDING_RADIUS_2;
   d = sqrt( B * B - 4.0 * C );
   t0 = ( -B + d ) * 0.5;
   t1 = ( -B - d ) * 0.5;
   t = min( t0, t1 );
   rO += t * rD;

   return rO;
}

// ------------ main() -------------------------------------------------
//
// Each fragment performs the intersection of a single ray with
// the quaternion Julia set.  In the current implementation
// the ray's origin and direction are passed in on texture
// coordinates, but could also be looked up in a texture for a
// more general set of rays.
//
// The overall procedure for intersection performed in main() is:
//
// -move the ray origin forward onto a bounding sphere surrounding the Julia set
// -test the new ray for the nearest intersection with the Julia set
// -if the ray does include a point in the set:
//    -estimate the gradient of the potential function to get a "normal"
//    -use the normal and other information to perform Phong shading
//    -cast a shadow ray from the point of intersection to the light
//    -if the shadow ray hits something, modify the Phong shaded color to represent shadow
// -return the shaded color if there was a hit and the background color otherwise
//

uniform vec3 rO;
varying vec3 rD;
uniform bool renderShadows;
uniform vec4 mu;              // quaternion constant specifying the particular set
uniform float epsilon;        // specifies precision of intersection
uniform vec3 light;           // location of a single point light
uniform int maxIterations; 
uniform vec4 backgroundColor; //background color
varying vec4 vColor;


void main() {
   vec4 color;  // This color is the final output of our program.
   vec3 rayDirection;
   vec3 rayOrigin;

   // Initially set the output color to the background color.  It will stay
   // this way unless we find an intersection with the Julia set.
   color = backgroundColor;


   // First, intersect the original ray with a sphere bounding the set, and
   // move the origin to the point of intersection.  This prevents an
   // unnecessarily large number of steps from being taken when looking for
   // intersection with the Julia set.

   rayDirection = normalize( rD );  //the ray direction is interpolated and may need to be normalized
   rayOrigin = intersectSphere( rO, rayDirection );


   // Next, try to find a point along the ray which intersects the Julia set.
   // (More details are given in the routine itself.)
   float dist = intersectQJulia( rayOrigin, rayDirection, mu, maxIterations, epsilon );



   // We say that we found an intersection if our estimate of the distance to
   // the set is smaller than some small value epsilon.  In this case we want
   // to do some shading / coloring.
   if( dist < epsilon ) {
      //    color = vColor;
      // Determine a "surface normal" which we'll use for lighting calculations.
      vec3 N = normEstimate( rayOrigin, mu, maxIterations );

      // Compute the Phong illumination at the point of intersection.
      color.rgb = Phong( light, rayDirection, rayOrigin, N );
      color.a = 1.0;  // (make this fragment opaque)

      // If the shadow flag is on, determine if this point is in shadow
      if( renderShadows == true ) {
         // The shadow ray will start at the intersection point and go
         // towards the point light.  We initially move the ray origin
         // a little bit along this direction so that we don't mistakenly
         // find an intersection with the same point again.

         vec3 L = normalize( light - rayOrigin );
         rayOrigin += N * epsilon * 2.0;
         dist = intersectQJulia( rayOrigin, L, mu, maxIterations, epsilon );

         // Again, if our estimate of the distance to the set is small, we say
         // that there was a hit.  In this case it means that the point is in
         // shadow and should be given darker shading.
         if( dist < epsilon )
            color.rgb *= 0.4;  // (darkening the shaded value is not really correct, but looks good)
      }
   }

   // Return the final color which is still the background color if we didn't hit anything.
   gl_FragColor = color;
}
