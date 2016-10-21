# ##### BEGIN GPL LICENSE BLOCK #####
#
# This program is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License
#  as published by the Free Software Foundation; either version 2
#  of the License, or (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software Foundation,
#  Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
#
# ##### END GPL LICENSE BLOCK #####

# inspired by game_export_GLSL_Shader.py
# see https://gist.github.com/humbletim/262da13aa79a6b9419e32f111c150cc6

bl_info = {
    "name": "Export Materials to HiFi Procedular Shaders",
    "author": "humbletim",
    "version": (0, 0),
    "location": "Material Properties",
    "description": "Export one or more materials to .hifi.fs",
    "warning": "",
    "category": "Testing"
}

import bpy
import gpu
import os
import json
import mathutils
import inspect
import re

class EXPORT_OT_hifimat(bpy.types.Operator):
    """Export all materials of this scene to .hifi.fs files) """
    bl_idname = "export.hifimat"
    bl_label = "Export Material To HiFi"

    filepath = bpy.props.StringProperty(subtype="DIR_PATH")
    dirpath = ''

    def write_shader(self, scene, mat):
        path = os.path.join(self.dirpath, "mat_%s.%%s" % mat.name)
        shader = gpu.export_shader(scene, mat)

        # uniforms
        unfs = uniforms2json(shader, scene, mat)

        if False:
            with open(path % "uniforms.json", "w") as uniforms:
                uniforms.write(json.dumps(unfs, indent=4, cls=ComplexEncoder, sort_keys=True))
                print(path % 'uniforms.json')
            with open(path % "uniforms", "w") as uniforms:
                uniforms.write(unfs['GLSL'])
                print(path % 'uniforms')

        with open(path % "hifi.fs", "w") as fs:
            fs.write(unfs['GLSL']);
            fs.write(glsl_boilerplate)
            print(path % 'hifi.fs')

        self.export_count += 1

    def execute(self, context):

        scene = bpy.context.scene
        materials = bpy.data.materials
        export_hifi_options = bpy.context.window_manager.exportHiFiOptions

        self.dirpath = os.path.dirname(self.filepath)

        if not self.dirpath:
            raise Exception('!self.dirpath ' + str(self.dirpath))

        self.export_count = 0

        self.report({'INFO'}, 'Exporting materials to %s' % self.dirpath)
        print('Writing .hifi.js to %s/' % self.dirpath)

        if export_hifi_options == "ALL":
            for mat in materials:
                self.write_shader(scene, mat)

        elif export_hifi_options == "SELECTED":
            for obj in bpy.context.selected_objects:
                print('   - exporting materials for object %s' % obj)
                for matsl in obj.material_slots:
                    self.write_shader(scene, matsl.material)

        elif export_hifi_options == "ACTIVE":
            self.write_shader(scene, bpy.context.material)

        self.report({'INFO'}, 'Exported %i materials' % self.export_count)

        return {'FINISHED'}

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

class HiFiExportPanel(bpy.types.Panel):
    bl_idname = "Export_Material2HiFi"
    bl_label = "Export Material To HiFi"
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = "material"

    bpy.types.WindowManager.exportHiFiOptions = bpy.props.EnumProperty(
        name="Export",
        description="",
        items=(("ALL", "All Materials", "Export all materials from all scenes"),
               ("SELECTED", "Selected Object Materials ",
                "Export all materials from the selected objects"),
               ("ACTIVE", "Active Material", "Export just this active material")),
        default="ALL")

    def draw(self, context):
        self.layout.prop(context.window_manager, "exportHiFiOptions")
        self.layout.operator("export.hifimat")

def register():
    bpy.utils.register_class(EXPORT_OT_hifimat)
    bpy.utils.register_class(HiFiExportPanel)

def unregister():
    bpy.utils.unregister_class(EXPORT_OT_hifimat)
    bpy.utils.unregister_class(HiFiExportPanel)

