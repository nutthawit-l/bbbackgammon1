import { useEffect, useRef } from 'react'
import { type Application } from 'pixi.js'
import { createPixiApp } from '../game/app'

interface Props {
  width: number
  height: number
}

export default function GameCanvas({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    createPixiApp(canvas, width, height).then((app) => {
      if (cancelled) {
        app.destroy()
        return
      }
      appRef.current = app
    })

    return () => {
      cancelled = true
      appRef.current?.destroy()
      appRef.current = null
    }
  }, [width, height])

  return <canvas ref={canvasRef} />
}
