Window.domainChanged.connect(Window, 'alert');

if (0) {
  // these two variations are equivalent to the above:
  Window.domainChanged.connect(Window, Window.alert);

  Window.domainChanged.connect(function(domain) {
    Window.alert(domain);
  });

  // ... but this variation is *not* equivalent
  Window.domainChanged.connect(Window.alert);
}
