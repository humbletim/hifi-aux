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
    for o in @_down.buddies
      p = glm.vec3(o.position)
      p2 = p['-'](displace)
      o.auto.position = p2
