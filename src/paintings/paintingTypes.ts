/**
 * The painting registry is the single source of truth for WHERE artwork hangs
 * and WHICH exhibit it opens. It deliberately does NOT contain exhibit copy:
 * that stays in src/data/museum.js, and a painting only points at it by id.
 * Duplicating the descriptions would guarantee they drift apart.
 */

export type Vec3 = readonly [number, number, number]

export type CropMode = 'contain' | 'cover'
export type HorizontalAnchor = 'left' | 'center' | 'right'
export type VerticalAnchor = 'top' | 'center' | 'bottom'

export type PaintingPlaque = {
  readonly enabled: boolean
  readonly title?: string
  readonly subtitle?: string
  readonly positionOffset?: Vec3
}

export type PaintingRecord = {
  readonly id: string
  readonly title: string
  readonly artist: string
  /** path under public/, resolved against BASE_URL at load time */
  readonly image: string

  /** resolves against the existing exhibit content; never inline copy here */
  readonly exhibitId: string
  /** index into a wing's `pieces` array, when the exhibit is a multi-piece wing */
  readonly exhibitPiece?: number

  readonly position: Vec3
  readonly rotation: Vec3
  readonly scale?: Vec3

  /** metres, of the visible canvas */
  readonly width: number
  readonly height: number

  readonly cropMode?: CropMode
  readonly horizontalAnchor?: HorizontalAnchor
  readonly verticalAnchor?: VerticalAnchor

  /** when set, transform defaults to the frame slot and may be overridden */
  readonly frameSlotId?: string
  readonly wallId?: string

  /** masks baked placeholder art or splat artefacts behind the canvas */
  readonly backingColor?: string
  /** pushes the canvas off the wall so it never z-fights the splat */
  readonly depthOffset?: number

  /** grows the invisible click target beyond the canvas edge */
  readonly interactionPadding?: number
  readonly visible?: boolean
  readonly mobileVisible?: boolean

  readonly plaque?: PaintingPlaque
}

/**
 * Known blank frames in the Marble room. These are DATA, not components, so a
 * painting can say `frameSlotId` and inherit a measured transform rather than
 * carrying hand-tuned numbers in the registry.
 */
export type FrameSlot = {
  readonly id: string
  readonly wallId: string
  readonly position: Vec3
  readonly rotation: Vec3
  readonly interiorWidth: number
  readonly interiorHeight: number
  readonly recommendedDepthOffset: number
}

export const DEFAULT_DEPTH_OFFSET = 0.04
export const DEFAULT_INTERACTION_PADDING = 0.12
