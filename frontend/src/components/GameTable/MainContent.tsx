import GameBoard from './GameBoard'
import PlayerStatusRow from './PlayerStatusRow'

export default function MainContent() {
  return (
    <main className="flex w-full flex-col items-center">
      <PlayerStatusRow side="them" />
      <GameBoard />
      <PlayerStatusRow side="you" />
    </main>
  )
}
