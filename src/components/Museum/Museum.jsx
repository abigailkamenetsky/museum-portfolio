import styles from './Museum.module.css'
import Character from '../Character'
import useCharacter from '../../hooks/useCharacter'

export default function Museum({ children }) {
  const { x, facing } = useCharacter()

  return (
    <div className={styles.museum}>
      {children}
      <Character x={x} facing={facing} />
    </div>
  )
}
