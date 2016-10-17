observeModeChanges(); // defined below

// --------------------------------------------------------------
// hear from your Avatar's perspective
MyAvatar.audioListenerMode = MyAvatar.audioListenerModeHead;

// --------------------------------------------------------------
// hear from the Camera's perspective
MyAvatar.audioListenerMode = MyAvatar.audioListenerModeCamera;

// --------------------------------------------------------------
// hear from a Custom position and orientation
// for example, let an Entity be your ears:
var uuid  = Entities.findClosestEntity(MyAvatar.position, 10),
    props = Entities.getEntityProperties(uuid, ['position','rotation']);
MyAvatar.audioListenerMode = MyAvatar.audioListenerModeCustom;
MyAvatar.customListenPosition = props.position;
MyAvatar.customListenOrientation = props.rotation;

// --------------------------------------------------------------
// restore the default mode
MyAvatar.audioListenerMode = MyAvatar.audioListenerModeHead;

// --------------------------------------------------------------
// observing mode changes... 
function observeModeChanges() {
  function modeChanged() {
    print('Audio Listen Mode Changed: ', ['Head','Camera','Custom'][MyAvatar.audioListenerMode]);
  }
  MyAvatar.audioListenerModeChanged.connect(modeChanged);
  Script.scriptEnding.connect(function(){
    MyAvatar.audioListenerModeChanged.disconnect(modeChanged);
  });
}