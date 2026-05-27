import { useCallback } from 'react'
import type { Graphics } from 'pixi.js'

const TRIANGLE_DARK = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()

  // Outer container (brown, fully rounded 5px)
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)

  // Playing surface
  g.rect(10, 10, 350, 308).fill(0xc8924a)

  // 24 triangles -- col 0-5 left of bar, col 6-11 right (+18px gap)
  for (let col = 0; col < 12; col++) {
    const xOff = col >= 6 ? 18 : 0
    const xL = 10 + col * 27.65 + xOff
    const xR = xL + 27.65
    const xT = (xL + xR) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    // top triangles (base at y=10, tip at y=124)
    g.poly([xL, 10, xR, 10, xT, 124]).fill(color)
    // bottom triangle (base at y=318, tip at y=204)
    g.poly([xL, 318, xR, 318, xT, 204]).fill(color)
  }

  // Center bar (dark brown)
  g.rect(176, 10, 18, 308).fill(0x351b0b)
}

export default function BoardScene() {
  const draw = useCallback(drawBoard, [])

  return <pixiGraphics draw={draw} />
}
