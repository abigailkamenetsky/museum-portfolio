import styles from './Room.module.css'
import CrownMolding from './CrownMolding'
import GildedFrame from '../Painting/GildedFrame'
import FloorPlanks from './FloorPlanks'
import Baseboard from './Baseboard'
import PlasterOverlay from './PlasterOverlay'

export default function Room() {
  return (
    <div className={styles.room}>
      <Ceiling />
      <Wall />
      <Floor />
    </div>
  )
}

function Ceiling() {
  return (
    <div className={styles.ceiling}>
      <CrownMolding />
    </div>
  )
}

function Wall() {
  return (
    <div className={styles.wall}>
      <PlasterOverlay />
      <div className={styles.lightLeft} />
      <div className={styles.lightRight} />
      <div className={styles.vignette} />

      <div className={styles.paintings}>
        <div className={styles.frameWrapper}>
          <GildedFrame>
            <div className={styles.canvas}>
              <span className={styles.canvasPlaceholder}>painting</span>
            </div>
          </GildedFrame>
          <div className={styles.placard}>
            <p className={styles.placardText}>— &nbsp; —</p>
          </div>
        </div>

        <div className={styles.frameWrapper}>
          <GildedFrame>
            <div className={styles.canvas}>
              <span className={styles.canvasPlaceholder}>painting</span>
            </div>
          </GildedFrame>
          <div className={styles.placard}>
            <p className={styles.placardText}>— &nbsp; —</p>
          </div>
        </div>
      </div>

      <Baseboard />
    </div>
  )
}

function Floor() {
  return <FloorPlanks />
}
