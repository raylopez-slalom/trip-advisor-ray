import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Preference } from '@trip-advisor/shared'
import PreferenceChip from './PreferenceChip.js'

const PREFERENCE: Preference = {
  id: 'interest-food',
  text: 'food',
  category: 'activity',
}

describe('PreferenceChip', () => {
  it('renders the preference text', () => {
    render(<PreferenceChip preference={PREFERENCE} />)
    expect(screen.getByText('food')).toBeInTheDocument()
  })

  it('has an accessible label that identifies it as a preference', () => {
    render(<PreferenceChip preference={PREFERENCE} />)
    expect(screen.getByLabelText(/preference: food/i)).toBeInTheDocument()
  })

  it('applies blue background styling', () => {
    render(<PreferenceChip preference={PREFERENCE} />)
    const chip = screen.getByLabelText(/preference:/i)
    expect(chip.className).toContain('bg-blue-100')
    expect(chip.className).toContain('text-blue-800')
  })

  it('includes an icon alongside the text (not color alone)', () => {
    render(<PreferenceChip preference={PREFERENCE} />)
    const chip = screen.getByLabelText(/preference:/i)
    expect(chip.querySelector('svg')).toBeTruthy()
  })

  it('constraint chip and preference chip styling do not overlap', () => {
    render(
      <>
        <PreferenceChip preference={PREFERENCE} />
      </>,
    )
    const chip = screen.getByLabelText(/preference:/i)
    expect(chip.className).not.toContain('red')
  })

  it('renders a pace preference correctly', () => {
    const p: Preference = { id: 'pace', text: 'relaxed pace', category: 'pace' }
    render(<PreferenceChip preference={p} />)
    expect(screen.getByText('relaxed pace')).toBeInTheDocument()
  })
})
