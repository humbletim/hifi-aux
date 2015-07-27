if @_down
  cur = glm.vec2(evt.pageX, evt.pageY)
  diff = glm.vec3(cur['-'](@_down.pt), .0001)['*'](.01)
  diff.x *= -1
  displace = diff['*'](glm.inverse(HiFi.orientation))
  p = @_down.position;
  p2 = p['-'](displace)
  len = glm.length(displace)
  if ((len > .1 or evt.altKey) and len < 3)
    @auto.position = p2
    if not @_down.buddies
      # query here in case some became deselected just prior to dragging...
      for o in @others when o.selected
        o.position = o.auto.position
        @_down.buddies.push(o)
    for o in @_down.buddies
      p = glm.vec3(o.position)
      p2 = p['-'](displace)
      o.auto.position = p2
