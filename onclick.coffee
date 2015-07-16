console.info "#{__SRC__} responding to a click! #{ evt.shiftKey } #{@scale}"
if not @child
  kid = "#{@name}-child"
  @child = HiFi.locate(name: kid) or 
    HiFi.create(type:@type, name: kid, position: glm.vec3(@position)['+'](glm.vec3(.5)))

@child.set position: glm.mix(glm.vec3(@position), HiFi.position, .5)