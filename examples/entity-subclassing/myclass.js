//myclass.js

Script.include('base.js');

// ------------------------------------------------
// local extensions -- stuff that isn't generic-enough to go into Base
// (as this class evolves, it could be put into an include at the domain level)
function MyClass(id) {
   this.channel = id;
   this.$wireup(Messages, 'messageReceived',
                function(channel, message, sender) {
                   if(channel===this.channel) print(message);
                }
               );
   /* attach more handlers here or elsewhere using this.$wireup...
     ... and everything would get cleaned-up automatically */
}
MyClass.prototype = new Base({autoclean: true});
// ------------------------------------------------

var managed = new MyClass("my managed object #1");
managed._domainVisits = {};

managed // method chaninig example
   .$wireup(Window, 'domainChanged', function(domain) {
               this._domainVisits[domain] = (this._domainVisits[domain]||0)+1;
               print("domain "+domain+" visited "+this._domainVisits[domain]+" this session.");
            })
   .$wireup(AvatarManager, 'avatarAddedEvent', function(uuid) {
               print("avatar "+uuid+" initial presence detected at: " +
                     JSON.stringify(AvatarManager.getAvatar(uuid).position));
            });

print("managed.$wires: ", managed.$wires.map(function(w) { return w.signal; }));

// Script.scriptEnding.connect... -- unnecessary (Base assumes this responsibility)
