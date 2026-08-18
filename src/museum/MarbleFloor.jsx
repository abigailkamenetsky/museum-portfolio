/**
 * A real parquet floor laid over Marble's.
 *
 * Marble's floor is the worst surface in the room: photogrammetry from a single
 * panorama gives it no plank detail at all, just brown streaks, and being the
 * largest thing on screen it drags the whole hall down. Our own geometry renders
 * sharp everywhere, including the door end where Marble is weakest.
 *
 * It follows a measured height field rather than sitting flat, because the hall
 * is a ramp: see floorField.js.
 */

import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import {
  RepeatWrapping, SRGBColorSpace, TextureLoader, MeshStandardMaterial,
  BufferGeometry, Float32BufferAttribute,
} from 'three'
import { buildFloorGeometry, FLOOR_BOUNDS } from './floorField'

const T = import.meta.env.BASE_URL + 'assets/textures/floor/WoodFloor043_2K-JPG_'
const WALNUT = import.meta.env.BASE_URL + 'assets/textures/floor/walnut_color.jpg'

// Marble's floor is locally smooth: measured deviation from a bilinear fit is
// 0.4cm median, 2.7cm at p90. So this only has to clear a few centimetres.
// It was 12cm while the height field was coarse, and that rode up over the
// skirting, the bench feet and the statue plinths, burying their bases.
const LIFT = 0.035

// One tile of the map covers this much floor. It is 1024x512 with six boards
// across the short side, so 1.8m gives boards about 30cm wide.
const TILE_ALONG = 3.6     // down the hall, matches the map's long side
const TILE_ACROSS = 1.8

export default function MarbleFloor() {
  const gl = useThree((s) => s.gl)

  const geo = useMemo(
    () => buildFloorGeometry(BufferGeometry, Float32BufferAttribute, LIFT),
    [],
  )
  useEffect(() => () => geo.dispose(), [geo])

  // Tuned against Marble's own floor rather than by eye. Sampled there: rgb
  // (31,16,8) near, (23,10,5) mid, so it is very dark and strongly red, r about
  // twice g. The first pass was three times too bright mid-hall and nowhere near
  // red enough, which is what made it read as a plank sheet laid on top of the
  // room instead of part of it.
  //
  // Most of that excess brightness was specular: at roughness 0.42 the map's
  // gloss put a bright streak down the centre of the hall, brighter than the
  // near floor, which is backwards. Waxed old oak is fairly matte.
  // The walnut tone is baked into walnut_color.jsp rather than applied as a
  // material tint. Tinting fought the hall's ambient light and lost: a dark red
  // albedo just got lifted back to flat grey, and dropping envMapIntensity did
  // nothing because this floor is lit by the scene's lights, not by the HDRI.
  // Baking it means the grain keeps its contrast at the tone we want.
  const mat = useMemo(() => new MeshStandardMaterial({
    roughness: 0.62,           // waxed old boards: matte, with a little sheen
    metalness: 0.0,
    color: '#ffffff',
    // The gallery HDRI lights this almost neutrally, which was washing the red
    // straight back out: the albedo is r/g 1.9 but it rendered at 1.3. Old dark
    // parquet reflects very little of the room anyway.
    envMapIntensity: 0.25,
    vertexColors: true,        // per-vertex falloff toward the skirting
    polygonOffset: true,       // win the depth test without lifting geometry
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -4,
  }), [])

  useEffect(() => {
    const across = FLOOR_BOUNDS.x1 - FLOOR_BOUNDS.x0
    const along = Math.abs(FLOOR_BOUNDS.z1 - FLOOR_BOUNDS.z0)
    const load = (file, srgb) => new Promise((res) => {
      new TextureLoader().load(file.startsWith('../') ? WALNUT : T + file, (t) => {
        t.wrapS = t.wrapT = RepeatWrapping
        if (srgb) t.colorSpace = SRGBColorSpace
        t.anisotropy = gl.capabilities.getMaxAnisotropy()
        // u runs down the hall, v across it (set in buildFloorGeometry), so no
        // texture rotation is needed and each repeat maps to the axis it names
        t.repeat.set(along / TILE_ALONG, across / TILE_ACROSS)
        gl.resetState()
        gl.initTexture(t)
        res(t)
      }, undefined, () => res(null))
    })

    let alive = true
    Promise.all([
      load('../walnut_color.jpg', true),
      load('NormalGL.jpg', false),
      load('Roughness.jpg', false),
    ]).then(([col, nrm, rgh]) => {
      if (!alive) return
      // no aoMap: it needs a second UV set this geometry does not carry
      if (col) mat.map = col
      if (nrm) mat.normalMap = nrm
      if (rgh) mat.roughnessMap = rgh
      mat.needsUpdate = true
    })
    return () => { alive = false }
  }, [gl, mat])

  return <mesh name="marble-floor" geometry={geo} material={mat} receiveShadow />
}
