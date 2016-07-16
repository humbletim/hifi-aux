var storage;
var tigerAIConfig;

// make changes to tigerAIConfig persist automatically when script exists
//   (could also have it save at regular intervals to protect against crashes)
//   (scriptEnding has to be trapped right away to make sure our handler gets called before SQLite cleanup)
Script.scriptEnding.connect(function() {
    if (tigerAIConfig) {
        print('saving tigerAIConfig...');
        storage.SQL.setObject('tigerAIConfig', tigerAIConfig).then(function(status) { print('saved tigerAIConfig: ', status); });
    }
});

Script.include(Script.resolvePath('qml-storage-test.js'));

storage.SQL.init().then(function() {
    storage.SQL.getObject('tigerAIConfig', { sad: true, reason: 'default value for when key/json-parse/object does not exist' })
        .then(function(config) {
            tigerAIConfig = config;
            print('tigerAIConfig:', JSON.stringify(tigerAIConfig));
            main(tigerAIConfig);
        });
});

function main(tigerAIConfig) {
    if (tigerAIConfig.lives < 0) {
        Window.alert("Sorry, you have exhausted your tiger's 9 lives");
        Script.stop();
    }
    delete tigerAIConfig.reason;
    delete tigerAIConfig.sad;
    print('bumping tigerAIConfig counter', tigerAIConfig.counter = (tigerAIConfig.counter||0)+1);
}

// example syncing SQLite -> Entity properties
function updateEntityPropertiesFromSQLite(entityID, which) {
    return storage.SQL.getObject(entityID, {}).then(function(props) {
        var newprops = {};
        if (!which)
            newprops = props;
        else
            which.forEach(function(p) { newprops[p] = props[p]; });
        print('assigning properties', entityID, JSON.stringify(newprops));
        return Entities.editEntity(entityID, newprops);
    });
}

function backupEntityToSQLite(entityID, which) {
    return storage.SQL.setObject(entityID, Entities.getEntityProperties(entityID, which))
        .then(function(status) {
            print('setObject status', status);
        })['catch'](function(err) { print('setObject error', err);});
}

storage.SQL.init().then(function() {
    var entityID = '{778f34fc-95a9-4636-8eaa-78c7cb018e86}';
    print('entityID', entityID);
    return storage.SQL.get(entityID).then(function(exists) {
        if (!exists) {
            // backup Entity properties to SQLite
            print('backing up Entity to SQLite', entityID);
            return backupEntityToSQLite(entityID, ['color']);
        } else {
            print('updating ', entityID, 'properties from SQLite record...');
            return updateEntityPropertiesFromSQLite(entityID, ['color']);
        }
    });
})['catch'](print);
