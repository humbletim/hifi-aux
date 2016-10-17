// base.js
Base = function Base(options) {
   options = options || {};
   this.$wires = options.wires || [];
   if (options.autoclean !== false)
      this.$wireup(Script, 'scriptEnding', this.$disposeAll);
};
Base.prototype = {
   $wireup: function(Thing, signal, handler) {
      if (!handler) {
         handler = this[signal]; // assumes this[signal] has been defined elsewhere
      } else {
         this[signal] = handler; // assumes we define it (and <= 1 handler per signal)
      }
      Thing[signal].connect(this, signal);

      // remember for automated disposal later
      this.$wires.push({ thing: Thing, signal: signal });
      print("Base.$wireup -- connected "+[Thing,signal]);
      return this; // allow method chaining
   },
   $disposeAll: function() {
      /* TODO: iterate this.$wires and .disconnect each */
      print("TODO: $disposeAll", this.$wires.map(function(w) { return w.signal }));
   }
};
