console.info "#{__SRC__} responding to a click! #{ evt.shiftKey } #{@scale}"
console.info "#{__SRC__} #{@scale *= 2}"

if evt.shiftKey
    @scale *= 2
else
    @scale /= 2

console.info "//#{__SRC__}"
if "relX" of evt
    console.info "#{__SRC__} popping up something!"
    @popup "[#{evt.relX}, #{evt.relY}]"