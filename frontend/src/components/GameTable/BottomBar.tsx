export default function BottomBar() {
  return (
    <footer className="flex h-12 w-full shrink-0 items-center justify-between p-4">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>00:14</span>
      </div>
      <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
        <span>Online Game</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="white" aria-hidden>
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l7.1-1.01L12 2z" />
        </svg>
      </div>
    </footer>
  )
}
