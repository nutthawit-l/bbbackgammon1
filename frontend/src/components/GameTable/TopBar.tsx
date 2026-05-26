import type { ReactNode } from 'react'

function IconButton({
  children,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  'aria-label': string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-black/60 shadow-lg"
    >
      {children}
    </button>
  )
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function TopBar() {
  return (
    <header className="flex w-full shrink-0 items-center justify-between px-6 py-4">
      <IconButton aria-label="Home">
        <HomeIcon />
      </IconButton>
      <div className="flex items-center gap-2">
        <IconButton aria-label="Help">
          <span className="text-xl font-bold leading-none text-white">?</span>
        </IconButton>
        <IconButton aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </div>
    </header>
  )
}
