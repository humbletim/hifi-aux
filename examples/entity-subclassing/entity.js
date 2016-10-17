(function() {
    this.lastMessage = "n/a";
    this.onmsg = function(channel, message, sender) {
       this.lastMessage = message; // no need for a "_that" closure!                                                                                                                        
       if (channel === 'color')
          Entities.editEntity(this.uuid, { color: JSON.parse(message) });
    };
    //elsewhere:
    //  Messages.sendMessage('color', JSON.stringify({red:0,green:255,blue:0}))                                                                                                          

    this.preload = function(uuid) {
       this.uuid = uuid;
       Messages.subscribe('color');
       Messages.messageReceived.connect(this, 'onmsg');
    };

    this.unload = function(uuid) {
       Messages.messageReceived.disconnect(this, 'onmsg');
       Messages.unsubscribe('color');
    };
 })