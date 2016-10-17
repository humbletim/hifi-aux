download and run polyfill-hifi-glm.js (or paste its snippet into the Script Editor) and then once loaded you can verify glm functionality like so:

```javascript
> glm.version
< 0.0.4

> glm.vec3(MyAvatar.position)
< fvec3(1598.819946, 263.487000, 1879.310059)

> glm.vec3(0,0,1)['*'](glm.inverse(glm.quat(Camera.orientation)))
< fvec3(-0.499926, -0.866012, -0.009918)

> m = glm.mat4()
< mat4x4( (1.000000, 0.000000, 0.000000, 0.000000), (0.000000, 1.000000, 0.000000, 0.000000), (0.000000, 0.000000, 1.000000, 0.000000), (0.000000, 0.000000, 0.000000, 1.000000) )

// convenient reference-based swizzles
> m[3].xyz = [1,2,3]; glm.$to_glsl(m)
< mat4(1,0,0,0,0,1,0,0,0,0,1,0,1,2,3,1)

// transparent support for using external array buffers or typed arrays as the backing store
> var f = new Float32Array(16), m = new glm.mat4(f); m[3].xyz['+='](glm.vec3(1,2,3));  [].slice.call(f)
0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,0
```