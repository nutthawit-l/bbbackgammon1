type Side = 'them' | 'you'

const config = {
  them: {
    name: 'Them',
    swatchClass: 'bg-[#d42200] border-[#a81800]',
    panelBorder: 'border border-[#e8d4b0]',
    align: 'items-end',
  },
  you: {
    name: 'You',
    swatchClass: 'bg-[#e0dcd5] border-[#9a9490]',
    panelBorder: '',
    align: 'items-start',
  },
} as const

export default function PlayerStatusRow({ side }: { side: Side }) {
  const { name, swatchClass, panelBorder, align } = config[side]

  return (
    <div className={`flex h-8 w-[389px] shrink-0 gap-6 ${align} justify-end`}>
      <div
        className={`flex items-center gap-2 rounded-lg bg-[#1c1c1c] px-2 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.55)] ${panelBorder}`}
      >
        <span className={`size-3 shrink-0 rounded-md border ${swatchClass}`} />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold leading-3 text-white">{name}</span>
          <span className="text-[10px] leading-[10px] text-[#aaa]">PIP: 158 5:0 / 1</span>
        </div>
      </div>
      <div className="flex items-center rounded-lg bg-[#1c1c1c] px-2 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.55)]">
        <span className="text-[10px] text-[#aaa]">Timer:&nbsp;</span>
        <span className="text-xs font-bold text-[#1c1c1c]">00:00</span>
      </div>
    </div>
  )
}
