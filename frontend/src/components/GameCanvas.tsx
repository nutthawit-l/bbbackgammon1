import { Application } from '@pixi/react'

interface Props {
  width: number
  height: number
}

export default function GameCanvas({ width, height }: Props) {
  return (
    <Application width={width} height={height} background={0x1a1a2e}>
      {/* child Pixi components go here */}
    </Application>
  )
}
