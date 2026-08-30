import Scene from './components/Scene/Scene'
import Guide from './components/Guide/Guide'
import TextVersion from './components/A11y/TextVersion'
import './index.css'

export default function App() {
  return (
    <>
      <TextVersion />
      <Scene />
      <Guide />
    </>
  )
}
