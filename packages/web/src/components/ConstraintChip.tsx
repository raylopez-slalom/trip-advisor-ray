import type { Constraint } from '@trip-advisor/shared'

interface Props {
  constraint: Constraint
}

export default function ConstraintChip({ constraint }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800"
      aria-label={`Hard constraint: ${constraint.text}`}
    >
      {/* Icon + label — never color alone */}
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
      {constraint.text}
    </span>
  )
}
