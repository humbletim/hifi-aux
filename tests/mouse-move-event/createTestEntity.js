var id = Entities.addEntity({
  lifetime: 600,
  type: 'Shape',
  shape: 'Icosahedron',
  position: MyAvatar.position,
  dimensions: Vec3.ONE,
  color: { red: 255, green: 0, blue: 255 },
  collisionless: true,
  script: Script.resolvePath('testDifferentMouseMoveEvents.js')
});
Script.scriptEnding.connect(function() { Entities.deleteEntity(id); });