# helpers
def uniforms2json(shader, scene, mat):
    unfs = { 'GLSL': '' }
    defines = []
    def append(glsl):
        unfs['GLSL'] += glsl + '\n'
    for v in shader["uniforms"]:
        tmp = unfs[v['varname']] = {
            '_varname': v['varname'],
            '_type': v['type'],
            '_datatype': v['datatype'],
        }
        varname = v['varname']
        _type = GPU_DYNAMIC[v['type']]
        datatype = GPU_DATA[v['datatype']]
        typename = TYPE_TO_NAME.get(_type, _type)
        value = None
        name = None

        # attempt to locate the uniform value
        # see https://www.blender.org/api/blender_python_api_2_78_1/gpu.html?highlight=export_shader#gpu.export_shader

        # material ?
        if value is None:
            value = getattr(mat, typename, None)
            if value is not None:
                name = 'material.%s' % typename

        # mist ?
        if value is None and ~_type.find('MIST'):
            value = getattr(scene.world.mist_settings, typename, None)
            if value is not None:
                name = 'mist.%s' % typename

        # world ?
        if value is None:
            value = getattr(scene.world, typename, None)
            if value is not None:
                name = 'world.%s' % typename
                if ~name.find('color') and len(value) is 3:
                    pt = value
                    if ~name.find('ambient_color'):
                        value = mathutils.Vector((pt[0],pt[1],pt[2],1))

        # lamp ?
        if 'lamp' in v:
            lamp = v['lamp']
            if value is None:
                value = getattr(lamp.data, typename, value)
                if value is not None:
                    name = 'material.lamp.%s' % typename
            if value is None:
                if typename is 'dynco':
                    pt = lamp.matrix_world[3]
                    value = (scene.camera.matrix_world * mathutils.Vector((pt[0],pt[1],pt[2],1)))
                    pt = value
                    value = mathutils.Vector((pt[0],pt[1],pt[2]))
                    name = 'material.lamp.position'

        # default value to typename as placeholder
        if value is None:
            value = typename

        # transfer other documented properties if present
        for k in ['image','texnumber','texpixels','texsize']:
            if k in v:
                tmp[k] = v[k]

        id = name or '?'+typename
        name = re.sub(r'[^a-zA-Z]','_', id)

        # attempt to generate corresponding GLSL uniform code
        if not name.startswith('_'):
            defines.append('#define %s %s' % (name, varname))
        typ = type(value)
        if typ in [int, float, bool]:
            if typ is bool:
                typ = float
                value = float(value)
            glsl = append('const %s %s = %s; // %s' % (typ.__name__, varname,  value, id))
        else:
            tt = ComplexEncoder().default(value)
            xyzw = ['x','y','z','w']
            if 'x' in tt:
                vec = 'vec3'
                ll = [str(tt[xyzw[i]]) for i in range(3)]
                if 'w' in tt:
                    vec = 'vec4'
                    ll = [str(tt[xyzw[i]]) for i in range(4)]
                glsl = append('const %s %s = %s(%s); // %s' % (vec, varname, vec, ', '.join(ll), id))
            else:
                glsl = append('// const %s %s = "%s"; // %s' % (typ.__name__, varname, value, id))

        tmp['id'] = id
        tmp['name'] = name
        tmp['varname'] = varname
        tmp['type'] = _type
        tmp['datatype'] = datatype
        tmp['typename'] = typename
        tmp['value'] = value
        tmp['value'] = value
        tmp['glsl'] = glsl
    unfs['GLSL'] += '\n'.join(defines)+'\n';
    return unfs

