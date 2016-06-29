print('hostname:  ', location.hostname);
print('canRez:    ', Entities.canRez());
print('canRezTmp: ', Entities.canRezTmp());

var lifetimes = [ undefined, -1, 0, 1, 3, 5, 3600, 3601 ];

function rez(lifetime) {
  rez.offset = (rez.offset || 0) + 1;
  return Entities.addEntity({
    type: 'Sphere',
    lifetime: lifetime,
    name: 'ttl ' + lifetime,
    position: Vec3.sum(MyAvatar.position, { x: rez.offset / 10, y: 0, z: 0 }),
    velocity: Vec3.UP
  });
}

var rezzed = lifetimes.map(rez);

Script.setTimeout(function() {
  rezzed.forEach(function probe(id, i) {
    var props = Entities.getEntityProperties(id);
    var requested = 'requested: ' + lifetimes[i];
    if (props.id) {
      print(requested, ' / reported: ' + props.lifetime);
      Entities.deleteEntity(props.id);
    } else
      print(requested, ' / (deleted)');
  });
}, 5000);
