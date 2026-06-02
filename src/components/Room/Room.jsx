import styles from './Room.module.css'
import CrownMolding from './CrownMolding'
import GildedFrame from '../Painting/GildedFrame'

export default function Room() {
  return (
    <div className={styles.room}>
      <Ceiling />
      <Wall />
      <Wainscoting />
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

      <div className={styles.nameplate}>
        <span className={styles.nameplateText}>
          Abigail Kamenetsky &nbsp;&middot;&nbsp; A Collection of Work
        </span>
      </div>

      <div className={styles.dadoRail} />
    </div>
  )
}

function Wainscoting() {
  return <div className={styles.wainscoting} />
}

function Floor() {
  return <div className={styles.floor} />
}