# enables more bpy.* types become serializable
class ComplexEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, mathutils.Quaternion):
            return dict(w=obj.w, x=obj.x, y=obj.y, z=obj.z)
        if isinstance(obj, mathutils.Color) or isinstance(obj, mathutils.Vector):
            if len(obj) is 4:
                return dict(x=obj[0], y=obj[1], z=obj[2], w=obj[3])
            else:
                return dict(x=obj[0], y=obj[1], z=obj[2])
        if isinstance(obj, bpy.types.EditBone) or isinstance(obj, bpy.types.Lamp):
            return dict([ [x[0], str(x[1])] for x in inspect.getmembers(obj)])
        if isinstance(obj, mathutils.Matrix):
            m = []
            for n in [0,1,2,3]:
                for v in obj:
                    m.append(v[n])
            return m
        try:
            if type(obj) in [bool, int, float, str]:
                return json.JSONEncoder.encode(self, obj)
            return json.JSONEncoder.default(self, obj)

        except Exception as e:
            return str(e)+'xx'+str(obj)

# enum lookup tables
GPU_DYNAMIC = {}
GPU_DATA = {}
for k,v in inspect.getmembers(gpu):
    if ~k.find('GPU_DYNAMIC'):
        GPU_DYNAMIC[v] = k
    if ~k.find('GPU_DATA'):
        GPU_DATA[v] = k

TYPE_TO_NAME = {
    'GPU_DYNAMIC_OBJECT_VIEWMAT': 'view_mat',
    'GPU_DYNAMIC_OBJECT_MAT': 'model_mat',
    'GPU_DYNAMIC_OBJECT_VIEWIMAT': 'inv_view_mat',
    'GPU_DYNAMIC_OBJECT_IMAT': 'inv_model_mat',
    'GPU_DYNAMIC_OBJECT_COLOR': 'color',
    'GPU_DYNAMIC_OBJECT_AUTOBUMPSCALE': 'auto_bump_scale',

    'GPU_DYNAMIC_MIST_ENABLE': 'use_mist',
    'GPU_DYNAMIC_MIST_START': 'start',
    'GPU_DYNAMIC_MIST_DISTANCE': 'depth',
    'GPU_DYNAMIC_MIST_INTENSITY': 'intensity',
    'GPU_DYNAMIC_MIST_TYPE': 'falloff',
    'GPU_DYNAMIC_MIST_COLOR': 'color',

    'GPU_DYNAMIC_HORIZON_COLOR': 'horizon_color',
    'GPU_DYNAMIC_AMBIENT_COLOR': 'ambient_color',

    'GPU_DYNAMIC_LAMP_DYNVEC': 'dynvec',
    'GPU_DYNAMIC_LAMP_DYNCO': 'dynco',
    'GPU_DYNAMIC_LAMP_DYNIMAT': 'dynimat',
    'GPU_DYNAMIC_LAMP_DYNPERSMAT': 'dynpersmat',
    'GPU_DYNAMIC_LAMP_DYNENERGY': 'energy',
    'GPU_DYNAMIC_LAMP_DYNCOL': 'color',
    'GPU_DYNAMIC_LAMP_DISTANCE': 'distance',
    'GPU_DYNAMIC_LAMP_ATT1': 'linear_attenuation',
    'GPU_DYNAMIC_LAMP_ATT2': 'quadratic_attenuation',
    'GPU_DYNAMIC_LAMP_SPOTSIZE': 'spot_size',
    'GPU_DYNAMIC_LAMP_SPOTBLEND': 'spot_blend',

    'GPU_DYNAMIC_MAT_DIFFRGB': 'diffuse_color',
    'GPU_DYNAMIC_MAT_REF': 'diffuse_intensity',
    'GPU_DYNAMIC_MAT_SPECRGB': 'specular_color',
    'GPU_DYNAMIC_MAT_SPEC': 'specular_intensity',
    'GPU_DYNAMIC_MAT_HARD': 'specular_hardness',
    'GPU_DYNAMIC_MAT_EMIT': 'emit',
    'GPU_DYNAMIC_MAT_AMB': 'ambient',
    'GPU_DYNAMIC_MAT_ALPHA': 'alpha',
}


glsl_boilerplate = '''
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
'''
