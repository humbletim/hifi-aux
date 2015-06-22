##############################################################################
## fufbx_show_popup.py v0.0.3
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

        if bpy.context.scene.fufbx_show_popup:
            # this pops up a little alert box near the mouse
            self.report({'ERROR'}, msg)
        else:
            # this displays in the menu bar area
            self.report({'INFO'}, "{0}: {1:d} things affected".format("._:", len(affected)))

        return {'FINISHED'}

##############################################################################
## BONE REROLLING

def _selectBonesinEditMode(reg):
    """ pass an uncompiled regex-like string in to select those bones """
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')

    # select the first visible object with an armature
    obj = [o for o in bpy.context.visible_objects
           if isinstance(o.data, bpy.types.Armature)
           ][0]
    armature = obj.data
    console.info("armature: "+str(armature))
    console.warn("object: "+str(obj))

    # the active object determines the EDIT target
    bpy.context.scene.objects.active = obj

    # also needs to be "selected"
    obj.select = True
    
    bpy.ops.object.mode_set(mode='EDIT')

    assert(bpy.context.mode == 'EDIT_ARMATURE')

    if bpy.context.scene.fufbx_restore_selection:
        # having a bone selected is useful to see the color normal,
        #   so attempt to restore selection after we're done
        previous = {
            'head': [b for b in armature.edit_bones if b.select_head],
            'tail': [b for b in armature.edit_bones if b.select_tail],
            'bone': [b for b in armature.edit_bones if b.select],
            'length': -1
        }
        previous['length'] = (
            len(previous['head']) +
            len(previous['tail']) +
            len(previous['bone'])
        )
        def restore():
            if previous and previous['length']:
                bpy.ops.armature.select_all(action='DESELECT')
                for b in previous['bone']:
                    b.select = True
                for b in previous['head']:
                    b.select_head = True
                for b in previous['tail']:
                    b.select_tail = True
        restore_selection = restore
    else:
        restore_selection = False
    
    # clear any selected bones
    bpy.ops.armature.select_all(action='DESELECT')

    affected = []

    import re
    regex = re.compile(reg, re.IGNORECASE)

    # should this be limited to only deform bones??
    deforms = [b for b in armature.edit_bones if b.use_deform]
    for b in deforms:
        if regex.search(b.name):
            affected.append(b)
            b.select_head = True
            b.select = True
            b.select_tail = True
    return affected, restore_selection

# make _selectBonesinEditMode reachable to debug from the Python Console
setattr(bpy.utils, '_selectBonesinEditMode', _selectBonesinEditMode)

class ArmsAndHands(bpy.types.Operator):
    bl_label = "Arms and Hands Roll -Z Global"
    axis = bpy.props.StringProperty(default="GLOBAL_NEG_Z")

    bl_idname = PREFIX + ".fix_arms_and_hands"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        affected, restore_selection = _selectBonesinEditMode( "arm|hand|palm" )

        if self.axis == 'ZERO':
            [ setattr(b,'roll',0) for b in affected ]
        else:
            bpy.ops.armature.calculate_roll(type=self.axis)

        affected = [ u"{1:+.1f}\u00B0 {0}".format(b.name, b.roll) for b in affected]
        msg = YELL(affected, prefix=self.axis)
        
        if bpy.context.scene.fufbx_show_popup:
            # digits are too much noise (do they even need to be rolled here?)
            import re
            msg2 = "\n".join([
                m for m in msg.split("\n")
                if not re.search(r"hand..", m, re.IGNORECASE)
            ])
            if msg != msg2:
                msg2 += "\n(and fingers)"
            # this pops up a little alert box near the mouse
            self.report({'ERROR'}, msg2)
        else:
            # this displays in the menu bar area
            self.report({'INFO'}, "{0}: {1:d} bones affected".format(self.axis, len(affected)))

        restore_selection and restore_selection()

        return {'FINISHED'}

class LegsAndCenterOfMass(bpy.types.Operator):
    bl_label = "Legs and Center of Mass (Hips, Spine, Neck, Head) Roll -Y Global"
    axis = bpy.props.StringProperty(default="GLOBAL_NEG_Y")

    bl_idname = PREFIX + ".fix_legs_and_cmass"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        affected, restore_selection = _selectBonesinEditMode( "leg|hips|spine|neck|head|face|thigh|shin" )

        if self.axis == 'ZERO':
            [ setattr(b,'roll',0) for b in affected ]
        else:
            bpy.ops.armature.calculate_roll(type=self.axis)

        affected = [ u"{1:+.1f}\u00B0 {0}".format(b.name, b.roll) for b in affected]
        msg = YELL(affected, prefix=self.axis)

        if bpy.context.scene.fufbx_show_popup:
            # this pops up a little alert box near the mouse
            self.report({'ERROR'}, msg)
        else:
            # this displays in the menu bar area
            self.report({'INFO'}, "{0}: {1:d} bones affected".format(self.axis, len(affected)))

        restore_selection and restore_selection()

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
    
    bpy.types.Scene.fufbx_show_popup = bpy.props.BoolProperty(name = "show_popup", default = True)
    bpy.types.Scene.fufbx_restore_selection = bpy.props.BoolProperty(name = "restore_selection", default = False)

    def __init__(self, *args, **kw):
        super(FUFBXPanel, self).__init__(*args, **kw)
        
    def draw(self, context):
        layout = self.layout
        layout.prop(bpy.context.scene, property='fufbx_show_popup', text="verbose mode")
        layout.prop(bpy.context.scene, property='fufbx_restore_selection', text="restore bone selection")

        layout.label(text="Hacks:")

        split = layout.split()
        col = split.column()
        
        col.operator(PREFIX+".fix_dots_in_names")

        layout.label(text="Center of Mass:")
        layout.operator(PREFIX+".fix_legs_and_cmass")
        split = layout.split()
        for _ in ['X','Y','Z']:
            col = split.column()
            col.operator(PREFIX+".fix_legs_and_cmass",text="-"+_).axis = 'GLOBAL_NEG_'+_
            col = split.column()
            col.operator(PREFIX+".fix_legs_and_cmass",text="+"+_).axis = 'GLOBAL_POS_'+_
        col = split.column()
        col.operator(PREFIX+".fix_legs_and_cmass",text=u"0\u00B0").axis = 'ZERO'

        layout.label(text="Arms and Hands:")
        layout.operator(PREFIX+".fix_arms_and_hands")
        split = layout.split()
        for _ in ['X','Y','Z']:
            col = split.column()
            col.operator(PREFIX+".fix_arms_and_hands",text="-"+_).axis = 'GLOBAL_NEG_'+_
            col = split.column()
            col.operator(PREFIX+".fix_arms_and_hands",text="+"+_).axis = 'GLOBAL_POS_'+_
        col = split.column()
        col.operator(PREFIX+".fix_arms_and_hands",text=u"0\u00B0").axis = 'ZERO'


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
    empty = kw.get("empty", "(nothing affected)")
   
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
