// MyController.js
//
//   Experimental apparatus for rapidly prototyping new Controller actions
//
//   -- humbletim @ 2016.11.08
//

MyController = new MockController();

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

///////////////////////////////////////////////////////////////////////////////

function MockController() {
    return {
        Actions: { __proto__: Controller.Actions },
        parseMapping: function(jsonStr) {
            var ob = JSON.parse(jsonStr);
            ob.name = ob.name || 'MyController-'+new Date().getTime();
            var mapping = this.newMapping(ob.name);
            ob.channels.forEach(function(route) {
                var from, to;

                // eg: Keyboard.T => MyController.Hardware.Keyboard.T
                with(MyController.Hardware)
                    from = eval(route.from);

                // eg: Actions.LONGITUDINAL_BACKWARD => MyController.Actions.LONGITUDINAL_BACKWARD
                with(MyController)
                    to = eval(route.to);

                if (!from || !to)
                    throw new Error('route is missing .from or .to: ' + JSON.stringify(route));
                return mapping.from(from).to(to);
            });
            return mapping;
        },
        __proto__: Controller,
    };
}
