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
  /** axis-aligned box the player may move within: [minX, maxX, minZ, maxZ] */
  readonly walkBounds: readonly [number, number, number, number]
  /** avatar height in metres; the room's real scale decides this, not taste */
  readonly avatarHeight: number
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
  walkBounds: [-8.3, 8.3, -38.3, 38.3],
  avatarHeight: 2.95,   // the legacy hall is 13.5m tall and was authored around this
}

/**
 * Marble hall: placeholder until the real export exists. Every value here is a
 * guess and MUST be replaced with measured numbers from the debug panel once
 * the SPZ loads. Marble worlds are typically Y-up with an arbitrary origin and
 * an arbitrary metric scale, so expect all six fields to change.
 */
export const MARBLE_CALIBRATION: MuseumCalibrationConfig = {
  // Marble reports these directly in the world's semantics_metadata, so they
  // are measured values rather than eyeballed ones:
  //   metric_scale_factor  2.7043977  -> multiply to reach metres
  //   ground_plane_offset  1.5348716  -> floor height in raw splat units
  // Measured from the collider GLB: raw 3.12 x 13.87 x 2.98 units, which at
  // 2.7044 is 8.4m wide x 37.5m long x 8.1m tall.
  //
  // Do NOT derive the floor from ground_plane_offset (1.5349). Measuring the
  // collider's dominant up-facing planes puts the real floor at raw -2.2 and
  // the ceiling at +0.6. Using the reported offset left the floor at y=-1.80,
  // so the player stood 1.8m in mid-air.
  //   floor lift = -(-2.2 * 2.7044) = +5.95  ->  floor lands on y=0
  position: [0, 1.62, 0],
  rotation: [Math.PI, 0, 0],   // Marble's world is Y-down; flip it upright
  scale: 2.7043977,
  playerSpawn: [0, 0, -5],    // the camera trails ~3.5m behind, so spawning
                             // at 10 put the CAMERA through the near wall (z=13.46)
  cameraTarget: [0, 1.6, 0],
  floorOffset: 0,
  // Marble reconstructs from one viewpoint, so only the near end holds up.
  // Measured by sweeping the hall: sharp at z=12 and z=6, softening by z=0,
  // clearly smeared by z=-6. Keep the player in the good 13m, and let the far
  // end read as gloom down the axis rather than somewhere you can walk into.
  walkBounds: [-3.2, 3.2, -9.0, 1.0],
  // Marble's hall measures 7.57m floor to vault. The legacy 2.95m avatar is
  // 9ft 8in and filled 39% of that height. Abby is 5'4", so 1.63m: 22%, and
  // comfortably below the window heads.
  avatarHeight: 1.63,
}

/** Raw values as returned by the API, kept for recalibration after a re-export. */
export const MARBLE_SEMANTICS = {
  metricScaleFactor: 2.7043977,
  groundPlaneOffset: 1.5348716,
} as const
