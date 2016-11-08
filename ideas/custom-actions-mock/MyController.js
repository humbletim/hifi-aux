// MyController.js
//
//   Experimental apparatus for rapidly prototyping new Controller actions
//
//   -- humbletim @ 2016.11.08

function _Controller(custom) {}
_Controller.prototype = {
    Actions: { __proto__: Controller.Actions },
    parseMapping: function(jsonStr) {
        var ob = JSON.parse(jsonStr);
        var mapping = this.newMapping(ob.name || 'MyController-'+new Date().getTime().toString(36));
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

MyController = new _Controller();
