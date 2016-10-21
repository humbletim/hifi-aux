// creates a ring of ProceduralEntity Shapes around MyAvatar
//
// to load a custom shader with this script, use one of the following URL formats:
//
// * Custom shaderUrl:
//   `example.js?shaderUrl=...`
//
// * Custom shaderUrl with addition properties:
//   `example.js?shaderUrl=...&channels=["http://path/to/image.png"]`
//
// * Custom ProceduralEntity JSON:
//   `example.js?ProceduralEntity={"version":2,"shaderUrl":"...","uniforms":{},"channels":[]}`
//
// by default all available Shape types (Sphere, Cube, Tetrahedron, etc.) will be created
// ... to limit to just one shape (or a few) add `&shapes=Cube` or `&shapes=cube,tetra,ico` etc.
//     (only the first few unique letters of a shape need to be specified)
//
//     -- humbletim @ 2016.10.21
//

Script.include('https://cdn.rawgit.com/humbletim/hifi-aux/194d418a/snippets/extract-parameters.js');
try { throw new Error('stacktrace'); } catch(e) { var kvargs = extractParameters(e.fileName); }

kvargs.shapes = kvargs.shapes || kvargs.shape;

var userData = kvargs.$object.ProceduralEntity || {
    ProceduralEntity: {
        version: kvargs.version,
        shaderUrl: kvargs.shaderUrl || kvargs.frag,
        uniforms: kvargs.uniforms,
        channels: kvargs.channels
    }
};

userData.ProceduralEntity.shaderUrl =
    userData.ProceduralEntity.shaderUrl || 'mat_ShinyBlue.hifi.fs';

if (!userData.ProceduralEntity.version) {
    // attempt to look up procedural version via heuristics
    print('example.js | loading ' + userData.ProceduralEntity.shaderUrl + ' to determine version...');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', userData.ProceduralEntity.shaderUrl, false);
    xhr.send();
    if (!xhr.responseText)
        print('example.js | error: could not load ' + userData.ProceduralEntity.shaderUrl);
    userData.ProceduralEntity.version = /getProceduralColors/.test(xhr.responseText) ? 2 :
        /getProceduralColor/.test(xhr.responseText) ? 1 : 2;
}

print('example.js | userData', JSON.stringify(userData,0,2));

function mkent(shape, offset) {
    var props = {
        name: '[GLSL test] ' + shape + ' w/' +
            userData.ProceduralEntity.shaderUrl.split(/[#?]/)[0].split('/').pop(),
        lifetime: 600,
        clientOnly: !(Entities.canRezTmp()||Entities.canRez()),
        type: 'Shape',
        shape: shape,
        position: Vec3.sum(MyAvatar.position, offset || Vec3.ZERO),
        dimensions: Vec3.ONE,
        color: mkent.first ? { red: 255, green: 255, blue: 255 } : (mkent.first = {red:0,green:255,blue:0}),
        collisionless: true,
        angularDamping: 0.0,
        angularVelocity: Vec3.multiply(1.0, {x: Math.random(), y: Math.random(), z: Math.random()}),
        userData: JSON.stringify(userData),
        script: '('+function() {
            return {
                clickDownOnEntity: function(uuid, evt) {
                    var props = Entities.getEntityProperties(uuid);
                    if (evt.button !== 'Tertiary')
                        return print('example.js | clickDownOnEntity | ' + props.name);

                    var data = JSON.parse(props.userData),
                        proc = data.ProceduralEntity,
                        frag = proc.shaderUrl.split('#')[0];
                    
                    proc.version = proc.version == 2 ? 1 : 2;
                    print('example.js | ... swithing '+props.name+' to PROCEDURAL_V'+proc.version);
                    proc.shaderUrl = frag + '#' + new Date().getTime();
                    print('example.js | data', uuid, props.shape, JSON.stringify(data));
                    Entities.editEntity(uuid, { userData: JSON.stringify(data) });
                },
            };
        }+')',
    };
    var uuid = Entities.addEntity(props, props.clientOnly);
    var aprops = Entities.getEntityProperties(uuid);
    if (aprops.id !== uuid)
        print('example.js | failed to create entity...', props.name);
    else
        print('example.js | created', props.name, '@', JSON.stringify(props.position));
    return uuid;
}

var SHAPES = [
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
];
SHAPES.forEach(function(Name) { SHAPES[Name] = SHAPES[Name.toLowerCase()] = Name; });

var shapes = SHAPES;

// map shapes= querystring parameter
if (kvargs.shapes)
    shapes = kvargs.shapes.split(/\s*,\s*/).map(function(_name) {
        var Name, name = _name.toLowerCase();
        for(var i=0; i < SHAPES.length; i++) {
            if (SHAPES[i].toLowerCase().indexOf(name) === 0) {
                Name = SHAPES[i];
                break;
            }
        }
        if (!(Name in SHAPES))
            print('example.js | WARNING: specified shape may not be valid...', _name, Name);
        return Name;
    }).filter(Boolean);

var uuids = shapes.map(function(shape, i, arr) {
    var deg = i/(arr.length) * 360;
    return mkent(shape, Vec3.multiply(2, Quat.getFront(
        Quat.multiply(MyAvatar.orientation, Quat.fromPitchYawRollDegrees(0,deg,0))
    )));
});

Script.scriptEnding.connect(function() {
    uuids.forEach(function(uuid) { Entities.deleteEntity(uuid); });
});
