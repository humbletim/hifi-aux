class Orb extends Thing
  @$name: 'Orb'

  constructor: (@uuid) ->
    super @uuid
    if @uuid and not @server('isorb')
      # temporary "earmarking" of peer'd Orbs                                                                                                                                                                                                                                                                                                                                                                                                                         
      @server 'isorb', __GIST__

  @colors:
    ambient: HiFi.c2hex '#333'
    selected: HiFi.c2hex '#fff'
    active: HiFi.c2hex '#ffa'
    initial: HiFi.c2hex '#f00'

  @tally: (prop) ->
    tot = 0
    peers = (new Orb(peer.uuid) for peer in @peers)
    tot = tot + (peer.data.clicks or 0) for peer in peers
    tot

  property = Properties
  # @$session = Thing.$session

  property Orb,
    # returns a simple set of Entities matching our earmark flag                                                                                                                                                                                                                                                                                                                                                                                                      
    peers: get: () ->
      HiFi.filter
        filter: { userData: (_) -> ~_.indexOf(__GIST__) }
        radius: 50

  # can be used to complect peers(eg: Orb.peers.map(Orb.factory))                                                                                                                                                                                                                                                                                                                                                                                                     
  @factory: (uuid) -> new Orb(uuid?.uuid or uuid)

  property @prototype,
    # manage selection the same way a user perceives it (by color!)                                                                                                                                                                                                                                                                                                                                                                                                   
    selected:
      get: () -> @auto.color in [ Orb.colors.selected, Orb.colors.active ]
      set: (tf) -> @auto.color = Orb.colors[tf and 'selected' or 'ambient']

    # set of all orbs in the group (excluding ourselves)                                                                                                                                                                                                                                                                                                                                                                                                             
    others: get: () ->
      new Orb(peer.uuid) for peer in Orb.peers when peer.uuid isnt @uuid

    # logical accessors for nested userData entries                                                                                                                                                                                                                                                                                                                                                                                                                   
    data: get: () -> property {},
        initialized:
          get: () => @server('initialized')
          set: (v) => @server('initialized', v)
        clicks:
          get: () => @server('clicks')
          set: (v) => @server('clicks', v)

    # lazy-mixin shorthands via HiFi.managed                                                                                                                                                                                                                                                                                                                                                                                                                          
    auto: get: () -> HiFi.managed(@uuid).auto

  onclick: (evt) ->
    if @selected
      # show user some feedback even when already selected (at least the first time re-selecting)                                                                                                                                                                                                                                                                                                                                                                                                
      @auto.color = Orb.colors.active
    else
      @selected = true

    # log the click                                                                                                                                                                                                                                                                                                                                                                                                                                                   
    @data.clicks++
    #TODO: stash @data.lastclicked record too                                                                                                                                                                                                                                                                                                                                                                                                                         

    # de-select other orbs in our group (unless user is multi-selecting)                                                                                                                                                                                                                                                                                                                                                                                              
    if not evt.shiftKey
      for peer in @others when peer.selected
        peer.selected = false
    console.info "#{HiFi.username} clicked #{evt.target} @ [#{evt.pageX}, #{evt.pageY}]"

  onload: (evt) ->
    if not @data.initialized
      @data.initialized = by: HiFi.username, at: HiFi.now.ms
    @auto.color = Orb.colors.initial # !selected, but different so we can see reloads                                                                                                                                                                                                                                                                                                                                                                                 

  oncontextmenu: (evt) ->
    #UX.tooltip                                                                                                                                                                                                                                                                                                                                                                                                                                                       
    Popup.popup """                                                                                                                                                                                                                                                                                                                                                                                                                                                   
      #{evt.target.name} #{(evt.uuid+'').substr(0,8)}                                                                                                                                                                                                                                                                                                                                                                                                                 
      initialized by: #{@data.initialized?.by or 'nobody yet!'}                                                                                                                                                                                                                                                                                                                                                                                                       
      total clicks: #{@data.clicks}                                                                                                                                                                                                                                                                                                                                                                                                                                   
      total across group: #{Orb.tally 'clicks'}                                                                                                                                                                                                                                                                                                                                                                                                                       
      last clicked: #{@data.lastclick?.by}                                                                                                                                                                                                                                                                                                                                                                                                                            
   """, target: @live
