console.info "#{__GIST__}.#{__SRC__}"
if @_down
  @auto.position = @_down.position
  if @_down.buddies
    o.auto.position = o.position for o in @_down.buddies
  delete @_down
  
