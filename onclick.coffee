console.info "#{__SRC__} responding to a click! #{ evt.shiftKey } #{@scale}"
if not @child
  kid = "#{@live.name}-child"
  @child = HiFi.locate(name: kid) or 
    HiFi.create(type:@live.type, name: kid, position: glm.vec3(@live.position)['+'](glm.vec3(.5)))

here = glm.vec3(@live.position)
@child.set position: ((HiFi.bellybutton['-'](here))['*'](1/2))['+'](HiFi.bellybutton)