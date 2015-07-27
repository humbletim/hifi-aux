console.info "#{__GIST__}.#{__SRC__}"
@_down =
  pt: glm.vec2(evt.pageX, evt.pageY)
  position: @auto.position
  at: +new Date
  buddies: []
for o in @others when o.selected
  o.position = o.auto.position
  @_down.buddies.push(o)
