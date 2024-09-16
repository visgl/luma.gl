export default `

///////////////////////////////////////////////////////////////////////////////
// Common
alias material_index = u32;
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Ray

struct ray {
    orig: vec3f,
        dir : vec3f,
}

fn ray_at(r: ray, t: f32) -> vec3f {
    return r.orig + t * r.dir;
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Color

alias color = vec3f;
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Utils
fn length_squared(v: vec3f) -> f32 {
    let l = length(v);
    return l * l;
}

fn near_zero(v: vec3f) -> bool {
    const s = 1e-8;
    return length(v) < s;
}

fn random_in_unit_sphere() -> vec3f {
    var p: vec3f;
    while (true) {
        p = random_range_vec3f(-1, 1);
        if (length_squared(p) >= 1) {
            continue;
        }
        break;
    }
    return p;
}

fn random_unit_vector() -> vec3f {
    return normalize(random_in_unit_sphere());
}

fn random_in_hemisphere(normal: vec3f) -> vec3f {
    let in_unit_sphere = random_in_unit_sphere();
    if (dot(in_unit_sphere, normal) > 0.0) { // In the same hemisphere as the normal
        return in_unit_sphere;
    }
    else {
        return -in_unit_sphere;
    }
}

fn random_in_unit_disk() -> vec3f {
    var p: vec3f;
    while (true) {
        p = vec3f(random_range_f32(-1, 1), random_range_f32(-1, 1), 0);
        if (length_squared(p) >= 1) {
            continue;
        }
        break;
    }
    return p;
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Hittable
struct hit_record {
    p: vec3f,
        normal: vec3f,
            t: f32,
                front_face: bool,
                    mat: material_index,
}

fn hit_record_set_face_normal(rec: ptr<function, hit_record>, r: ray, outward_normal: vec3f) {
    (* rec).front_face = dot(r.dir, outward_normal) < 0.0;
    if ((* rec).front_face) {
        (* rec).normal = outward_normal;
    } else {
        (* rec).normal = -outward_normal;
    }
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Material

alias material_type = u32;
const MATERIAL_LAMBERTIAN: material_type = 0;
const MATERIAL_METAL: material_type = 1;
const MATERIAL_DIELECTRIC: material_type = 2;

struct lambertian_material {
    albedo: color,
}

struct metal_material {
    albedo: color,
        fuzz: f32,
}

struct dielectric_material {
    ir: f32 // index of refraction
}

struct material {
    // NOTE: ideally we'd use a discrimination union
    ty: material_type,
        lambertian: lambertian_material,
            metal: metal_material,
                dielectric: dielectric_material
}

@group(0) @binding(1)
    var<storage>materials: array<material>;

// fn material_create_lambertian(albedo: color) -> material {
//     var m: material;
//     m.ty = MATERIAL_LAMBERTIAN;
//     m.lambertian = lambertian_material(albedo);
//     return m;
// }

// fn material_create_metal(albedo: color, fuzz: f32) -> material {
//     var m: material;
//     m.ty = MATERIAL_METAL;
//     m.metal = metal_material(albedo, fuzz);
//     return m;
// }

// fn material_create_dielectric(ir: f32) -> material {
//     var m: material;
//     m.ty = MATERIAL_DIELECTRIC;
//     m.dielectric = dielectric_material(ir);
//     return m;
// }

// For the input ray and hit on the input material, returns true if the ray bounces, and if so,
// stores the color contribution (attenuation) from this material and the new bounce (scatter) ray.
fn material_scatter(mat: material_index, r_in: ray, rec: hit_record, attenuation: ptr<function, color>, scattered: ptr<function, ray>) -> bool {
    let m = materials[mat];
    if (m.ty == MATERIAL_LAMBERTIAN) {
        var scatter_direction = rec.normal + random_unit_vector();

        // Catch degenerate scatter direction
        if (near_zero(scatter_direction)) {
            scatter_direction = rec.normal;
        }

        * scattered = ray(rec.p, scatter_direction);
        * attenuation = m.lambertian.albedo;
        return true;

    } else if (m.ty == MATERIAL_METAL) {
        let reflected = reflect(normalize(r_in.dir), rec.normal);
        * scattered = ray(rec.p, reflected + m.metal.fuzz * random_in_unit_sphere());
        * attenuation = m.metal.albedo;
        // Only bounce rays that reflect in the same direction as the incident normal
        return dot((* scattered).dir, rec.normal) > 0;

    } else if (m.ty == MATERIAL_DIELECTRIC) {
        * attenuation = color(1, 1, 1);
        let refraction_ratio = select(m.dielectric.ir, 1.0 / m.dielectric.ir, rec.front_face);

        let unit_direction = normalize(r_in.dir);
        let cos_theta = min(dot(-unit_direction, rec.normal), 1.0);
        let sin_theta = sqrt(1.0 - cos_theta * cos_theta);

        let cannot_refract = (refraction_ratio * sin_theta) > 1.0;
        var direction: vec3f;

        if (cannot_refract || reflectance(cos_theta, refraction_ratio) > random_f32()) {
            direction = reflect(unit_direction, rec.normal);
        } else {
            direction = refract(unit_direction, rec.normal, refraction_ratio);
        }

        * scattered = ray(rec.p, direction);
        return true;
    }

    return false;
}

fn reflectance(cosine: f32, ref_idx: f32) -> f32 {
    // Use Schlick's approximation for reflectance.
    var r0 = (1 - ref_idx) / (1 + ref_idx);
    r0 = r0 * r0;
    return r0 + (1 - r0) * pow((1 - cosine), 5);
}

///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Sphere
struct sphere {
    center: vec3f,
        radius: f32,
            // mat: material, // TODO: index into storage buffer of materials
            mat: material_index,
}

fn sphere_hit(s: sphere, r: ray, t_min: f32, t_max: f32, rec: ptr<function, hit_record>) -> bool {
    let oc = r.orig - s.center;
    let a = length_squared(r.dir);
    let half_b = dot(oc, r.dir);
    let c = length_squared(oc) - s.radius * s.radius;
    let discriminant = half_b * half_b - a * c;

    if (discriminant < 0) {
        return false;
    }

    let sqrtd = sqrt(discriminant);

    // Find the nearest root that lies in the acceptable range.
    var root = (-half_b - sqrtd) / a;
    if (root < t_min || t_max < root) {
        root = (-half_b + sqrtd) / a;
        if (root < t_min || t_max < root) {
            return false;
        }
    }

    (* rec).t = root;
    (* rec).p = ray_at(r, (* rec).t);
    let outward_normal = ((* rec).p - s.center) / s.radius;
    hit_record_set_face_normal(rec, r, outward_normal);
    (* rec).mat = s.mat;

    return true;
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Hittable List
const MAX_NUM_SPHERES = 10;
struct hittable_list {
    spheres: array<sphere, MAX_NUM_SPHERES>, // TODO: remove fixed size, make this a uniform input struct
        spheres_size: u32,
}

fn hittable_list_add_sphere(list: ptr<function, hittable_list>, s: sphere) {
    (* list).spheres[(* list).spheres_size] = s;
    (* list).spheres_size += 1;
}

fn hittable_list_hit(list: ptr<function, hittable_list>, r: ray, t_min: f32, t_max: f32, rec: ptr<function, hit_record>) -> bool {
    var temp_rec: hit_record;
    var hit_anything = false;
    var closest_so_far = t_max;

    for (var i = 0u; i < (* list).spheres_size; i += 1u) {
        let s = ((* list).spheres)[i];
        // TODO: remove once we pass in this data as uniform
        if (s.radius == 0.0) {
            continue;
        }
        if (sphere_hit(s, r, t_min, closest_so_far, & temp_rec)) {
            hit_anything = true;
            closest_so_far = temp_rec.t;
            * rec = temp_rec;
        }
    }
    return hit_anything;
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Camera
struct camera {
    origin: vec3f,
        lower_left_corner: vec3f,
            horizontal: vec3f,
                vertical: vec3f,
                    u : vec3f,
                        v : vec3f,
                            w : vec3f,
                                lens_radius : f32,
}

fn camera_create(
                                    lookfrom: vec3f,
                                    lookat: vec3f,
                                    vup : vec3f,
                                    vfov: f32, // vertical field-of-view in degrees
                                    aspect_ratio: f32,
                                    aperture : f32,
                                    focus_dist: f32
                                ) -> camera {
    let theta = radians(vfov);
    let h = tan(theta / 2);
    let viewport_height = 2.0 * h;
    let viewport_width = aspect_ratio * viewport_height;

    // Note: vup, v, and w are all in the same plane
    let w = normalize(lookfrom - lookat);
    let u = normalize(cross(vup, w));
    let v = cross(w, u);

    let origin = lookfrom;
    let horizontal = focus_dist * viewport_width * u;
    let vertical = focus_dist * viewport_height * v;
    let lower_left_corner = origin - horizontal / 2 - vertical / 2 - focus_dist * w;
    let lens_radius = aperture / 2;

    return camera(origin, lower_left_corner, horizontal, vertical, u, v, w, lens_radius);
}

fn camera_get_ray(cam: ptr<function, camera>, s: f32, t: f32) -> ray {
    let rd = (* cam).lens_radius * random_in_unit_disk();
    let offset = (* cam).u * rd.x + (* cam).v * rd.y;
    return ray(
        (* cam).origin + offset,
        (* cam).lower_left_corner + s * (* cam).horizontal + t * (* cam).vertical - (* cam).origin - offset
    );
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Random

// Implementation copied from https://webgpu.github.io/webgpu-samples/samples/particles#./particle.wgsl
var<private>rand_seed : vec2<f32>;

fn init_rand(invocation_id : u32, seed : vec4<f32>) {
    rand_seed = seed.xz;
    rand_seed = fract(rand_seed * cos(35.456 + f32(invocation_id) * seed.yw));
    rand_seed = fract(rand_seed * cos(41.235 + f32(invocation_id) * seed.xw));
}

// Returns random value in [0.0, 1.0)
fn random_f32() -> f32 {
    rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
    rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
    return rand_seed.y;
}

fn random_range_f32(min: f32, max: f32) -> f32 {
    return mix(min, max, random_f32());
}

fn random_vec3f() -> vec3f {
    return vec3(random_f32(), random_f32(), random_f32());
}

fn random_range_vec3f(min: f32, max: f32) -> vec3f {
    return vec3(random_range_f32(min, max), random_range_f32(min, max), random_range_f32(min, max));
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Main

@group(0) @binding(0)
    var<storage, read_write > output : array<u32>;

const infinity = 3.402823466e+38; // NOTE: largest f32 instead of inf
const pi = 3.1415926535897932385;

fn ray_color(in_r: ray, world: ptr<function, hittable_list>, in_max_depth: i32) -> color {
    // Book uses recursion for bouncing rays. We can't recurse in WGSL, so convert algorithm to procedural.
    var r = in_r;
    var c: color = color(1, 1, 1);
    var rec: hit_record;
    var max_depth = in_max_depth;

    while (true) {
        if (hittable_list_hit(world, r, 0.001, infinity, & rec)) {
            var attenuation: color;
            var scattered: ray;
            if (material_scatter(rec.mat, r, rec, & attenuation, & scattered)) {
                c *= attenuation;
                r = scattered;
            } else {
                // Material does not contribute, final color is black
                c *= color(0, 0, 0);
                break;
            }

        } else {
            // If we hit nothing, return a blue sky color (linear blend of ray direction with white and blue)
            let unit_direction = normalize(r.dir);
            let t = 0.5 * (unit_direction.y + 1.0);
            c *= (1.0 - t) * color(1.0, 1.0, 1.0) + t * color(0.5, 0.7, 1.0);
            break;
        }

        // If we've exceeded the ray bounce limit, no more light is gathered.
        max_depth -= 1;
        if (max_depth <= 0) {
            c *= color(0, 0, 0);
            break;
        }
    }

    return c;
}

fn color_to_u32(c: color) -> u32 {
    let r = u32(c.r * 255.0);
    let g = u32(c.g * 255.0);
    let b = u32(c.b * 255.0);
    let a = 255u;

    // bgra8unorm
    return (a << 24) | (r << 16) | (g << 8) | b;

    // rgba8unorm
    // return (a << 24) | (b << 16) | (g << 8) | r;
}

fn write_color(offset: u32, pixel_color: color, samples_per_pixel: u32) {
    var c = pixel_color;
    // Divide the color by the number of samples.
    c /= f32(samples_per_pixel);

    // And gamma-correct for gamma=2.0.
    c = sqrt(c);

    output[offset] = color_to_u32(c);
}

@compute @workgroup_size(256)
fn main(
    @builtin(global_invocation_id) global_invocation_id: vec3<u32>,
    ) {
    init_rand(global_invocation_id.x, vec4(vec3f(global_invocation_id), 1.0));

    // Image
    const aspect_ratio = 832f / 468f;

    // World
    var world: hittable_list;

    // let material_ground = material_create_lambertian(color(0.8, 0.8, 0.0));
    // let material_center = material_create_lambertian(color(0.1, 0.2, 0.5));
    // let material_left = material_create_dielectric(1.5);
    // let material_right = material_create_metal(color(0.8, 0.6, 0.2), 0.0);

    let material_idx = 0u;

    hittable_list_add_sphere(& world, sphere(vec3(0.0, -100.5, -1.0), 100.0, material_idx));
    hittable_list_add_sphere(& world, sphere(vec3(0.0, 0.0, -1.0), 0.5, material_idx));
    hittable_list_add_sphere(& world, sphere(vec3(-1.0, 0.0, -1.0), 0.5, material_idx));
    hittable_list_add_sphere(& world, sphere(vec3(-1.0, 0.0, -1.0), -0.4, material_idx));
    hittable_list_add_sphere(& world, sphere(vec3(1.0, 0.0, -1.0), 0.5, material_idx));

    // Camera
    let lookfrom = vec3f(3, 3, 2);
    let lookat = vec3f(0, 0, -1);
    let vup = vec3f(0, 1, 0);
    let dist_to_focus = length(lookfrom - lookat);
    let aperture = 2.0;
    let vfov = 20.0;
    var cam = camera_create(lookfrom, lookat, vup, vfov, aspect_ratio, aperture, dist_to_focus);

    // Render
    // Compute current x,y
    let offset = global_invocation_id.x;
    let x = f32(offset % 832);
    let y = 468 - f32(offset / 832); // Flip Y so Y+ is up
    const image_height = 468;
    const image_width = 832;
    const samples_per_pixel = 100;
    const max_depth = 50;

    var pixel_color = color(0.0, 0.0, 0.0);
    for (var i = 0; i < samples_per_pixel; i += 1) {
        let u = (x + random_f32()) / (image_width - 1);
        let v = (y + random_f32()) / (image_height - 1);
        let r = camera_get_ray(& cam, u, v);
        pixel_color += ray_color(r, & world, max_depth);
    }

    // Store color for current pixel
    write_color(offset, pixel_color, samples_per_pixel);
}
///////////////////////////////////////////////////////////////////////////////

`;