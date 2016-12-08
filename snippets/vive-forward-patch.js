var input = {
    "name": "Vive to Standard",
    "channels": [
        { "from": "Vive.LeftApplicationMenu", "to": "Actions.LONGITUDINAL_FORWARD" },
    ]
};

var mapping = Controller.parseMapping(JSON.stringify(input));
Script.scriptEnding.connect(mapping, 'disable');
mapping.enable();
print(Script.resolvePath(''), 'LOADED');
