console.info "#{__SRC__} responding to a click! #{@child.auto.color}"
if @child
  @child.auto.color = glm.vec3(Math.random(),Math.random(),Math.random())