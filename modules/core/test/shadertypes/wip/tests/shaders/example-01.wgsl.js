export default `
alias material_index = u32;
alias color = vec3f;

struct material {
    index: material_type,
    diffuse: color,
}

@group(0) @binding(1) var<storage> materials: array<material>;
`;