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

const LIFT = 0.12          // Marble's floor is bumpy between samples; a smaller lift lost the depth test

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

  // The brief asks for deep walnut, almost black in shadow. The map is a light
  // pine, so it is tinted down hard; left at full brightness it out-shouted the
  // paintings, which are the point of the room.
  const mat = useMemo(() => new MeshStandardMaterial({
    roughness: 0.42, metalness: 0.0, color: '#4a3220',
  }), [])

  useEffect(() => {
    const across = FLOOR_BOUNDS.x1 - FLOOR_BOUNDS.x0
    const along = Math.abs(FLOOR_BOUNDS.z1 - FLOOR_BOUNDS.z0)
    const load = (file, srgb) => new Promise((res) => {
      new TextureLoader().load(T + file, (t) => {
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
      load('Color.jpg', true),
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
