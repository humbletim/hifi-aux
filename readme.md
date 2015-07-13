download and run polyfill-hifi-glm.js (or paste its snippet into the Script Editor) and then once loaded you can verify glm functionality like so:

```javascript
> glm.version
< 0.0.4

> glm.vec3(MyAvatar.position)
< fvec3(1598.819946, 263.487000, 1879.310059)

> glm.vec3(0,0,1)['*'](glm.inverse(glm.quat(Camera.orientation)))
< fvec3(-0.499926, -0.866012, -0.009918)
```