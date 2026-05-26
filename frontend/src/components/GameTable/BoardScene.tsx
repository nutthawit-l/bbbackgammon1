import { Assets, Texture } from 'pixi.js'
import { useState, useEffect } from 'react'

const BOARD_WIDTH = 389
const BOARD_HEIGHT = 328
const BOARD_TEXTURE = '/assets/game-board/board.png'

export default function BoardScene() {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    Assets.load<Texture>(BOARD_TEXTURE).then(setTexture)
  }, [])

  if (!texture) return null

  return (
    <pixiSprite texture={texture} width={BOARD_WIDTH} height={BOARD_HEIGHT} />
  )
}
