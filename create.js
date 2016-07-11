// demonstrates a two-phase initialization approach where parenting is set via Entity script
//  and Entity updates are "forced" 20 times a second to try and keep everything in sync

uuids = [
    rezAtJoint(
        "RightShoulder", 
        "http://hifi-content.s3.amazonaws.com/caitlyn/production/Scansite/buddhaReduced.fbx?1"
    ),
    rezAtJoint(
        "LeftShoulder", 
        "http://hifi-content.s3.amazonaws.com/caitlyn/production/Scansite/buddhaReduced.fbx?1"
    )
];

Script.scriptEnding.connect(function() {
    uuids.forEach(Entities.deleteEntity);
});

function rezAtJoint(joint, modelURL) {
    return Entities.addEntity({
        script: Script.resolvePath('entity-heartbeat.js'),
        lifetime: 600,
        type: 'Model',
        modelURL: modelURL,
        dimensions: {x: .1, y: .1, z: .1},
        collisionless: false,
        // these properties get applied verbatim within entity-heartbeat.js's preload
        userData: JSON.stringify({
            parentID: MyAvatar.sessionUUID,
            parentJointIndex: MyAvatar.getJointIndex(joint),
            localPosition: /right|left/i.test(joint) ? 
                {x: 0, y: .1, z: -.125} : {x: 0, y: 0, z: .125},
            angularVelocity: {x: 0, y: 0, z: /right/i.test(joint) ? 1 : -1},
            angularDamping: 0
        })
    });
}
