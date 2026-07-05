interface StatusBadgeProps {
  ok: boolean
  trueLabel: string
  falseLabel: string
}

export default function StatusBadge({ ok, trueLabel, falseLabel }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-mono ${
        ok
          ? 'border-signal-high/30 bg-signal-high/10 text-signal-high'
          : 'border-signal-low/30 bg-signal-low/10 text-signal-low'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-signal-high' : 'bg-signal-low'}`} />
      {ok ? trueLabel : falseLabel}
    </span>
  )
}
