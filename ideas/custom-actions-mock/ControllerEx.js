// ControllerEx.js
//
//   Experimental apparatus for rapidly prototyping new Controller actions
//
//   -- humbletim @ 2016.11.08
//

ControllerEx = new MockController();

ControllerEx.Actions.TEST_ACTION_T = function(value){
    print("The custom test action has been triggered by" + value);
};

ControllerEx.Actions.TEST_ACTION_MIDDLE = function(value){
    print("The custom test middle action has been triggered by " + value);
};

// JSON configuration example
mappingJSON = {
    "name" : "Just testing",
    "channels" : [
        { "from": "Keyboard.T", "to": "Actions.TEST_ACTION_T" }
    ]
};
mapping = ControllerEx.parseMapping(JSON.stringify(mappingJSON));

// direct API example
mapping
    .from(ControllerEx.Hardware.Keyboard.MiddleMouseButton)
    .to(ControllerEx.Actions.TEST_ACTION_MIDDLE);

mapping.enable();

Script.scriptEnding.connect(mapping, 'disable');

///////////////////////////////////////////////////////////////////////////////

function MockController() {
    return {
        Actions: { __proto__: Controller.Actions },
        parseMapping: function(jsonStr) {
            var ob = JSON.parse(jsonStr);
            ob.name = ob.name || 'ControllerEx-'+new Date().getTime();
            var mapping = this.newMapping(ob.name);
            ob.channels.forEach(function(route) {
                var key = (route.from+'').replace('Keyboard.',''),
                    from = ControllerEx.Hardware.Keyboard[key];

                var action = (route.to+'').replace('Actions.',''),
                    to = ControllerEx.Actions[action];

                if (!from || !to)
                    throw new Error('route is missing .from or .to: ' + JSON.stringify(route));
                return mapping.from(from).to(to);
            });
            return mapping;
        },
        __proto__: Controller,
    };
}
