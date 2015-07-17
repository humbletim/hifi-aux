class Test extends Thing
  @$name: 'Test'
  
  constructor: (@uuid) ->
    super(@uuid)
    console.info "__SRC__ -- Test::constructor(#{@uuid})!!

  onwheel: (evt) ->
    console.info "__SRC__ -- onwheel!!! #{evt.wheelDelta}"

