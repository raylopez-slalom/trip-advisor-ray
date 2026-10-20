import type { Preference } from '@trip-advisor/shared'

interface Props {
  preference: Preference
}

export default function PreferenceChip({ preference }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
      aria-label={`Preference: ${preference.text}`}
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
      {preference.text}
    </span>
  )
}
