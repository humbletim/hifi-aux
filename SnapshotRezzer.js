//
//    snapshot-to-entity (proof-of-concept)
//    2016.08.20 humbletim
//
//    ... opens a QML Window dialog that listeners for screenshots
//     and offers to upload the latest one via ATP and generate an in-world
//     photoframe from it

var modelURL = 'http://cdn.xoigo.com/hifi/pod_frame.fbx#20160712';

var qmlURL = Script.resolvePath('').replace('.js','.qml');

// note: only useful during file: dev (forces .qml to be reloaded with the .js)
var cache_buster = /^file:/.test(qmlURL) ? '#'+new Date().getTime().toString(36) : '';

var window = new OverlayWindow({
    source: qmlURL + cache_buster,
    width: 480,
    height: 320,
    title: 'SnapshotRezzer v0.0.1'
});

window.fromQml.connect(function(event) {
    if (event.type === 'addFrame')
        addFrame(event);
    else if (event.type === 'close') {
        window.close();
        Script.stop();
    }
});

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

function addFrame(event) {
    ready('caching:'+event.src, TextureCache.prefetch(event.src), function(texture) {
        ready('caching:'+modelURL, ModelCache.prefetch(modelURL), function(model) {
            print('addFrame', JSON.stringify(event,0,2));
            var Origin = MyAvatar;
            var frame = Entities.addEntity({
                type: 'Model',
                name: event.name || 'SnapshotShare',
                dimensions: Vec3.multiply(.1, Vec3.ONE),
                position: Vec3.sum(Vec3.multiply(.5,Quat.getUp(Origin.orientation)),Vec3.sum(Origin.position, Vec3.multiply(Quat.getFront(Origin.orientation), 3))),
                rotation: MyAvatar.orientation,
                dynamic: 1,
                modelURL: modelURL,
                compoundShapeURL: modelURL,
                shapeType: 'compound',
                collisionsWillMove: true,
                collisionless: false,
                density: 10000,
                restitution: .75,
                friction: .8,
                //registrationPoint: Vec3.sum(Vec3.multiply(Vec3.UP,-.125/2), Vec3.HALF),
                registrationPoint: Vec3.multiply(.5,Vec3.sum(Vec3.multiply(Vec3.UP,-.5), Vec3.ONE)),
                textures: JSON.stringify({ backlight: event.src }),
                userData: JSON.stringify({ location: Window.location.href, hash: event.hash })
            });

            // workaround: .naturalDimensions isn't always available the first time ModelCache reports FINISHED state
            ready('recaching:'+modelURL, ModelCache.prefetch(modelURL), function(model) {
                // workaround: physics, etc. appears to disrupt assignment of certain properties when first added
                //   so I wait a moment and then calculate/assign the final dimensions
                Script.setTimeout(function() {
                    var props = Entities.getEntityProperties(frame);

                    // ~~ in theory this makes it plenty big enough, but not too overwhelming (from user's perspective)
                    var height = HMD.eyeHeight || 1.0;
                    var dims = Vec3.multiply(props.naturalDimensions, height /  props.naturalDimensions.y);
                    Entities.editEntity(frame, {
                        dimensions: dims,
                        velocity: Vec3.multiply(0.1, Vec3.UP),
                        gravity: Vec3.multiply(Vec3.UP, -9.8)
                    });
                    print('//addFrame', frame, JSON.stringify(Entities.getEntityProperties(frame, ['userData','textures','name','orientation']),0,2));

                    // re-orient on mouse click (applies only to the local Interface client and until end of session/script)
                    function reorient(uuid, evt) {
                        print('reorienting', frame, JSON.stringify(Quat.safeEulerAngles(MyAvatar.orientation)));
                        Entities.editEntity(frame, { rotation: MyAvatar.orientation });
                    }
                    Script.addEventHandler(frame, 'clickDownOnEntity', reorient);
                    Script.scriptEnding.connect(function() { Script.removeEventHandler(frame, 'clickDownOnEntity', reorient); });

                    // notify our OverlayWindow QML that we were succsesful
                    window.sendToQml({ type: 'frameAdded', uuid: frame });
                }, 250);
            });
        });
    });
}//addFrame
