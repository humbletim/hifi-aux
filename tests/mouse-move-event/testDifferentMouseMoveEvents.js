(function() {
  return {
    mouseMoveEvent: function(arg1, arg2) {
      if (typeof arg1 === 'string')
        print('"mysterious" invocation as Entities.mouseMoveEvent(entityID, event)', [ arg2.x, arg2.y ]);
      else
        print('"intended" invocation as Controller.mouseMoveEvent(event)', [ arg1.x, arg1.y ]);
    },
    preload: function(entityID) {
      Controller.mouseMoveEvent.connect(this, 'mouseMoveEvent');
    },
    unload: function(entityID) {
      Controller.mouseMoveEvent.disconnect(this, 'mouseMoveEvent');
    }
  };
})
