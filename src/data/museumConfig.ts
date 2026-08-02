/**
 * Environment selection + asset paths for the museum shell.
 *
 * The legacy hall must keep working until the Marble room is genuinely
 * finished, so the environment is a build-time flag with `legacy` as the
 * default. Nothing here fabricates asset files: `marbleAssetsDeclared` only
 * says which paths we WILL use, and the loader is responsible for failing
 * gracefully when they are absent.
 */

import {
  LEGACY_CALIBRATION,
  MARBLE_CALIBRATION,
  type MuseumCalibrationConfig,
} from '../museum/MuseumCalibration'

export type MuseumEnvironmentId = 'legacy' | 'marble'

const RAW_ENV = import.meta.env.VITE_MUSEUM_ENVIRONMENT as string | undefined

/** `?environment=marble` is allowed so the room can be reviewed before cutover. */
function urlOverride(): MuseumEnvironmentId | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('environment')
  return v === 'marble' || v === 'legacy' ? v : null
}

export const MUSEUM_ENVIRONMENT: MuseumEnvironmentId =
  urlOverride() ?? (RAW_ENV === 'marble' ? 'marble' : 'legacy')

const BASE = import.meta.env.BASE_URL

/**
 * Marble exports these four artefacts directly; see docs.worldlabs.ai export
 * specs. `full` is the ~2M-splat SPZ, `mobile` the ~500k variant, `collider`
 * the 100-200k-triangle physics GLB, `fallback` the 360 panorama.
 */
export const MARBLE_ASSETS = {
  full: `${BASE}museum/abby-museum-full.spz`,
  mobile: `${BASE}museum/abby-museum-mobile.spz`,
  low: `${BASE}museum/abby-museum-low.spz`,
  collider: `${BASE}museum/abby-museum-collider.glb`,
  fallback: `${BASE}museum/abby-museum-fallback.webp`,
} as const

export const CALIBRATION: Record<MuseumEnvironmentId, MuseumCalibrationConfig> = {
  legacy: LEGACY_CALIBRATION,
  marble: MARBLE_CALIBRATION,
}

/** The placement editor must never reach production. */
export const MUSEUM_EDITOR_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MUSEUM_EDITOR === 'true'

export const MUSEUM_DEBUG =
  MUSEUM_EDITOR_ENABLED ||
  (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug'))
