import { useCallback, useState, useRef } from 'react'
import { extend, useTick } from '@pixi/react'
import { Graphics } from 'pixi.js'
import type { GameState, CheckerSelected } from '../game/state'
import { INITIAL_STATE, getPoint, TOTAL_CHECKER_NUMBER } from '../game/state'
import { drawBoard, createClickArea, CLICK_AREAS } from '../game/board'
import { drawCheckers, getCheckerY } from '../game/checker'

extend({ Graphics })


export default function BoardScene() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<CheckerSelected>(null)
  // const [isAnimating, setIsAnimating] = useState(false)
  // const animRef = useRef<game.AnimState | null>(null)
  // const animGfxRef = useRef<Graphics | null>(null)
  

  // // Animation tick -- runs every frame, update animRef
  // useTick((ticker) => {
  //   const anim = animRef.current
  //   const g = animGfxRef.current
    
  //   if (!anim || !g) return
      
  //   anim.t = Math.min(1, anim.t + ticker.deltaTime / game.ANIM_DURATION)
  //   const eased = anim.t * anim.t * (3 - 2 * anim.t)
  //   const x = anim.srcPoint.x + (anim.destPoint.x - anim.srcPoint.x) * eased
  //   const y = anim.srcPoint.y + (anim.destPoint.y - anim.srcPoint.y) * eased
    
  //   g.clear()
    
  //   if (anim.t < 1) {
  //     drawChecker(g, x, y, anim.checker)
  //   } else {
  //     // Commit move
  //     setGameState(prev => {
  //       const pss = prev.points.map(ps => ({ ...ps }))

  //       // Remove checker from old point
  //       const psOld = pss[anim.srcPointIndex]
  //       pss[anim.srcPointIndex] = game.removeChecker(psOld)
        
  //       // Add checker to new point
  //       const psNew = pss[anim.destPointIndex]
  //       pss[anim.destPointIndex] = game.addChecker(psNew, anim.checker)
        
  //       return { ...prev, points: pss }
  //     })
      
  //     // Stop animation
  //     animRef.current = null
  //     setIsAnimating(false)
  //   }
  // })
  
  const handleClick = useCallback((pIdx: number) => {
    setSelected(prev => {
      // Deselect
      if (prev == pIdx) return null
        
      // Select the point, if that point have checkers
      if (gameState.points[pIdx]?.count > 0) return pIdx
        
      // Start animation
      if (prev != null) {
        const pSrc = getPoint(prev)
        const pDest = getPoint(pIdx)
        const psSrc = gameState.points[prev]
        pSrc.coord.y = getCheckerY(
          pSrc, psSrc.count, TOTAL_CHECKER_NUMBER)
        const psDest = gameState.points[pIdx]
        pDest.coord.y = getCheckerY(
          pDest, psDest.count, TOTAL_CHECKER_NUMBER)

        // animRef.current = {
        //   srcPoint: pSrc,
        //   destPoint: pDest,
        //   srcPointIndex: prevSelected,
        //   destPointIndex: pIdx,
        //   checker: psSrcRef.checker,
        //   t: 0
        // }
        // setIsAnimating(true)
      }
      return null 
    })
  }, [])

  return (
    <>
      <pixiGraphics draw={useCallback(drawBoard, [])} />
      <pixiGraphics
        draw={
          useCallback(
            (g: Graphics) => drawCheckers(g, gameState, selected),
            [selected]
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
    </>
  )
}