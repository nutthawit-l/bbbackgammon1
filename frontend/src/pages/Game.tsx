import BottomBar from '../components/BottomBar'
import MainContent from '../components/MainContent'
import TopBar from '../components/TopBar'

const PAGE_GRADIENT =
  'linear-gradient(180deg, #3d6db5 0%, #3e6cb5 16.67%, #3f6bb5 33.33%, #406ab5 50%, #3d68b2 57.14%, #3b65af 64.29%, #3863ac 71.43%, #3561a8 78.57%, #325fa5 85.71%, #305ca2 92.86%, #2d5a9f 100%)'

export default function Game() {
  return (
    <div
      className="flex w-[393px] h-[852px] flex-col justify-between overflow-hidden"
      style={{ background: PAGE_GRADIENT }}
    >
      <TopBar />
      <MainContent />
      <BottomBar />
    </div>
  )
}