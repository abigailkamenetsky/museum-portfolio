import styles from './Room.module.css'

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
      <div className={styles.crownMolding} />
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
        <FramePlaceholder />
        <FramePlaceholder />
      </div>

      <div className={styles.nameplate}>
        <span className={styles.nameplateText}>Abigail Kamenetsky &nbsp;·&nbsp; A Collection of Work</span>
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

function FramePlaceholder() {
  return (
    <div className={styles.frameWrapper}>
      <div className={styles.frameOuter}>
        <div className={styles.frameInner}>
          <div className={styles.canvas}>
            <span className={styles.canvasPlaceholder}>painting</span>
          </div>
        </div>
      </div>
      <div className={styles.placard}>
        <p className={styles.placardText}>— &nbsp; —</p>
      </div>
    </div>
  )
}
