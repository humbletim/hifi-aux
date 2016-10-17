console.info "#{__SRC__} responding to a click! #{ evt.shiftKey } #{@scale}"
SCALE = 1.5
if evt.shiftKey
    @scale *= SCALE
else
    @scale /= SCALE

# console.info "//#{__SRC__}"
if "relX" of evt
    console.info "#{__SRC__} popping up something!"
    @popup "[#{evt.relX}, #{evt.relY}]"