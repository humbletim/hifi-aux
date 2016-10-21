Script.include('https://cdn.rawgit.com/humbletim/hifi-aux/5dfa4d68/snippets/extract-parameters.js');
try { throw new Error('stacktrace'); } catch(e) { var kvargs = extractParameters(e.fileName); }

var PROCEDURAL = 2;
var shaderUrl = Script.resolvePath( kvargs.frag || 'mat_ShinyBlue.hifi.fs' );

print('shaderUrl', shaderUrl);

function mkent(shape, offset) {
    return Entities.addEntity({
        name: shape + ' GLSL test',
        lifetime: 600,
        type: 'Shape',
        shape: shape,
        position: Vec3.sum(MyAvatar.position, offset||Vec3.ZERO),
        dimensions: Vec3.ONE,
        color: { red: 255, green: 255, blue: 255 },
        collisionless: true,
        angularDamping: 0.0,
        angularVelocity: Vec3.multiply(1.0, {x: Math.random(), y: Math.random(), z: Math.random()}),
        userData: JSON.stringify({
            "ProceduralEntity": {
                "version": PROCEDURAL,
                "shaderUrl": shaderUrl
            }
        }),
        script: '('+function() {
            return {
                clickDownOnEntity: function(uuid) {
                    var props = Entities.getEntityProperties(uuid),
                        data = JSON.parse(props.userData),
                        proc = data.ProceduralEntity,
                        frag = proc.shaderUrl.split('#')[0];
                    
                    proc.version = proc.version == 2 ? 1 : 2;
                    print('... swithing '+props.name+' to PROCEDURAL_V'+proc.version);
                    proc.shaderUrl = frag + '#' + new Date().getTime();
                    print('data', uuid, props.shape, JSON.stringify(data));
                    Entities.editEntity(uuid, { userData: JSON.stringify(data) });
                },
            };
        }+')',
    }, !(Entities.canRezTmp()||Entities.canRez()));
}

var uuids = [
    "Triangle",
    //"Quad",
    "Hexagon",
    "Octagon",
    //"Circle",
    "Cube",
    "Sphere",
    "Tetrahedron",
    "Octahedron",
    "Dodecahedron",
    "Icosahedron",
    //"Torus",
    //"Cone",
    //"Cylinder"
    
].map(function(shape,i,arr) {
    var t = i/(arr.length)*Math.PI*2;
    return mkent(shape, Quat.multiply(Camera.orientation, Vec3.multiply(2, {x: Math.sin(t), y: 0, z: Math.cos(t) })));
});

Script.scriptEnding.connect(function() {
    uuids.forEach(function(uuid) { Entities.deleteEntity(uuid); });
});
