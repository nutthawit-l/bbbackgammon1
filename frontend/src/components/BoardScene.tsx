import { useCallback, useState, useRef } from 'react'
import { extend, useTick } from '@pixi/react'
import { Graphics } from 'pixi.js'
import * as game from '../gameState'
import { drawBoard } from '../states/board'

extend({ Graphics })

// Checker
const CHECKER_WHITE_COLOR = 0xe0dcd5
const CHECKER_WHITE_STROKE = { color: 0x9a9490, width: 1 }
const CHECKER_RED_COLOR = 0xd42200
const CHECKER_RED_STROKE = { color: 0x8a1200, width: 1 }
const CHECKER_HIGHTLIGHT = { color: 0x4499ff, alpha: 0.6 }

// function drawChecker(
//   g: Graphics, x: number, y: number,
//   checker: game.Checker, highlight = false
// ) {
//   if (highlight) {
//     g.circle(x, y, (game.CHECKER_RADIUS_PX + 4)).fill(CHECKER_HIGHTLIGHT)
//   }
//   const fill = checker === 'red' ? CHECKER_RED_COLOR : CHECKER_WHITE_COLOR
//   const stroke = checker === 'red' ? CHECKER_RED_STROKE : CHECKER_WHITE_STROKE
//   g.circle(x, y, game.CHECKER_RADIUS_PX).fill(fill).stroke(stroke)
// }

// function drawCheckers(g: Graphics, gs: game.GameState, selected: number | null) {
//   g.clear()

//   for (let i = 0; i < game.TOTAL_CHECKER_NUMBER; i++) {
//     const ps = game.getPointState(gs, i)
    
//     // If point is empty, nothing is draw.
//     if (game.isPointEmpty(ps)) continue
    
//     const p = game.getPoint(i)
    
//     const isSelect = selected === i
//     for (let sc = 0; sc < ps.count; sc++) {
//       const y = game.getCheckerY(p, sc, ps.count)
//       const isTop = sc === ps.count - 1
//       drawChecker(g, p.x, y, ps.checker, (isSelect && isTop))
//     }
//   }
// }

// // Create a transparent rectangle area that captures pointer events
// // When mouse move to this area, it will change to hand point
// function createClickArea(x: number, y: number, w: number, h: number) {
//   return (g: Graphics) => {
//     g.clear()
//     g.rect(x, y, w, h).fill({ color: 0, alpha: 0 }).stroke(CHECKER_RED_STROKE)
//   }
// }

// const CLICK_AREAS = game.POINTS.map((p, _) => {
//   const pIdx = (() => {
//     const home = p.x - game.BOARD_BORDER_PX
//     const outer = home >= (game.TRIANGLE_WIDTH_PX * 6) + game.BAR_WIDTH_PX
//     return outer 
//       ? Math.round((home - game.BAR_WIDTH_PX - game.TRIANGLE_CENTER_PX) / game.TRIANGLE_WIDTH_PX)
//       : Math.round((home - game.TRIANGLE_CENTER_PX) / game.TRIANGLE_WIDTH_PX)
//   })()
//   const xOffset = pIdx >= 6 ? 18 : 0
//   const xLeft = game.BOARD_BORDER_PX + pIdx * game.TRIANGLE_WIDTH_PX + xOffset
//   const isTop = p.direction === 1
//   const x = xLeft
//   const y = isTop ? game.BOARD_BORDER_PX : (game.BOARD_CONTAINER_HEIGHT_PX / 2)
//   const w = game.TRIANGLE_WIDTH_PX
//   const h = (game.BOARD_CONTAINER_HEIGHT_PX / 2) - game.BOARD_BORDER_PX
//   return { x, y, w, h }
// })

export default function BoardScene() {
  // const [gameState, setGameState] = useState<game.GameState>(game.INITIAL_STATE)
  // const [selected, setSelected] = useState<number | null>(null)
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
  
  // const handleClick = useCallback((pIdx: number) => {
  //   setSelected(prevSelected => {
  //     // Deselect
  //     if (prevSelected == pIdx) return null
        
  //     // Select the point, if that point have checkers
  //     if (gameState.points[pIdx]?.count > 0) return pIdx
        
  //     // Start animation
  //     if (prevSelected != null) {
  //       const pSrc = game.getPoint(prevSelected)
  //       const pDest = game.getPoint(pIdx)
  //       const psSrcRef = gameState.points[prevSelected]
  //       pSrc.y = game.getCheckerY(
  //         pSrc, psSrcRef.count, game.TOTAL_CHECKER_NUMBER)
  //       const psDestRef = gameState.points[pIdx]
  //       pDest.y = game.getCheckerY(
  //         pDest, psDestRef.count, game.TOTAL_CHECKER_NUMBER)

  //       animRef.current = {
  //         srcPoint: pSrc,
  //         destPoint: pDest,
  //         srcPointIndex: prevSelected,
  //         destPointIndex: pIdx,
  //         checker: psSrcRef.checker,
  //         t: 0
  //       }
  //       setIsAnimating(true)
  //     }
  //     return null 
  //   })
  // }, [])

  return <><pixiGraphics draw={useCallback(drawBoard, [])} /></>
  // return (
  //   <>
  //     <pixiGraphics draw={useCallback(drawBoard, [])} />
  //     <pixiGraphics
  //       draw={
  //         useCallback(
  //           (g: Graphics) => drawCheckers(g, gameState, selected),
  //           [selected]
  //         )
  //       }
  //     />
  //     {CLICK_AREAS.map((area, i) => (
  //       <pixiGraphics 
  //         key={i}
  //         draw={useCallback(createClickArea(area.x, area.y, area.w, area.h),[])} 
  //         eventMode='static'
  //         cursor='pointer'
  //         onPointerDown={() => handleClick(i)}
  //       />
  //     ))}
  //   </>
  // ) 
}