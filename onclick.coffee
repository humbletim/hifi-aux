console.info "__SRC__ responding to a click!"
if evt.shiftKey
    @scale *= 2
else
    @scale /= 2

if "relX" in evt
    @popup "[#{evt.relX}, #{evt.relY}]"