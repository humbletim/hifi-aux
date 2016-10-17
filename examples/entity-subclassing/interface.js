function managed() {
   this.lastMessage = "n/a";
   Messages.subscribe('channel');
   Messages.messageReceived.connect(this, 'messageReceived');
   Entities.clickDownOnEntity.connect(this, 'clickDownOnEntity');
   Script.scriptEnding.connect(this, 'scriptEnding');
}
managed.prototype = {
   scriptEnding: function() {
      Messages.unsubscribe('channel');
      Messages.messageReceived.disconnect(this, 'messageReceived');
      Entities.clickDownOnEntity.disconnect(this, 'clickDownOnEntity');
      Script.scriptEnding.disconnect(this, 'scriptEnding');
      print("//managed.scriptEnding", this.lastMessage);
   },
   clickDownOnEntity: function(uuid, evt) {
      print("managed.clickDownOnEntity", [uuid, evt.button, this.lastMessage]);
   },
   messageReceived: function(channel, message, sender) {
      this.lastMessage = message;
      print("managed.messageReceived", [channel,message,sender]);
   }
};
new managed();