import { Application } from '@pixi/react'
import BoardScene from './BoardScene'

const BOARD_WIDTH = 389
const BOARD_HEIGHT = 328

export default function GameBoard() {
  return (
    <Application
      width={BOARD_WIDTH} 
      height={BOARD_HEIGHT}
      backgroundAlpha={0}
      antialias
      resolution={window.devicePixelRatio || 1}
      autoDensity
      className="block shrink-0"
      onInit={(app) => {
        if (import.meta.env.DEV) {
          void import('@pixi/devtools').then(({ initDevtools }) => {
            initDevtools({ app })
          })
        }
      }}
    >
      <BoardScene />
    </Application>
  )
}