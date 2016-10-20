// provision as AC script and pass config= in URL like so:
// ...acscript.js?config={"name":"entity-name", "position": /* rough position */}

Script.include('https://cdn.rawgit.com/humbletim/hifi-aux/5dfa4d68/snippets/extract-parameters.js');

try { throw new Error('stacktrace'); } catch(e) {
    var filename = e.fileName;
}

var kvargs   = extractParameters(filename), // key/value strings...
    jsonargs = kvargs.$object, // key/object parameters (where values parsable as JSON)
    config   = jsonargs.config;

if (!(config.entityID || config.name) || !config.position)
    throw new Error('entitySoul | expected (config.entityID or config.name) and config.position... pass via URL config={"entityID":"...", "position":{"x":X,"y":Y,"z":Z}}');

EntityViewer.setPosition(config.position);
EntityViewer.queryOctree();

print('entitySoul | using config:', JSON.stringify(config, 0, 2));

function initializeSoul(entity) {
    if (!entity.position) {
        print('entitySoul | invalid entity/entityID...', config.entityID, JSON.stringify(entity));
        print('trying name...', config.name);
        var matches = findByName(config.name);
        if (!matches.length)
            throw new Error('entitySoul | could not find entity using config: '+JSON.stringify(config));
        if (matches.length > 1)
            print('entitySoul | warning -- more than one entity with name='+config.name+' found... using the first');
        entity = matches[0];
    }

    print('entitySoul | defibrillating: ', JSON.stringify(entity.position, 0, 2));

    // *bring to life here*
    Script.setInterval(function() {
        var t = new Date().getTime()/1000;
        entity.position = Vec3.sum(
            config.position,
            { x: Math.sin(t)/2, y: 0, z: Math.cos(t)/2 }
        );
        Entities.editEntity(entity.id, {
            position: entity.position,
        })
    }, 1000/30);
}

function findByName(name, position, radius) {
    return Entities.findEntities(position, radius || 1000)
        .map(function(id){ return Entities.getEntityProperties(id) })
        .filter(function(ent) { return ent.name === name; });
}

function queryEntityProperties(entityOrUUID, callback, waitms) {
    waitms = waitms || 250;
    var uuid = entityOrUUID;
    if (entityOrUUID && entityOrUUID.position) { // have EntityViewer follow entity (in case it moves)
        EntityViewer.setPosition(entityOrUUID.position);
        uuid = entityOrUUID.id;
    }
    EntityViewer.queryOctree();
    Script.setTimeout(function() {
        callback(Entities.getEntityProperties(uuid));
    }, waitms);
}

// wait for entity server to warm up
var timer = Script.setInterval(function() {
    if (Entities.serversExist()) {
        Script.clearInterval(timer);
        queryEntityProperties(config.entityID, initializeSoul, 500);
    }
}, 100);
