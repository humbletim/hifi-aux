const vec3 unf1 = vec3(0.6434964537620544, 1.0, 0.035301573574543); // material.diffuse_color
const float unf7 = 0.05999999865889549; // material.emit
const vec3 unf12 = vec3(0.0, 0.0, 0.0); // material.lamp.position
const float unf16 = 94.86997985839844; // material.lamp.distance
const float unf26 = 0.837837815284729; // material.diffuse_intensity
const float unf28 = 0.9800001382827759; // material.lamp.energy
const vec3 unf29 = vec3(1.0, 1.0, 1.0); // material.lamp.color
const int unf49 = 274; // material.specular_hardness
const float unf52 = 0.7297297120094299; // material.specular_intensity
const vec3 unf58 = vec3(1.0, 0.0, 0.0027703794185072184); // material.specular_color
const float unf74 = 1.0; // material.use_mist
const float unf75 = 5.0; // mist.start
const float unf76 = 25.0; // mist.depth
// const str unf77 = "QUADRATIC"; // mist.falloff
const float unf78 = 0.0; // mist.intensity
// const str unf82 = "color"; // ?color
const vec3 unf84 = vec3(0.0, 0.0, 0.0); // world.horizon_color
#define material_diffuse_color unf1
#define material_emit unf7
#define material_lamp_position unf12
#define material_lamp_distance unf16
#define material_diffuse_intensity unf26
#define material_lamp_energy unf28
#define material_lamp_color unf29
#define material_specular_hardness unf49
#define material_specular_intensity unf52
#define material_specular_color unf58
#define material_use_mist unf74
#define mist_start unf75
#define mist_depth unf76
#define mist_falloff unf77
#define mist_intensity unf78
#define world_horizon_color unf84

#line 1

///////////////////////////////////////////////////////////////////////////////

#ifndef material_emit
#define material_emit 0.0
#endif
#ifndef material_emit
#define material_emit float(0.0)
#endif
#ifndef material_specular_color
#define material_specular_color vec3(0.0)
#endif
#ifndef material_specular_intensity
#define material_specular_intensity float(1.0)
#endif
#ifndef material_specular_hardness
#define material_specular_hardness float(0.0)
#endif
#ifndef material_diffuse_color
#define material_diffuse_color vec3(0.0)
#endif
#ifndef material_diffuse_intensity
#define material_diffuse_intensity float(1.0)
#endif

///////////////////////////////////////////////////////////////////////////////

// HIFI PROCEDURAL_V1
vec4 getProceduralColor() {
    vec3 diffuse = material_diffuse_color * material_diffuse_intensity;
    vec3 specular = material_specular_color * material_specular_intensity;
    float shininess = material_specular_hardness*(128.0/510.0);
    return vec4(diffuse,1);
}

// HIFI PROCEDURAL_V1
float getProceduralColors(inout vec3 diffuse, inout vec3 specular, inout float shininess) {
    specular = material_specular_color * material_specular_intensity;
    diffuse = material_diffuse_color * material_diffuse_intensity +
        material_emit*material_diffuse_color -
        material_emit*specular/16;;
    shininess = material_specular_hardness*(128.0/510.0);
    return material_emit;
}
