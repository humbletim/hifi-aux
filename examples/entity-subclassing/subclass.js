(function() {

    // 1) BaseClass -- the original, unmodified entity script
    // 2) ... SubClass instanceof BaseClass
    // 3) ...... MySubClass instanceof SubClass
    // 4) ......... *this Entity* instanceof MySubClass

// ---------------------------------------------------------
// 1) BaseClass
    function __get_BaseClass_constructor() {
       var src = "https://cdn.rawgit.com/humbletim/e7621c5a087d345c717f/raw/a8202d1079a342789012a3523dc29cdfc2a75b33/entity.js";
       var BaseClass = $require(src);
       __get_BaseClass_constructor = function() { return BaseClass; };
       return BaseClass;
    }

// ---------------------------------------------------------
// 2) ... SubClass
    function __get_SubClass_constructor() {
       var BaseClass = __get_BaseClass_constructor();
       
       SubClass.prototype = new BaseClass();
       SubClass.prototype.$super = SubClass.prototype;

       return SubClass;

       function SubClass() { // extends BaseClass

          // let's override an existing method from BaseClass...
          this.onmsg = function(channel, message, sender) {
             print("OVERRODE METHOD...", [channel, message, sender]);
             // ... while still leveraging the original!
             return this.$super.onmsg.apply(this, arguments);
          };

          // let's add a new *overridable* utility method ...         
          this.send = function(channel, message) {
             Messages.sendMessage(channel, message);
          };
          
          // let's add some user interaction ...                      
          this.clickReleaseOnEntity = function(uuid, evt) {
             // ... while still leveraging original's properties!
             var question = "Last message was: '"+this.lastMessage+"';"+
                "... shall I transmit a random color for you?";

             if (Window.confirm(question))
                this.send('color', JSON.stringify(this._random_color()));
          };

          // boring helper function (but it's also overridable)
          this._random_color = function() {
             return {
                red: 0xff * Math.random(),
                green: 0xff * Math.random(),
                blue: 0xff * Math.random()
             };
          };

       } //SubClass
    }

    // now let's get to business with *this* Entity script
    this.preload = function(uuid) {

       var SubClass = __get_SubClass_constructor();

       // hmph! hifi://sandbox doesn't support Messages.* yet...
       // No worries -- we can use the same dog food to create a temporary kludge
       // (which coincidentally allows us to test without a domain server too)

       var MOCKSEND = true; // FIXME: set to false once sandbox is upgraded

// 3) ...... MySubClass
       function MySubClass() { // extends SubClass
          if (MOCKSEND) {
             // override SubClass.send...
             this.send = function(channel, message) {
                Messages.messageReceived(channel, message, this.uuid);
             };
          }
       }
       MySubClass.prototype = new SubClass();

       // our current .preload was just to help carry us this far
       delete this.preload;
       
// 4) ......... *this Entity*
       this.__proto__ = new MySubClass();

       {  // VR: virtual reality
          var BaseClass = __get_BaseClass_constructor();
          print("this instanceof SubClass:",   this instanceof SubClass   ); // true!
          print("this instanceof MySubClass:", this instanceof MySubClass ); // true!
          print("this instanceof BaseClass:",  this instanceof BaseClass  ); // true!
       }
       
       // .preload wasn't overriden, so is naturally BaseClass.preload here
       this.preload(uuid);
    };

    // helper function (module system where art thou?)
    function $require(src) {
       var xhr = new XMLHttpRequest();
       xhr.open("GET", src, false);
       xhr.send();
       return eval("1,"+xhr.responseText);
    }
 })