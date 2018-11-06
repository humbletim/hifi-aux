// helper to wait on cache states when needed and trigger a callback
function ready(hint, thing, onready) {
    print(hint, thing, thing.state === Resource.State.FINISHED ? 'READY' : thing.state);
    if (thing.state === Resource.State.FINISHED)
        return onready(thing);
    thing.stateChanged.connect(function wait() {
        if (thing.state === Resource.State.FINISHED) {
            thing.stateChanged.disconnect(wait);
            onready(thing);
        }
    });
}

_addFrame.modelURL = 'http://192.241.189.145:8083/hifi/pod_frame.fbx#20160712';
_addFrame.ready = ready;
addFrame = _addFrame; // export
try { module.exports = _addFrame; } catch(e) {}
function _addFrame(event) {
    ready('caching:'+event.src, !event.src || Script.context === 'agent' ? { state: Resource.State.FINISHED } : TextureCache.prefetch(event.src), function(texture) {
        ready('caching:'+addFrame.modelURL, ModelCache.prefetch(addFrame.modelURL), function(model) {
            print('addFrame', JSON.stringify(event,0,2));
            var Origin = MyAvatar;
            var settings = event.settings || event;
            var frame = Entities.addEntity({
                type: 'Model',
                lifetime: event.lifetime || 3600,
                name: event.name || 'SnapshotRezzer-' + MyAvatar.sessionDisplayName,
                description: event.description || 'Snapshot rezzed by ' + MyAvatar.sessionDisplayName,
                dimensions: Vec3.multiply(.1, Vec3.ONE),
                position: event.position || Vec3.sum(Vec3.multiply(.5,Quat.getUp(Origin.orientation)),Vec3.sum(Origin.position, Vec3.multiply(Quat.getFront(Origin.orientation), 3))),
                rotation: event.orientation || MyAvatar.orientation,
                dynamic: 1,
                modelURL: addFrame.modelURL,
                compoundShapeURL: addFrame.modelURL,
                shapeType: 'compound',
                collisionsWillMove: true,
                collisionless: false,
                density: settings.gravity ? 10000 : 1000,
                restitution: .45,
                friction: .8,
                //registrationPoint: Vec3.sum(Vec3.multiply(Vec3.UP,-.125/2), Vec3.HALF),
                registrationPoint: Vec3.multiply(.5,Vec3.sum(Vec3.multiply(Vec3.UP,-.5), Vec3.ONE)),
                textures: event.src ? JSON.stringify({ backlight: event.src }) : undefined,
                userData: JSON.stringify({ location: location.href, hash: event.hash }),
                script: '('+function() {
                    return {
                        preload: function(uuid) {
                            print('addFrame.preload', uuid);
                        },
                        src: function(uuid, args) {
                            var textures = args[0] ? JSON.stringify({ backlight: args[0] }) : undefined
                            print('updating', frame, textures);
                            Entities.editEntity(frame, { textures: textures });
                        }
                    };
                }+')',
            }, (Entities.canRez() || Entities.canRezTmp()) ? false : true /*clientOnly*/);

            // workaround: .naturalDimensions isn't always available the first time ModelCache reports FINISHED state
            ready('recaching:'+addFrame.modelURL, ModelCache.prefetch(addFrame.modelURL), function(model) {
                // workaround: physics, etc. appears to disrupt assignment of certain properties when first added
                //   so I wait a moment and then calculate/assign the final dimensions
                Script.setTimeout(function() {
                    var props = Entities.getEntityProperties(frame);

                    // ~~ in theory this makes it plenty big enough, but not too overwhelming (from user's perspective)
                    var height = (typeof HMD === 'object' ? HMD.eyeHeight : 0) || 1.0;
                    var dims = Vec3.multiply(props.naturalDimensions, height /  props.naturalDimensions.y);
                    Entities.editEntity(frame, {
                        dimensions: dims,
                        velocity: Vec3.multiply(0.1, Vec3.UP),
                        gravity: settings.gravity ? Vec3.multiply(Vec3.UP, -9.8) : Vec3.ZERO
                    });
                    //print('//addFrame', frame, JSON.stringify(Entities.getEntityProperties(frame, ['userData','textures','name','orientation']),0,2));

                    // re-orient on mouse click (applies only to the local Interface client and until end of session/script)
                    function reorient(uuid, evt) {
                        print('reorienting', frame, JSON.stringify(Quat.safeEulerAngles(MyAvatar.orientation)));
                        Entities.editEntity(frame, { rotation: MyAvatar.orientation });
                    }
                    //Script.addEventHandler(frame, 'clickDownOnEntity', reorient);
                    //Script.scriptEnding.connect(function() { Script.removeEventHandler(frame, 'clickDownOnEntity', reorient); });

                    // notify our OverlayWindow QML that we were succsesful
                    event.callback && event.callback(Entities.getEntityProperties(frame));
                }, 250);
            });
        });
    });
}//addFrame
