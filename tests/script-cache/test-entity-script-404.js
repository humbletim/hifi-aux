var entityID = Entities.addEntity({
    type: 'Text',
    name: '404 include test',
    text: '',
    color: { red: 0, green: 0, blue: 0 },
    dimensions: { x: 2, y: 1, z: 0 },
    position: Vec3.sum(Quat.getFront(MyAvatar.orientation), MyAvatar.position),
    rotation: MyAvatar.orientation,
    lifetime: 120,
    font: { size: 20 },
    script: '('+function() {
        return {
            preload: function(uuid) {
                log(uuid, 'BEFORE 404...');
                Script.include('https://httpbin.org/status/404?'+new Date().getTime().toString(36))
                // currently this line will never be hit
                log(uuid, '//AFTER 404');
            }
        };
        function log(uuid, msg) {
            print(uuid, msg);
            Entities.editEntity(uuid, {
                text: [
                    Entities.getEntityProperties(uuid, ['text']).text, msg
                ].join('\n')
            });
        }
    }+')',
});

print(Script.resolvePath(''), 'created test entity', entityID);
