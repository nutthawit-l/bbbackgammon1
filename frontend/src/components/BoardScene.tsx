import { useCallback } from 'react'
import { extend } from '@pixi/react'
import { Graphics } from 'pixi.js'

extend({ Graphics })

// const TRIANGLE_DARK = 0x7b2d10
// const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()

  // Board frame (brown, fully rounded 5px)
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)
}

export default function BoardScene() {
  const draw = useCallback(drawBoard, [])
  return <pixiGraphics draw={draw} />
}