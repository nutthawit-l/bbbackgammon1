import { useCallback, useState, useRef } from 'react'
import { extend, useTick } from '@pixi/react'
import { Graphics } from 'pixi.js'
import type { GameState, CheckerSelected } from '../game/state'
import { 
  INITIAL_STATE, 
  getPoint, 
  AnimState,
  rmCheckerFromPoint,
  addCheckerToPoint,
  ANIM_DURATION,
} from '../game/state'
import { drawBoard, createClickArea, CLICK_AREAS } from '../game/board'
import { newChecker, drawChecker, drawCheckers, getCheckerY } from '../game/checker'

extend({ Graphics })

export default function BoardScene() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<CheckerSelected>(null)
  const [_, setIsAnimating] = useState(false)
  const animRef = useRef<AnimState | null>(null)
  const animGfxRef = useRef<Graphics | null>(null)
  
  // Animation tick -- runs every frame, update animRef
  useTick((ticker) => {
    const anim = animRef.current
    const gfx = animGfxRef.current
    
    if (!anim || !gfx) return
      
    anim.t = Math.min(1, anim.t + ticker.deltaTime / ANIM_DURATION)
    const eased = anim.t * anim.t * (3 - 2 * anim.t)
    const x = anim.srcPoint.x + (anim.destPoint.x - anim.srcPoint.x) * eased
    const y = anim.srcPoint.y + (anim.destPoint.y - anim.srcPoint.y) * eased
    
    gfx.clear()
    
    if (anim.t < 1) {
      const checker = newChecker({x, y}, anim.checker, false)
      drawChecker(gfx, checker)
    } else {
      // Commit move
      setGameState(prev => {
        const pss = prev.points.map(ps => ({ ...ps }))
        
        // Remove checker from old point
        const psOld = pss[anim.srcPointIndex]
        pss[anim.srcPointIndex] = rmCheckerFromPoint(psOld)
        
        // Add checker to new point
        const psNew = pss[anim.destPointIndex]
        pss[anim.destPointIndex] = addCheckerToPoint(psNew, anim.checker)
        
        return { ...prev, points: pss }
      })
      
      // Stop animation
      animRef.current = null
      setIsAnimating(false)
    }
  })
  
  const handleClick = useCallback((pIdx: number) => {
    setSelected(prev => {
      // Deselect
      if (prev === pIdx) return null
        
      // Select
      if (prev === null && gameState.points[pIdx]?.count > 0) return pIdx
      
      // Check which of 2 events it is:
      // 1. Normal move
      // 2. Blot hit
      if (prev !== null) {
        const psSrc = gameState.points[prev]
        const psDest = gameState.points[pIdx]
        
        // Check is blot hit?
        const isBlotHit = (
          psDest.count === 1 && 
          psDest.checker != psSrc.checker
        )
        
        if (isBlotHit) {
          // Handle blot hit
          console.log('hit')
        } else {
          // Handle normal move
          const pSrc = getPoint(prev)
          const pDest = getPoint(pIdx)
          const srcY = getCheckerY(pSrc, psSrc.count - 1, psSrc.count)
          const destY = getCheckerY(pDest, psDest.count, psDest.count + 1)
          
          animRef.current = {
            srcPoint: { x: pSrc.coord.x, y: srcY },
            destPoint: { x: pDest.coord.x, y: destY },
            srcPointIndex: prev,
            destPointIndex: pIdx,
            checker: psSrc.checker,
            t: 0
          }
          
          // if (isBlotHit) {
          //   animRef.current = { ...animRef.current, isBlotHit: true }
          // }
          
          // console.log(animRef.current)
          
          setIsAnimating(true)
        }
      }
      return null
    })
  }, [gameState])

  return (
    <>
      <pixiGraphics draw={useCallback(drawBoard, [])} />
      <pixiGraphics
        draw={
          useCallback(
            (gfx: Graphics) => drawCheckers(gfx, gameState, selected),
            [selected, gameState]
          )
        }
      />
      {CLICK_AREAS.map((area, i) => (
        <pixiGraphics 
          key={i}
          draw={useCallback(
            createClickArea(area.x, area.y, area.w, area.h),[])} 
          eventMode='static'
          cursor='pointer'
          onPointerDown={() => handleClick(i)}
        />
      ))}
      <pixiGraphics ref={animGfxRef} draw={(gfx) => gfx.clear()} />
    </>
  )
}