import GameCanvas from './components/GameCanvas'

export default function App() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <GameCanvas width={800} height={600} />
    </div>
  )
}
