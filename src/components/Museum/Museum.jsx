import styles from './Museum.module.css'

export default function Museum({ children }) {
  return (
    <div className={styles.museum}>
      {children}
    </div>
  )
}
