/**
 * ONE place where the Marble world is aligned to our scene.
 *
 * The SPZ and the collider GLB come out of Marble in their own coordinate
 * convention, which will not match the hall we already built. Resolve that here
 * and apply it once at `museumWorldRoot`. Do not scatter corrective rotations
 * or scale factors through individual components: that is how the Blender room
 * ended up with coordinate fixes buried in five different places.
 */

export type Vec3 = readonly [number, number, number]

export type MuseumCalibrationConfig = {
  /** applied to museumWorldRoot, which parents splat + collider + paintings */
  readonly position: Vec3
  readonly rotation: Vec3
  readonly scale: number
  /** where the player is placed on entry, in OUR world space */
  readonly playerSpawn: Vec3
  /** what the intro camera looks at, in OUR world space */
  readonly cameraTarget: Vec3
  /** nudges the walkable plane so the character does not sink or float */
  readonly floorOffset: number
}

/**
 * Legacy hall: our own geometry is already authored in scene space, so this is
 * identity apart from the spawn point the existing intro uses.
 */
export const LEGACY_CALIBRATION: MuseumCalibrationConfig = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
  playerSpawn: [0, 0, 34],
  cameraTarget: [0, 3.6, 0],
  floorOffset: 0,
}

/**
 * Marble hall: placeholder until the real export exists. Every value here is a
 * guess and MUST be replaced with measured numbers from the debug panel once
 * the SPZ loads. Marble worlds are typically Y-up with an arbitrary origin and
 * an arbitrary metric scale, so expect all six fields to change.
 */
export const MARBLE_CALIBRATION: MuseumCalibrationConfig = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
  playerSpawn: [0, 0, 34],
  cameraTarget: [0, 3.6, 0],
  floorOffset: 0,
}
