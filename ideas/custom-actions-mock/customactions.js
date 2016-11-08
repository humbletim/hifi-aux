Script.include('MyController.js');

MyController.Actions.TEST_ACTION_T = function(value){
    print("The custom test action has been triggered by" + value);
};

MyController.Actions.TEST_ACTION_MIDDLE = function(value){
    print("The custom test middle action has been triggered by " + value);
};

// JSON configuration example
mappingJSON = {
    "name" : "Just testing",
    "channels" : [
        { "from": "Keyboard.T", "to": "Actions.TEST_ACTION_T" }
    ]
};
mapping = MyController.parseMapping(JSON.stringify(mappingJSON));

// direct API example
mapping
    .from(MyController.Hardware.Keyboard.MiddleMouseButton)
    .to(MyController.Actions.TEST_ACTION_MIDDLE);

mapping.enable();

Script.scriptEnding.connect(mapping, 'disable');
