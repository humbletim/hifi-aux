const vec3 unf1 = vec3(0.0, 0.009037550538778305, 1.0); // material.diffuse_color
const vec3 unf10 = vec3(0.0, 0.0, 0.0); // material.lamp.position
const float unf14 = 94.86997985839844; // material.lamp.distance
const float unf24 = 1.0; // material.diffuse_intensity
const float unf26 = 0.9800001382827759; // material.lamp.energy
const vec3 unf27 = vec3(1.0, 1.0, 1.0); // material.lamp.color
const int unf47 = 346; // material.specular_hardness
const float unf50 = 0.5405405759811401; // material.specular_intensity
const vec3 unf56 = vec3(1.0, 0.0, 0.5043444633483887); // material.specular_color
const float unf72 = 1.0; // material.use_mist
const float unf73 = 5.0; // mist.start
const float unf74 = 25.0; // mist.depth
// const str unf75 = "QUADRATIC"; // mist.falloff
const float unf76 = 0.0; // mist.intensity
// const str unf80 = "color"; // ?color
const vec3 unf82 = vec3(0.0, 0.0, 0.0); // world.horizon_color
#define material_diffuse_color unf1
#define material_lamp_position unf10
#define material_lamp_distance unf14
#define material_diffuse_intensity unf24
#define material_lamp_energy unf26
#define material_lamp_color unf27
#define material_specular_hardness unf47
#define material_specular_intensity unf50
#define material_specular_color unf56
#define material_use_mist unf72
#define mist_start unf73
#define mist_depth unf74
#define mist_falloff unf75
#define mist_intensity unf76
#define world_horizon_color unf82

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
    return vec4(diffuse,1);
}

// HIFI PROCEDURAL_V1
float getProceduralColors(inout vec3 diffuse, inout vec3 specular, inout float shininess) {
    specular = material_specular_color * material_specular_intensity;
    diffuse = material_diffuse_color * material_diffuse_intensity;
    shininess = material_specular_hardness * ( 128.0 / 510.0 );
    return material_emit;
}
