##############################################################################
## example UI panel to perform corrective surgery on an avatar model
## copyright (c) 2015 tim dedischew
## released under the same terms as blender (GPL v2+)
##############################################################################

import bpy

## buttons for now are squatting on the "chain links" (constraints) icon tab
PREFIX = "constraint"
# other ideas: scene | object | physics | data | world | render | render_layers

##############################################################################
### FIXING DOTS IN OBJECT/MESH/ETC NAMES

def _dedotify(id, stuff):
    affected = []
    for _, m in enumerate(stuff):
        #console.warn("%s[%d]: %s" % (str(id), _, str(m and m.name)));
        if m and "." in m.name:
            console.warn("%s[%d] fixing name: %s" % (str(id), _, str(m.name)));
            m.name = m.name.replace(".","_")
            affected.append(m)
    return affected
    
class FixDotsInNames(bpy.types.Operator):
    """ . -> _ """
    bl_idname = PREFIX + ".fix_dots_in_names"
    bl_label = "Replaces dots with underscores"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        # note: certain things don't appear to be mutable unless OBJECT mode is selected
        bpy.ops.object.mode_set(mode='OBJECT')

        affected = []
        affected += _dedotify("objects", bpy.data.objects)
        affected += _dedotify("meshes", bpy.data.meshes)
        affected += _dedotify("materials", bpy.data.materials)
        affected += _dedotify("textures", bpy.data.textures)
        affected += _dedotify("armatures", bpy.data.armatures)

        msg = YELL(affected, prefix="renamed")

        # this pops up a little alert box near the mouse
        self.report({'ERROR'}, msg)

        return {'FINISHED'}

##############################################################################
## BONE REROLLING

def _selectBonesinEditMode(reg):
    """ pass an uncompiled regex-like string in to select those bones """
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    armature = bpy.data.armatures[0]
    obj = [o for o in bpy.data.objects if o.data == armature][0]
    obj.select = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.armature.select_all(action='DESELECT')

    affected = []

    import re
    regex = re.compile(reg, re.IGNORECASE)

    for b in armature.edit_bones:
        if regex.search(b.name):
            affected.append(b)
            b.select = True

    return affected

class ArmsAndHands(bpy.types.Operator):
    bl_idname = PREFIX + ".fix_arms_and_hands"
    bl_label = "Arms and Hands Roll -Z Global"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        affected = _selectBonesinEditMode( "arm|hand|palm" )
        #bpy.ops.armature.calculate_roll(type="GLOBAL_NEG_Z")
        msg = YELL(affected, prefix="seleted only for now")
        
        # this pops up a little alert box near the mouse
        self.report({'ERROR'}, msg)

        return {'FINISHED'}

class LegsAndCenterOfMass(bpy.types.Operator):
    bl_idname = PREFIX + ".fix_legs_and_cmass"
    bl_label = "Legs and Center of Mass (Hips, Spine, Neck, Head) Roll -Y Global"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        affected = _selectBonesinEditMode( "leg|hips|spine|neck|head" )
        # bpy.ops.armature.calculate_roll(type="GLOBAL_NEG_Y")

        msg = YELL(affected, prefix="selected only for now")
        
        # this pops up a little alert box near the mouse
        self.report({'ERROR'}, msg)

        return {'FINISHED'}

##############################################################################
## the actual new panel with the buttons for triggering stuff

class FUFBXPanel(bpy.types.Panel):
    """Creates a Panel in the """+PREFIX+""" context of the properties editor"""
    bl_label = "FUFBX (Functional User FBX) Demo"
    bl_idname = PREFIX.upper() + "_PT_fufbx"
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = PREFIX

    def draw(self, context):
        layout = self.layout
        layout.label(text="Hacks:")

        split = layout.split()
        col = split.column()
        col.operator(PREFIX+".fix_dots_in_names")

        split = layout.split()
        col = split.column()
        col.operator(PREFIX+".fix_arms_and_hands")
        col = split.column(align=True)
        col.operator(PREFIX+".fix_legs_and_cmass")

##############################################################################
## module stuff

def register():
    try:
        unregister()
    except:
        pass
    print("registering ui_panel")
    bpy.utils.register_module(__name__)

def unregister():
    print("unregistering ui_panel")
    bpy.utils.unregister_module(__name__)


##############################################################################
## console-lack hackery...

## i'm experimenting with various ways to provide user feedback notices
## (... blender has no great way of doing this, for years now)

def YELL(affected, **kw):
    prefix = kw.get("prefix", "affected")
    empty = kw.get("empty", "hurray!")
   
    # this outputs above the main menu (to Blender's hidden log output pane!)
    [ console.info(str(x)) for x in affected ]

    if len(affected):
        msg = prefix + ":\n  "+ ("\n  ".join([str(x) for x in affected]))
    else:
        msg =  empty

    return msg

class upper_console_output(bpy.types.Operator):
        bl_idname = 'render.upper_console_output'
        bl_label = 'WarnOutput'
        bl_options = {'REGISTER'}
        text = bpy.props.StringProperty()
        level = bpy.props.StringProperty(default="INFO")
        def execute(self, context):
            self.report({self.level.upper()}, str(self.text))
            return {'FINISHED'}

def _logit(*args, **kw):
    level = kw.get('level', 'INFO');
    print("["+str(level)+"]" + str(args)) # also log to stdout
    try:
        bpy.ops.render.upper_console_output(text=str(args), level = level)
    except AttributeError:
        bpy.utils.register_class(upper_console_output)
        bpy.ops.render.upper_console_output(text=str(args), level = level)

class console:
    bl_options = set()
    @classmethod
    def debug(*args):
        _logit(*args, level='DEBUG')
    def info(*args):
        _logit(*args, level='INFO')
    def operator(*args):
        _logit(*args, level='OPERATOR')
    def warn(*args):
        _logit(*args, level='WARNING')
    def error(*args):
        _logit(*args, level='ERROR')

## auto-register when ran a direct script in the text editor view
if __name__ == "__main__":
    register()
