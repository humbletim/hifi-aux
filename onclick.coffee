console.info "#{__SRC__} responding to a click! #{ evt.shiftKey } #{@scale}"
if not @child
  kid = "#{@live.name}-child"
  @child = HiFi.first(name: kid) or 
    HiFi.create(
      name: kid
      type:@live.type
      position: glm.vec3(@live.position)['+'](glm.vec3(.5))
    )

here = glm.vec3(@live.position)
@child.set position: ((HiFi.bellybutton['-'](here))['*'](1/2))['+'](HiFi.bellybutton)